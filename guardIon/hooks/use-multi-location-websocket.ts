import { useCallback, useEffect, useRef, useState } from 'react';

import { getWebSocketBaseUrl } from '@/api/config';
import { getValidAccessToken } from '@/lib/storage/get-valid-access-token';
import type { LocationUpdate } from '@/hooks/use-location-websocket';

const RECONNECT_MS = 3000;
const PING_MS = 25000;

type DeviceChildMap = Record<string, string>;

/**
 * Subscribe to location WebSockets for multiple devices.
 * Returns live coordinates keyed by child ID.
 */
export function useMultiLocationWebSocket(
  deviceToChild: DeviceChildMap,
  enabled = true,
) {
  const [updatesByChild, setUpdatesByChild] = useState<Record<string, LocationUpdate>>({});
  const socketsRef = useRef<Map<string, WebSocket>>(new Map());
  const pingRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
  const reconnectRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const deviceToChildRef = useRef(deviceToChild);
  deviceToChildRef.current = deviceToChild;

  const clearPing = useCallback((deviceId: string) => {
    const timer = pingRef.current.get(deviceId);
    if (timer) {
      clearInterval(timer);
      pingRef.current.delete(deviceId);
    }
  }, []);

  const disconnectAll = useCallback(() => {
    for (const timer of reconnectRef.current.values()) clearTimeout(timer);
    reconnectRef.current.clear();
    for (const deviceId of [...pingRef.current.keys()]) clearPing(deviceId);
    for (const ws of socketsRef.current.values()) ws.close();
    socketsRef.current.clear();
  }, [clearPing]);

  const connectDevice = useCallback(async (deviceId: string, childId: string) => {
    if (!enabled) return;

    const token = await getValidAccessToken();
    if (!token) return;

    const existing = socketsRef.current.get(deviceId);
    if (existing?.readyState === WebSocket.OPEN || existing?.readyState === WebSocket.CONNECTING) {
      return;
    }
    if (existing) {
      existing.close();
      socketsRef.current.delete(deviceId);
    }

    const url = `${getWebSocketBaseUrl()}/ws/location/${encodeURIComponent(deviceId)}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    socketsRef.current.set(deviceId, ws);

    ws.onopen = () => {
      const pending = reconnectRef.current.get(deviceId);
      if (pending) {
        clearTimeout(pending);
        reconnectRef.current.delete(deviceId);
      }
      clearPing(deviceId);
      pingRef.current.set(
        deviceId,
        setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send('ping');
        }, PING_MS),
      );
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(String(event.data)) as {
          type: string;
          data?: LocationUpdate;
        };
        if (payload.type === 'location_update' && payload.data) {
          setUpdatesByChild((prev) => ({ ...prev, [childId]: payload.data! }));
        }
      } catch {
        /* ignore */
      }
    };

    ws.onclose = () => {
      clearPing(deviceId);
      socketsRef.current.delete(deviceId);
      if (enabled && deviceToChildRef.current[deviceId]) {
        const timer = setTimeout(() => {
          reconnectRef.current.delete(deviceId);
          void connectDevice(deviceId, childId);
        }, RECONNECT_MS);
        reconnectRef.current.set(deviceId, timer);
      }
    };

    ws.onerror = () => ws.close();
  }, [clearPing, enabled]);

  const deviceMapKey = Object.keys(deviceToChild)
    .sort()
    .map((deviceId) => `${deviceId}:${deviceToChild[deviceId]}`)
    .join('|');

  useEffect(() => {
    if (!enabled) {
      disconnectAll();
      return;
    }

    for (const [deviceId, childId] of Object.entries(deviceToChildRef.current)) {
      void connectDevice(deviceId, childId);
    }

    return () => {
      disconnectAll();
    };
  }, [deviceMapKey, connectDevice, disconnectAll, enabled]);

  return updatesByChild;
}
