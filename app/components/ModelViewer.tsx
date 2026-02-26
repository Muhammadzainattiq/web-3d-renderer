"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Center } from "@react-three/drei";

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
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={1.5}
          castShadow
        />
        <pointLight position={[-5, 5, -5]} intensity={0.5} color="#ffffff" />

        <Suspense fallback={<LoadingFallback />}>
          <Center>
            <Model />
          </Center>
          <Environment preset="city" />
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
