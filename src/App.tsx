import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, ShieldCheck, Volume2, VolumeX } from 'lucide-react';
import { GlobeViewport } from './components/GlobeViewport';
import { MatchSummaryModal } from './components/MatchSummaryModal';
import { PlayHud } from './components/PlayHud';
import { PrivacyDisclaimerModal } from './components/PrivacyDisclaimerModal';
import { SetupPanel } from './components/SetupPanel';
import { TRANSLATIONS, type Language } from './i18n/translations';
import type {
  CityInfo,
  DistanceUnit,
  GameMode,
  GamePhase,
  MatchFormat,
  PlayerId,
  TurnRecord,
} from './types/game';
import { soundEngine } from './utils/audio';
import { getRandomStartingCity, pickAiCity, resolveCityQuery } from './utils/cityEngine';
import {
  computeScoreBreakdown,
  formatDistance,
  haversineKm,
} from './utils/geo';

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [mode, setMode] = useState<GameMode>('ai');
  const [matchFormat, setMatchFormat] = useState<MatchFormat>('rounds');
  const [turnCount, setTurnCount] = useState<number>(7);
  const [turnSeconds, setTurnSeconds] = useState<number>(30);
  const [unit, setUnit] = useState<DistanceUnit>('km');
  const [muted, setMuted] = useState(false);

  const [player1Name, setPlayer1Name] = useState('Player 1');
  const [player2Name, setPlayer2Name] = useState('Player 2');

  const [turns, setTurns] = useState<TurnRecord[]>([]);
  const [activePlayer, setActivePlayer] = useState<PlayerId>('p1');
  const [currentMoveNumber, setCurrentMoveNumber] = useState(1);
  const [timeLeft, setTimeLeft] = useState(turnSeconds);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [focusCity, setFocusCity] = useState<CityInfo | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'error' | 'success' | 'info';
    text: string;
  } | null>(null);

  const aiTimeoutRef = useRef<number | null>(null);
  const t = TRANSLATIONS[lang];

  const totalMoves = matchFormat === 'rounds' ? turnCount * 2 : turnCount;
  const effectiveP1Name =
    player1Name.trim() || (lang === 'de' ? 'Spieler 1' : 'Player 1');
  const effectiveP2Name =
    mode === 'ai'
      ? lang === 'de'
        ? 'Atlas KI'
        : 'Atlas AI'
      : player2Name.trim() || (lang === 'de' ? 'Spieler 2' : 'Player 2');

  const handleLanguageChange = (nextLang: Language) => {
    setLang(nextLang);
    if (player1Name === 'Player 1' && nextLang === 'de') setPlayer1Name('Spieler 1');
    if (player1Name === 'Spieler 1' && nextLang === 'en') setPlayer1Name('Player 1');
    if (player2Name === 'Player 2' && nextLang === 'de') setPlayer2Name('Spieler 2');
    if (player2Name === 'Spieler 2' && nextLang === 'en') setPlayer2Name('Player 2');
  };

  const lastValidCity = useMemo(() => {
    for (let i = turns.length - 1; i >= 0; i--) {
      if (turns[i].city) return turns[i].city;
    }
    return null;
  }, [turns]);

  const requiredLetter = lastValidCity ? lastValidCity.endLetter : 'A';

  const usedCityIds = useMemo(
    () => turns.filter((turn) => turn.city !== null).map((turn) => turn.city!.id),
    [turns],
  );

  const { p1Score, p2Score } = useMemo(() => {
    let p1 = 0;
    let p2 = 0;
    for (const turn of turns) {
      if (turn.playerId === 'p1') p1 += turn.score.totalPoints;
      if (turn.playerId === 'p2') p2 += turn.score.totalPoints;
    }
    return { p1Score: p1, p2Score: p2 };
  }, [turns]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    soundEngine.setMuted(next);
  };

  const advanceTurnOrFinish = useCallback(
    (nextTurns: TurnRecord[], moveIndex: number, whoMoved: PlayerId) => {
      if (moveIndex >= totalMoves) {
        setPhase('finished');
        setShowSummaryModal(true);
        soundEngine.playVictory();
        return;
      }
      setCurrentMoveNumber(moveIndex + 1);
      setActivePlayer(whoMoved === 'p1' ? 'p2' : 'p1');
      setTimeLeft(turnSeconds);
    },
    [totalMoves, turnSeconds],
  );

  const startNewGame = () => {
    if (aiTimeoutRef.current) {
      window.clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }
    setIsStarting(true);
    setFeedback(null);
    setShowSummaryModal(false);

    const startCity = getRandomStartingCity();

    const initialTurn: TurnRecord = {
      index: 0,
      round: 0,
      playerId: 'system',
      playerName: t.startTag,
      city: startCity,
      distanceKm: 0,
      score: {
        distancePoints: 0,
        gdgBonus: 0,
        totalPoints: 0,
      },
      timedOut: false,
      requiredLetter: startCity.startLetter,
      timestamp: Date.now(),
    };

    setTurns([initialTurn]);
    setFocusCity(startCity);
    setActivePlayer('p1');
    setCurrentMoveNumber(1);
    setTimeLeft(turnSeconds);
    setIsAiThinking(false);
    setIsSubmitting(false);
    setIsStarting(false);
    setPhase('playing');
    setFeedback({
      type: 'info',
      text: t.startingPrompt(
        startCity.name,
        effectiveP1Name,
        startCity.endLetter,
      ),
    });
  };

  const handleReturnToSetup = () => {
    if (aiTimeoutRef.current) {
      window.clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }
    setPhase('setup');
    setTurns([]);
    setShowSummaryModal(false);
    setFeedback(null);
    setIsAiThinking(false);
    setIsSubmitting(false);
  };

  const recordValidCityMove = useCallback(
    (
      city: CityInfo,
      who: PlayerId,
      options?: { typedQuery?: string; wasMisspelled?: boolean },
    ) => {
      if (!lastValidCity) return;
      const distKm = haversineKm(lastValidCity.lat, lastValidCity.lng, city.lat, city.lng);
      const breakdown = computeScoreBreakdown(distKm, city.isGdg);

      const playerName = who === 'p1' ? effectiveP1Name : effectiveP2Name;
      const roundNum = matchFormat === 'rounds' ? Math.ceil(currentMoveNumber / 2) : currentMoveNumber;

      const record: TurnRecord = {
        index: currentMoveNumber,
        round: roundNum,
        playerId: who,
        playerName,
        city,
        typedQuery: options?.typedQuery,
        wasMisspelled: options?.wasMisspelled,
        distanceKm: distKm,
        score: breakdown,
        timedOut: false,
        requiredLetter,
        timestamp: Date.now(),
      };

      const nextTurns = [...turns, record];
      setTurns(nextTurns);
      setFocusCity(city);
      soundEngine.playAccepted(city.isGdg);

      const bonusSuffix = breakdown.gdgBonus > 0 ? t.gdgBonusTag(breakdown.gdgBonus) : '';
      const typoPrefix =
        options?.wasMisspelled && options.typedQuery
          ? t.matchedFrom(options.typedQuery)
          : '';

      setFeedback({
        type: 'success',
        text: `${typoPrefix}${city.name} · ${formatDistance(distKm, unit)} · +${breakdown.totalPoints} ${t.pts}${bonusSuffix}`,
      });

      advanceTurnOrFinish(nextTurns, currentMoveNumber, who);
    },
    [
      lastValidCity,
      effectiveP1Name,
      effectiveP2Name,
      matchFormat,
      currentMoveNumber,
      requiredLetter,
      turns,
      unit,
      lang,
      t,
      advanceTurnOrFinish,
    ],
  );

  const handleSubmitCity = (query: string) => {
    if (phase !== 'playing' || isSubmitting || !lastValidCity) return;
    setIsSubmitting(true);

    const result = resolveCityQuery(query, requiredLetter, usedCityIds);
    if (!result.valid || !result.city) {
      soundEngine.playError();
      let localizedErr = t.errNotFound(requiredLetter, query.trim());
      if (result.reason === 'EMPTY') {
        localizedErr = t.errEmpty;
      } else if (result.reason === 'WRONG_FIRST_LETTER' && result.typedFirst) {
        localizedErr = t.errWrongFirstLetter(result.typedFirst, requiredLetter);
      } else if (result.reason === 'ALREADY_USED' && result.city) {
        localizedErr = t.errAlreadyUsed(result.city.name);
      }
      setFeedback({
        type: 'error',
        text: localizedErr,
      });
      setIsSubmitting(false);
      return;
    }

    recordValidCityMove(result.city, activePlayer, {
      typedQuery: query.trim(),
      wasMisspelled: result.wasMisspelled,
    });
    setIsSubmitting(false);
  };

  // Turn countdown timer for human turns
  useEffect(() => {
    if (phase !== 'playing') return;
    if (mode === 'ai' && activePlayer === 'p2') return;

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        if (prev <= 6) {
          soundEngine.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [phase, mode, activePlayer, currentMoveNumber]);

  // Handle timeout when timer reaches 0
  useEffect(() => {
    if (phase !== 'playing' || timeLeft > 0) return;
    if (mode === 'ai' && activePlayer === 'p2') return;

    soundEngine.playTimeout();
    const who = activePlayer;
    const playerName = who === 'p1' ? effectiveP1Name : effectiveP2Name;
    const roundNum = matchFormat === 'rounds' ? Math.ceil(currentMoveNumber / 2) : currentMoveNumber;

    const timeoutRecord: TurnRecord = {
      index: currentMoveNumber,
      round: roundNum,
      playerId: who,
      playerName,
      city: null,
      distanceKm: 0,
      score: {
        distancePoints: 0,
        gdgBonus: 0,
        totalPoints: 0,
      },
      timedOut: true,
      requiredLetter,
      timestamp: Date.now(),
    };

    const nextTurns = [...turns, timeoutRecord];
    setTurns(nextTurns);
    setFeedback({
      type: 'error',
      text: t.ranOutOfTime(playerName, requiredLetter),
    });
    advanceTurnOrFinish(nextTurns, currentMoveNumber, who);
  }, [
    timeLeft,
    phase,
    mode,
    activePlayer,
    effectiveP1Name,
    effectiveP2Name,
    matchFormat,
    currentMoveNumber,
    requiredLetter,
    turns,
    t,
    advanceTurnOrFinish,
  ]);

  // Trigger client-side AI competitor move
  useEffect(() => {
    if (phase !== 'playing' || mode !== 'ai' || activePlayer !== 'p2' || !lastValidCity) {
      return;
    }

    let cancelled = false;
    setIsAiThinking(true);

    aiTimeoutRef.current = window.setTimeout(() => {
      if (cancelled) return;
      const aiCity = pickAiCity(requiredLetter, usedCityIds, lastValidCity.lat, lastValidCity.lng);

      if (aiCity) {
        recordValidCityMove(aiCity, 'p2');
      } else {
        const roundNum = matchFormat === 'rounds' ? Math.ceil(currentMoveNumber / 2) : currentMoveNumber;
        const timeoutRecord: TurnRecord = {
          index: currentMoveNumber,
          round: roundNum,
          playerId: 'p2',
          playerName: effectiveP2Name,
          city: null,
          distanceKm: 0,
          score: {
            distancePoints: 0,
            gdgBonus: 0,
            totalPoints: 0,
          },
          timedOut: true,
          requiredLetter,
          timestamp: Date.now(),
        };
        const nextTurns = [...turns, timeoutRecord];
        setTurns(nextTurns);
        setFeedback({
          type: 'info',
          text: t.aiPassed(effectiveP2Name, requiredLetter),
        });
        advanceTurnOrFinish(nextTurns, currentMoveNumber, 'p2');
      }
      setIsAiThinking(false);
    }, 1150);

    return () => {
      cancelled = true;
      if (aiTimeoutRef.current) {
        window.clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = null;
      }
    };
  }, [
    phase,
    mode,
    activePlayer,
    lastValidCity,
    requiredLetter,
    usedCityIds,
    currentMoveNumber,
    matchFormat,
    effectiveP2Name,
    turns,
    t,
    recordValidCityMove,
    advanceTurnOrFinish,
  ]);

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-[#EEF3FF]">
      {/* Full-viewport 3D Cartographic Globe */}
      <GlobeViewport
        turns={turns}
        unit={unit}
        focusCity={focusCity}
        autoSpin={phase === 'setup'}
      />

      {/* Top Navigation Bar (Responsive for desktop & vertical phones) */}
      <header className="pointer-events-auto absolute top-0 left-0 right-0 z-30 h-14 sm:h-16 px-3 sm:px-6 bg-white/94 border-b border-slate-200 shadow-xs flex items-center justify-between gap-2 sm:gap-6">
        {/* Zone 1: Brand wordmark */}
        <span className="font-display text-base sm:text-2xl font-black tracking-tight text-slate-950 whitespace-nowrap shrink-0 truncate max-w-[130px] sm:max-w-none">
          {t.brandTitle}
        </span>

        {/* Zone 2: Language, Unit, Sound & Privacy controls */}
        <div className="flex items-center gap-1.5 sm:gap-4 text-xs sm:text-sm font-bold text-slate-700 shrink-0">
          {/* Language Toggle */}
          <div className="flex items-center gap-0.5 p-0.5 sm:p-1 rounded-lg bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => handleLanguageChange('en')}
              className={`min-h-[32px] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[11px] sm:text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                lang === 'en' ? 'bg-[#8338EC] text-white' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('de')}
              className={`min-h-[32px] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[11px] sm:text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                lang === 'de' ? 'bg-[#8338EC] text-white' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              DE
            </button>
          </div>

          {/* Unit Toggle */}
          <div className="flex items-center gap-0.5 p-0.5 sm:p-1 rounded-lg bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => setUnit('km')}
              className={`min-h-[32px] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[11px] sm:text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                unit === 'km' ? 'bg-[#3A86FF] text-white' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              km
            </button>
            <button
              type="button"
              onClick={() => setUnit('mi')}
              className={`min-h-[32px] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[11px] sm:text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                unit === 'mi' ? 'bg-[#3A86FF] text-white' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              mi
            </button>
          </div>

          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? t.muted : t.sound}
            className="min-h-[36px] min-w-[36px] flex items-center justify-center gap-1.5 text-slate-700 hover:text-[#8338EC] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {muted ? <VolumeX className="w-4 h-4" aria-hidden="true" /> : <Volume2 className="w-4 h-4" aria-hidden="true" />}
            <span className="hidden lg:inline">{muted ? t.muted : t.sound}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPrivacyModal(true)}
            aria-label={t.privacyFull}
            className="min-h-[36px] min-w-[36px] flex items-center justify-center gap-1.5 text-slate-700 hover:text-[#3A86FF] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            <span className="hidden lg:inline">{t.privacyFull}</span>
          </button>
        </div>

        {/* Zone 3: Primary action */}
        <div className="shrink-0">
          {phase === 'setup' ? (
            <button
              type="button"
              disabled={isStarting}
              onClick={startNewGame}
              className="hidden sm:inline-flex min-h-[38px] px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl bg-[#FB5607] hover:bg-[#E04800] text-white text-xs sm:text-sm font-extrabold transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-sm items-center"
            >
              {t.startMatch}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleReturnToSetup}
              className="min-h-[36px] px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-[#8338EC] hover:bg-[#6D28D9] text-white text-xs sm:text-sm font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
              <span className="hidden sm:inline">{t.newMatch}</span>
            </button>
          )}
        </div>
      </header>

      {/* Setup Screen */}
      {phase === 'setup' && (
        <SetupPanel
          lang={lang}
          mode={mode}
          onModeChange={setMode}
          matchFormat={matchFormat}
          onMatchFormatChange={setMatchFormat}
          turnCount={turnCount}
          onTurnCountChange={setTurnCount}
          turnSeconds={turnSeconds}
          onTurnSecondsChange={setTurnSeconds}
          player1Name={player1Name}
          onPlayer1NameChange={setPlayer1Name}
          player2Name={player2Name}
          onPlayer2NameChange={setPlayer2Name}
          onStartGame={startNewGame}
          onOpenPrivacy={() => setShowPrivacyModal(true)}
          isStarting={isStarting}
        />
      )}

      {/* Active Gameplay & Route Inspection HUD */}
      {phase !== 'setup' && (
        <PlayHud
          lang={lang}
          phase={phase}
          mode={mode}
          matchFormat={matchFormat}
          turnCount={turnCount}
          turnSeconds={turnSeconds}
          player1Name={effectiveP1Name}
          player2Name={effectiveP2Name}
          p1Score={p1Score}
          p2Score={p2Score}
          activePlayer={activePlayer}
          currentMoveNumber={currentMoveNumber}
          totalMoves={totalMoves}
          turns={turns}
          lastValidCity={lastValidCity}
          requiredLetter={requiredLetter}
          timeLeft={timeLeft}
          isAiThinking={isAiThinking}
          isSubmitting={isSubmitting}
          feedback={feedback}
          unit={unit}
          onSubmitCity={handleSubmitCity}
          onFocusCity={(city) => setFocusCity({ ...city })}
          onOpenSummary={() => setShowSummaryModal(true)}
        />
      )}

      {/* End-of-Match Scoreboard Modal */}
      {phase === 'finished' && showSummaryModal && (
        <MatchSummaryModal
          lang={lang}
          player1Name={effectiveP1Name}
          player2Name={effectiveP2Name}
          p1Score={p1Score}
          p2Score={p2Score}
          turns={turns}
          unit={unit}
          onPlayAgain={startNewGame}
          onInspectGlobe={() => setShowSummaryModal(false)}
          onFocusCity={(city) => setFocusCity({ ...city })}
        />
      )}

      {/* Privacy Policy & Legal Disclaimer Modal */}
      {showPrivacyModal && (
        <PrivacyDisclaimerModal lang={lang} onClose={() => setShowPrivacyModal(false)} />
      )}
    </div>
  );
}
