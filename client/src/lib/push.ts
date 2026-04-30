/**
 * Push subscription lifecycle for the client.
 *
 * One-shot call sites:
 *   - registerServiceWorker(): mount /sw.js (idempotent).
 *   - subscribeToPush(reconnectToken): request permission → subscribe → POST to server.
 *
 * Surfaces granular state via NotificationState so the UI can show:
 *   - "default" → render an opt-in toggle
 *   - "granted" → render a "subscribed" indicator (or hide)
 *   - "denied" → render a hint to re-enable in browser settings
 *   - "unsupported" → hide entirely
 */

export type NotificationState = 'unsupported' | 'default' | 'granted' | 'denied';

const SUBSCRIBED_FLAG = 'saw:pushSubscribed';

export function getNotificationState(): NotificationState {
  if (typeof window === 'undefined') return 'unsupported';
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return 'unsupported';
  }
  return Notification.permission as NotificationState;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js');
  } catch (err) {
    console.error('[push] sw register failed', err);
    return null;
  }
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const buffer = new ArrayBuffer(raw.length);
  const out = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function fetchPublicKey(): Promise<string | null> {
  try {
    const res = await fetch('/api/push/key');
    if (!res.ok) return null;
    const body = (await res.json()) as { publicKey?: string };
    return body.publicKey ?? null;
  } catch {
    return null;
  }
}

export interface SubscribeResult {
  ok: boolean;
  state: NotificationState;
  error?: string;
}

export async function subscribeToPush(reconnectToken: string): Promise<SubscribeResult> {
  const initial = getNotificationState();
  if (initial === 'unsupported') return { ok: false, state: 'unsupported', error: 'Unsupported' };
  if (initial === 'denied') return { ok: false, state: 'denied', error: 'Permission denied' };

  const reg = await registerServiceWorker();
  if (!reg) return { ok: false, state: initial, error: 'SW failed to register' };

  let perm: NotificationPermission = Notification.permission;
  if (perm === 'default') {
    perm = await Notification.requestPermission();
  }
  if (perm !== 'granted') {
    return { ok: false, state: perm as NotificationState, error: 'Permission not granted' };
  }

  const publicKey = await fetchPublicKey();
  if (!publicKey) return { ok: false, state: 'granted', error: 'No VAPID key from server' };

  let sub: PushSubscription | null = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reconnectToken, subscription: sub }),
  });
  if (!res.ok) return { ok: false, state: 'granted', error: `Server rejected (${res.status})` };

  try {
    window.localStorage.setItem(SUBSCRIBED_FLAG, '1');
  } catch {
    /* ignore */
  }
  return { ok: true, state: 'granted' };
}

export function isSubscribed(): boolean {
  try {
    return window.localStorage.getItem(SUBSCRIBED_FLAG) === '1';
  } catch {
    return false;
  }
}
