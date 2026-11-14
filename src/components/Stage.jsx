import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import Car from "./Car";

// ---------------------------------------------------------------------------
// The showroom. The car stays still; the CAMERA moves between "shots" as you scroll,
// like a film. Each shot also sets the mood:
//   pos / look: where the camera stands and what it looks at
//   sx: move the car left/right on screen (so the text has room), -0.5..0.5 of the width
//   lights: headlights on (1) or off (0)
//   night: 0 = bright studio, 1 = dark night scene
//   doors: 0 = closed, 1 = open
// ---------------------------------------------------------------------------
const SHOTS = [
  {
    pos: [4.6, 1.5, 6.6],
    look: [0, 0.75, 0.25],
    sx: 0,
    lights: 1,
    night: 0.15,
    doors: 0,
  }, // hero (car low, under the title)
  {
    pos: [11, 0.95, 0.2],
    look: [0, 0.48, 0.2],
    sx: 0.17,
    lights: 0.4,
    night: 0,
    doors: 0,
  }, // design: side profile
  {
    pos: [4.6, 0.95, 10.8],
    look: [0, 0.5, 0.8],
    sx: 0.2,
    lights: 1,
    night: 1,
    doors: 0,
  }, // light: nose at night
  {
    pos: [-7.8, 0.75, -8.8],
    look: [0, 0.5, -0.3],
    sx: -0.23,
    lights: 1,
    night: 0.55,
    doors: 0,
  }, // drive: low rear
  {
    pos: [7.4, 3.3, 4.0],
    look: [0, 0.6, 0.1],
    sx: 0.22,
    lights: 0.6,
    night: 0.2,
    doors: 1,
  }, // cabin: doors up
  {
    pos: [5.6, 1.9, 6.2],
    look: [0, 0.35, 0.1],
    sx: -0.2,
    lights: 1,
    night: 0.1,
    doors: 0,
  }, // build
  {
    pos: [0.01, 1.6, 11],
    look: [0, 0.5, 0],
    sx: 0,
    sy: -0.27,
    lights: 1,
    night: 0.35,
    doors: 0,
  }, // reserve: straight on, car high, text below
];

const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);

// Mixes two shots
function blend(a, b, t) {
  const s = smooth(t);
  return {
    pos: a.pos.map((v, i) => lerp(v, b.pos[i], s)),
    look: a.look.map((v, i) => lerp(v, b.look[i], s)),
    sx: lerp(a.sx, b.sx, s),
    sy: lerp(a.sy ?? 0, b.sy ?? 0, s), // move the car up (-) or down (+) on screen
    lights: lerp(a.lights, b.lights, s),
    night: lerp(a.night, b.night, s),
    doors: lerp(a.doors, b.doors, s),
  };
}

function Director({ stage, spin, mood, override, dark, wake }) {
  const { camera, size, scene } = useThree();
  const pos = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const now = useRef({
    pos: new THREE.Vector3(...SHOTS[0].pos).multiplyScalar(1.5),
    look: new THREE.Vector3(...SHOTS[0].look),
    sx: 0,
    sy: 0,
  });

  const last = useRef({ stage: -1, spin: 0, busy: 0 });

  useFrame((state, frameDelta) => {
    const delta = Math.min(frameDelta, 0.1);
    // Save power: keep drawing only for ~2.5 s after anything changes (scroll, drag, a choice)
    const l = last.current;
    if (stage.current !== l.stage || spin.current !== l.spin || wake.current) {
      l.stage = stage.current;
      l.spin = spin.current;
      l.busy = 2.5;
      wake.current = false;
    }
    l.busy -= delta;
    if (l.busy > 0) state.invalidate();
    const i = Math.min(SHOTS.length - 1, Math.floor(stage.current));
    const shot = blend(
      SHOTS[i],
      SHOTS[Math.min(SHOTS.length - 1, i + 1)],
      stage.current - i,
    );

    // Phones: stand farther back (the screen is narrow), car in the upper part, text below
    const aspect = size.width / size.height;
    const phone = aspect < 0.9;
    const far = phone ? Math.max(1, 1.05 / aspect) : Math.max(1, 1.5 / aspect);
    pos
      .set(...shot.pos)
      .sub(look.set(...shot.look))
      .multiplyScalar(far)
      .add(look);
    // The drag on the page turns the camera around the car
    pos
      .sub(look)
      .applyAxisAngle(THREE.Object3D.DEFAULT_UP, spin.current)
      .add(look);
    const sx = phone ? 0 : shot.sx;
    const sy = phone ? -0.17 : shot.sy;

    const k = 1 - Math.pow(0.02, delta); // smooth follow, the same at any frame rate
    now.current.pos.lerp(pos, k);
    now.current.look.lerp(look, k);
    now.current.sx = lerp(now.current.sx, sx, k);
    now.current.sy = lerp(now.current.sy, sy, k);
    camera.position.copy(now.current.pos);
    camera.lookAt(now.current.look);
    // Slide the picture sideways/up without changing the perspective
    camera.setViewOffset(
      size.width,
      size.height,
      -now.current.sx * size.width,
      -now.current.sy * size.height,
      size.width,
      size.height,
    );

    // The mood: lights, night, doors (the configurator buttons can override lights and doors)
    const m = mood.current;
    const o = override.current;
    m.lights = lerp(m.lights, o.lights ?? shot.lights, k);
    m.doors = lerp(m.doors, o.doors ?? shot.doors, k * 0.8);
    m.night = lerp(m.night, dark ? shot.night : shot.night * 0.35, k); // light mode: the night shots stay brighter
    scene.environmentIntensity = lerp(1, 0.12, m.night);
  });
  return null;
}

