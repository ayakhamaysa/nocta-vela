import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { accents, calipers, find, interiors, paints, wheels } from "../data/car";

// ---------------------------------------------------------------------------
// The car: a real 3D model (glTF), "Car Concept" by Eric Chadwick / DGG (CC BY 4.0),
// based on a public-domain model. We keep its shapes and textures, and take
// control of its materials so every choice in the configurator changes it live.
//
// The front of the car points to +z, its left side to +x, the ground is at y ≈ -0.16.
// ---------------------------------------------------------------------------

const MODEL = `${import.meta.env.BASE_URL}models/car.glb`;

// The model's own material names → which of our choices controls them
const ROLE = {
  "Paint 1 Carmine": "paint",
  "Paint 2 Carmine": "accent",
  "Interior 3 Carmine": "interior",
  Rim2: "wheels",
  Brake: "caliper",
  Headlight: "headlight",
  Brakelight: "taillight",
  Signallight: "signal",
  Dashboard: "dashboard",
};

export default function Car({ config, state }) {
  // The model is compressed (meshopt + webp, 3.3 MB instead of 11.8 MB); true = use the meshopt decoder
  const { scene } = useGLTF(MODEL, false, true);

  // One copy of the car, with its controlled materials collected by role
  const { car, mats, doors, hood } = useMemo(() => {
    const car = scene.clone(true);
    const mats = {};
    car.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      // The plate and the steering emblem carry other companies' logos: hide them
      if (o.material?.name === "License" || o.name.startsWith("InteriorSteeringEmblem")) o.visible = false;
      const role = ROLE[o.material?.name];
      if (!role) return;
      if (!mats[role]) {
        mats[role] = o.material.clone();
        // The paint had a tiny "metal flake" bump picture; close up it looked grainy, so we use smooth paint
        if (role === "paint" || role === "accent") {
          mats[role].normalMap = null;
          mats[role].needsUpdate = true;
        }
        mats[role].userData.base = mats[role].emissiveIntensity; // its own light strength
      }
      o.material = mats[role];
    });
    // Glass: a little darker tint, like real privacy glass
    car.traverse((o) => {
      if (o.isMesh && o.material?.name === "Glass") {
        // Simple see-through glass (real "transmission" glass re-draws the whole scene every frame: too slow)
        o.material = new THREE.MeshPhysicalMaterial({
          color: "#0c0e10",
          transparent: true,
          opacity: 0.55,
          roughness: 0.02,
          metalness: 0.2,
          clearcoat: 1,
          envMapIntensity: 1.4,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
      }
    });
    const doors = [car.getObjectByName("BodyDoorLColor1"), car.getObjectByName("BodyDoorRColor1")];
    const hood = car.getObjectByName("BodyHood");
    return { car, mats, doors, hood };
  }, [scene]);

  // The colors the materials glide toward
  const target = useMemo(
    () => ({ paint: new THREE.Color(), accent: new THREE.Color(), wheels: new THREE.Color(), caliper: new THREE.Color(), interior: new THREE.Color() }),
    []
  );

  useEffect(() => {
    const paint = find(paints, config.paint);
    const accent = find(accents, config.accent);
    const wheel = find(wheels, config.wheels);
    target.paint.set(paint.color);
    target.accent.set(accent.color ?? paint.color); // "Body colour" follows the paint
    target.wheels.set(wheel.color);
    target.caliper.set(find(calipers, config.caliper).color);
    target.interior.set(find(interiors, config.interior).color);

    // Finish of each surface (matte, gloss, metal...)
    const p = mats.paint;
    if (p) {
      p.metalness = paint.metal;
      p.roughness = paint.rough;
      p.clearcoat = paint.coat;
      p.clearcoatRoughness = 0.04;
    }
    const a = mats.accent;
    if (a) {
      const same = accent.color === null;
      a.metalness = same ? paint.metal : accent.metal;
      a.roughness = same ? paint.rough : accent.rough;
      a.clearcoat = same ? paint.coat : 1;
    }
    if (mats.wheels) {
      mats.wheels.metalness = wheel.metal;
      mats.wheels.roughness = wheel.rough;
      mats.wheels.emissiveIntensity = 0; // the model lit its rims from inside; we want real reflections
    }
    if (mats.caliper) {
      mats.caliper.emissiveIntensity = 0;
      mats.caliper.roughness = 0.35;
    }
    if (mats.interior) mats.interior.roughness = config.interior === "onyx" ? 0.9 : 0.45; // Alcantara is soft, leather a bit shiny
  }, [config, mats, target]);

  useFrame((_, frameDelta) => {
    const k = Math.min(1, Math.min(frameDelta, 0.1) * 5);
    for (const key of Object.keys(target)) mats[key]?.color.lerp(target[key], k);

    // Lights: 0 = off, 1 = on (headlights, tail lights, dashboard)
    const on = state.current.lights;
    if (mats.headlight) mats.headlight.emissiveIntensity = 0.15 + on * mats.headlight.userData.base * 1.4;
    if (mats.taillight) mats.taillight.emissiveIntensity = 0.2 + on * mats.taillight.userData.base * 1.5;
    if (mats.signal) mats.signal.emissiveIntensity = on * mats.signal.userData.base;
    if (mats.dashboard) mats.dashboard.emissiveIntensity = 0.2 + on * mats.dashboard.userData.base;

    // Doors open up and out (butterfly doors); the hood stays closed
    const d = state.current.doors;
    if (doors[0]) doors[0].rotation.set(0.62 * d, -0.42 * d, 0);
    if (doors[1]) doors[1].rotation.set(0.62 * d, 0.42 * d, 0);
    if (hood) hood.rotation.x = 0;
  });

  return <primitive object={car} />;
}

useGLTF.preload(MODEL, false, true);
