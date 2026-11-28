import { GIFEncoder, applyPalette, quantize, type Palette } from 'gifenc';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { CityInfo, DistanceUnit, PlayerId, TurnRecord } from '../types/game';
import { formatDistance } from './geo';
import {
  GLOBE_RADIUS,
  buildArcCurve,
  createProceduralGlobeTextures,
  latLngToVec3,
  playerColor,
} from './globeScene';

// Renders a short, looping GIF of the match route frame by frame (no screen
// recording): the camera flies from city to city while each arc draws itself.
// Everything runs locally in the browser; nothing is uploaded.

const SIZE = 480; // output pixels (square works well in social feeds)
const SUPERSAMPLE = 2; // render at 2x and downscale for smooth edges
const FRAME_DELAY_MS = 60; // ~16.7 fps (GIF delays are stored in 10 ms steps)
const INTRO_S = 0.6;
const HOP_S = 0.5;
const OUTRO_S = 1.6;
const MAX_CITIES = 16; // longer matches show only the last 15 hops (~10 s total)
const CLOSE_DIST = 4.1;
const TUBE_SEGMENTS = 64;
const TUBE_RADIAL = 8;

interface RouteStop {
  city: CityInfo;
  color: string;
  playerId: PlayerId | 'system';
  distanceKm: number;
}

