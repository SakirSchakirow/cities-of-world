import type { DistanceUnit, ScoreBreakdown } from '../types/game';

const EARTH_RADIUS_KM = 6371;
const KM_TO_MILES = 0.621371;

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export function kmToMiles(km: number): number {
  return km * KM_TO_MILES;
}

export function formatDistance(km: number, unit: DistanceUnit): string {
  const value = unit === 'mi' ? kmToMiles(km) : km;
  return `${Math.round(value).toLocaleString('en-US')} ${unit}`;
}

export function formatDualDistance(km: number): string {
  const roundedKm = Math.round(km).toLocaleString('en-US');
  const roundedMi = Math.round(kmToMiles(km)).toLocaleString('en-US');
  return `${roundedKm} km · ${roundedMi} mi`;
}

export function computeScoreBreakdown(distanceKm: number, isGdg: boolean): ScoreBreakdown {
  const distancePoints = distanceKm > 0 ? Math.max(1, Math.round(distanceKm / 20)) : 0;
  const gdgBonus = isGdg ? 100 : 0;
  return {
    distancePoints,
    gdgBonus,
    totalPoints: distancePoints + gdgBonus,
  };
}
