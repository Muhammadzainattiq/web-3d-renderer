"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import {
  XR,
  createXRStore,
  useXRHitTest,
  useXR,
  XRDomOverlay,
} from "@react-three/xr";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Shared store — createXRStore auto-creates the domOverlayRoot div used by XRDomOverlay
const store = createXRStore();

// Reused matrix — allocated once to avoid per-frame GC pressure
const matrixHelper = new THREE.Matrix4();

// ─── Sub-components (inside <Canvas><XR>) ────────────────────────────────────

function FoodModel({ position }: { position: [number, number, number] }) {
  const { scene } = useGLTF("/your-food.glb");
  const clone = useRef(scene.clone(true));
  return (
    <primitive
      object={clone.current}
      position={position}
      scale={0.3} // ~30 cm — tweak if the model looks too large/small on a real surface
    />
  );
}

/**
 * Flat ring that snaps to the nearest detected surface every frame.
 * useXRHitTest fires inside useFrame; 'viewer' = ray from the camera pose.
 */
function Reticle({ onHit }: { onHit: (pos: THREE.Vector3) => void }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useXRHitTest((results, getWorldMatrix) => {
    if (!meshRef.current) return;

    if (results.length === 0) {
      meshRef.current.visible = false;
      return;
    }

    getWorldMatrix(matrixHelper, results[0]);
    const pos = new THREE.Vector3().setFromMatrixPosition(matrixHelper);
    meshRef.current.position.copy(pos);
    meshRef.current.visible = true;

    onHit(pos);
  }, "viewer");

  return (
    // rotation keeps the ring flat; it lies in the surface's plane
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
 * Listens for the WebXR "select" event (screen tap on Android).
 * Re-attaches whenever the session object changes (start/end).
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
 * All AR logic: hit testing, reticle, placement, and the in-AR DOM overlay.
 * Rendered inside <Canvas><XR> so it has access to XR context hooks.
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

      {/* In-AR overlay — rendered into the WebXR domOverlay layer so it appears above the camera feed */}
      <XRDomOverlay>
        <p
          style={{
            position: "fixed",
            bottom: "48px",
            left: "50%",
            transform: "translateX(-50%)",
            margin: 0,
            color: "#fff",
            fontFamily: "sans-serif",
            fontSize: "14px",
            whiteSpace: "nowrap",
            textShadow: "0 1px 6px rgba(0,0,0,0.8)",
            pointerEvents: "none",
          }}
        >
          {modelPos ? "Tap to move the model" : "Point at a surface · Tap to place"}
        </p>
      </XRDomOverlay>
    </>
  );
}

// ─── Root export ─────────────────────────────────────────────────────────────

export default function ARScene() {
  const [inSession, setInSession] = useState(false);

  // Subscribe to the XR store outside the Canvas to show/hide pre-session UI.
  // store is a Zustand store so .subscribe() fires on every state change.
  useEffect(() => {
    return store.subscribe((state) => {
      setInSession(!!state.session);
    });
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        // Transparent when in session so the camera passthrough isn't blocked by the div
        background: inSession ? "transparent" : "#000",
      }}
    >
      {/* Pre-session UI — hidden once AR starts */}
      {!inSession && (
        <>
          <p
            style={{
              position: "absolute",
              bottom: "116px",
              left: "50%",
              transform: "translateX(-50%)",
              margin: 0,
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
        </>
      )}

      {/*
        alpha: true  →  transparent WebGL background so the camera passthrough shows through.
        Without this the canvas renders opaque black and you see nothing.
      */}
      <Canvas gl={{ alpha: true, antialias: true }}>
        <XR store={store}>
          <ARContent />
        </XR>
      </Canvas>
    </div>
  );
}
