import { createContext, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { GizmoHelper, GizmoViewport, OrbitControls } from '@react-three/drei';
import { AXIS_COLORS } from '../lib/colors.js';
import { useScenePalette } from '../theme.js';

/**
 * DOM layer that scene labels (drei <Html>) portal into. Giving them a fixed
 * target stops drei re-mounting each label when the canvas connects its events,
 * which left orphaned React roots behind.
 */
export const LabelLayerContext = createContext(null);

/** Moves the camera to `position`, looking at `target`, whenever resetKey changes. */
function CameraRig({ position, target, resetKey }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls);
  useEffect(() => {
    camera.up.set(0, 0, 1);
    camera.position.set(...position);
    if (controls) {
      controls.target.set(...target);
      controls.update();
    } else {
      camera.lookAt(...target);
    }
    // Only an explicit reset (or controls becoming available) moves the camera.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, controls, camera]);
  return null;
}

export function Viewport({
  children,
  cameraPosition,
  target,
  resetKey = 0,
  active = true,
  grid = { size: 4, divisions: 20, z: 0 },
  overlay,
  className = '',
}) {
  const pal = useScenePalette();
  const labelLayer = useRef(null);
  return (
    <div className={`viewport ${className}`}>
      <LabelLayerContext.Provider value={labelLayer}>
        <Canvas
          frameloop={active ? 'always' : 'never'}
          dpr={[1, 2]}
          camera={{ position: cameraPosition, up: [0, 0, 1], fov: 38, near: 0.01, far: 200 }}
        >
          <color attach="background" args={[pal.bg]} />
          <hemisphereLight args={['#ffffff', '#8a93a3', 1.1]} position={[0, 0, 1]} />
          <directionalLight position={[3, -4, 6]} intensity={1.5} />
          <directionalLight position={[-4, 3, 2]} intensity={0.45} />
          <gridHelper
            key={`${pal.grid1}-${grid.size}-${grid.divisions}`}
            args={[grid.size, grid.divisions, pal.grid1, pal.grid2]}
            rotation={[Math.PI / 2, 0, 0]}
            position={[0, 0, grid.z ?? 0]}
          />
          <OrbitControls makeDefault enableDamping dampingFactor={0.12} />
          <CameraRig position={cameraPosition} target={target} resetKey={resetKey} />
          {children}
          {/* World-axis gizmo (Unity style) so the x/y/z colours are always at hand. Clicking is
              disabled: drei's snap-to-axis tween resets camera.up to +Y and breaks our z-up orbit. */}
          <GizmoHelper alignment="bottom-right" margin={[70, 70]}>
            <GizmoViewport
              scale={44}
              disabled
              hideNegativeAxes
              axisColors={AXIS_COLORS}
              labels={['x', 'y', 'z']}
              labelColor="#ffffff"
              font="bold 22px Arial, sans-serif"
            />
          </GizmoHelper>
        </Canvas>
      </LabelLayerContext.Provider>
      <div className="label-layer" ref={labelLayer} />
      {overlay}
      <div className="viewport-hint">drag to orbit · scroll to zoom · right-drag to pan</div>
    </div>
  );
}
