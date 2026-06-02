"use client";

import { useState, useTransition } from "react";
import { CreditCard, Check, AlertTriangle, Plug } from "lucide-react";
import {
  updatePaymentSettings,
  setStripeMode,
  testStripeConnection,
} from "@/lib/payments/admin-actions";
import type { MaskedPaymentSettings } from "@/lib/payments/queries";
import type { StripeMode } from "@/lib/payments/settings";

const WEBHOOK_PATH = "/api/stripe/webhook";

export function PaymentSettingsForm({ settings }: { settings: MaskedPaymentSettings }) {
  const [mode, setMode] = useState<StripeMode>(settings.mode);
  const [form, setForm] = useState({
    testPublishableKey: settings.test.publishableKey,
    testSecretKey: "",
    testWebhookSecret: "",
    livePublishableKey: settings.live.publishableKey,
    liveSecretKey: "",
    liveWebhookSecret: "",
  });
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  function save() {
    setError(null);
    setSaved(false);
    start(async () => {
      const res = await updatePaymentSettings(form);
      if (res.ok) {
        setSaved(true);
        setForm((f) => ({ ...f, testSecretKey: "", testWebhookSecret: "", liveSecretKey: "", liveWebhookSecret: "" }));
      } else setError(res.error);
    });
  }

  function switchMode(next: StripeMode) {
    setMode(next);
    start(async () => {
      const res = await setStripeMode(next);
      if (!res.ok) setError(res.error);
    });
  }

  function ping() {
    setTestResult(null);
    start(async () => {
      const res = await testStripeConnection(mode);
      setTestResult(
        res.ok
          ? { ok: true, msg: `Connected — account ${res.account}` }
          : { ok: false, msg: res.error },
      );
    });
  }

  const webhookUrl = typeof window !== "undefined" ? `${window.location.origin}${WEBHOOK_PATH}` : WEBHOOK_PATH;

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-ink-soft" />
        <h1 className="text-xl font-semibold text-ink">Stripe payments</h1>
      </div>

      {/* Active mode toggle */}
      <section className="mb-6 rounded-xl border border-ink/10 bg-white p-4">
        <p className="mb-1 text-sm font-medium text-ink">Active mode</p>
        <p className="mb-3 text-xs text-ink-soft">
          Choose which key set the live site uses. Use <strong>Test</strong> for demo cards, <strong>Live</strong> for real charges.
        </p>
        <div className="inline-flex rounded-lg border border-ink/10 p-0.5">
          {(["test", "live"] as const).map((m) => (
            <button
              key={m}
              type="button"
              disabled={pending}
              onClick={() => switchMode(m)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition ${
                mode === m ? "bg-primary text-white shadow-sm" : "text-ink-soft hover:bg-ink/5"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        {mode === "live" && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5" /> Live mode charges real cards.
          </p>
        )}
      </section>

      {/* Key sets */}
      <KeySet
        title="Test keys"
        prefix="test"
        publishable={form.testPublishableKey}
        secretSet={settings.test.secretKeySet}
        secretLast4={settings.test.secretKeyLast4}
        webhookSet={settings.test.webhookSecretSet}
        secretValue={form.testSecretKey}
        webhookValue={form.testWebhookSecret}
        onPublishable={(v) => set("testPublishableKey", v)}
        onSecret={(v) => set("testSecretKey", v)}
        onWebhook={(v) => set("testWebhookSecret", v)}
      />
      <KeySet
        title="Live keys"
        prefix="live"
        publishable={form.livePublishableKey}
        secretSet={settings.live.secretKeySet}
        secretLast4={settings.live.secretKeyLast4}
        webhookSet={settings.live.webhookSecretSet}
        secretValue={form.liveSecretKey}
        webhookValue={form.liveWebhookSecret}
        onPublishable={(v) => set("livePublishableKey", v)}
        onSecret={(v) => set("liveSecretKey", v)}
        onWebhook={(v) => set("liveWebhookSecret", v)}
      />

      {/* Webhook URL helper */}
      <section className="mb-6 rounded-xl border border-ink/10 bg-white p-4">
        <p className="mb-1 text-sm font-medium text-ink">Webhook endpoint</p>
        <p className="mb-2 text-xs text-ink-soft">Add this URL in your Stripe dashboard → Developers → Webhooks, then paste the signing secret above.</p>
        <code className="block break-all rounded-md bg-ink/5 px-3 py-2 text-xs text-ink">{webhookUrl}</code>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save keys"}
        </button>
        <button
          type="button"
          onClick={ping}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-ink/15 px-4 py-2 text-sm font-medium text-ink transition hover:bg-ink/5 disabled:opacity-50"
        >
          <Plug className="h-4 w-4" /> Test {mode} connection
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-sm text-green-700">
            <Check className="h-4 w-4" /> Saved
          </span>
        )}
      </div>

      {testResult && (
        <p className={`mt-3 text-sm ${testResult.ok ? "text-green-700" : "text-red-600"}`}>{testResult.msg}</p>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function KeySet(props: {
  title: string;
  prefix: string;
  publishable: string;
  secretSet: boolean;
  secretLast4: string;
  webhookSet: boolean;
  secretValue: string;
  webhookValue: string;
  onPublishable: (v: string) => void;
  onSecret: (v: string) => void;
  onWebhook: (v: string) => void;
}) {
  return (
    <section className="mb-6 rounded-xl border border-ink/10 bg-white p-4">
      <p className="mb-3 text-sm font-medium text-ink">{props.title}</p>
      <label className="mb-3 block">
        <span className="mb-1 block text-xs text-ink-soft">Publishable key</span>
        <input
          type="text"
          value={props.publishable}
          onChange={(e) => props.onPublishable(e.target.value)}
          placeholder={`pk_${props.prefix}_…`}
          className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        />
      </label>
      <label className="mb-3 block">
        <span className="mb-1 block text-xs text-ink-soft">
          Secret key {props.secretSet && <em className="not-italic text-green-700">· saved ••••{props.secretLast4}</em>}
        </span>
        <input
          type="password"
          value={props.secretValue}
          onChange={(e) => props.onSecret(e.target.value)}
          placeholder={props.secretSet ? "Leave blank to keep current" : `sk_${props.prefix}_…`}
          autoComplete="off"
          className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-ink-soft">
          Webhook signing secret {props.webhookSet && <em className="not-italic text-green-700">· saved</em>}
        </span>
        <input
          type="password"
          value={props.webhookValue}
          onChange={(e) => props.onWebhook(e.target.value)}
          placeholder={props.webhookSet ? "Leave blank to keep current" : "whsec_…"}
          autoComplete="off"
          className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        />
      </label>
    </section>
  );
}
