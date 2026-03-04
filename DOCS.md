# 3D Food Viewer — Project Documentation

## Overview

A Next.js web app that renders an interactive 3D food model (`.glb` file) in the browser using Three.js and React Three Fiber.

---

## Project Structure

```
new-3d-proj/
├── app/
│   ├── components/
│   │   └── ModelViewer.tsx   # 3D canvas component (client-side)
│   ├── globals.css           # Global styles (zeroed margin/padding)
│   ├── layout.tsx            # Root layout with metadata
│   └── page.tsx              # Home page — renders ModelViewer
├── public/
│   └── your-food.glb         # 3D model file (served as static asset)
├── package.json
└── DOCS.md
```

---

## What Was Done

### 1. Moved the 3D Model
Copied `your-food.glb` from the root `D:/Res-3d/` directory into `new-3d-proj/public/`. Files in `public/` are served by Next.js as static assets at the root URL path (e.g. `/your-food.glb`).

### 2. Installed Dependencies

```bash
npm install three @react-three/fiber @react-three/drei @types/three
```

| Package | Purpose |
|---|---|
| `three` | Core Three.js 3D engine |
| `@react-three/fiber` | React renderer for Three.js (`Canvas`, hooks) |
| `@react-three/drei` | Helper abstractions (`useGLTF`, `OrbitControls`, `Environment`, `Center`) |
| `@types/three` | TypeScript type definitions for Three.js |

> **Note:** A clean reinstall (`rm -rf node_modules` then `npm install`) was required because a partial install corrupted `@swc/helpers`, which Next.js depends on internally.

### 3. Created `app/components/ModelViewer.tsx`

A `"use client"` component (required because Three.js uses browser WebGL APIs that don't exist on the server). It contains:

- **`<Canvas>`** — sets up the WebGL rendering context, camera at position `[0, 1, 4]` with 45° FOV
- **`<Model>`** — inner component that calls `useGLTF("/your-food.glb")` to load the model and renders it as a `<primitive>`
- **`<LoadingFallback>`** — wireframe sphere shown while the GLB file is loading over the network
- **Lighting** — ambient light (0.6 intensity) + directional light with shadows + point light for fill
- **`<Environment preset="city">`** — HDR environment map for realistic material reflections
- **`<Center>`** — auto-centers the model regardless of its origin point in the file
- **`<OrbitControls>`** — mouse drag to rotate, scroll to zoom, auto-rotate at 1.5 rpm, pan disabled, polar angle clamped so the model can't flip upside down

### 4. Updated `app/page.tsx`

Replaced the default Next.js starter page with a single import and render of `<ModelViewer />`.

### 5. Updated `app/globals.css`

Added `margin: 0; padding: 0; overflow: hidden;` to `body` and `html` so the canvas fills the entire viewport without scrollbars.

### 6. Updated `app/layout.tsx`

Changed the page `<title>` to `"3D Food Viewer"` and description to match the project.

---

## Running the Project

```bash
cd new-3d-proj
npm run dev
```

Then open **http://localhost:3000** in your browser.

---

## Controls

| Action | Result |
|---|---|
| Left-click + drag | Rotate the model |
| Scroll wheel | Zoom in / out |
| (Auto) | Model slowly rotates on its own |

---

## How the GLB Loading Works

1. Next.js serves `public/your-food.glb` at `/your-food.glb`
2. `useGLTF("/your-food.glb")` (from `@react-three/drei`) fetches and parses the file using Three.js's `GLTFLoader`
3. The parsed `scene` object (a Three.js `Object3D` graph) is passed to `<primitive object={scene} />` which inserts it directly into the R3F scene graph
4. React Suspense handles the async loading — the fallback wireframe sphere is shown until the model is ready
