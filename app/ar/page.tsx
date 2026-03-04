"use client";

// dynamic with ssr:false requires a Client Component in Next.js App Router
import dynamic from "next/dynamic";

const ARViewer = dynamic(() => import("../components/ARViewer"), {
  ssr: false,
});

export default function ARPage() {
  return <ARViewer />;
}
