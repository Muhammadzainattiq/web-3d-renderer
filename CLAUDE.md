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
| `app/components/ModelViewer.tsx` | The entire 3D viewer — must be `"use client"` because Three.js requires browser WebGL |
| `app/page.tsx` | Home page; simply renders `<ModelViewer />` |
| `public/your-food.glb` | The 3D model, served as a static asset at `/your-food.glb` |

### How the 3D viewer works

`ModelViewer.tsx` renders a full-viewport `<Canvas>` (R3F). Inside it:
- `useGLTF("/your-food.glb")` loads the GLB via Three.js `GLTFLoader`; the parsed `scene` is inserted with `<primitive object={scene} />`
- React `<Suspense>` shows a wireframe sphere fallback while loading
- `<Center>` auto-centers the model regardless of its origin in the file
- `<Environment preset="city">` provides HDR reflections
- `<OrbitControls autoRotate>` handles mouse interaction (pan disabled, polar angle clamped)

Any new 3D components must be placed inside the R3F `<Canvas>` tree and follow the same `"use client"` pattern.
