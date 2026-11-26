export type GameMode = 'ai' | 'pvp';
export type GamePhase = 'setup' | 'playing' | 'finished';
export type DistanceUnit = 'km' | 'mi';
export type MatchFormat = 'rounds' | 'moves';

export type PlayerId = 'p1' | 'p2';

export interface CityInfo {
  id: number;
  name: string;
  lat: number;
  lng: number;
  population: number;
  isGdg: boolean;
  startLetter: string;
  endLetter: string;
}

export interface ScoreBreakdown {
  distancePoints: number;
  gdgBonus: number;
  totalPoints: number;
}

export interface TurnRecord {
  index: number; // 0 = starting city, 1..N = player turns
  round: number; // 1..7
  playerId: PlayerId | 'system';
  playerName: string;
  city: CityInfo | null; // null on timeout
  typedQuery?: string;
  wasMisspelled?: boolean;
  distanceKm: number;
  score: ScoreBreakdown;
  timedOut: boolean;
  requiredLetter: string;
  timestamp: number;
}

export interface ResolveCityResponse {
  valid: boolean;
  reason?: 'WRONG_FIRST_LETTER' | 'ALREADY_USED' | 'NOT_FOUND' | 'EMPTY';
  message?: string;
  typedFirst?: string;
  city?: CityInfo;
  wasMisspelled?: boolean;
  matchedFrom?: string;
}