export interface RouteGifOptions {
  turns: TurnRecord[];
  unit: DistanceUnit;
  brandTitle: string;
  footerText: (cityCount: number, totalDistance: string) => string;
  onProgress?: (fraction: number) => void;
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const nextTick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

export async function generateRouteGif(options: RouteGifOptions): Promise<Blob> {
  const { turns, unit, brandTitle, footerText, onProgress } = options;

  const allStops: RouteStop[] = turns
    .filter((t): t is TurnRecord & { city: CityInfo } => t.city !== null)
    .map((t) => ({ city: t.city, color: playerColor(t.playerId), playerId: t.playerId, distanceKm: t.distanceKm }));
  if (allStops.length === 0) throw new Error('No cities to render');
  const stops = allStops.slice(-MAX_CITIES);
  const hops = stops.length - 1;
  const routeKm = stops.slice(1).reduce((sum, s) => sum + s.distanceKm, 0);

  if (document.fonts?.ready) await document.fonts.ready;

  // ---- Scene -------------------------------------------------------------
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setPixelRatio(1);
  renderer.setSize(SIZE * SUPERSAMPLE, SIZE * SUPERSAMPLE, false);

  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(obj: T): T => {
    disposables.push(obj);
    return obj;
  };

  try {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#EEF3FF');
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = track(pmrem.fromScene(new RoomEnvironment(), 0.04).texture);
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    scene.add(new THREE.HemisphereLight('#FFFFFF', '#CBD5E1', 1.2));
    // Same lights as the live globe, but attached to the camera so every city is lit
    // the way the game's default view is (light from upper right, in front).
    const keyLight = new THREE.DirectionalLight('#FFFDF5', 1.85);
    keyLight.position.set(2.2, 2.4, 0);
    camera.add(keyLight);
    scene.add(camera);
    scene.fog = new THREE.FogExp2('#EEF3FF', 0.018);

    const { map, roughnessMap } = createProceduralGlobeTextures(renderer.capabilities.getMaxAnisotropy());
    track(map);
    track(roughnessMap);
    const earth = new THREE.Mesh(
      track(new THREE.SphereGeometry(GLOBE_RADIUS, 64, 48)),
      track(
        new THREE.MeshPhysicalMaterial({
          map,
          roughnessMap,
          roughness: 0.85,
          metalness: 0.05,
          clearcoat: 0.16,
          clearcoatRoughness: 0.35,
        }),
      ),
    );
    scene.add(earth);

    const equator = new THREE.Mesh(
      track(new THREE.TorusGeometry(GLOBE_RADIUS * 1.015, 0.0045, 8, 120)),
      track(new THREE.MeshStandardMaterial({ color: '#8338EC', metalness: 0.65, roughness: 0.32 })),
    );
    equator.rotation.x = Math.PI / 2;
    scene.add(equator);

    // Pins
    const up = new THREE.Vector3(0, 1, 0);
    const ringGeo = track(new THREE.RingGeometry(0.024, 0.04, 24));
    const bonusRingGeo = track(new THREE.RingGeometry(0.046, 0.062, 28));
    const stemGeo = track(new THREE.CylinderGeometry(0.006, 0.006, 0.07, 8));
    const headGeo = track(new THREE.OctahedronGeometry(0.028, 1));
    const stemMat = track(new THREE.MeshStandardMaterial({ color: '#0F172A', metalness: 0.7, roughness: 0.3 }));
    const goldMat = track(new THREE.MeshBasicMaterial({ color: '#FFBE0B', side: THREE.DoubleSide }));

    const pins = stops.map((stop) => {
      const normal = latLngToVec3(stop.city.lat, stop.city.lng, 1).normalize();
      const group = new THREE.Group();
      group.position.copy(normal).multiplyScalar(GLOBE_RADIUS);
      group.quaternion.setFromUnitVectors(up, normal);

      const ring = new THREE.Mesh(
        ringGeo,
        track(new THREE.MeshBasicMaterial({ color: stop.color, side: THREE.DoubleSide })),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.003;
      group.add(ring);
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.y = 0.036;
      group.add(stem);
      const head = new THREE.Mesh(
        headGeo,
        track(
          new THREE.MeshStandardMaterial({
            color: stop.color,
            emissive: stop.color,
            emissiveIntensity: 0.35,
            metalness: 0.2,
            roughness: 0.25,
          }),
        ),
      );
      head.position.y = 0.078;
      group.add(head);
      if (stop.city.isGdg) {
        const bonus = new THREE.Mesh(bonusRingGeo, goldMat);
        bonus.rotation.x = -Math.PI / 2;
        bonus.position.y = 0.0045;
        group.add(bonus);
      }
      group.visible = false;
      scene.add(group);
      return { group, normal };
    });

    // Arcs (index buffer is ordered along the tube, so drawRange reveals it progressively)
    const arcs = stops.slice(1).map((stop, i) => {
      const curve = buildArcCurve(stops[i].city, stop.city);
      const geo = track(new THREE.TubeGeometry(curve, TUBE_SEGMENTS, 0.011, TUBE_RADIAL, false));
      const mesh = new THREE.Mesh(
        geo,
        track(
          new THREE.MeshStandardMaterial({
            color: stop.color,
            emissive: stop.color,
            emissiveIntensity: 0.3,
            roughness: 0.3,
            metalness: 0.15,
          }),
        ),
      );
      geo.setDrawRange(0, 0);
      scene.add(mesh);
      return { curve, geo, mid: curve.getPointAt(0.5) };
    });

    const head = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.03, 14, 14)),
      track(new THREE.MeshBasicMaterial({ color: '#FFBE0B' })),
    );
    head.visible = false;
    scene.add(head);

    // Final overview: look at the middle of the route from far enough to see all of it
    const centroid = new THREE.Vector3();
    pins.forEach((p) => centroid.add(p.normal));
    if (centroid.lengthSq() < 1e-4) centroid.copy(pins[pins.length - 1].normal);
    centroid.normalize();
    const spread = Math.max(...pins.map((p) => p.normal.angleTo(centroid)));
    const overviewDist = THREE.MathUtils.clamp(CLOSE_DIST + spread * 1.6, CLOSE_DIST + 0.3, 6.6);

    // ---- 2D overlay canvas -------------------------------------------------
    const out = document.createElement('canvas');
    out.width = SIZE;
    out.height = SIZE;
    const ctx = out.getContext('2d', { willReadFrequently: true })!;
    const siteText = location.hostname === 'localhost' ? '' : `${location.host}${location.pathname}`.replace(/\/$/, '');

    const projected = new THREE.Vector3();
    const camDir = new THREE.Vector3();

