"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

// Lazy-load ARScene — it imports @react-three/xr which touches browser WebXR APIs
const ARScene = dynamic(() => import("./ARScene"), { ssr: false });

// ─── Platform detection ───────────────────────────────────────────────────────

type Platform = "ios" | "android-ar" | "unsupported";

function detectPlatform(): Promise<Platform> {
  return new Promise((resolve) => {
    const ua = navigator.userAgent;

    // iPad on iPadOS 13+ reports as MacIntel with touch points
    const ios =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    if (ios) {
      resolve("ios");
      return;
    }

    if ("xr" in navigator) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigator as any).xr
        .isSessionSupported("immersive-ar")
        .then((supported: boolean) => resolve(supported ? "android-ar" : "unsupported"))
        .catch(() => resolve("unsupported"));
    } else {
      resolve("unsupported");
    }
  });
}

// ─── Shared back button ───────────────────────────────────────────────────────

function BackButton() {
  return (
    <Link
      href="/"
      style={{
        position: "absolute",
        top: "20px",
        left: "20px",
        color: "#ccc",
        fontFamily: "sans-serif",
        fontSize: "14px",
        textDecoration: "none",
        background: "rgba(0,0,0,0.55)",
        padding: "8px 16px",
        borderRadius: "20px",
        zIndex: 20,
      }}
    >
      ← Back
    </Link>
  );
}

// ─── iOS path: model-viewer → AR Quick Look ───────────────────────────────────

function IOSViewer() {
  useEffect(() => {
    // Dynamically import the web component — registers <model-viewer> globally
    import("@google/model-viewer").catch(console.error);
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#111",
        position: "relative",
      }}
    >
      {/* @ts-expect-error — model-viewer is a web component, not a React element */}
      <model-viewer
        src="/your-food.glb"
        alt="3D food model"
        ar
        ar-modes="quick-look"
        camera-controls
        auto-rotate
        style={{ width: "100%", height: "100%" }}
      />
      <BackButton />
    </div>
  );
}

// ─── Unsupported path ─────────────────────────────────────────────────────────

function UnsupportedMessage() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#111",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        fontFamily: "sans-serif",
        padding: "24px",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      <p style={{ color: "#ccc", fontSize: "18px", margin: 0 }}>
        AR not supported on this device
      </p>
      <p
        style={{
          color: "#666",
          fontSize: "14px",
          textAlign: "center",
          maxWidth: "320px",
          margin: 0,
          lineHeight: 1.6,
        }}
      >
        AR requires an ARCore-supported Android device with Chrome, or an
        iPhone / iPad with Safari.
      </p>
      <BackButton />
    </div>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────

export default function ARViewer() {
  const [platform, setPlatform] = useState<Platform | null>(null);

  useEffect(() => {
    detectPlatform().then(setPlatform);
  }, []);

  // Still checking
  if (platform === null) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "#111",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "#888", fontFamily: "sans-serif" }}>
          Checking AR support…
        </p>
      </div>
    );
  }

  if (platform === "ios") return <IOSViewer />;
  if (platform === "android-ar") return (
    <div style={{ position: "relative" }}>
      <BackButton />
      <ARScene />
    </div>
  );
  return <UnsupportedMessage />;
}
