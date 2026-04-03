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

  // Keep callback refs up-to-date without triggering reconnection on every render
  const onChatRef = useRef(onChat);
  const onCodeRef = useRef(onCode);
  const onSignalRef = useRef(onSignal);
  const onEventRef = useRef(onEvent);
  const onConnectedRef = useRef(onConnected);
  const onDisconnectedRef = useRef(onDisconnected);
  onChatRef.current = onChat;
  onCodeRef.current = onCode;
  onSignalRef.current = onSignal;
  onEventRef.current = onEvent;
  onConnectedRef.current = onConnected;
  onDisconnectedRef.current = onDisconnected;

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

        if (onChatRef.current) {
          subs.push(client.subscribe(`/topic/session/${sessionId}/chat`, (msg: IMessage) => {
            onChatRef.current!(JSON.parse(msg.body));
          }));
        }
        if (onCodeRef.current) {
          subs.push(client.subscribe(`/topic/session/${sessionId}/code`, (msg: IMessage) => {
            onCodeRef.current!(JSON.parse(msg.body));
          }));
        }
        if (onSignalRef.current) {
          subs.push(client.subscribe(`/topic/session/${sessionId}/signal`, (msg: IMessage) => {
            onSignalRef.current!(JSON.parse(msg.body));
          }));
        }
        if (onEventRef.current) {
          subs.push(client.subscribe(`/topic/session/${sessionId}/events`, (msg: IMessage) => {
            onEventRef.current!(JSON.parse(msg.body));
          }));
        }

        subscriptionsRef.current = subs;
        onConnectedRef.current?.();

        // Announce join
        client.publish({
          destination: `/app/session/${sessionId}/join`,
          body: JSON.stringify({}),
        });
      },
      onDisconnect: () => {
        reconnectCountRef.current++;
        console.log('[STOMP] Disconnected');
        onDisconnectedRef.current?.();
      },
      onStompError: (frame) => {
        console.error('[STOMP] Error:', frame.headers['message']);
      },
    });

    client.activate();
    clientRef.current = client;
  }, [sessionId, token]); // callbacks are accessed via refs — only reconnect when session or token changes

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