    const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    const toScreen = (world: THREE.Vector3) => {
      projected.copy(world).project(camera);
      return { x: ((projected.x + 1) / 2) * SIZE, y: ((-projected.y + 1) / 2) * SIZE };
    };

    const drawCityLabel = (stop: RouteStop, normal: THREE.Vector3, alpha: number) => {
      const facing = normal.dot(camDir);
      if (facing < 0.2 || alpha <= 0) return;
      const { x, y } = toScreen(normal.clone().multiplyScalar(GLOBE_RADIUS + 0.14));
      ctx.save();
      ctx.globalAlpha = alpha * clamp01((facing - 0.2) / 0.15);
      ctx.font = '700 15px "DM Sans", system-ui, sans-serif';
      const textW = ctx.measureText(stop.city.name).width;
      const w = textW + 32;
      const h = 26;
      const left = Math.min(Math.max(x - w / 2, 6), SIZE - w - 6);
      const top = y - h / 2;
      roundRect(left, top, w, h, 8);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = stop.city.isGdg ? '#FFBE0B' : stop.color;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(left + 12, top + h / 2, 4, 0, Math.PI * 2);
      ctx.fillStyle = stop.color;
      ctx.fill();
      ctx.fillStyle = '#0F172A';
      ctx.textBaseline = 'middle';
      ctx.fillText(stop.city.name, left + 22, top + h / 2 + 1);
      ctx.restore();
    };

