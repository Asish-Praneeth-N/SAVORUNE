import { Match } from '@/lib/types';
import { Award, Navigation, Scale, Clock, Heart } from 'lucide-react';

export function MatchCard({
  match,
  onClaim,
  showClaimButton = true,
}: {
  match: Match;
  onClaim?: () => void;
  showClaimButton?: boolean;
}) {
  const score = match.finalScore || 0;
  const isHighMatch = score >= 80;

  return (
    <div className="rounded-xl border border-forest/15 bg-surface p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 font-mono font-bold text-sm px-2.5 py-1 rounded-full ${
                isHighMatch
                  ? 'bg-lime text-forest border border-forest/20'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}
            >
              <Award className="w-4 h-4" />
              {score}/100 Match
            </span>
            <span className="text-xs text-forest/70 font-mono">
              ~{match.distanceKm} km away
            </span>
          </div>

          <p className="mt-2 text-sm text-forest font-medium leading-snug">
            {match.explanation}
          </p>
        </div>

        {showClaimButton && onClaim && (
          <button
            onClick={onClaim}
            className="shrink-0 rounded-full bg-natural px-4 py-2 text-xs font-semibold text-background hover:bg-natural/90 transition-colors shadow-sm"
          >
            Claim Surplus
          </button>
        )}
      </div>

      {/* Factor Breakdown Bars */}
      <div className="mt-4 pt-3 border-t border-forest/10 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div>
          <div className="flex justify-between text-forest/70 mb-1">
            <span className="flex items-center gap-1">
              <Navigation className="w-3 h-3 text-natural" /> Distance
            </span>
            <span className="font-mono font-bold">{match.distanceScore}</span>
          </div>
          <div className="h-1.5 w-full bg-forest/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-natural rounded-full"
              style={{ width: `${match.distanceScore}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-forest/70 mb-1">
            <span className="flex items-center gap-1">
              <Scale className="w-3 h-3 text-natural" /> Quantity
            </span>
            <span className="font-mono font-bold">{match.quantityScore}</span>
          </div>
          <div className="h-1.5 w-full bg-forest/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-natural rounded-full"
              style={{ width: `${match.quantityScore}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-forest/70 mb-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-natural" /> Timing
            </span>
            <span className="font-mono font-bold">{match.timingScore}</span>
          </div>
          <div className="h-1.5 w-full bg-forest/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-natural rounded-full"
              style={{ width: `${match.timingScore}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-forest/70 mb-1">
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3 text-natural" /> Need/Suit
            </span>
            <span className="font-mono font-bold">{match.needScore}</span>
          </div>
          <div className="h-1.5 w-full bg-forest/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-natural rounded-full"
              style={{ width: `${match.needScore}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
