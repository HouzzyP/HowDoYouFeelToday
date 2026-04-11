'use client';

import { useEffect, useState } from 'react';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const output = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) {
        output[i] = rawData.charCodeAt(i);
    }
    return output;
}

type State = 'idle' | 'loading' | 'granted' | 'denied' | 'unsupported';

export function PushPrompt() {
    const [state, setState] = useState<State>('idle');

    useEffect(() => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            setState('unsupported');
            return;
        }
        if (Notification.permission === 'granted') {
            setState('granted');
        } else if (Notification.permission === 'denied') {
            setState('denied');
        }
    }, []);

    // Don't render if unsupported, denied, or already subscribed
    if (state === 'unsupported' || state === 'denied' || state === 'granted') {
        return null;
    }

    const handleSubscribe = async () => {
        setState('loading');
        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                setState('denied');
                return;
            }

            const reg = await navigator.serviceWorker.ready;
            const subscription = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(
                    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
                ),
            });

            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription),
            });

            setState('granted');
        } catch {
            setState('idle');
        }
    };

    return (
        <div className="thin-border mb-8 flex items-center justify-between gap-4 rounded-3xl border border-neutral-200 bg-neutral-50 px-5 py-4 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Get a daily reminder to check in.
            </p>
            <button
                onClick={handleSubscribe}
                disabled={state === 'loading'}
                className="shrink-0 rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-50 dark:text-neutral-950 dark:hover:bg-neutral-200"
            >
                {state === 'loading' ? 'Setting up…' : 'Remind me'}
            </button>
        </div>
    );
}
