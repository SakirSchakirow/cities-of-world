import { Bot, Clock, Compass, Globe2, Keyboard, Play, ShieldCheck, Timer } from 'lucide-react';
import { TRANSLATIONS, type Language } from '../i18n/translations';
import type { GameMode, MatchFormat } from '../types/game';
import { RouletteSlider } from './RouletteSlider';

interface SetupPanelProps {
  lang: Language;
  mode: GameMode;
  onModeChange: (mode: GameMode) => void;
  matchFormat: MatchFormat;
  onMatchFormatChange: (format: MatchFormat) => void;
  turnCount: number;
  onTurnCountChange: (count: number) => void;
  turnSeconds: number;
  onTurnSecondsChange: (seconds: number) => void;
  player1Name: string;
  onPlayer1NameChange: (name: string) => void;
  player2Name: string;
  onPlayer2NameChange: (name: string) => void;
  onStartGame: () => void;
  onOpenPrivacy: () => void;
  isStarting: boolean;
}

function formatEstimatedPlayTime(
  turnCount: number,
  matchFormat: MatchFormat,
  mode: GameMode,
  turnSeconds: number,
  minUnit: string,
): string {
  const totalHumanMoves =
    matchFormat === 'rounds'
      ? mode === 'ai'
        ? turnCount
        : turnCount * 2
      : mode === 'ai'
        ? Math.ceil(turnCount / 2)
        : turnCount;
  const totalAiMoves =
    matchFormat === 'rounds'
      ? mode === 'ai'
        ? turnCount
        : 0
      : mode === 'ai'
        ? Math.floor(turnCount / 2)
        : 0;

  // Realistic low bound (~35% of turn clock per human turn) vs high bound (~85% of turn clock)
  const minTotalSec = totalHumanMoves * Math.max(4, turnSeconds * 0.35) + totalAiMoves * 1.5;
  const maxTotalSec = totalHumanMoves * Math.max(6, turnSeconds * 0.85) + totalAiMoves * 1.5;

  const minMins = Math.max(1, Math.round(minTotalSec / 60));
  const maxMins = Math.max(minMins, Math.round(maxTotalSec / 60));

  if (minMins === maxMins) {
    return `~${minMins} ${minUnit}`;
  }
  return `~${minMins}–${maxMins} ${minUnit}`;
}

