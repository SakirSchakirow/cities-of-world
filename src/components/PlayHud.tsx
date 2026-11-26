import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  History,
  Send,
  Sparkles,
} from 'lucide-react';
import { TRANSLATIONS, type Language } from '../i18n/translations';
import type {
  CityInfo,
  DistanceUnit,
  GameMode,
  GamePhase,
  MatchFormat,
  PlayerId,
  TurnRecord,
} from '../types/game';
import { formatDistance } from '../utils/geo';

interface PlayHudProps {
  lang: Language;
  phase: GamePhase;
  mode: GameMode;
  matchFormat: MatchFormat;
  turnCount: number;
  turnSeconds: number;
  player1Name: string;
  player2Name: string;
  p1Score: number;
  p2Score: number;
  activePlayer: PlayerId;
  currentMoveNumber: number;
  totalMoves: number;
  turns: TurnRecord[];
  lastValidCity: CityInfo | null;
  requiredLetter: string;
  timeLeft: number;
  isAiThinking: boolean;
  isSubmitting: boolean;
  feedback: { type: 'error' | 'success' | 'info'; text: string } | null;
  unit: DistanceUnit;
  onSubmitCity: (query: string) => void;
  onFocusCity: (city: CityInfo) => void;
  onOpenSummary: () => void;
}

