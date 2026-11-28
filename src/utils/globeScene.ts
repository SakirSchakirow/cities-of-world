import * as THREE from 'three';
import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import worldLandData from 'world-atlas/land-110m.json';
import type { CityInfo, PlayerId } from '../types/game';

// Shared by the live globe (GlobeViewport) and the route GIF export (routeGif),
// so both render the same globe.

export const GLOBE_RADIUS = 1.45;

export function playerColor(playerId: PlayerId | 'system'): string {
  return playerId === 'system' ? '#8338EC' : playerId === 'p1' ? '#3A86FF' : '#FF006E';
}

export function latLngToVec3(lat: number, lng: number, radius: number, out = new THREE.Vector3()): THREE.Vector3 {
  const theta = THREE.MathUtils.degToRad(90 - lat);
  const phi = THREE.MathUtils.degToRad(lng + 180);
  out.set(
    -radius * Math.sin(theta) * Math.cos(phi),
    radius * Math.cos(theta),
    radius * Math.sin(theta) * Math.sin(phi),
  );
  return out;
}

function drawGeoRing(
  ctx: CanvasRenderingContext2D,
  ring: number[][],
  w: number,
  h: number,
) {
  if (ring.length < 2) return;
  let prevLng = ring[0][0];
  ctx.moveTo(((prevLng + 180) / 360) * w, ((90 - ring[0][1]) / 180) * h);
  for (let i = 1; i < ring.length; i++) {
    const [lng, lat] = ring[i];
    const x = ((lng + 180) / 360) * w;
    const y = ((90 - lat) / 180) * h;
    if (Math.abs(lng - prevLng) > 180) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
    prevLng = lng;
  }
}

export function createProceduralGlobeTextures(maxAnisotropy: number): {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const width = 2048;
  const height = 1024;

  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = width;
  albedoCanvas.height = height;
  const ctx = albedoCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = width;
  roughCanvas.height = height;
  const rCtx = roughCanvas.getContext('2d')!;

  // Vibrant Azure Ocean Gradient (#3a86ff -> #2563eb)
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#5397FF');
  oceanGrad.addColorStop(0.5, '#3A86FF');
  oceanGrad.addColorStop(1, '#2B6CE6');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle sheen on ocean
  rCtx.fillStyle = 'rgb(115, 115, 115)';
  rCtx.fillRect(0, 0, width, height);

  // Crisp light graticule grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1;
  for (let lng = -180; lng <= 180; lng += 15) {
    const x = ((lng + 180) / 360) * width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let lat = -75; lat <= 75; lat += 15) {
    const y = ((90 - lat) / 180) * height;
    ctx.beginPath();
    ctx.strokeStyle = lat === 0 ? 'rgba(255, 190, 11, 0.55)' : 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = lat === 0 ? 1.8 : 1;
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Land masses only (countries merged), so no national borders are drawn.
  const topology = worldLandData as unknown as Topology<{
    land: GeometryCollection;
  }>;
  const landGeo = feature(topology, topology.objects.land);

  for (const feat of landGeo.features) {
    const geom = feat.geometry;
    if (!geom) continue;

    const polygons: number[][][][] =
      geom.type === 'Polygon'
        ? [geom.coordinates]
        : geom.type === 'MultiPolygon'
          ? geom.coordinates
          : [];

    ctx.beginPath();
    rCtx.beginPath();

    for (const poly of polygons) {
      for (const ring of poly) {
        drawGeoRing(ctx, ring, width, height);
        drawGeoRing(rCtx, ring, width, height);
      }
    }

    ctx.fillStyle = '#F8FAFC';
    ctx.fill();
    ctx.strokeStyle = '#6C5CE7';
    ctx.lineWidth = 1.1;
    ctx.stroke();

    rCtx.fillStyle = 'rgb(218, 218, 218)';
    rCtx.fill();
  }

  const map = new THREE.CanvasTexture(albedoCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = maxAnisotropy;
  map.needsUpdate = true;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.anisotropy = maxAnisotropy;
  roughnessMap.needsUpdate = true;

  return { map, roughnessMap };
}

/** Great-circle arc between two cities, lifted above the surface (higher for longer hops). */
export function buildArcCurve(from: CityInfo, to: CityInfo): THREE.CatmullRomCurve3 {
  const vStart = latLngToVec3(from.lat, from.lng, GLOBE_RADIUS).normalize();
  const vEnd = latLngToVec3(to.lat, to.lng, GLOBE_RADIUS).normalize();
  const angle = vStart.angleTo(vEnd);

  const arcPoints: THREE.Vector3[] = [];
  const segments = 48;
  const maxLift = Math.min(0.42, 0.06 + (angle / Math.PI) * 0.36);

  for (let s = 0; s <= segments; s++) {
    const t = s / segments;
    let dir: THREE.Vector3;
    if (angle < 0.001) {
      dir = vStart.clone();
    } else {
      const sinA = Math.sin(angle);
      const w1 = Math.sin((1 - t) * angle) / sinA;
      const w2 = Math.sin(t * angle) / sinA;
      dir = vStart
        .clone()
        .multiplyScalar(w1)
        .add(vEnd.clone().multiplyScalar(w2))
        .normalize();
    }
    const lift = Math.sin(t * Math.PI) * maxLift;
    arcPoints.push(dir.multiplyScalar(GLOBE_RADIUS + 0.006 + lift));
  }

  return new THREE.CatmullRomCurve3(arcPoints);
}
