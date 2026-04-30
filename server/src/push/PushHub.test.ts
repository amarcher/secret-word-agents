import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import webpush, { type PushSubscription } from 'web-push';
import { PushHub, loadVapidConfig } from './PushHub.js';

const fakeSub: PushSubscription = {
  endpoint: 'https://fcm.googleapis.com/fake/endpoint',
  keys: { p256dh: 'AAAA', auth: 'BBBB' },
};

let validKeys: { publicKey: string; privateKey: string };
beforeAll(() => {
  validKeys = webpush.generateVAPIDKeys();
});

function newHub() {
  return new PushHub({
    publicKey: validKeys.publicKey,
    privateKey: validKeys.privateKey,
    subject: 'mailto:test@local',
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PushHub.register / send', () => {
  it('stores a subscription and forwards the payload to web-push', async () => {
    const send = vi
      .spyOn(webpush, 'sendNotification')
      .mockResolvedValue({ statusCode: 201, body: '', headers: {} });

    const hub = newHub();
    hub.register('token-1', fakeSub);
    expect(hub.size()).toBe(1);
    expect(hub.has('token-1')).toBe(true);

    await hub.send('token-1', { type: 'clue', title: 'x' });
    expect(send).toHaveBeenCalledOnce();
    const [subArg, payloadArg] = send.mock.calls[0]!;
    expect(subArg).toEqual(fakeSub);
    expect(JSON.parse(payloadArg as string)).toEqual({ type: 'clue', title: 'x' });
  });

  it('no-ops when no subscription is registered for the token', async () => {
    const send = vi.spyOn(webpush, 'sendNotification').mockResolvedValue({
      statusCode: 201,
      body: '',
      headers: {},
    });
    const hub = newHub();
    await hub.send('unknown-token', { type: 'x' });
    expect(send).not.toHaveBeenCalled();
  });

  it('drops 404/410 subscriptions on send failure', async () => {
    vi.spyOn(webpush, 'sendNotification').mockRejectedValue({ statusCode: 410 });
    const hub = newHub();
    hub.register('dead', fakeSub);
    await hub.send('dead', { type: 'x' });
    expect(hub.has('dead')).toBe(false);
  });

  it('keeps the subscription on transient errors (5xx)', async () => {
    vi.spyOn(webpush, 'sendNotification').mockRejectedValue({ statusCode: 503 });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const hub = newHub();
    hub.register('flaky', fakeSub);
    await hub.send('flaky', { type: 'x' });
    expect(hub.has('flaky')).toBe(true);
    expect(errSpy).toHaveBeenCalled();
  });

  it('unregister drops the slot', () => {
    const hub = newHub();
    hub.register('t', fakeSub);
    hub.unregister('t');
    expect(hub.has('t')).toBe(false);
  });
});

describe('loadVapidConfig', () => {
  const origPub = process.env.VAPID_PUBLIC;
  const origPriv = process.env.VAPID_PRIVATE;
  const origNode = process.env.NODE_ENV;

  afterEach(() => {
    process.env.VAPID_PUBLIC = origPub;
    process.env.VAPID_PRIVATE = origPriv;
    process.env.NODE_ENV = origNode;
  });

  it('uses env vars when both are set', () => {
    process.env.VAPID_PUBLIC = validKeys.publicKey;
    process.env.VAPID_PRIVATE = validKeys.privateKey;
    const cfg = loadVapidConfig();
    expect(cfg.publicKey).toBe(validKeys.publicKey);
    expect(cfg.privateKey).toBe(validKeys.privateKey);
  });

  it('hard-fails in production when env unset', () => {
    delete process.env.VAPID_PUBLIC;
    delete process.env.VAPID_PRIVATE;
    process.env.NODE_ENV = 'production';
    expect(() => loadVapidConfig()).toThrow(/production/);
  });

  it('auto-generates keys in dev when env unset', () => {
    delete process.env.VAPID_PUBLIC;
    delete process.env.VAPID_PRIVATE;
    process.env.NODE_ENV = 'development';
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const cfg = loadVapidConfig();
    expect(cfg.publicKey).toBeTruthy();
    expect(cfg.privateKey).toBeTruthy();
  });
});