export function PlayHud({
  lang,
  phase,
  mode,
  matchFormat,
  turnCount,
  turnSeconds,
  player1Name,
  player2Name,
  p1Score,
  p2Score,
  activePlayer,
  currentMoveNumber,
  totalMoves,
  turns,
  lastValidCity,
  requiredLetter,
  timeLeft,
  isAiThinking,
  isSubmitting,
  feedback,
  unit,
  onSubmitCity,
  onFocusCity,
  onOpenSummary,
}: PlayHudProps) {
  const t = TRANSLATIONS[lang];
  const [cityInput, setCityInput] = useState('');
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isHumanTurn = phase === 'playing' && (mode === 'pvp' || activePlayer === 'p1');

  useEffect(() => {
    if (isHumanTurn && !dockCollapsed) {
      inputRef.current?.focus();
    }
  }, [isHumanTurn, activePlayer, currentMoveNumber, dockCollapsed]);

  useEffect(() => {
    setCityInput('');
  }, [currentMoveNumber]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isHumanTurn || isSubmitting || !cityInput.trim()) return;
    onSubmitCity(cityInput);
  };

  const currentRound = matchFormat === 'rounds' ? Math.ceil(currentMoveNumber / 2) : currentMoveNumber;
  const totalRounds = matchFormat === 'rounds' ? turnCount : totalMoves;
  const activePlayerName = activePlayer === 'p1' ? player1Name : player2Name;
  const timerPercent = Math.max(0, Math.min(100, (timeLeft / turnSeconds) * 100));
  const urgentThreshold = Math.min(5, Math.max(2, Math.floor(turnSeconds * 0.2)));
  const warnThreshold = Math.min(10, Math.max(4, Math.floor(turnSeconds * 0.35)));
  const timerUrgent = timeLeft <= urgentThreshold;
  const timerWarn = timeLeft > urgentThreshold && timeLeft <= warnThreshold;

  return (
    <>
      {/* Top Scoreboard & Route Chain Strip */}
      <div className="pointer-events-none absolute top-14 sm:top-16 left-0 right-0 z-10 px-2.5 sm:px-6 pt-1.5 sm:pt-2">
        <div className="mx-auto max-w-6xl flex flex-col gap-1.5 sm:gap-2">
          <div className="pointer-events-auto flex items-center justify-between gap-2 sm:gap-4 rounded-xl bg-white/95 border-2 border-slate-200 shadow-lg px-3 sm:px-5 py-2 sm:py-3">
            {/* Player 1 */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span
                className={`h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full shrink-0 ${
                  activePlayer === 'p1' && phase === 'playing' ? 'bg-[#3A86FF]' : 'bg-[#3A86FF]/35'
                }`}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-slate-600">
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 truncate max-w-[82px] sm:max-w-[140px]">
                    {player1Name}
                  </span>
                  {activePlayer === 'p1' && phase === 'playing' && (
                    <span className="hidden sm:inline text-[#3A86FF] font-extrabold">· {t.activeLabel}</span>
                  )}
                </div>
                <div className="font-mono tabular-nums text-lg sm:text-3xl font-extrabold text-slate-950 leading-none mt-0.5">
                  {p1Score.toLocaleString('en-US')}{' '}
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500">{t.pts}</span>
                </div>
              </div>
            </div>

            {/* Center Turn Progress */}
            <div className="text-center px-1 sm:px-3 min-w-0">
              <div className="text-xs sm:text-sm font-extrabold text-[#8338EC] whitespace-nowrap">
                {phase === 'finished'
                  ? t.matchComplete
                  : matchFormat === 'rounds'
                    ? t.roundOf(currentRound, totalRounds)
                    : t.turnOf(currentRound, totalRounds)}
              </div>
              {lastValidCity && (
                <div className="text-[11px] sm:text-sm font-semibold text-slate-600 mt-0.5 truncate max-w-[125px] sm:max-w-[280px]">
                  <span className="hidden sm:inline">{t.currentCity}: </span>
                  <span className="font-extrabold text-slate-950">{lastValidCity.name}</span>
                </div>
              )}
            </div>

            {/* Player 2 / AI */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 text-right">
              <div className="min-w-0">
                <div className="flex items-center justify-end gap-1.5 text-[11px] sm:text-xs font-bold text-slate-600">
                  {activePlayer === 'p2' && phase === 'playing' && (
                    <span className="hidden sm:inline text-[#FF006E] font-extrabold">{t.activeLabel} ·</span>
                  )}
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 truncate max-w-[82px] sm:max-w-[140px]">
                    {player2Name}
                  </span>
                </div>
                <div className="font-mono tabular-nums text-lg sm:text-3xl font-extrabold text-slate-950 leading-none mt-0.5">
                  {p2Score.toLocaleString('en-US')}{' '}
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500">{t.pts}</span>
                </div>
              </div>
              <span
                className={`h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full shrink-0 ${
                  activePlayer === 'p2' && phase === 'playing' ? 'bg-[#FF006E]' : 'bg-[#FF006E]/35'
                }`}
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Clickable City Chain Strip */}
          {turns.length > 0 && (
            <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto custom-scroll rounded-xl bg-white/92 border border-slate-200 shadow-sm px-2.5 sm:px-3.5 py-1.5 text-xs sm:text-sm font-semibold">
              <span className="text-slate-500 font-bold shrink-0 mr-0.5">{t.routeLabel}:</span>
              {turns
                .filter((tItem): tItem is TurnRecord & { city: CityInfo } => tItem.city !== null)
                .map((turn, idx) => (
                  <div key={`${turn.index}-${turn.city.id}`} className="flex items-center gap-1.5 shrink-0">
                    {idx > 0 && (
                      <span className="text-slate-400 font-mono text-[11px] font-bold" aria-hidden="true">
                        —{formatDistance(turn.distanceKm, unit)}→
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onFocusCity(turn.city)}
                      className="px-2 py-0.5 rounded-lg hover:bg-slate-100 text-slate-900 font-bold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1"
                      title={turn.city.name}
                    >
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{
                          backgroundColor:
                            turn.playerId === 'system'
                              ? '#8338EC'
                              : turn.playerId === 'p1'
                                ? '#3A86FF'
                                : '#FF006E',
                        }}
                      />
                      <span>{turn.city.name}</span>
                      {turn.city.isGdg && (
                        <span className="font-mono text-[10px] font-extrabold bg-[#FFBE0B] text-slate-950 px-1 py-0.5 rounded">
                          GDG
                        </span>
                      )}
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Center Control Dock */}
      <div className="pointer-events-none fixed bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 w-[min(820px,96vw)] flex flex-col items-center">
        <button
          type="button"
          onClick={() => setDockCollapsed((c) => !c)}
          className="pointer-events-auto mb-1 px-3.5 py-1 rounded-t-xl bg-white/95 border border-b-0 border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-950 flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
        >
          {dockCollapsed ? (
            <>
              <ChevronUp className="w-4 h-4" aria-hidden="true" />
              <span>{t.showDock}</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
              <span>{t.hideControls}</span>
            </>
          )}
        </button>

        {!dockCollapsed && (
          <div className="pointer-events-auto w-full rounded-2xl bg-white/96 border-2 border-slate-200 shadow-2xl overflow-hidden">
            {historyOpen && (
              <div className="border-b border-slate-200 max-h-44 sm:max-h-56 overflow-y-auto custom-scroll p-3 sm:p-4 bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900">{t.turnBreakdown}</span>
                  <span className="text-[11px] sm:text-xs font-semibold text-slate-500">
                    {t.clickToFocus}
                  </span>
                </div>
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-200">
                      <th className="py-1.5 pr-2 font-bold">{t.colTurn}</th>
                      <th className="py-1.5 pr-2 font-bold">{t.colPlayer}</th>
                      <th className="py-1.5 pr-2 font-bold">{t.colCity}</th>
                      <th className="py-1.5 pr-2 font-bold text-right">{t.colDistance}</th>
                      <th className="py-1.5 font-bold text-right">{t.colPoints}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80">
                    {turns.map((turn) => (
                      <tr
                        key={turn.index}
                        onClick={() => turn.city && onFocusCity(turn.city)}
                        className={turn.city ? 'hover:bg-white cursor-pointer' : 'opacity-70'}
                      >
                        <td className="py-2 pr-2 font-mono tabular-nums font-bold text-slate-500">
                          {turn.index === 0 ? t.startTag : turn.index}
                        </td>
                        <td className="py-2 pr-2 font-bold text-slate-800 whitespace-nowrap">
                          {turn.playerName}
                        </td>
                        <td className="py-2 pr-2 text-slate-950 font-bold">
                          {turn.city ? (
                            <span>
                              {turn.city.name}
                              {turn.wasMisspelled && turn.typedQuery && (
                                <span className="ml-1.5 text-xs text-[#8338EC] font-semibold">
                                  {t.fromQuery(turn.typedQuery)}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-[#FF006E]">{t.timedOutNeeded(turn.requiredLetter)}</span>
                          )}
                        </td>
                        <td className="py-2 pr-2 font-mono tabular-nums font-bold text-right text-slate-700 whitespace-nowrap">
                          {turn.index === 0 || turn.timedOut ? '—' : formatDistance(turn.distanceKm, unit)}
                        </td>
                        <td className="py-2 font-mono tabular-nums text-right whitespace-nowrap">
                          {turn.index === 0 ? (
                            <span className="text-slate-400">—</span>
                          ) : (
                            <span className="text-[#3A86FF] font-extrabold">
                              +{turn.score.totalPoints}
                              {turn.score.gdgBonus > 0 && (
                                <span className="bg-[#FFBE0B] text-slate-950 px-1.5 py-0.5 rounded text-[11px] font-extrabold ml-1.5">
                                  +{turn.score.gdgBonus} GDG
                                </span>
                              )}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {phase === 'playing' ? (
              <div className="p-3 sm:p-5 space-y-2.5 sm:space-y-3.5">
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
                      <span
                        className={`text-sm sm:text-base font-extrabold whitespace-nowrap ${
                          activePlayer === 'p1' ? 'text-[#3A86FF]' : 'text-[#FF006E]'
                        }`}
                      >
                        {t.playersTurn(activePlayerName)}
                      </span>
                      <span className="text-slate-300 font-bold">·</span>
                      <span className="text-xs sm:text-base font-bold text-slate-700">
                        {t.startWith}{' '}
                        <strong className="font-mono text-base sm:text-xl font-black text-slate-950 bg-[#FFBE0B] px-2 py-0.5 rounded-lg ml-0.5 shadow-xs">
                          {requiredLetter}
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                      <button
                        type="button"
                        onClick={() => setHistoryOpen((o) => !o)}
                        className="min-h-[36px] px-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-[#8338EC] flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      >
                        <History className="w-4 h-4" aria-hidden="true" />
                        <span>{t.logLabel(turns.length)}</span>
                      </button>

                      <div
                        className={`flex items-center gap-1 font-mono tabular-nums text-base sm:text-lg font-extrabold ${
                          timerUrgent
                            ? 'text-[#FF006E]'
                            : timerWarn
                              ? 'text-[#FB5607]'
                              : 'text-slate-900'
                        }`}
                      >
                        <Clock className="w-4 h-4" aria-hidden="true" />
                        <span>{timeLeft}s</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-2 sm:h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        timerUrgent
                          ? 'bg-[#FF006E]'
                          : timerWarn
                            ? 'bg-[#FB5607]'
                            : 'bg-[#3A86FF]'
                      }`}
                      style={{ width: `${timerPercent}%` }}
                    />
                  </div>
                </div>

                {isHumanTurn ? (
                  <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={cityInput}
                      onChange={(e) => setCityInput(e.target.value)}
                      disabled={isSubmitting}
                      placeholder={t.inputPlaceholder(requiredLetter)}
                      aria-label={t.inputPlaceholder(requiredLetter)}
                      className="flex-1 min-w-0 min-h-[44px] px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-slate-50 border-2 border-slate-200 text-base font-bold text-slate-950 placeholder:text-slate-400 placeholder:font-medium focus:outline-none focus:border-[#3A86FF]"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting || !cityInput.trim()}
                      className="min-h-[44px] px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-[#3A86FF] hover:bg-[#2563EB] disabled:bg-slate-200 disabled:text-slate-400 text-white font-display font-extrabold text-sm sm:text-base flex items-center gap-1.5 sm:gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-md"
                    >
                      <Send className="w-4 h-4" aria-hidden="true" />
                      <span>{t.submit}</span>
                    </button>
                  </form>
                ) : (
                  <div className="min-h-[44px] flex items-center justify-between px-3.5 sm:px-4 py-2.5 rounded-xl bg-[#8338EC]/8 border-2 border-[#8338EC]/25 text-sm sm:text-base font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#8338EC] shrink-0" aria-hidden="true" />
                      <span>
                        {isAiThinking
                          ? t.aiThinking(player2Name, requiredLetter)
                          : t.aiReady(player2Name)}
                      </span>
                    </div>
                  </div>
                )}

                {feedback && (
                  <div
                    role="status"
                    className={`flex items-start sm:items-center gap-2 text-xs sm:text-sm font-bold ${
                      feedback.type === 'error'
                        ? 'text-[#D9005D]'
                        : feedback.type === 'success'
                          ? 'text-slate-900'
                          : 'text-slate-700'
                    }`}
                  >
                    {feedback.type === 'error' ? (
                      <AlertCircle className="w-4 h-4 shrink-0 text-[#FF006E] mt-0.5 sm:mt-0" aria-hidden="true" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-[#3A86FF] mt-0.5 sm:mt-0" aria-hidden="true" />
                    )}
                    <span>{feedback.text}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3.5 sm:p-5 flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm sm:text-base font-semibold text-slate-700">
                  <span className="font-extrabold text-slate-950">{t.inspectingRoute}</span>{' '}
                  <span className="hidden sm:inline text-slate-500">· {t.dragToRotate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setHistoryOpen((o) => !o)}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl border-2 border-slate-200 hover:border-slate-400 text-xs sm:text-sm font-bold text-slate-800 cursor-pointer whitespace-nowrap"
                  >
                    {historyOpen ? t.hideLog : t.routeLogLabel(turns.length)}
                  </button>
                  <button
                    type="button"
                    onClick={onOpenSummary}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-[#8338EC] hover:bg-[#6D28D9] text-white text-xs sm:text-sm font-extrabold cursor-pointer whitespace-nowrap shadow-md"
                  >
                    {t.viewFinalScoreboard}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
