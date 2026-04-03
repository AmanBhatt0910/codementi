import { useEffect, useRef, useCallback } from 'react';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080/ws';

interface UseStompOptions {
  sessionId: string;
  token: string | null;
  onChat?: (message: unknown) => void;
  onCode?: (update: unknown) => void;
  onSignal?: (signal: unknown) => void;
  onEvent?: (event: unknown) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export function useStomp({
  sessionId,
  token,
  onChat,
  onCode,
  onSignal,
  onEvent,
  onConnected,
  onDisconnected,
}: UseStompOptions) {
  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<StompSubscription[]>([]);
  const reconnectCountRef = useRef(0);

  const connect = useCallback(() => {
    if (!token || !sessionId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: { Authorization: `Bearer ${token}` },
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      reconnectDelay: Math.min(5000 * (reconnectCountRef.current + 1), 30000),
      onConnect: () => {
        reconnectCountRef.current = 0;
        console.log('[STOMP] Connected');

        const subs: StompSubscription[] = [];

        if (onChat) {
          subs.push(client.subscribe(`/topic/session/${sessionId}/chat`, (msg: IMessage) => {
            onChat(JSON.parse(msg.body));
          }));
        }
        if (onCode) {
          subs.push(client.subscribe(`/topic/session/${sessionId}/code`, (msg: IMessage) => {
            onCode(JSON.parse(msg.body));
          }));
        }
        if (onSignal) {
          subs.push(client.subscribe(`/topic/session/${sessionId}/signal`, (msg: IMessage) => {
            onSignal(JSON.parse(msg.body));
          }));
        }
        if (onEvent) {
          subs.push(client.subscribe(`/topic/session/${sessionId}/events`, (msg: IMessage) => {
            onEvent(JSON.parse(msg.body));
          }));
        }

        subscriptionsRef.current = subs;
        onConnected?.();

        // Announce join
        client.publish({
          destination: `/app/session/${sessionId}/join`,
          body: JSON.stringify({}),
        });
      },
      onDisconnect: () => {
        reconnectCountRef.current++;
        console.log('[STOMP] Disconnected');
        onDisconnected?.();
      },
      onStompError: (frame) => {
        console.error('[STOMP] Error:', frame.headers['message']);
      },
    });

    client.activate();
    clientRef.current = client;
  }, [sessionId, token, onChat, onCode, onSignal, onEvent, onConnected, onDisconnected]);

  useEffect(() => {
    connect();
    return () => {
      subscriptionsRef.current.forEach(sub => {
        try { sub.unsubscribe(); } catch (_) {}
      });
      if (clientRef.current?.connected) {
        clientRef.current.publish({
          destination: `/app/session/${sessionId}/leave`,
          body: JSON.stringify({}),
        });
      }
      clientRef.current?.deactivate();
    };
  }, [connect, sessionId]);

  const publish = useCallback((destination: string, body: unknown) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination,
        body: JSON.stringify(body),
      });
    }
  }, []);

  const sendChat = useCallback((content: string) => {
    publish(`/app/session/${sessionId}/chat`, { content });
  }, [publish, sessionId]);

  const sendCode = useCallback((update: unknown) => {
    publish(`/app/session/${sessionId}/code`, update);
  }, [publish, sessionId]);

  const sendSignal = useCallback((signal: unknown) => {
    publish(`/app/session/${sessionId}/signal`, signal);
  }, [publish, sessionId]);

  const isConnected = () => clientRef.current?.connected ?? false;

  return { sendChat, sendCode, sendSignal, isConnected, client: clientRef };
}
