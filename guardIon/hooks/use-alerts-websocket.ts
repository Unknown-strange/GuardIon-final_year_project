import { useCallback, useEffect, useRef, useState } from 'react';

import { getWebSocketBaseUrl } from '@/api/config';
import { getValidAccessToken } from '@/lib/storage/get-valid-access-token';

export type AlertWsPayload = {
  alert_id: string;
  alert_type: string;
  child_id: string;
  child_name?: string;
  device_id?: string;
  zone_name?: string | null;
  location_lat?: number;
  location_lng?: number;
  status: string;
  priority?: string;
  battery_level?: number;
  created_at: string;
  image_url?: string | null;
  reporter_name?: string | null;
  notes?: string | null;
};

type AlertMessage = {
  type: 'alert' | 'connected' | 'pong';
  data?: AlertWsPayload;
  message?: string;
};

const RECONNECT_MS = 3000;

export function useAlertsWebSocket(userId: string | null | undefined, enabled = true) {
  const [lastAlert, setLastAlert] = useState<AlertWsPayload | null>(null);
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
    if (!userId || !enabled) return;

    const token = await getValidAccessToken();
    if (!token) return;

    disconnect();

    const url = `${getWebSocketBaseUrl()}/ws/alerts/${encodeURIComponent(userId)}?token=${encodeURIComponent(token)}`;
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
        const payload = JSON.parse(String(event.data)) as AlertMessage;
        if (payload.type === 'alert' && payload.data) {
          setLastAlert(payload.data);
        }
      } catch {
        /* ignore */
      }
    };

    ws.onclose = () => {
      setConnected(false);
      if (pingRef.current) {
        clearInterval(pingRef.current);
        pingRef.current = null;
      }
      if (enabled && userId) {
        reconnectRef.current = setTimeout(() => {
          void connect();
        }, RECONNECT_MS);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [userId, disconnect, enabled]);

  useEffect(() => {
    void connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { lastAlert, connected, reconnect: connect };
}
