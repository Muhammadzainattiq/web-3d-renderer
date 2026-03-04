"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { XR, createXRStore, useXRHitTest, useXR } from "@react-three/xr";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Shared store instance for this AR session
const store = createXRStore();

// Reused matrix — allocated once outside components to avoid per-frame allocation
const matrixHelper = new THREE.Matrix4();

// ─── Sub-components (must live inside <Canvas><XR>) ──────────────────────────

function FoodModel({ position }: { position: [number, number, number] }) {
  const { scene } = useGLTF("/your-food.glb");
  // Clone so the AR instance doesn't share geometry/materials with the viewer
  const clone = useRef(scene.clone(true));
  return (
    <primitive
      object={clone.current}
      position={position}
      scale={0.3} // ~30 cm — adjust if the model looks too large/small on a real surface
    />
  );
}

/**
 * Reticle — flat ring that snaps to the nearest detected surface.
 * useXRHitTest fires every frame; callback receives hit results + a getWorldMatrix helper.
 * relativeTo='viewer' means the hit-test ray originates from the camera/viewer pose.
 */
function Reticle({ onHit }: { onHit: (pos: THREE.Vector3) => void }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useXRHitTest(
    (results, getWorldMatrix) => {
      if (!meshRef.current) return;

      if (results.length === 0) {
        meshRef.current.visible = false;
        return;
      }

      // Populate matrixHelper with the world transform of the first hit
      getWorldMatrix(matrixHelper, results[0]);

      const pos = new THREE.Vector3().setFromMatrixPosition(matrixHelper);
      meshRef.current.position.copy(pos);
      meshRef.current.visible = true;

      onHit(pos);
    },
    "viewer"
  );

  // rotation={[-Math.PI/2, 0, 0]} keeps the ring lying flat on horizontal surfaces
  return (
    <mesh ref={meshRef} visible={false} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.055, 0.08, 32]} />
      <meshBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.9}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/**
 * Listens for the WebXR "select" event — on Android this fires on every screen tap.
 * useXR(state => state.session) re-runs when the session starts/ends so the listener
 * is correctly attached and cleaned up.
 */
function SelectListener({ onSelect }: { onSelect: () => void }) {
  const session = useXR((state) => state.session);

  useEffect(() => {
    if (!session) return;
    session.addEventListener("select", onSelect);
    return () => session.removeEventListener("select", onSelect);
  }, [session, onSelect]);

  return null;
}

/**
 * All AR logic: hit test, reticle, placement.
 * Tapping places the model; tapping again moves it to the new position.
 */
function ARContent() {
  const currentHit = useRef<THREE.Vector3>(new THREE.Vector3());
  const [modelPos, setModelPos] = useState<[number, number, number] | null>(
    null
  );

  const handleHit = useCallback((pos: THREE.Vector3) => {
    currentHit.current.copy(pos);
  }, []);

  const handleSelect = useCallback(() => {
    const p = currentHit.current;
    setModelPos([p.x, p.y, p.z]);
  }, []);

  return (
    <>
      <ambientLight intensity={1} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} />

      <Reticle onHit={handleHit} />
      <SelectListener onSelect={handleSelect} />

      {modelPos && <FoodModel position={modelPos} />}
    </>
  );
}

// ─── Root export ─────────────────────────────────────────────────────────────

export default function ARScene() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        background: "#000",
      }}
    >
      <p
        style={{
          position: "absolute",
          bottom: "116px",
          left: "50%",
          transform: "translateX(-50%)",
          color: "#aaa",
          fontSize: "13px",
          fontFamily: "sans-serif",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          zIndex: 10,
        }}
      >
        Point at a surface · Tap to place
      </p>

      <button
        onClick={() => store.enterAR()}
        style={{
          position: "absolute",
          bottom: "48px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          padding: "14px 36px",
          background: "#ffffff",
          color: "#111111",
          border: "none",
          borderRadius: "32px",
          fontSize: "16px",
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "sans-serif",
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          whiteSpace: "nowrap",
        }}
      >
        Start AR
      </button>

      <Canvas>
        <XR store={store}>
          <ARContent />
        </XR>
      </Canvas>
    </div>
  );
}
