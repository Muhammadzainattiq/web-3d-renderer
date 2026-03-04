# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run lint     # Run ESLint
```

No test suite is configured.

## Architecture

This is a **Next.js 16 / React 19** app that renders a single interactive 3D model in the browser using the WebGL stack:

- **Three.js** — core 3D engine
- **@react-three/fiber** — React renderer for Three.js (`Canvas`)
- **@react-three/drei** — higher-level abstractions (`useGLTF`, `OrbitControls`, `Environment`, `Center`)
- **Tailwind CSS v4** (PostCSS plugin)

### Key files

| File | Role |
|---|---|
| `app/components/ModelViewer.tsx` | Main 3D viewer — `"use client"`, has "View in AR" button |
| `app/components/ARViewer.tsx` | Platform router: detects iOS / Android / unsupported, renders the correct AR path |
| `app/components/ARScene.tsx` | Android WebXR AR — `@react-three/xr` hit-test reticle + tap-to-place |
| `app/ar/page.tsx` | AR route — `"use client"` page with SSR-disabled dynamic import of ARViewer |
| `public/your-food.glb` | 3D model served at `/your-food.glb` |

### How the 3D viewer works

`ModelViewer.tsx` renders a full-viewport `<Canvas>` (R3F). Inside it:
- `useGLTF("/your-food.glb")` loads the GLB via Three.js `GLTFLoader`; the parsed `scene` is inserted with `<primitive object={scene} />`
- React `<Suspense>` shows a wireframe sphere fallback while loading
- `<Center>` auto-centers the model regardless of its origin in the file
- `<Environment preset="city">` provides HDR reflections
- `<OrbitControls autoRotate>` handles mouse interaction (pan disabled, polar angle clamped)

Any new 3D components must be placed inside the R3F `<Canvas>` tree and follow the same `"use client"` pattern.

### How the AR experience works

`/ar` route → `ARViewer` detects the platform client-side:
- **Android + ARCore**: renders `ARScene` — a `<Canvas><XR>` with `useHitTest` for surface detection and a `select` event listener for tap-to-place
- **iOS Safari**: renders `<model-viewer ar ar-modes="quick-look">` which hands off to Apple AR Quick Look (ARKit surface detection)
- **Unsupported**: shows an error message

All AR components use `dynamic(..., { ssr: false })` because they touch `navigator.xr` and WebGL. See `AR.md` for full details.

### Package install note

AR packages were installed with `--legacy-peer-deps` because `@google/model-viewer` declares a stale `three` peer dependency (it bundles its own Three.js). Always use `--legacy-peer-deps` when adding packages to this project.
