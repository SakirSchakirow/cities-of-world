import type { CityInfo, DistanceUnit, GameMode, PlayerId, TurnRecord } from '../types/game';
import type { Language } from '../i18n/translations';
import { getCityById } from './cityEngine';
import { haversineKm } from './geo';

// A match route packed into the URL hash, e.g.
//   #r=s1nh9k.a2abc.b3def&s=1234&m=ai&u=km&l=en
// Each stop is a player letter (s = start, a = player 1, b = player 2) followed by
// the city's GeoNames id in base 36. Nothing leaves the browser: the hash is never
// sent to the server, and it contains no player names.

export interface SharedRoute {
  turns: TurnRecord[];
  score: number;
  mode: GameMode;
  unit: DistanceUnit;
  lang: Language;
  totalKm: number;
}

const PLAYER_TO_CODE: Record<PlayerId | 'system', string> = { system: 's', p1: 'a', p2: 'b' };
const CODE_TO_PLAYER: Record<string, PlayerId | 'system'> = { s: 'system', a: 'p1', b: 'p2' };

export function routeTotalKm(turns: TurnRecord[]): number {
  return turns.reduce((sum, t) => sum + (t.city && !t.timedOut ? t.distanceKm : 0), 0);
}

export function buildReplayUrl(
  turns: TurnRecord[],
  opts: { score: number; mode: GameMode; unit: DistanceUnit; lang: Language },
): string {
  const stops = turns
    .filter((t): t is TurnRecord & { city: CityInfo } => t.city !== null)
    .map((t) => `${PLAYER_TO_CODE[t.playerId]}${t.city.id.toString(36)}`)
    .join('.');
  const params = new URLSearchParams({
    r: stops,
    s: String(Math.max(0, Math.round(opts.score))),
    m: opts.mode,
    u: opts.unit,
    l: opts.lang,
  });
  const base = `${location.origin}${location.pathname}`;
  return `${base}#${params.toString()}`;
}

export function parseReplayHash(hash: string): SharedRoute | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const raw = params.get('r');
  if (!raw) return null;

  const turns: TurnRecord[] = [];
  let prev: CityInfo | null = null;
  for (const token of raw.split('.').slice(0, 400)) {
    const player = CODE_TO_PLAYER[token[0]];
    const id = parseInt(token.slice(1), 36);
    if (!player || !Number.isFinite(id)) continue;
    const city = getCityById(id);
    if (!city) continue;
    const distanceKm = prev ? haversineKm(prev.lat, prev.lng, city.lat, city.lng) : 0;
    turns.push({
      index: turns.length,
      round: 0,
      playerId: turns.length === 0 ? 'system' : player,
      playerName: '',
      city,
      distanceKm,
      score: { distancePoints: 0, gdgBonus: 0, totalPoints: 0 },
      timedOut: false,
      requiredLetter: city.startLetter,
      timestamp: 0,
    });
    prev = city;
  }
  if (turns.length < 2) return null;

  const score = Number(params.get('s'));
  return {
    turns,
    score: Number.isFinite(score) && score > 0 ? Math.round(score) : 0,
    mode: params.get('m') === 'pvp' ? 'pvp' : 'ai',
    unit: params.get('u') === 'mi' ? 'mi' : 'km',
    lang: params.get('l') === 'de' ? 'de' : 'en',
    totalKm: routeTotalKm(turns),
  };
}

/** "Linz → Zurich → … → Oslo → Accra" (long routes are shortened). */
export function shortRouteChain(turns: TurnRecord[], max = 6): string {
  const names = turns.filter((t) => t.city).map((t) => t.city!.name);
  if (names.length <= max) return names.join(' → ');
  return [...names.slice(0, 3), '…', ...names.slice(-2)].join(' → ');
}
