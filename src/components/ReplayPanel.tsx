import { Play, RotateCcw, Route } from 'lucide-react';
import { TRANSLATIONS, type Language } from '../i18n/translations';
import type { DistanceUnit } from '../types/game';
import { formatDistance } from '../utils/geo';
import type { SharedRoute } from '../utils/replayLink';

interface ReplayPanelProps {
  lang: Language;
  unit: DistanceUnit;
  route: SharedRoute;
  shownStops: number;
  onReplay: () => void;
  onTryIt: () => void;
}

export function ReplayPanel({ lang, unit, route, shownStops, onReplay, onTryIt }: ReplayPanelProps) {
  const t = TRANSLATIONS[lang];
  const cityCount = route.turns.length;
  const shown = route.turns.slice(0, shownStops);
  const finished = shownStops >= cityCount;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-end sm:items-center justify-center lg:justify-start px-3 sm:px-8 lg:px-14 pt-16 pb-3 sm:pb-6">
      <section
        aria-label={t.replayKicker}
        className="pointer-events-auto w-full max-w-md max-h-[calc(100dvh-4.75rem)] overflow-y-auto custom-scroll rounded-2xl bg-white/95 border-2 border-[#3A86FF]/25 shadow-2xl p-4 sm:p-6 space-y-4"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#8338EC]">
            <Route className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{t.replayKicker}</span>
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-black tracking-tight text-slate-900 [text-wrap:balance]">
            {t.replayTitle(formatDistance(route.totalKm, unit))}
          </h1>
          <p className="text-sm sm:text-base font-semibold text-slate-600">
            {t.replaySubtitle(cityCount, route.score.toLocaleString('en-US'))}
          </p>
        </div>

        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm font-bold text-slate-800" aria-live="polite">
          {shown.map((turn, i) => (
            <li key={`${turn.city!.id}-${i}`} className="flex items-center gap-1.5">
              {i > 0 && (
                <span className="text-slate-400" aria-hidden="true">
                  →
                </span>
              )}
              <span
                className={`px-2 py-0.5 rounded-md border ${
                  i === shown.length - 1 && !finished ? 'bg-[#FFBE0B]/25 border-[#FFBE0B]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                {turn.city!.name}
              </span>
            </li>
          ))}
        </ol>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onTryIt}
            className="flex-1 min-h-[48px] px-5 py-2.5 rounded-xl bg-[#FB5607] hover:bg-[#E04800] text-white text-base font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shadow-sm transition-colors"
          >
            <Play className="w-5 h-5" aria-hidden="true" />
            {t.replayTry}
          </button>
          <button
            type="button"
            onClick={onReplay}
            className="min-h-[48px] px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-slate-500 text-slate-800 text-sm font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap transition-colors"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            {t.replayAgain}
          </button>
        </div>
      </section>
    </div>
  );
}
