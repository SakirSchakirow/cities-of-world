import { useState } from 'react';
import { Award, Check, Copy, Eye, RotateCcw, Share2, Trophy } from 'lucide-react';
import { TRANSLATIONS, type Language } from '../i18n/translations';
import type { CityInfo, DistanceUnit, TurnRecord } from '../types/game';
import { formatDistance, formatDualDistance } from '../utils/geo';

interface MatchSummaryModalProps {
  lang: Language;
  player1Name: string;
  player2Name: string;
  p1Score: number;
  p2Score: number;
  turns: TurnRecord[];
  unit: DistanceUnit;
  onPlayAgain: () => void;
  onInspectGlobe: () => void;
  onFocusCity: (city: CityInfo) => void;
}

export function MatchSummaryModal({
  lang,
  player1Name,
  player2Name,
  p1Score,
  p2Score,
  turns,
  unit,
  onPlayAgain,
  onInspectGlobe,
  onFocusCity,
}: MatchSummaryModalProps) {
  const t = TRANSLATIONS[lang];
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  const winner =
    p1Score > p2Score ? player1Name : p2Score > p1Score ? player2Name : null;

  const playerTurns = turns.filter((turn) => turn.index > 0);
  const totalDistanceKm = playerTurns.reduce((sum, turn) => sum + (turn.timedOut ? 0 : turn.distanceKm), 0);
  const longestLeg = playerTurns.reduce<TurnRecord | null>(
    (best, turn) => (!turn.timedOut && (!best || turn.distanceKm > best.distanceKm) ? turn : best),
    null,
  );
  const gdgHits = playerTurns.filter((turn) => turn.city?.isGdg).length;

  const cityChainNames = turns
    .filter((turn): turn is TurnRecord & { city: CityInfo } => turn.city !== null)
    .map((turn) => turn.city.name)
    .join(' → ');

  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
  const winnerLabel = winner ? t.playerWins(winner) : t.drawMatch;
  const gdgText =
    gdgHits > 0
      ? ` · ${gdgHits} ${gdgHits === 1 ? t.citySingular : t.cityPlural} GDG (+${gdgHits * 100} ${t.pts})`
      : '';
  const summaryText = t.shareTemplate(
    winnerLabel,
    p1Score.toLocaleString('en-US'),
    p2Score.toLocaleString('en-US'),
    formatDistance(totalDistanceKm, unit),
    gdgText,
    cityChainNames,
  );

  const linkedinHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`;
  const xHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(summaryText)}&url=${encodeURIComponent(pageUrl)}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${summaryText}\n${pageUrl}`)}`;

  const copySummary = async (message: string) => {
    try {
      await navigator.clipboard.writeText(`${summaryText}\n${pageUrl}`);
      setShareNotice(message);
    } catch {
      setShareNotice(t.copyFailed);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: t.brandTitle,
          text: summaryText,
          url: pageUrl,
        });
      } catch {
        // User cancelled share sheet
      }
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-6 bg-slate-900/45">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.finalStandings}
        className="w-full max-w-3xl max-h-[92dvh] flex flex-col rounded-2xl bg-white border-2 border-[#3A86FF]/30 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 rounded-xl bg-[#FFBE0B] text-slate-950 shadow-sm shrink-0">
              <Trophy className="w-6 h-6 sm:w-7 sm:h-7" aria-hidden="true" />
            </div>
            <div>
              <div className="text-xs font-extrabold text-[#8338EC]">{t.finalStandings}</div>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-950">
                {winnerLabel}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <div>
              <div className="text-xs sm:text-sm font-extrabold text-[#3A86FF]">{player1Name}</div>
              <div className="font-mono tabular-nums text-2xl sm:text-3xl font-black text-slate-950">
                {p1Score.toLocaleString('en-US')}
              </div>
            </div>
            <div className="text-slate-400 text-xs sm:text-sm font-bold">vs</div>
            <div className="text-right">
              <div className="text-xs sm:text-sm font-extrabold text-[#FF006E]">{player2Name}</div>
              <div className="font-mono tabular-nums text-2xl sm:text-3xl font-black text-slate-950">
                {p2Score.toLocaleString('en-US')}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-white border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
          <div>
            <div className="text-xs font-bold text-slate-500">{t.totalRoute}</div>
            <div className="font-mono tabular-nums text-base font-extrabold text-slate-950 mt-0.5">
              {formatDistance(totalDistanceKm, unit)}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500">{t.longestFlight}</div>
            <div className="font-mono tabular-nums text-base font-extrabold text-[#3A86FF] mt-0.5">
              {longestLeg?.city ? `${longestLeg.city.name} (${formatDistance(longestLeg.distanceKm, unit)})` : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500">{t.gdgBonuses}</div>
            <div className="font-mono tabular-nums text-base font-extrabold text-[#FB5607] mt-0.5">
              {gdgHits} {gdgHits === 1 ? t.citySingular : t.cityPlural} (+{gdgHits * 100} {t.pts})
            </div>
          </div>
        </div>

        {/* Turn-by-Turn Table */}
        <div className="flex-1 overflow-y-auto custom-scroll px-4 sm:px-6 py-3.5 sm:py-4 bg-white">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="text-slate-500 border-b border-slate-200 text-xs">
                <th className="py-2 pr-2 sm:pr-3 font-extrabold">{t.colTurn}</th>
                <th className="py-2 pr-2 sm:pr-3 font-extrabold">{t.colPlayer}</th>
                <th className="py-2 pr-2 sm:pr-3 font-extrabold">{t.colCity}</th>
                <th className="py-2 pr-2 sm:pr-3 font-extrabold text-right">{t.colDistance}</th>
                <th className="py-2 font-extrabold text-right">{t.colPoints}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {turns.map((turn) => (
                <tr
                  key={turn.index}
                  onClick={() => {
                    if (turn.city) {
                      onFocusCity(turn.city);
                      onInspectGlobe();
                    }
                  }}
                  className={turn.city ? 'hover:bg-slate-50 cursor-pointer' : ''}
                >
                  <td className="py-2.5 pr-2 sm:pr-3 font-mono tabular-nums font-bold text-slate-500 whitespace-nowrap">
                    {turn.index === 0 ? t.originTag : `#${turn.index}`}
                  </td>
                  <td className="py-2.5 pr-2 sm:pr-3 font-extrabold whitespace-nowrap">
                    <span
                      className={
                        turn.playerId === 'p1'
                          ? 'text-[#3A86FF]'
                          : turn.playerId === 'p2'
                            ? 'text-[#FF006E]'
                            : 'text-[#8338EC]'
                      }
                    >
                      {turn.playerName}
                    </span>
                  </td>
                  <td className="py-2.5 pr-2 sm:pr-3">
                    {turn.city ? (
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-extrabold text-slate-950">{turn.city.name}</span>
                        {turn.city.isGdg && (
                          <span className="inline-flex items-center gap-1 bg-[#FFBE0B] text-slate-950 px-1.5 py-0.5 rounded text-[11px] font-extrabold">
                            <Award className="w-3 h-3" aria-hidden="true" />
                            {t.gdgChapterBadge}
                          </span>
                        )}
                        {turn.wasMisspelled && turn.typedQuery && (
                          <span className="text-xs font-bold text-[#8338EC]">
                            ({t.fromQuery(turn.typedQuery)})
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="font-bold text-[#FF006E]">
                        {t.timedOutNeeded(turn.requiredLetter)}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 pr-2 sm:pr-3 font-mono tabular-nums font-bold text-right text-slate-700 whitespace-nowrap">
                    {turn.index === 0 || turn.timedOut ? '—' : formatDualDistance(turn.distanceKm)}
                  </td>
                  <td className="py-2.5 font-mono tabular-nums text-right whitespace-nowrap">
                    {turn.index === 0 ? (
                      <span className="text-slate-400">—</span>
                    ) : turn.timedOut ? (
                      <span className="text-slate-400 font-bold">0 {t.pts}</span>
                    ) : (
                      <span className="text-[#3A86FF] font-extrabold">
                        +{turn.score.totalPoints} {t.pts}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Social Share Bar */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-200 bg-slate-50/60 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-slate-600 flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-[#8338EC]" aria-hidden="true" />
              {t.shareResult}
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={linkedinHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => copySummary(t.copiedLinkedIn)}
                className="min-h-[36px] inline-flex items-center px-3.5 py-1.5 rounded-lg bg-[#0A66C2] hover:bg-[#004182] text-white text-xs font-extrabold transition-colors whitespace-nowrap"
              >
                LinkedIn
              </a>
              <a
                href={xHref}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[36px] inline-flex items-center px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold transition-colors whitespace-nowrap"
              >
                X / Twitter
              </a>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[36px] inline-flex items-center px-3.5 py-1.5 rounded-lg bg-[#128C7E] hover:bg-[#075E54] text-white text-xs font-extrabold transition-colors whitespace-nowrap"
              >
                WhatsApp
              </a>
              <button
                type="button"
                onClick={() => copySummary(t.copiedClipboard)}
                className="min-h-[36px] px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-slate-500 text-slate-800 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                {shareNotice === t.copiedClipboard || shareNotice === t.copiedLinkedIn ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                ) : (
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>{t.copyBtn}</span>
              </button>
              {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="min-h-[36px] px-3.5 py-1.5 rounded-lg bg-[#8338EC] hover:bg-[#6D28D9] text-white text-xs font-extrabold cursor-pointer whitespace-nowrap"
                >
                  {t.shareMoreBtn}
                </button>
              )}
            </div>
          </div>

          {shareNotice && (
            <div role="status" className="text-xs font-bold text-[#3A86FF]">
              {shareNotice}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onInspectGlobe}
            className="min-h-[44px] px-4 py-2 rounded-xl border-2 border-slate-200 hover:border-slate-400 text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <Eye className="w-4 h-4" aria-hidden="true" />
            <span>{t.inspectGlobe}</span>
          </button>

          <button
            type="button"
            onClick={onPlayAgain}
            className="min-h-[44px] px-5 sm:px-6 py-2 rounded-xl bg-[#3A86FF] hover:bg-[#2563EB] text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 cursor-pointer whitespace-nowrap shadow-md"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>{t.playAgain}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
