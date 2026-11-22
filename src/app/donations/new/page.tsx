'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  Clock,
  Scale,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  FOOD_CATEGORIES,
  ALLERGEN_LIST,
  DISCLAIMER_TEXT,
} from '@/lib/constants';
import { FoodCategory, StorageCondition, AllergenStatus, Allergen, DietType } from '@/lib/types';
import { StatusChip, UrgencyBadge } from '@/components/status-chip';

export default function QuickDonationPage() {
  const router = useRouter();

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<FoodCategory>('COOKED_MEAL');
  const [dietType, setDietType] = useState<DietType>('VEG');
  const [quantityKg, setQuantityKg] = useState<number>(25);
  const [estimatedServings, setEstimatedServings] = useState<number>(63);
  const [deadlineOffsetHours, setDeadlineOffsetHours] = useState<number>(3);
  const [storageCondition, setStorageCondition] = useState<StorageCondition>('HOT_HELD');
  const [allergenStatus, setAllergenStatus] = useState<AllergenStatus | null>(null);
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [pickupInstructions, setPickupInstructions] = useState(
    'Collect at the kitchen back entrance; ask for the duty manager.'
  );
  const [safetyAck, setSafetyAck] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedDonation, setSubmittedDonation] = useState<any | null>(null);
  const [matchSummary, setMatchSummary] = useState<any | null>(null);

  // Update category and auto-derive storage condition
  const handleCategoryChange = (cat: FoodCategory) => {
    setCategory(cat);
    if (cat === 'COOKED_MEAL') setStorageCondition('HOT_HELD');
    else if (cat === 'BAKERY' || cat === 'PACKAGED' || cat === 'OTHER') setStorageCondition('AMBIENT');
    else if (cat === 'FRESH_PRODUCE') setStorageCondition('CHILLED');
  };

  // Update quantity and auto-calculate servings
  const handleQuantityChange = (kg: number) => {
    const val = Math.max(0.5, Math.min(500, kg));
    setQuantityKg(val);
    setEstimatedServings(Math.round((val * 1000) / 400));
  };

  // Preset quick chips (PRD Section 9)
  const presets = [
    { title: 'Veg biryani & salan', cat: 'COOKED_MEAL' as FoodCategory, diet: 'VEG' as DietType, kg: 25, allergens: ['DAIRY'] as Allergen[], status: 'DECLARED' as AllergenStatus },
    { title: 'Dal makhani & steamed rice', cat: 'COOKED_MEAL' as FoodCategory, diet: 'VEG' as DietType, kg: 20, allergens: ['DAIRY'] as Allergen[], status: 'DECLARED' as AllergenStatus },
    { title: 'Dinner rolls & sandwich bread', cat: 'BAKERY' as FoodCategory, diet: 'VEG' as DietType, kg: 10, allergens: ['GLUTEN'] as Allergen[], status: 'DECLARED' as AllergenStatus },
    { title: 'Mixed garden produce', cat: 'FRESH_PRODUCE' as FoodCategory, diet: 'VEG' as DietType, kg: 15, allergens: [] as Allergen[], status: 'NONE_DECLARED' as AllergenStatus },
  ];

  const applyPreset = (preset: typeof presets[0]) => {
    setTitle(preset.title);
    handleCategoryChange(preset.cat);
    setDietType(preset.diet);
    handleQuantityChange(preset.kg);
    setAllergenStatus(preset.status);
    setAllergens(preset.allergens);
  };

  const toggleAllergen = (a: Allergen) => {
    if (allergens.includes(a)) {
      setAllergens(allergens.filter((item) => item !== a));
    } else {
      setAllergens([...allergens, a]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Food title is required.');
      return;
    }
    if (!allergenStatus) {
      setError('Please select an allergen declaration status.');
      return;
    }
    if (allergenStatus === 'DECLARED' && allergens.length === 0) {
      setError('Please select at least one declared allergen.');
      return;
    }
    if (!safetyAck) {
      setError('You must confirm the food safety acknowledgment.');
      return;
    }

    setSubmitting(true);
    try {
      const deadline = new Date(Date.now() + deadlineOffsetHours * 60 * 60 * 1000).toISOString();

      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          dietType,
          quantityKg,
          estimatedServings,
          pickupDeadline: deadline,
          storageCondition,
          allergenStatus,
          allergens: allergenStatus === 'DECLARED' ? allergens : [],
          pickupInstructions,
          safetyAck: true,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to create donation');
      }

      setSubmittedDonation(json.data);
      setMatchSummary(json.matchSummary);
    } catch (err: any) {
      setError(err.message || 'An error occurred while posting surplus');
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS STATE (FR-C3)
  if (submittedDonation) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-6">
        <div className="rounded-2xl border-2 border-natural bg-surface p-6 sm:p-8 shadow-md text-center space-y-4">
          <div className="w-14 h-14 bg-natural/15 text-natural rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-forest">
            Donation Published Successfully!
          </h1>
          <p className="text-sm text-forest/80 max-w-md mx-auto">
            Your surplus offering is live on the redistribution network.
          </p>

          <div className="bg-background rounded-xl p-4 border border-forest/15 text-left space-y-3">
            <div className="flex items-center justify-between border-b border-forest/10 pb-2">
              <span className="font-bold text-forest text-base">{submittedDonation.title}</span>
              <StatusChip status={submittedDonation.status} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <span className="text-forest/60">Quantity: </span>
                <strong className="text-forest">{submittedDonation.quantityKg} kg</strong> ({submittedDonation.estimatedServings} servings)
              </div>
              <div>
                <span className="text-forest/60">Category: </span>
                <strong className="text-forest">{submittedDonation.category}</strong>
              </div>
              <div>
                <span className="text-forest/60">Diet: </span>
                <strong className="text-forest">{submittedDonation.dietType}</strong>
              </div>
              <div>
                <span className="text-forest/60">Deadline: </span>
                <strong className="text-forest">+{deadlineOffsetHours} hours</strong>
              </div>
            </div>
          </div>

          {/* Match Summary (FR-C3, FR-E10) */}
          {matchSummary && (
            <div className="rounded-xl border border-forest/15 bg-lime/10 p-4 text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-forest uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-natural" />
                  Matching Engine Status
                </span>
                {matchSummary.bestScore ? (
                  <span className="text-xs font-mono font-bold bg-lime text-forest px-2.5 py-0.5 rounded-full">
                    Top Score: {matchSummary.bestScore}/100
                  </span>
                ) : null}
              </div>

              {matchSummary.eligibleReceivers > 0 ? (
                <p className="text-xs text-forest/90">
                  <strong>{matchSummary.eligibleReceivers} verified receivers</strong> nearby can accommodate this surplus quantity right now.
                </p>
              ) : (
                <div className="text-xs text-amber-900 space-y-1">
                  <p className="font-semibold">
                    Posted. No receiver can accept this donation right now.
                  </p>
                  <p className="text-[11px] text-amber-800">
                    The donation remains posted and visible. Receivers whose capacity clears later will see it.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link
              href={`/donations/${submittedDonation.id}`}
              className="rounded-full bg-natural px-6 py-2.5 text-xs font-bold text-background hover:bg-natural/90 transition-colors shadow-sm"
            >
              View Donation &amp; Handoff PIN →
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-forest/20 px-6 py-2.5 text-xs font-bold text-forest hover:bg-forest/5 transition-colors"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-forest/15 pb-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-forest flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-natural" />
            Quick Donation
          </h1>
          <p className="text-xs text-forest/70 mt-1">
            Publish surplus food in under 60 seconds (PRD Mandatory Requirement 1)
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-xs font-bold text-natural hover:underline"
        >
          Cancel
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs font-semibold text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Preset Chips (FR-C2) */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-forest/70">
          One-Tap Presets (Fast Track)
        </label>
        <div className="flex flex-wrap gap-2">
          {presets.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => applyPreset(p)}
              className="px-3 py-1.5 rounded-full bg-surface border border-natural/30 text-xs font-medium text-forest hover:bg-natural/10 hover:border-natural transition-colors"
            >
              + {p.title} ({p.kg}kg)
            </button>
          ))}
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Food Title */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-forest uppercase tracking-wider">
            Food Name / Description <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            minLength={3}
            maxLength={60}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Veg Biryani with Mirchi Salan"
            className="w-full rounded-xl border border-forest/20 bg-surface px-4 py-2.5 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-natural shadow-sm"
          />
        </div>

        {/* 2. Category & Diet */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-forest uppercase tracking-wider">
              Food Category
            </label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value as FoodCategory)}
              className="w-full rounded-xl border border-forest/20 bg-surface px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-natural shadow-sm"
            >
              {FOOD_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-forest uppercase tracking-wider">
              Diet Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDietType('VEG')}
                className={`py-2 rounded-xl text-xs font-bold transition-colors ${
                  dietType === 'VEG'
                    ? 'bg-natural text-background shadow-sm'
                    : 'bg-surface border border-forest/20 text-forest'
                }`}
              >
                Vegetarian
              </button>
              <button
                type="button"
                onClick={() => setDietType('NON_VEG')}
                className={`py-2 rounded-xl text-xs font-bold transition-colors ${
                  dietType === 'NON_VEG'
                    ? 'bg-amber-800 text-background shadow-sm'
                    : 'bg-surface border border-forest/20 text-forest'
                }`}
              >
                Non-Veg
              </button>
            </div>
          </div>
        </div>

        {/* 3. Quantity & Servings */}
        <div className="space-y-2 rounded-xl border border-forest/15 bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-forest uppercase tracking-wider">
              Surplus Quantity (kg) <span className="text-rose-500">*</span>
            </label>
            <span className="text-xs font-mono text-forest/70">
              Auto: ~{estimatedServings} meal portions
            </span>
          </div>

          {/* Quick chips */}
          <div className="flex flex-wrap gap-2 pt-1">
            {[5, 10, 20, 25, 50, 100].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleQuantityChange(num)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-colors ${
                  quantityKg === num
                    ? 'bg-forest text-lime font-bold shadow-sm'
                    : 'bg-background border border-forest/15 text-forest hover:bg-forest/5'
                }`}
              >
                {num} kg
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="number"
              step={0.5}
              min={0.5}
              max={500}
              required
              value={quantityKg}
              onChange={(e) => handleQuantityChange(parseFloat(e.target.value) || 0)}
              className="w-32 rounded-xl border border-forest/20 bg-background px-3 py-2 text-sm font-mono font-bold text-forest focus:outline-none focus:ring-2 focus:ring-natural"
            />
            <span className="text-xs text-forest/60">
              (0.5 kg to 500 kg limit)
            </span>
          </div>
        </div>

        {/* 4. Pickup Deadline Chips */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-forest uppercase tracking-wider">
            Collection Deadline (Hours from now)
          </label>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 6].map((hrs) => (
              <button
                key={hrs}
                type="button"
                onClick={() => setDeadlineOffsetHours(hrs)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition-colors ${
                  deadlineOffsetHours === hrs
                    ? 'bg-natural text-background font-bold shadow-sm'
                    : 'bg-surface border border-forest/20 text-forest hover:bg-forest/5'
                }`}
              >
                +{hrs} Hours
              </button>
            ))}
          </div>
        </div>

        {/* 5. Storage Condition */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-forest uppercase tracking-wider">
            Storage Condition
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['HOT_HELD', 'CHILLED', 'AMBIENT', 'FROZEN'] as StorageCondition[]).map((cond) => (
              <button
                key={cond}
                type="button"
                onClick={() => setStorageCondition(cond)}
                className={`py-2 rounded-xl text-xs font-bold transition-colors ${
                  storageCondition === cond
                    ? 'bg-natural text-background shadow-sm'
                    : 'bg-surface border border-forest/20 text-forest'
                }`}
              >
                {cond.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* 6. Allergen Status (FR-C2: Forces explicit safety choice) */}
        <div className="space-y-3 rounded-xl border border-natural/20 bg-natural/5 p-4">
          <label className="block text-xs font-bold text-natural uppercase tracking-wider">
            Allergen Declaration (Mandatory Safety Choice) <span className="text-rose-500">*</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setAllergenStatus('NONE_DECLARED');
                setAllergens([]);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
                allergenStatus === 'NONE_DECLARED'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-surface border border-forest/20 text-forest'
              }`}
            >
              None Declared
            </button>
            <button
              type="button"
              onClick={() => setAllergenStatus('DECLARED')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
                allergenStatus === 'DECLARED'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-surface border border-forest/20 text-forest'
              }`}
            >
              Contains Known Allergens
            </button>
            <button
              type="button"
              onClick={() => {
                setAllergenStatus('UNKNOWN');
                setAllergens([]);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
                allergenStatus === 'UNKNOWN'
                  ? 'bg-rose-700 text-white shadow-sm'
                  : 'bg-surface border border-forest/20 text-forest'
              }`}
            >
              Unknown (Warning Flag)
            </button>
          </div>

          {allergenStatus === 'DECLARED' && (
            <div className="space-y-1.5 pt-2">
              <span className="text-xs text-forest/70 font-semibold">Select all that apply:</span>
              <div className="flex flex-wrap gap-1.5">
                {ALLERGEN_LIST.map((item) => {
                  const selected = allergens.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleAllergen(item)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        selected
                          ? 'bg-amber-800 text-white'
                          : 'bg-surface border border-forest/20 text-forest/80'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 7. Pickup Instructions (Validation against personal contact info) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-forest uppercase tracking-wider">
              Pickup Instructions
            </label>
            <span className="text-[11px] text-forest/60">Max 300 chars (No phone/email)</span>
          </div>
          <textarea
            rows={2}
            maxLength={300}
            value={pickupInstructions}
            onChange={(e) => setPickupInstructions(e.target.value)}
            className="w-full rounded-xl border border-forest/20 bg-surface px-3 py-2 text-xs text-forest focus:outline-none focus:ring-2 focus:ring-natural shadow-sm"
          />
        </div>

        {/* 8. Mandatory Safety Acknowledgment (FR-H3) */}
        <div className="rounded-xl border border-amber-400/40 bg-amber-50 p-4 space-y-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={safetyAck}
              onChange={(e) => setSafetyAck(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-forest/30 text-natural focus:ring-natural shrink-0"
            />
            <span className="text-xs text-forest/90 leading-relaxed font-medium">
              I certify that this surplus was prepared and held in accordance with standard hygiene protocols, stored under the declared condition, and is suitable for rescue redistribution.
            </span>
          </label>

          <p className="text-[11px] text-forest/60 italic pt-1 border-t border-amber-200/50">
            {DISCLAIMER_TEXT}
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !safetyAck}
          className="w-full rounded-full bg-natural py-3.5 text-sm font-bold text-background hover:bg-natural/90 disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-lime" />
          {submitting ? 'Publishing Surplus...' : 'Publish Surplus Offering (Under 60s)'}
        </button>
      </form>
    </div>
  );
}
