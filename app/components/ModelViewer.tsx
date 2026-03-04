"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center } from "@react-three/drei";

function Model() {
  const { scene } = useGLTF("/your-food.glb");
  return <primitive object={scene} />;
}

function LoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshStandardMaterial color="#555" wireframe />
    </mesh>
  );
}

export default function ModelViewer() {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#111111" }}>
      <Canvas
        camera={{ position: [0, 1, 4], fov: 45 }}
        gl={{ antialias: true }}
        shadows
      >
        {/* No external HDR preset — avoids CDN fetch failures on mobile */}
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 10, 5]} intensity={2} castShadow />
        <directionalLight position={[-5, 3, -5]} intensity={0.8} color="#c8d8ff" />
        <pointLight position={[0, 6, 0]} intensity={1} color="#ffffff" />

        <Suspense fallback={<LoadingFallback />}>
          <Center>
            <Model />
          </Center>
        </Suspense>

        <OrbitControls
          autoRotate
          autoRotateSpeed={1.5}
          enableZoom
          enablePan={false}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 1.8}
        />
      </Canvas>

      {/* View in AR button — top-right corner */}
      <Link
        href="/ar"
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          padding: "10px 20px",
          background: "rgba(255,255,255,0.12)",
          color: "#fff",
          fontFamily: "sans-serif",
          fontSize: "14px",
          fontWeight: 500,
          textDecoration: "none",
          borderRadius: "24px",
          border: "1px solid rgba(255,255,255,0.25)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        View in AR
      </Link>

      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          color: "#888",
          fontSize: "13px",
          fontFamily: "sans-serif",
          pointerEvents: "none",
        }}
      >
        Drag to rotate · Scroll to zoom
      </div>
    </div>
  );
}
