import { useCallback, useEffect, useRef, useState } from 'react';

import { getWebSocketBaseUrl } from '@/api/config';
import { getValidAccessToken } from '@/lib/storage/get-valid-access-token';

export type LocationUpdate = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  battery_level?: number;
  timestamp?: string;
};

type LocationMessage = {
  type: 'location_update' | 'connected' | 'pong';
  data?: LocationUpdate;
  message?: string;
};

const RECONNECT_MS = 3000;

export function useLocationWebSocket(
  deviceId: string | null | undefined,
  enabled = true,
) {
  const [lastUpdate, setLastUpdate] = useState<LocationUpdate | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const disconnect = useCallback(() => {
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    }
    if (pingRef.current) {
      clearInterval(pingRef.current);
      pingRef.current = null;
    }
    wsRef.current?.close();
    wsRef.current = null;
    setConnected(false);
  }, []);

  const connect = useCallback(async () => {
    if (!deviceId || !enabled) return;

    const token = await getValidAccessToken();
    if (!token) return;

    disconnect();

    const url = `${getWebSocketBaseUrl()}/ws/location/${encodeURIComponent(deviceId)}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      pingRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send('ping');
      }, 25000);
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(String(event.data)) as LocationMessage;
        if (payload.type === 'location_update' && payload.data) {
          setLastUpdate(payload.data);
        }
      } catch {
        /* ignore malformed messages */
      }
    };

    ws.onclose = () => {
      setConnected(false);
      if (pingRef.current) {
        clearInterval(pingRef.current);
        pingRef.current = null;
      }
      if (enabled && deviceId) {
        reconnectRef.current = setTimeout(() => {
          void connect();
        }, RECONNECT_MS);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [deviceId, disconnect, enabled]);

  useEffect(() => {
    void connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { lastUpdate, connected, reconnect: connect };
}
