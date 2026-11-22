'use client';

import { useState } from 'react';
import { KeyRound, Check, Copy, ShieldCheck } from 'lucide-react';

export function DonorHandoffPinDisplay({ pin }: { pin?: string | null }) {
  const [copied, setCopied] = useState(false);

  if (!pin) return null;

  const copyPin = () => {
    navigator.clipboard.writeText(pin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-natural/30 bg-natural/5 p-4 shadow-sm space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-natural flex items-center gap-1.5 uppercase tracking-wider">
          <KeyRound className="w-4 h-4 text-natural" />
          Handoff Verification PIN (P1)
        </span>
        <span className="text-[11px] text-forest/60 bg-white/70 px-2 py-0.5 rounded">
          Confidential to Donor
        </span>
      </div>

      <p className="text-xs text-forest/80">
        Read this 6-digit PIN to the collector when they arrive at the handover point to confirm collection:
      </p>

      <div className="flex items-center gap-3 pt-1">
        <div className="font-mono text-2xl font-bold tracking-widest bg-surface border border-natural/40 text-forest px-4 py-2 rounded-lg shadow-inner">
          {pin}
        </div>
        <button
          onClick={copyPin}
          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg bg-surface border border-forest/20 text-forest hover:bg-forest/5 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-forest/70" />
              Copy PIN
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export function CollectorPinInput({
  onSubmitPin,
  loading = false,
  error = null,
}: {
  onSubmitPin: (pin: string) => void;
  loading?: boolean;
  error?: string | null;
}) {
  const [pin, setPin] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length === 6) {
      onSubmitPin(pin);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-bold text-forest mb-1 uppercase tracking-wider">
          Enter 6-Digit Handoff PIN
        </label>
        <p className="text-xs text-forest/70 mb-2">
          Ask the donor duty manager at the handover location for the 6-digit verification code.
        </p>
        <input
          type="text"
          maxLength={6}
          pattern="[0-9]*"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          placeholder="000000"
          className="w-full font-mono text-center tracking-widest text-2xl font-bold py-2.5 px-4 rounded-xl border border-forest/30 bg-surface text-forest focus:outline-none focus:ring-2 focus:ring-natural"
          required
        />
      </div>

      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || pin.length !== 6}
        className="w-full rounded-xl bg-natural py-3 text-sm font-bold text-background hover:bg-natural/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
      >
        <ShieldCheck className="w-4 h-4" />
        {loading ? 'Verifying PIN...' : 'Confirm Food Collection'}
      </button>
    </form>
  );
}