export function SetupPanel({
  lang,
  mode,
  onModeChange,
  matchFormat,
  onMatchFormatChange,
  turnCount,
  onTurnCountChange,
  turnSeconds,
  onTurnSecondsChange,
  player1Name,
  onPlayer1NameChange,
  player2Name,
  onPlayer2NameChange,
  onStartGame,
  onOpenPrivacy,
  isStarting,
}: SetupPanelProps) {
  const t = TRANSLATIONS[lang];
  const estTime = formatEstimatedPlayTime(turnCount, matchFormat, mode, turnSeconds, t.minUnit);

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-end sm:items-center justify-center lg:justify-start px-3 sm:px-8 lg:px-14 pt-16 pb-3 sm:pb-6">
      <section
        aria-label="Match setup"
        className="pointer-events-auto w-full max-w-xl max-h-[calc(100dvh-4.75rem)] flex flex-col overflow-hidden rounded-2xl bg-white/95 border-2 border-[#3A86FF]/25 shadow-2xl"
      >
        {/* Settings scroll; the Start button and privacy note below stay pinned */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scroll p-4 sm:p-7 pb-4 sm:pb-5 space-y-4 sm:space-y-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#8338EC]">
            <Compass className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{t.tagline}</span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-black tracking-tight text-slate-900 [text-wrap:balance]">
            {t.brandTitle}
          </h1>
          <p className="text-sm sm:text-base font-medium text-slate-600 leading-relaxed">
            {t.setupDesc}
          </p>
        </div>

        {/* Mode Selection */}
        <div className="space-y-2">
          <span className="block text-xs font-bold text-slate-500">{t.opponentMode}</span>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => onModeChange('ai')}
              className={`min-h-[54px] flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 rounded-xl border-2 text-left transition-colors cursor-pointer ${
                mode === 'ai'
                  ? 'bg-[#3A86FF]/12 border-[#3A86FF] text-slate-950'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-[#3A86FF]/50 hover:text-slate-950'
              }`}
            >
              <Bot className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-[#3A86FF]" aria-hidden="true" />
              <div className="min-w-0">
                <div className="text-sm sm:text-base font-extrabold truncate">{t.soloVsAi}</div>
                <div className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate">{t.soloDesc}</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onModeChange('pvp')}
              className={`min-h-[54px] flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 rounded-xl border-2 text-left transition-colors cursor-pointer ${
                mode === 'pvp'
                  ? 'bg-[#FF006E]/10 border-[#FF006E] text-slate-950'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-[#FF006E]/50 hover:text-slate-950'
              }`}
            >
              <Keyboard className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-[#FF006E]" aria-hidden="true" />
              <div className="min-w-0">
                <div className="text-sm sm:text-base font-extrabold truncate">{t.sharedKeyboard}</div>
                <div className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate">{t.pvpDesc}</div>
              </div>
            </button>
          </div>
        </div>

        {/* Player Names */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
          <label className="block space-y-1">
            <span className="text-xs font-bold text-slate-600">{t.player1Label}</span>
            <input
              type="text"
              value={player1Name}
              maxLength={20}
              onChange={(e) => onPlayer1NameChange(e.target.value)}
              placeholder={t.player1Label}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-50 border-2 border-slate-200 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#3A86FF]"
            />
          </label>

          {mode === 'pvp' ? (
            <label className="block space-y-1">
              <span className="text-xs font-bold text-slate-600">{t.player2Label}</span>
              <input
                type="text"
                value={player2Name}
                maxLength={20}
                onChange={(e) => onPlayer2NameChange(e.target.value)}
                placeholder={t.player2Label}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-50 border-2 border-slate-200 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#FF006E]"
              />
            </label>
          ) : (
            <div className="space-y-1">
              <span className="block text-xs font-bold text-slate-600">{t.competitorLabel}</span>
              <div className="min-h-[44px] px-3 py-2 rounded-xl bg-[#8338EC]/8 border-2 border-[#8338EC]/25 text-base font-bold text-slate-900 flex items-center justify-between gap-2">
                <span className="truncate">Atlas AI</span>
                <span className="font-mono text-xs font-extrabold text-[#8338EC] shrink-0">{t.ready}</span>
              </div>
            </div>
          )}
        </div>

        {/* Match Length: Roulette Slider (1-100) + Structure + Estimated Time */}
        <div className="space-y-2.5 border-t border-slate-200 pt-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-600">{t.turnsCountLabel}</span>
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#8338EC]">
              <Timer className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>
                {t.estPlayTime}: <span className="font-mono tabular-nums">{estTime}</span>
              </span>
            </div>
          </div>

          <RouletteSlider
            value={turnCount}
            min={1}
            max={100}
            onChange={onTurnCountChange}
            ariaLabel={t.turnsCountLabel}
          />

          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => onMatchFormatChange('rounds')}
              className={`min-h-[38px] px-2.5 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                matchFormat === 'rounds'
                  ? 'bg-[#8338EC] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              {turnCount} {t.roundsMode}
            </button>
            <button
              type="button"
              onClick={() => onMatchFormatChange('moves')}
              className={`min-h-[38px] px-2.5 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                matchFormat === 'moves'
                  ? 'bg-[#8338EC] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              {turnCount} {t.movesMode}
            </button>
          </div>
        </div>

        {/* Turn Clock Control (10s - 60s, default 30s) */}
        <div className="space-y-2 border-t border-slate-200 pt-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#FB5607]" aria-hidden="true" />
              <span>{t.turnClockLabel}</span>
            </span>
            <span className="font-mono tabular-nums text-base font-black text-slate-950 bg-slate-100 px-2.5 py-0.5 rounded-lg">
              {turnSeconds}{t.secondsShort}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="range"
              min={10}
              max={60}
              step={5}
              value={turnSeconds}
              onChange={(e) => onTurnSecondsChange(Number(e.target.value))}
              aria-label={t.turnClockLabel}
              className="flex-1 min-w-[140px] h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#FB5607]"
            />
            <div className="flex items-center gap-1 shrink-0">
              {[10, 20, 30, 45, 60].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => onTurnSecondsChange(sec)}
                  className={`min-h-[32px] px-2 py-1 rounded-md font-mono text-[11px] font-extrabold transition-colors cursor-pointer ${
                    turnSeconds === sec
                      ? 'bg-[#FB5607] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Rules Summary */}
        <div className="border-t border-slate-200 pt-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <span className="font-extrabold text-slate-900">
              {turnSeconds}{t.secondsShort} {t.ruleClockTitle}
            </span>
            <p className="text-xs font-medium text-slate-600 mt-0.5">{t.ruleClockDesc}</p>
          </div>
          <div>
            <span className="font-extrabold text-[#3A86FF]">{t.ruleDistTitle}</span>
            <p className="text-xs font-medium text-slate-600 mt-0.5">{t.ruleDistDesc}</p>
          </div>
          <div>
            <span className="inline-block font-extrabold text-slate-950 bg-[#FFBE0B] px-1.5 py-0.5 rounded">
              {t.ruleGdgTitle}
            </span>
            <p className="text-xs font-medium text-slate-600 mt-0.5">{t.ruleGdgDesc}</p>
          </div>
        </div>
        </div>

        <div className="shrink-0 px-4 sm:px-7 pt-3 sm:pt-4 pb-4 sm:pb-6 border-t border-slate-200 bg-white/95 space-y-2.5">
        <button
          type="button"
          disabled={isStarting}
          onClick={onStartGame}
          className="w-full min-h-[48px] py-3.5 px-6 rounded-xl bg-[#3A86FF] hover:bg-[#2563EB] disabled:opacity-60 text-white font-display font-extrabold text-base sm:text-lg flex items-center justify-center gap-2.5 shadow-lg transition-colors cursor-pointer whitespace-nowrap"
        >
          {isStarting ? (
            <>
              <Globe2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              <span>{t.chartingCity}</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" aria-hidden="true" />
              <span>{t.startMatch}</span>
            </>
          )}
        </button>

        <div className="pt-0.5 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-500">
          <span>{t.localPrivacyNote}</span>
          <button
            type="button"
            onClick={onOpenPrivacy}
            className="text-slate-700 hover:text-[#3A86FF] underline underline-offset-2 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t.privacyFull}</span>
          </button>
        </div>
        </div>
      </section>
    </div>
  );
}
