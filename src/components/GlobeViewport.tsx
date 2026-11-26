import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import worldLandData from 'world-atlas/land-110m.json';
import type { CityInfo, DistanceUnit, TurnRecord } from '../types/game';
import { formatDistance } from '../utils/geo';

interface GlobeViewportProps {
  turns: TurnRecord[];
  unit: DistanceUnit;
  focusCity: CityInfo | null;
  autoSpin: boolean;
}

const GLOBE_RADIUS = 1.45;
const _vecA = new THREE.Vector3();
const _vecB = new THREE.Vector3();
const _vecMid = new THREE.Vector3();
const _camDir = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
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

function createProceduralGlobeTextures(maxAnisotropy: number): {
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

interface LabelEntry {
  key: string;
  kind: 'city' | 'arc';
  worldPos: THREE.Vector3;
  normal: THREE.Vector3;
  primaryText: string;
  secondaryText?: string;
  accentColor: string;
  isBonus?: boolean;
  isLatest?: boolean;
}

export function GlobeViewport({ turns, unit, focusCity, autoSpin }: GlobeViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const labelsContainerRef = useRef<HTMLDivElement>(null);
  const [contextLost, setContextLost] = useState(false);

  const turnsRef = useRef(turns);
  const unitRef = useRef(unit);
  const autoSpinRef = useRef(autoSpin);

  turnsRef.current = turns;
  unitRef.current = unit;
  autoSpinRef.current = autoSpin;

  const sceneRefs = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    markersGroup: THREE.Group;
    arcsGroup: THREE.Group;
    pulseMesh: THREE.Mesh;
    activeCurve: THREE.CatmullRomCurve3 | null;
    pulseProgress: number;
    cameraGoalPos: THREE.Vector3 | null;
    labelEntries: LabelEntry[];
    labelElements: Map<string, HTMLDivElement>;
    syncData: () => void;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const labelsRoot = labelsContainerRef.current;
    if (!container || !labelsRoot) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const handleContextRestored = () => {
      setContextLost(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#EEF3FF');
    scene.fog = new THREE.FogExp2('#EEF3FF', 0.018);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const aspect = width / height;
    const portraitExtraDist = aspect < 0.85 ? (0.85 - aspect) * 3.8 : 0;
    const camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 100);
    latLngToVec3(36, 15, 4.15 + portraitExtraDist, camera.position);
    camera.lookAt(0, 0, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.minDistance = 2.15;
    controls.maxDistance = 7.8;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.065;
    controls.rotateSpeed = 0.72;
    controls.zoomSpeed = 0.85;

    // Bright Daylight 3-point studio lighting
    const hemiLight = new THREE.HemisphereLight('#FFFFFF', '#CBD5E1', 1.2);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight('#FFFDF5', 1.85);
    keyLight.position.set(5, 4, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight('#8338EC', 0.65);
    rimLight.position.set(-5, -2, -4);
    scene.add(rimLight);

    // Subtle geometric sky confetti/grid dots in light atmosphere
    const starCount = 320;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 16 + Math.random() * 18;
      const theta = Math.acos(2 * Math.random() - 1);
      const phi = Math.random() * Math.PI * 2;
      starPos[i * 3] = r * Math.sin(theta) * Math.cos(phi);
      starPos[i * 3 + 1] = r * Math.cos(theta);
      starPos[i * 3 + 2] = r * Math.sin(theta) * Math.sin(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: '#3A86FF',
      size: 0.09,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.25,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    const globeAssembly = new THREE.Group();
    scene.add(globeAssembly);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const { map: earthMap, roughnessMap: earthRough } = createProceduralGlobeTextures(maxAniso);

    const earthGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 48);
    const earthMat = new THREE.MeshPhysicalMaterial({
      map: earthMap,
      roughnessMap: earthRough,
      roughness: 0.85,
      metalness: 0.05,
      clearcoat: 0.16,
      clearcoatRoughness: 0.35,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    globeAssembly.add(earthMesh);

    // Subtle daylight rim halo
    const atmosGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.035, 48, 36);
    const atmosMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      uniforms: {
        uColor: { value: new THREE.Color('#3A86FF') },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPos;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vViewPos = -mvPos.xyz;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying vec3 vNormal;
        varying vec3 vViewPos;
        void main() {
          vec3 viewDir = normalize(vViewPos);
          float rim = pow(clamp(0.62 - dot(-vNormal, viewDir), 0.0, 1.0), 2.8);
          gl_FragColor = vec4(uColor, rim * 0.32);
        }
      `,
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    globeAssembly.add(atmosMesh);

    // Sunburst Gold meridian ring & Violet equator ring
    const goldMat = new THREE.MeshStandardMaterial({
      color: '#FFBE0B',
      metalness: 0.78,
      roughness: 0.25,
    });
    const violetMat = new THREE.MeshStandardMaterial({
      color: '#8338EC',
      metalness: 0.65,
      roughness: 0.32,
    });

    const meridianRingGeo = new THREE.TorusGeometry(GLOBE_RADIUS * 1.072, 0.012, 12, 120);
    const meridianRing = new THREE.Mesh(meridianRingGeo, goldMat);
    meridianRing.rotation.y = Math.PI / 4;
    globeAssembly.add(meridianRing);

    const equatorRingGeo = new THREE.TorusGeometry(GLOBE_RADIUS * 1.015, 0.0045, 8, 120);
    const equatorRing = new THREE.Mesh(equatorRingGeo, violetMat);
    equatorRing.rotation.x = Math.PI / 2;
    globeAssembly.add(equatorRing);

    const poleGeo = new THREE.CylinderGeometry(0.014, 0.014, GLOBE_RADIUS * 2.18, 12);
    const poleMesh = new THREE.Mesh(poleGeo, goldMat);
    globeAssembly.add(poleMesh);

    const markersGroup = new THREE.Group();
    const arcsGroup = new THREE.Group();
    globeAssembly.add(markersGroup);
    globeAssembly.add(arcsGroup);

    const pulseGeo = new THREE.SphereGeometry(0.028, 14, 14);
    const pulseMat = new THREE.MeshBasicMaterial({ color: '#FFBE0B' });
    const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
    pulseMesh.visible = false;
    globeAssembly.add(pulseMesh);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const labelEntries: LabelEntry[] = [];
    const labelElements = new Map<string, HTMLDivElement>();
    let activeCurve: THREE.CatmullRomCurve3 | null = null;
    let pulseProgress = 0;
    let cameraGoalPos: THREE.Vector3 | null = null;

    controls.addEventListener('start', () => {
      cameraGoalPos = null;
      if (sceneRefs.current) {
        sceneRefs.current.cameraGoalPos = null;
      }
    });

    const clearGroup = (group: THREE.Group) => {
      while (group.children.length > 0) {
        const child = group.children[0];
        group.remove(child);
        child.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((m) => m.dispose());
            } else {
              mesh.material.dispose();
            }
          }
        });
      }
    };

    const syncData = () => {
      clearGroup(markersGroup);
      clearGroup(arcsGroup);
      labelEntries.length = 0;

      for (const [, el] of labelElements) {
        el.remove();
      }
      labelElements.clear();

      const validTurns = turnsRef.current.filter((t): t is TurnRecord & { city: CityInfo } => t.city !== null);
      activeCurve = null;
      pulseMesh.visible = false;

      if (validTurns.length === 0) return;

      const pinHeadGeo = new THREE.OctahedronGeometry(0.028, 1);
      const pinStemGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.07, 8);
      const pinRingGeo = new THREE.RingGeometry(0.024, 0.04, 24);
      const bonusRingGeo = new THREE.RingGeometry(0.046, 0.062, 28);

      validTurns.forEach((turn, idx) => {
        const city = turn.city;
        const isLatest = idx === validTurns.length - 1;
        const colorHex =
          turn.playerId === 'system'
            ? '#8338EC'
            : turn.playerId === 'p1'
              ? '#3A86FF'
              : '#FF006E';

        const surfacePos = latLngToVec3(city.lat, city.lng, GLOBE_RADIUS);
        const normal = surfacePos.clone().normalize();

        const pinGroup = new THREE.Group();
        pinGroup.position.copy(surfacePos);
        pinGroup.quaternion.setFromUnitVectors(_up, normal);

        const baseMat = new THREE.MeshBasicMaterial({
          color: colorHex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.92,
        });
        const baseRing = new THREE.Mesh(pinRingGeo, baseMat);
        baseRing.rotation.x = -Math.PI / 2;
        baseRing.position.y = 0.003;
        pinGroup.add(baseRing);

        const stemMat = new THREE.MeshStandardMaterial({
          color: '#0F172A',
          metalness: 0.7,
          roughness: 0.3,
        });
        const stem = new THREE.Mesh(pinStemGeo, stemMat);
        stem.position.y = 0.036;
        pinGroup.add(stem);

        const crownMat = new THREE.MeshStandardMaterial({
          color: colorHex,
          emissive: colorHex,
          emissiveIntensity: isLatest ? 0.55 : 0.25,
          metalness: 0.2,
          roughness: 0.25,
        });
        const crown = new THREE.Mesh(pinHeadGeo, crownMat);
        crown.position.y = 0.078;
        crown.scale.setScalar(isLatest ? 1.3 : 0.96);
        pinGroup.add(crown);

        if (city.isGdg) {
          const bonusMat = new THREE.MeshBasicMaterial({
            color: '#FFBE0B',
            side: THREE.DoubleSide,
          });
          const bonusRing = new THREE.Mesh(bonusRingGeo, bonusMat);
          bonusRing.rotation.x = -Math.PI / 2;
          bonusRing.position.y = 0.0045;
          pinGroup.add(bonusRing);
        }

        markersGroup.add(pinGroup);

        const labelPos = normal.clone().multiplyScalar(GLOBE_RADIUS + 0.12);
        const bonusTag = city.isGdg ? '+100 GDG' : undefined;

        labelEntries.push({
          key: `city-${turn.index}-${city.id}`,
          kind: 'city',
          worldPos: labelPos,
          normal: normal.clone(),
          primaryText: city.name,
          secondaryText: bonusTag,
          accentColor: colorHex,
          isBonus: city.isGdg,
          isLatest,
        });

        if (idx > 0) {
          const prevTurn = validTurns[idx - 1];
          const prevCity = prevTurn.city;
          const vStart = latLngToVec3(prevCity.lat, prevCity.lng, GLOBE_RADIUS).normalize();
          const vEnd = normal.clone();
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

          const curve = new THREE.CatmullRomCurve3(arcPoints);
          const tubeRadius = isLatest ? 0.013 : 0.0085;
          const tubeGeo = new THREE.TubeGeometry(curve, 52, tubeRadius, 8, false);
          const tubeMat = new THREE.MeshStandardMaterial({
            color: colorHex,
            emissive: colorHex,
            emissiveIntensity: isLatest ? 0.45 : 0.2,
            roughness: 0.3,
            metalness: 0.15,
            transparent: true,
            opacity: isLatest ? 1 : 0.82,
          });
          const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
          arcsGroup.add(tubeMesh);

          const midWorld = curve.getPoint(0.5);
          labelEntries.push({
            key: `arc-${turn.index}`,
            kind: 'arc',
            worldPos: midWorld,
            normal: midWorld.clone().normalize(),
            primaryText: formatDistance(turn.distanceKm, unitRef.current),
            accentColor: colorHex,
            isLatest,
          });

          if (isLatest) {
            activeCurve = curve;
            pulseProgress = 0;
            pulseMesh.visible = true;
            (pulseMesh.material as THREE.MeshBasicMaterial).color.set('#FFBE0B');
          }
        }
      });

      // Bigger, bolder light-themed DOM labels
      for (const entry of labelEntries) {
        const el = document.createElement('div');
        el.style.position = 'absolute';
        el.style.left = '0px';
        el.style.top = '0px';
        el.style.pointerEvents = 'none';
        el.style.transform = 'translate(-50%, -50%)';
        el.style.transition = 'opacity 140ms ease';
        el.style.boxShadow = '0 6px 18px rgba(15, 23, 42, 0.14)';

        if (entry.kind === 'city') {
          el.className =
            'px-2.5 py-1 rounded-lg text-xs font-bold tracking-tight whitespace-nowrap flex items-center gap-1.5 border-2';
          el.style.backgroundColor = 'rgba(255, 255, 255, 0.96)';
          el.style.borderColor = entry.isBonus ? '#FFBE0B' : entry.accentColor;
          el.style.color = '#0F172A';

          const dot = document.createElement('span');
          dot.style.width = '8px';
          dot.style.height = '8px';
          dot.style.borderRadius = '9999px';
          dot.style.backgroundColor = entry.accentColor;
          dot.style.flexShrink = '0';
          el.appendChild(dot);

          const nameSpan = document.createElement('span');
          nameSpan.textContent = entry.primaryText;
          el.appendChild(nameSpan);

          if (entry.secondaryText) {
            const bonusSpan = document.createElement('span');
            bonusSpan.textContent = entry.secondaryText;
            bonusSpan.style.backgroundColor = '#FFBE0B';
            bonusSpan.style.color = '#0F172A';
            bonusSpan.style.padding = '0 5px';
            bonusSpan.style.borderRadius = '4px';
            bonusSpan.style.fontFamily = 'var(--font-mono)';
            bonusSpan.style.fontSize = '11px';
            bonusSpan.style.fontWeight = '800';
            el.appendChild(bonusSpan);
          }
        } else {
          el.className = 'px-2 py-0.5 rounded-md font-mono tabular-nums text-xs font-extrabold whitespace-nowrap';
          el.style.backgroundColor = entry.isLatest ? entry.accentColor : 'rgba(255, 255, 255, 0.95)';
          el.style.border = `2px solid ${entry.accentColor}`;
          el.style.color = entry.isLatest ? '#FFFFFF' : '#0F172A';
          el.textContent = entry.primaryText;
        }

        labelsRoot.appendChild(el);
        labelElements.set(entry.key, el);
      }

      const latestCity = validTurns[validTurns.length - 1].city;
      const curAspect = camera.aspect || 1;
      const extraDist = curAspect < 0.85 ? (0.85 - curAspect) * 3.8 : 0;
      const currentDist = camera.position.length();
      const targetDist = THREE.MathUtils.clamp(currentDist, 3.2 + extraDist, 4.4 + extraDist);
      cameraGoalPos = latLngToVec3(latestCity.lat, latestCity.lng, targetDist);
      if (sceneRefs.current) {
        sceneRefs.current.activeCurve = activeCurve;
        sceneRefs.current.pulseProgress = pulseProgress;
        sceneRefs.current.cameraGoalPos = cameraGoalPos;
      }
    };

    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;

    const updateProjectedLabels = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      _camDir.copy(camera.position).normalize();

      for (const entry of labelEntries) {
        const el = labelElements.get(entry.key);
        if (!el) continue;

        const facing = entry.normal.dot(_camDir);
        const minFacing = entry.kind === 'arc' ? 0.05 : 0.14;
        if (facing < minFacing) {
          el.style.opacity = '0';
          continue;
        }

        _vecA.copy(entry.worldPos).project(camera);
        if (_vecA.z > 1) {
          el.style.opacity = '0';
          continue;
        }

        const x = ((_vecA.x + 1) / 2) * w;
        const y = ((-_vecA.y + 1) / 2) * h;

        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.opacity = facing < 0.28 ? String(THREE.MathUtils.smoothstep(facing, minFacing, 0.28)) : '1';
      }
    };

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync && gl.deleteSync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = () => {
      if (disposed) return;
      const delta = Math.min(clock.getDelta(), 0.1);

      const refs = sceneRefs.current;
      const goal = refs?.cameraGoalPos ?? cameraGoalPos;

      if (goal) {
        const currentR = camera.position.length();
        const goalR = goal.length();
        const nextR = THREE.MathUtils.damp(currentR, goalR, 3.2, delta);

        _vecA.copy(camera.position).normalize();
        _vecB.copy(goal).normalize();
        const lerpAlpha = 1 - Math.exp(-3.4 * delta);
        _vecMid.copy(_vecA).lerp(_vecB, lerpAlpha).normalize().multiplyScalar(nextR);
        camera.position.copy(_vecMid);

        if (_vecA.distanceTo(_vecB) < 0.015) {
          cameraGoalPos = null;
          if (refs) refs.cameraGoalPos = null;
        }
      } else if (autoSpinRef.current && !isSoftwareGl) {
        const rotAngle = delta * 0.12;
        const x = camera.position.x;
        const z = camera.position.z;
        camera.position.x = x * Math.cos(rotAngle) - z * Math.sin(rotAngle);
        camera.position.z = x * Math.sin(rotAngle) + z * Math.cos(rotAngle);
      }

      if (refs?.activeCurve) {
        refs.pulseProgress = (refs.pulseProgress + delta * 0.42) % 1;
        refs.activeCurve.getPointAt(refs.pulseProgress, pulseMesh.position);
      } else if (activeCurve) {
        pulseProgress = (pulseProgress + delta * 0.42) % 1;
        activeCurve.getPointAt(pulseProgress, pulseMesh.position);
      }

      controls.update();
      renderer.render(scene, camera);
      updateProjectedLabels();

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    sceneRefs.current = {
      scene,
      camera,
      controls,
      markersGroup,
      arcsGroup,
      pulseMesh,
      activeCurve,
      pulseProgress,
      cameraGoalPos,
      labelEntries,
      labelElements,
      syncData,
    };

    syncData();
    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);

      controls.dispose();
      clearGroup(markersGroup);
      clearGroup(arcsGroup);
      earthGeo.dispose();
      earthMat.dispose();
      earthMap.dispose();
      earthRough.dispose();
      atmosGeo.dispose();
      atmosMat.dispose();
      meridianRingGeo.dispose();
      equatorRingGeo.dispose();
      poleGeo.dispose();
      goldMat.dispose();
      violetMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      pulseGeo.dispose();
      pulseMat.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      for (const [, el] of labelElements) {
        el.remove();
      }
      labelElements.clear();
      sceneRefs.current = null;
    };
  }, []);

  useEffect(() => {
    sceneRefs.current?.syncData();
  }, [turns, unit]);

  useEffect(() => {
    if (!focusCity || !sceneRefs.current) return;
    const curAspect = sceneRefs.current.camera.aspect || 1;
    const extraDist = curAspect < 0.85 ? (0.85 - curAspect) * 3.8 : 0;
    const dist = THREE.MathUtils.clamp(
      sceneRefs.current.camera.position.length(),
      2.9 + extraDist,
      4.1 + extraDist,
    );
    sceneRefs.current.cameraGoalPos = latLngToVec3(focusCity.lat, focusCity.lng, dist);
  }, [focusCity]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#EEF3FF]">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      <div ref={labelsContainerRef} className="pointer-events-none absolute inset-0 overflow-hidden" />
      {contextLost && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#EEF3FF]/95 text-slate-900 p-6">
          <div className="max-w-md text-center space-y-2">
            <h2 className="font-display text-2xl font-extrabold">3D Globe Renderer Suspended</h2>
            <p className="text-base font-medium text-slate-600">
              WebGL context was interrupted by your browser. Reload or switch tabs to restore the globe.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
