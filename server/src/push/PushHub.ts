import webpush, { type PushSubscription } from 'web-push';

interface VapidConfig {
  publicKey: string;
  privateKey: string;
  subject: string;
}

export class PushHub {
  private subs: Map<string, PushSubscription> = new Map();
  readonly publicKey: string;

  constructor(config: VapidConfig) {
    webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
    this.publicKey = config.publicKey;
  }

  /** Register or update a subscription keyed by the player's reconnect token. */
  register(reconnectToken: string, subscription: PushSubscription): void {
    this.subs.set(reconnectToken, subscription);
  }

  /** Drop a player's subscription (e.g. on explicit unsubscribe / leave). */
  unregister(reconnectToken: string): void {
    this.subs.delete(reconnectToken);
  }

  has(reconnectToken: string): boolean {
    return this.subs.has(reconnectToken);
  }

  /**
   * Fire a push to a specific player's subscription. Silently no-ops when no
   * sub is registered (caller doesn't need to check). Drops 404/410 dead
   * subs from the map.
   */
  async send(reconnectToken: string, payload: object): Promise<void> {
    const sub = this.subs.get(reconnectToken);
    if (!sub) return;
    try {
      await webpush.sendNotification(sub, JSON.stringify(payload));
    } catch (err: unknown) {
      const status = (err as { statusCode?: number })?.statusCode;
      if (status === 404 || status === 410) {
        // Subscription expired or unsubscribed — clear it.
        this.subs.delete(reconnectToken);
        return;
      }
      console.error('[push] send failed', status, err);
    }
  }

  /** Visible for tests. */
  size(): number {
    return this.subs.size;
  }
}

/**
 * Resolve VAPID config from env. In prod, missing env is a hard error.
 * In dev, generate an ephemeral keypair so the project boots out-of-the-box —
 * but warn loudly because the keys reset on every restart.
 */
export function loadVapidConfig(): VapidConfig {
  const publicKey = process.env.VAPID_PUBLIC?.trim();
  const privateKey = process.env.VAPID_PRIVATE?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim() || 'mailto:dev@secret-agent-words.local';

  if (publicKey && privateKey) {
    return { publicKey, privateKey, subject };
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('VAPID_PUBLIC and VAPID_PRIVATE must be set in production.');
  }

  const keys = webpush.generateVAPIDKeys();
  console.warn(
    '[push] VAPID env vars unset — generated ephemeral keys for this dev process.\n' +
      '       Subscriptions will break on server restart. Set VAPID_PUBLIC and\n' +
      '       VAPID_PRIVATE in env for stable dev.\n' +
      '       publicKey:  ' + keys.publicKey + '\n' +
      '       privateKey: ' + keys.privateKey,
  );
  return { publicKey: keys.publicKey, privateKey: keys.privateKey, subject };
}
