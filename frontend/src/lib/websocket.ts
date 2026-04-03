"use client";

import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8080/ws";

let stompClient: Client | null = null;
const subscriptions: StompSubscription[] = [];

export function connectWebSocket(onConnected?: () => void): Client {
  if (stompClient?.active) return stompClient;

  stompClient = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    reconnectDelay: 5000,
    onConnect: () => {
      console.log("WebSocket connected");
      onConnected?.();
    },
    onStompError: (frame) => {
      console.error("STOMP error:", frame);
    },
    onDisconnect: () => {
      console.log("WebSocket disconnected");
    },
  });

  stompClient.activate();
  return stompClient;
}

export function disconnectWebSocket(): void {
  subscriptions.forEach((sub) => {
    try { sub.unsubscribe(); } catch { /* ignore */ }
  });
  subscriptions.length = 0;
  stompClient?.deactivate();
  stompClient = null;
}

export function subscribeToTopic(
  topic: string,
  callback: (message: IMessage) => void
): StompSubscription | null {
  if (!stompClient?.active) return null;
  const sub = stompClient.subscribe(topic, callback);
  subscriptions.push(sub);
  return sub;
}

export function sendMessage(destination: string, body: unknown): void {
  if (!stompClient?.active) {
    console.warn("WebSocket not connected");
    return;
  }
  stompClient.publish({
    destination,
    body: JSON.stringify(body),
  });
}

export function getClient(): Client | null {
  return stompClient;
}
