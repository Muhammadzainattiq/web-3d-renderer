# AR Implementation

## Overview

The AR experience lives at `/ar` and is a separate route from the main 3D viewer. Platform detection runs client-side and routes users to the right experience automatically.

---

## Platform Matrix

| Device | Browser | AR Mode | Technology |
|---|---|---|---|
| Android (ARCore supported) | Chrome | In-browser hit-test | WebXR `immersive-ar` + `@react-three/xr` |
| iPhone / iPad | Safari | Native AR Quick Look | `<model-viewer>` web component → Apple ARKit |
| Desktop / unsupported | Any | Error message | — |

> **iOS limitation:** Apple has not shipped WebXR AR support in Safari as of early 2026. The only way to get real surface detection on iOS without a native app is to hand off to Apple's AR Quick Look system viewer. It opens as a separate app overlay, not inside your browser tab. The upside is it uses full ARKit quality.

---

## File Map

```
app/
  ar/
    page.tsx              Route entry — server component, SSR-disabled dynamic import
  components/
    ARViewer.tsx          Platform router — iOS vs Android vs unsupported
    ARScene.tsx           Android WebXR AR scene (Canvas + XR + hit test)
    ModelViewer.tsx       Main 3D viewer — has "View in AR" button linking to /ar
```

---

## Android WebXR Flow (ARScene.tsx)

### Session startup
`createXRStore()` creates a shared XR store. Clicking "Start AR" calls `store.enterAR()`, which internally requests an `immersive-ar` WebXR session with the `hit-test` feature.

### Hit testing (surface detection)
```tsx
useXRHitTest(
  (results: XRHitTestResult[], getWorldMatrix: (target: THREE.Matrix4, result: XRHitTestResult) => void) => {
    if (results.length === 0) return;
    getWorldMatrix(matrixHelper, results[0]);
    const pos = new THREE.Vector3().setFromMatrixPosition(matrixHelper);
    // update reticle position
  },
  'viewer'   // relativeTo: ray originates from the camera/viewer pose
)
```
`useXRHitTest` fires every frame via `useFrame`. `results[0]` is the nearest hit. `getWorldMatrix` populates a `THREE.Matrix4` with the world transform at the hit point. The `'viewer'` argument means the ray shoots from the camera center (what the user is looking at / pointing at).

### Tap to place
`SelectListener` uses `useXR(state => state.session)` from `@react-three/xr` to reactively get the XRSession. When the session exists, a `select` event listener is attached. On Android, `select` fires on each screen tap. When tapped, the model is placed at `currentHit.current` — the position saved from the most recent `useXRHitTest` callback.

Tapping again moves the model to the new position (single model, last tap wins).

### Scene graph
```
<Canvas>
  <XR store={store}>
    <ambientLight /> <directionalLight />
    <Reticle />           ← white ring on detected surface
    <SelectListener />    ← attaches select event after session starts
    {modelPos && <FoodModel position={modelPos} />}
  </XR>
</Canvas>
```

---

## iOS Quick Look Flow (ARViewer.tsx → IOSViewer)

`@google/model-viewer` is imported dynamically inside `useEffect` to register the `<model-viewer>` custom element. The element handles everything:
- Shows a "View in AR" button automatically
- On tap, launches Apple's AR Quick Look system viewer
- AR Quick Look uses ARKit for surface detection — the user can place the model on any detected horizontal surface

The GLB file is used directly; `model-viewer` auto-converts it to USDZ for Quick Look on the fly.

---

## Adjusting the Model Scale in AR

The AR world is in real metres. The model appears at `scale={0.3}` (≈ 30 cm across). If it looks too large or too small on a real surface:

**In `app/components/ARScene.tsx`, line with `scale={0.3}`:**
```tsx
// 0.1 = 10 cm, 0.5 = 50 cm, 1.0 = 1 m
<primitive object={clone.current} position={position} scale={0.3} />
```

---

## Swapping the 3D Model

Replace `public/your-food.glb` with any other `.glb` file and update the path in two places:

| File | Variable |
|---|---|
| `app/components/ARScene.tsx` | `useGLTF("/your-food.glb")` |
| `app/components/ModelViewer.tsx` | `useGLTF("/your-food.glb")` |

Both also call `useGLTF.preload("/your-food.glb")` — add that call for new files to pre-fetch the model.

---

## ARCore Device Requirement (Android)

The user's Android device must:
1. Be on the [ARCore supported devices list](https://developers.google.com/ar/devices) — covers most phones sold since 2018
2. Have **Google Play Services for AR** installed — Chrome prompts for this automatically on first AR session if missing

The page falls back gracefully to the "AR not supported" message if `navigator.xr.isSessionSupported("immersive-ar")` returns `false`.

---

## HTTPS Requirement

WebXR `immersive-ar` only works in a [secure context](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts):
- `localhost` — already secure, works in `npm run dev`
- Production — must be HTTPS (Vercel, Netlify, Cloudflare Pages all satisfy this)

---

## Dependencies Added

| Package | Purpose |
|---|---|
| `@react-three/xr` | WebXR session management, `useHitTest`, `<XR>` wrapper |
| `@google/model-viewer` | iOS AR Quick Look via `<model-viewer>` web component |

Installed with `--legacy-peer-deps` because `@google/model-viewer` declares a stale `three` peer dependency even though it bundles its own Three.js internally.