// The showroom floor: glossy, it reflects the studio lights (one simple material, fast on every device)
function Floor({ dark }) {
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={-0.16}>
      <circleGeometry args={[30, 64]} />
      <meshPhysicalMaterial
        color={dark ? "#050506" : "#d8d6d1"}
        metalness={dark ? 0.15 : 0.1}
        roughness={dark ? 0.55 : 0.45}
        clearcoat={dark ? 0.25 : 0.6}
        clearcoatRoughness={0.5}
        envMapIntensity={dark ? 0.35 : 1}
      />
    </mesh>
  );
}

// A soft round pool of light on the floor around the car, fading to black
function LightPool() {
  const map = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(255,255,255,0.55)");
    g.addColorStop(0.45, "rgba(255,255,255,0.18)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }, []);
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={-0.155} scale={[1, 1.35, 1]}>
      <circleGeometry args={[6, 64]} />
      <meshBasicMaterial
        map={map}
        color="#1c1c20"
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// Key and rim lights, so the body shape reads against the dark. They dim for the night shots.
function KeyLights({ mood }) {
  const key = useRef();
  const rim = useRef();
  const pool = useRef();
  useFrame(() => {
    const day = 1 - mood.current.night;
    key.current.intensity = 0.2 + 1.3 * day;
    rim.current.intensity = 0.6 + 1.2 * day;
  });
  void pool;
  return (
    <>
      <directionalLight ref={key} position={[4, 6, 5]} color="#fff4e6" />
      <directionalLight ref={rim} position={[-6, 3, -4]} color="#cfe0ff" />
    </>
  );
}

// The studio: long soft light strips above and beside the car (they draw the lines on the paint)
function Studio() {
  return (
    <Environment resolution={512} frames={1}>
      <color attach="background" args={["#020203"]} />
      {[-3, 0, 3].map((z) => (
        <Lightformer
          key={z}
          form="rect"
          intensity={4}
          position={[0, 5, z]}
          rotation-x={Math.PI / 2}
          scale={[8, 0.6, 1]}
        />
      ))}
      <Lightformer
        form="rect"
        intensity={2.5}
        position={[-7, 1.5, 0]}
        rotation-y={Math.PI / 2}
        scale={[12, 0.8, 1]}
      />
      <Lightformer
        form="rect"
        intensity={2.5}
        position={[7, 1.5, 0]}
        rotation-y={-Math.PI / 2}
        scale={[12, 0.8, 1]}
      />
      <Lightformer
        form="rect"
        intensity={1.2}
        position={[0, 1, 8]}
        scale={[10, 2, 1]}
      />
      <Lightformer
        form="ring"
        intensity={3}
        color="#e8d9c0"
        position={[5, 3, -6]}
        scale={2}
      />
    </Environment>
  );
}

// Real light from the headlights onto the floor (follows the "lights" mood)
function HeadlightBeams({ mood }) {
  const left = useRef();
  const right = useRef();
  const glow = useRef();
  const scene = useThree((st) => st.scene);
  // Each spotlight needs a target point in the scene to aim at (far ahead on the floor)
  useEffect(() => {
    const pairs = [
      [left.current, 0.9],
      [right.current, -0.9],
    ];
    pairs.forEach(([light, x]) => {
      light.target.position.set(x, -0.16, 9);
      scene.add(light.target);
    });
    return () => pairs.forEach(([light]) => scene.remove(light.target));
  }, [scene]);
  useFrame(() => {
    const on = mood.current.lights;
    const night = mood.current.night;
    if (left.current) left.current.intensity = on * (8 + night * 30);
    if (right.current) right.current.intensity = on * (8 + night * 30);
    if (glow.current) glow.current.intensity = on * night * 6;
  });
  return (
    <group>
      {[
        [left, 0.6],
        [right, -0.6],
      ].map(([ref, x]) => (
        <spotLight
          key={x}
          ref={ref}
          position={[x, 0.65, 2.3]}
          angle={0.55}
          penumbra={0.9}
          distance={14}
          color="#dfe9ff"
        />
      ))}
      <pointLight
        ref={glow}
        position={[0, 0.3, 3.4]}
        distance={5}
        color="#cfe0ff"
      />
    </group>
  );
}

// Can this browser draw 3D at all? (WebGL can be switched off, e.g. when graphics acceleration is off)
function canDraw3D() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

// If the 3D crashes anyway, show the still picture instead of a black screen
class Safe3D extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

// Shown when there is no 3D: a photo of the car, so the page still looks complete
function Still({ onReady }) {
  useEffect(() => {
    onReady?.();
  }, [onReady]);
  return (
    <div className="absolute inset-0 grid place-items-center px-5">
      <img
        src={`${import.meta.env.BASE_URL}car-still.webp`}
        alt="NOCTA VELA"
        className="w-full max-w-3xl"
        // soft edges, so the photo melts into the background
        style={{ maskImage: "radial-gradient(ellipse 50% 50% at 50% 50%, #000 55%, transparent 100%)", WebkitMaskImage: "radial-gradient(ellipse 50% 50% at 50% 50%, #000 55%, transparent 100%)" }}
      />
    </div>
  );
}

// The fixed 3D layer behind the page. Drag sideways to turn around the car.
export default function Stage({ stage, config, override, onReady, dark }) {
  const bg = dark ? "#050506" : "#ecebe7";
  const spin = useRef(0);
  const lastX = useRef(null);
  const mood = useRef({ lights: 0, night: 0.15, doors: 0 });
  const [ready, setReady] = useState(false);
  // "wake" asks the 3D to draw again (after a choice in the configurator or a theme change)
  const wake = useRef(true);
  const invalidateRef = useRef(null);
  useEffect(() => {
    wake.current = true;
    invalidateRef.current?.();
  }, [config, dark]);
  // scrolling and dragging also wake it up
  useEffect(() => {
    const kick = () => invalidateRef.current?.();
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("pointermove", kick, { passive: true });
    window.addEventListener("resize", kick);
    const id = setInterval(() => {
      if (override.current.doors !== undefined || override.current.lights !== undefined) kick();
    }, 500);
    return () => {
      window.removeEventListener("scroll", kick);
      window.removeEventListener("pointermove", kick);
      window.removeEventListener("resize", kick);
      clearInterval(id);
    };
  }, [override]);

  useEffect(() => {
    const start = () =>
      "requestIdleCallback" in window
        ? requestIdleCallback(() => setReady(true), { timeout: 1200 })
        : setReady(true);
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => window.removeEventListener("load", start);
  }, []);

  // Let go of the drag: the camera slowly returns to the planned shot
  useEffect(() => {
    let id;
    const settle = () => {
      if (lastX.current === null && spin.current !== 0) spin.current = Math.abs(spin.current) < 0.001 ? 0 : spin.current * 0.96;
      id = requestAnimationFrame(settle);
    };
    id = requestAnimationFrame(settle);
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className="fixed inset-0 z-10 cursor-grab active:cursor-grabbing touch-pan-y bg-night transition-colors duration-700"
      onPointerDown={(e) => (lastX.current = e.clientX)}
      onPointerMove={(e) => {
        if (lastX.current === null) return;
        spin.current -= (e.clientX - lastX.current) * 0.006;
        lastX.current = e.clientX;
      }}
      onPointerUp={() => (lastX.current = null)}
      onPointerLeave={() => (lastX.current = null)}
      onPointerCancel={() => (lastX.current = null)}
    >
      {ready && !canDraw3D() && <Still onReady={onReady} />}
      {ready && canDraw3D() && (
        <Safe3D fallback={<Still onReady={onReady} />}>
          <Canvas
            frameloop="demand"
            onCreated={(st) => {
              invalidateRef.current = () => {
                wake.current = true;
                st.invalidate();
              };
              onReady?.();
            }}
            dpr={[1, window.innerWidth < 700 ? 1.5 : 1.75]}
            camera={{ position: [7, 2, 10], fov: 30, near: 0.1, far: 120 }}
            gl={{
              antialias: true,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.25,
            }}
          >
            <color attach="background" args={[bg]} />
            <fog attach="fog" args={[bg, 12, 32]} />
            <Suspense fallback={null}>
              <Studio />
              <Car config={config} state={mood} />
              <Floor dark={dark} />
              {dark && <LightPool />}
              <ContactShadows
                position={[0, -0.15, 0.2]}
                scale={[6, 8]}
                opacity={0.85}
                blur={2.2}
                far={1.2}
                frames={1}
                resolution={512}
              />
              <KeyLights mood={mood} />
              <HeadlightBeams mood={mood} />
            </Suspense>
            <Director
              stage={stage}
              spin={spin}
              mood={mood}
              override={override}
              dark={dark}
              wake={wake}
            />
          </Canvas>
        </Safe3D>
      )}
    </div>
  );
}
