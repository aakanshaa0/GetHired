"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";

type Status = "checking" | "unsupported" | "subscribed" | "unsubscribed" | "denied" | "working";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

export default function PushSubscribeButton() {
  const [status, setStatus] = useState<Status>("checking");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check(): Promise<Status> {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return "unsupported";
      if (Notification.permission === "denied") return "denied";
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        const subscription = await registration.pushManager.getSubscription();
        return subscription ? "subscribed" : "unsubscribed";
      } catch {
        return "unsubscribed";
      }
    }

    check().then((result) => {
      if (!cancelled) setStatus(result);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function subscribe() {
    setStatus("working");
    setError(null);
    try {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error("Push isn't configured on this deployment yet.");

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const json = subscription.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Failed to save subscription");

      setStatus("subscribed");
    } catch (err) {
      setStatus(Notification.permission === "denied" ? "denied" : "unsubscribed");
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function unsubscribe() {
    setStatus("working");
    setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setStatus("unsubscribed");
    } catch (err) {
      setStatus("subscribed");
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  if (status === "unsupported") {
    return <p className="text-sm text-slate-500">Push notifications aren&apos;t supported in this browser.</p>;
  }

  if (status === "denied") {
    return (
      <p className="text-sm text-slate-500">
        Notifications are blocked for this site in your browser settings — enable them there, then reload this page.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {status === "subscribed" ? (
        <button onClick={unsubscribe} disabled={false} className="btn-secondary w-fit">
          <BellRing className="h-4 w-4 text-teal-600" />
          Push enabled on this device — turn off
        </button>
      ) : (
        <button
          onClick={subscribe}
          disabled={status === "checking" || status === "working"}
          className="btn-primary w-fit"
        >
          {status === "working" ? <Bell className="h-4 w-4 animate-pulse" /> : <BellOff className="h-4 w-4" />}
          Enable push notifications on this device
        </button>
      )}
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
