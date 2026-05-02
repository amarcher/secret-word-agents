import { useEffect, useState } from 'react';
import {
  getNotificationState,
  isSubscribed,
  registerServiceWorker,
  subscribeToPush,
  type NotificationState,
} from '../lib/push.ts';

function readToken(): string | null {
  try {
    return window.localStorage.getItem('saw:reconnectToken');
  } catch {
    return null;
  }
}

/**
 * Compact opt-in chip rendered in the Room header. Reflects the current
 * Notification.permission state and offers a one-tap subscribe.
 */
export default function NotifyToggle() {
  const [state, setState] = useState<NotificationState>('unsupported');
  const [subscribed, setSubscribed] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setState(getNotificationState());
    setSubscribed(isSubscribed());
    // Best-effort: register the SW on mount so subsequent pushes can dispatch
    // even if the user never opens the toggle. Idempotent.
    void registerServiceWorker();
  }, []);

  if (state === 'unsupported') return null;

  const enable = async () => {
    const token = readToken();
    if (!token) return;
    setPending(true);
    const res = await subscribeToPush(token);
    setPending(false);
    setState(res.state);
    if (res.ok) setSubscribed(true);
  };

  if (state === 'granted' && subscribed) {
    return (
      <span className="text-[9px] uppercase tracking-[0.25em] text-stamp-green opacity-80">
        Pings on
      </span>
    );
  }

  if (state === 'denied') {
    return (
      <span
        className="text-[9px] uppercase tracking-[0.25em] text-ink-fade"
        title="Notifications blocked — re-enable in browser settings."
      >
        Pings off
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={enable}
      disabled={pending}
      className="text-[9px] uppercase tracking-[0.25em] text-ink-fade hover:text-stamp-red disabled:opacity-40"
    >
      {pending ? 'Enabling…' : 'Enable pings'}
    </button>
  );
}