    const drawDistanceLabel = (text: string, color: string, world: THREE.Vector3, alpha: number) => {
      if (world.clone().normalize().dot(camDir) < 0.1 || alpha <= 0) return;
      const { x, y } = toScreen(world);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = '800 13px "JetBrains Mono", ui-monospace, monospace';
      const w = ctx.measureText(text).width + 14;
      const h = 22;
      roundRect(x - w / 2, y - h / 2, w, h, 6);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y + 1);
      ctx.restore();
    };

    const drawChrome = (visibleCities: number, km: number) => {
      ctx.save();
      ctx.font = '900 22px Outfit, system-ui, sans-serif';
      ctx.fillStyle = '#0F172A';
      ctx.textBaseline = 'top';
      ctx.fillText(brandTitle, 16, 14);
      ctx.font = '700 13px "DM Sans", system-ui, sans-serif';
      ctx.fillStyle = '#334155';
      ctx.textBaseline = 'bottom';
      ctx.fillText(footerText(visibleCities, formatDistance(km, unit)), 16, SIZE - 14);
      if (siteText) {
        ctx.textAlign = 'right';
        ctx.fillStyle = '#3A86FF';
        ctx.fillText(siteText, SIZE - 16, SIZE - 14);
      }
      ctx.restore();
    };

    // ---- Timeline ----------------------------------------------------------
    const setCamera = (dir: THREE.Vector3, dist: number) => {
      camera.position.copy(dir).normalize().multiplyScalar(dist);
      camera.up.set(0, 1, 0);
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();
      camDir.copy(camera.position).normalize();
    };

    const renderFrame = (time: number): Uint8ClampedArray => {
      let label: { stop: number; alpha: number }[] = [];
      let distLabel: { hop: number; alpha: number } | null = null;
      let visibleCities = 1;
      let km = 0;

      if (time < INTRO_S || hops === 0) {
        const t = easeInOut(clamp01(time / INTRO_S));
        setCamera(pins[0].normal, CLOSE_DIST + 0.6 * (1 - t));
        pins.forEach((p, i) => (p.group.visible = i === 0));
        arcs.forEach((a) => a.geo.setDrawRange(0, 0));
        head.visible = false;
        label = [{ stop: 0, alpha: clamp01(time / 0.25) }];
      } else if (time < INTRO_S + hops * HOP_S) {
        const hopTime = time - INTRO_S;
        const hop = Math.min(hops - 1, Math.floor(hopTime / HOP_S));
        const raw = clamp01((hopTime - hop * HOP_S) / HOP_S);
        const t = easeInOut(raw);
        const from = pins[hop].normal;
        const to = pins[hop + 1].normal;
        const angle = from.angleTo(to);
        const dir = new THREE.Vector3().copy(from).lerp(to, t).normalize();
        if (dir.lengthSq() < 1e-6) dir.copy(to);
        const lift = Math.sin(Math.PI * t) * Math.min(1.6, angle * 0.9);
        setCamera(dir, CLOSE_DIST + lift);

        arcs.forEach((a, i) => {
          const segs = i < hop ? TUBE_SEGMENTS : i === hop ? Math.floor(t * TUBE_SEGMENTS) : 0;
          a.geo.setDrawRange(0, segs * TUBE_RADIAL * 6);
        });
        pins.forEach((p, i) => (p.group.visible = i <= hop || (i === hop + 1 && raw >= 0.92)));
        head.visible = raw < 0.97;
        arcs[hop].curve.getPointAt(t, head.position);

        label = [
          { stop: hop, alpha: 1 - clamp01((raw - 0.35) / 0.3) },
          { stop: hop + 1, alpha: clamp01((raw - 0.85) / 0.15) },
        ];
        distLabel = { hop, alpha: clamp01((raw - 0.15) / 0.2) };
        visibleCities = hop + 1 + (raw >= 0.92 ? 1 : 0);
        km = stops.slice(1, hop + 1).reduce((s, st) => s + st.distanceKm, 0) + stops[hop + 1].distanceKm * t;
      } else {
        const t = easeInOut(clamp01((time - INTRO_S - hops * HOP_S) / (OUTRO_S * 0.55)));
        const last = pins[pins.length - 1].normal;
        const dir = new THREE.Vector3().copy(last).lerp(centroid, t).normalize();
        setCamera(dir, CLOSE_DIST + (overviewDist - CLOSE_DIST) * t);
        pins.forEach((p) => (p.group.visible = true));
        arcs.forEach((a) => a.geo.setDrawRange(0, TUBE_SEGMENTS * TUBE_RADIAL * 6));
        head.visible = false;
        label = [{ stop: stops.length - 1, alpha: 1 - t }];
        visibleCities = stops.length;
        km = routeKm;
      }

      renderer.render(scene, camera);
      ctx.drawImage(renderer.domElement, 0, 0, SIZE, SIZE);
      if (distLabel) {
        const stop = stops[distLabel.hop + 1];
        drawDistanceLabel(formatDistance(stop.distanceKm, unit), stop.color, arcs[distLabel.hop].mid, distLabel.alpha);
      }
      label.forEach((l) => drawCityLabel(stops[l.stop], pins[l.stop].normal, l.alpha));
      drawChrome(visibleCities, km);
      return ctx.getImageData(0, 0, SIZE, SIZE).data;
    };

    const totalS = hops === 0 ? INTRO_S + OUTRO_S : INTRO_S + hops * HOP_S + OUTRO_S;
    const frameCount = Math.round((totalS * 1000) / FRAME_DELAY_MS);

    // One shared palette (built from the first and the final frame) keeps colors
    // stable between frames and the file small.
    const firstSample = renderFrame(0).slice();
    const lastSample = renderFrame(totalS);
    const sample = new Uint8ClampedArray(firstSample.length + lastSample.length);
    sample.set(firstSample, 0);
    sample.set(lastSample, firstSample.length);
    const palette: Palette = quantize(sample, 256);

    const gif = GIFEncoder();
    for (let f = 0; f < frameCount; f++) {
      const rgba = renderFrame((f * FRAME_DELAY_MS) / 1000);
      const index = applyPalette(rgba, palette);
      gif.writeFrame(index, SIZE, SIZE, f === 0 ? { palette, delay: FRAME_DELAY_MS } : { delay: FRAME_DELAY_MS });
      onProgress?.((f + 1) / frameCount);
      if (f % 3 === 0) await nextTick(); // keep the page responsive
    }
    gif.finish();
    return new Blob([gif.bytes()], { type: 'image/gif' });
  } finally {
    disposables.forEach((d) => d.dispose());
    renderer.dispose();
    renderer.forceContextLoss();
  }
}
