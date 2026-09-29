// Scene building blocks. Everything is in robotics coordinates (z up).
import { useContext } from 'react';
import * as THREE from 'three';
import { Html, Line } from '@react-three/drei';
import { AXIS_COLORS } from '../lib/colors.js';
import { add, axis, cross, norm, normalize, pos, scale, sub } from '../lib/dh.js';
import { useScenePalette } from '../theme.js';
import { LabelLayerContext } from './Viewport.jsx';

const Y = new THREE.Vector3(0, 1, 0);

/** Quaternion turning three.js' +Y (cylinder/cone axis) onto `dir`. */
function quatFor(dir) {
  const v = new THREE.Vector3(...normalize(dir));
  return new THREE.Quaternion().setFromUnitVectors(Y, v);
}

export function Mat({ color, opacity = 1 }) {
  return (
    <meshStandardMaterial
      color={color}
      transparent
      opacity={opacity}
      depthWrite={opacity > 0.55}
      roughness={0.45}
      metalness={0.05}
    />
  );
}

export function Arrow({ from, dir, length, color, radius = 0.012, opacity = 1 }) {
  const L = length ?? norm(dir);
  if (!(L > 1e-6) || norm(dir) < 1e-9) return null;
  const u = normalize(dir);
  const q = quatFor(u);
  const head = Math.min(radius * 7, L * 0.45);
  const shaft = L - head;
  return (
    <group>
      <mesh position={add(from, scale(u, shaft / 2))} quaternion={q} scale={[1, shaft, 1]}>
        <cylinderGeometry args={[radius, radius, 1, 12]} />
        <Mat color={color} opacity={opacity} />
      </mesh>
      <mesh position={add(from, scale(u, shaft + head / 2))} quaternion={q}>
        <coneGeometry args={[radius * 2.6, head, 18]} />
        <Mat color={color} opacity={opacity} />
      </mesh>
    </group>
  );
}

export function Rod({ from, to, radius, color, opacity = 1, square = false }) {
  const v = sub(to, from);
  const L = norm(v);
  if (L < 1e-6) return null;
  return (
    <mesh position={add(from, scale(v, 0.5))} quaternion={quatFor(v)} scale={[1, L, 1]}>
      {square ? (
        <boxGeometry args={[radius * 2, 1, radius * 2]} />
      ) : (
        <cylinderGeometry args={[radius, radius, 1, 20]} />
      )}
      <Mat color={color} opacity={opacity} />
    </mesh>
  );
}

export function Dot({ position, radius, color, opacity = 1 }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[radius, 18, 18]} />
      <Mat color={color} opacity={opacity} />
    </mesh>
  );
}

/** Revolute joints are cylinders, prismatic joints square sleeves, both along the joint axis. */
export function JointBody({ origin, dir, type, radius, length, color, opacity = 1 }) {
  return (
    <mesh position={origin} quaternion={quatFor(dir)}>
      {type === 'P' ? (
        <boxGeometry args={[radius * 1.7, length, radius * 1.7]} />
      ) : (
        <cylinderGeometry args={[radius, radius, length, 32]} />
      )}
      <Mat color={color} opacity={opacity} />
    </mesh>
  );
}

export function DashedLine({ from, to, color, opacity = 1, width = 1.5, dash = 0.06 }) {
  return (
    <Line
      points={[from, to]}
      color={color}
      lineWidth={width}
      dashed
      dashSize={dash}
      gapSize={dash * 0.7}
      transparent
      opacity={opacity}
    />
  );
}

/**
 * Circular arc for an angle: starts along `from`, turns `angle` rad about `axis`
 * (right-hand rule) and ends in an arrowhead.
 */
export function AngleArc({ center, from, axis: n, angle, radius, color, opacity = 1, width = 2.5, arrow = true }) {
  if (Math.abs(angle) < 1e-3) return null;
  const u = normalize(from);
  const w = cross(normalize(n), u);
  const N = Math.max(6, Math.ceil(Math.abs(angle) / (Math.PI / 60)));
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const t = (angle * i) / N;
    pts.push(add(center, add(scale(u, radius * Math.cos(t)), scale(w, radius * Math.sin(t)))));
  }
  const end = pts[N];
  const tangent = scale(add(scale(u, -Math.sin(angle)), scale(w, Math.cos(angle))), Math.sign(angle));
  const head = Math.min(radius * 0.32, 0.07);
  const showHead = arrow && Math.abs(angle) * radius > head * 1.6;
  return (
    <group>
      <Line points={pts} color={color} lineWidth={width} transparent opacity={opacity} />
      {showHead && (
        <mesh position={add(end, scale(tangent, -head / 2))} quaternion={quatFor(tangent)}>
          <coneGeometry args={[head * 0.42, head, 14]} />
          <Mat color={color} opacity={opacity} />
        </mesh>
      )}
    </group>
  );
}

/** Screen-space text label anchored to a 3D point. */
export function Label({ position, children, color, dim = false, plain = false, className = '' }) {
  const layer = useContext(LabelLayerContext);
  return (
    <Html position={position} center portal={layer ?? undefined} zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
      <div
        className={`scene-label${plain ? ' plain' : ''} ${className}`}
        style={{ color, opacity: dim ? 0.3 : 1 }}
      >
        {children}
      </div>
    </Html>
  );
}

/** Coordinate frame: x/y/z arrows (red/green/blue) with optional labels. */
export function Frame({ T, size = 0.5, radius = 0.013, labels, name, opacity = 1, highlight = false, nameOffset = 0.09 }) {
  const pal = useScenePalette();
  const o = pos(T);
  const ax = [axis(T, 0), axis(T, 1), axis(T, 2)];
  const dim = opacity < 0.5;
  return (
    <group>
      {ax.map((a, i) => (
        <Arrow key={i} from={o} dir={a} length={size} radius={radius} color={AXIS_COLORS[i]} opacity={opacity} />
      ))}
      <mesh position={o}>
        <sphereGeometry args={[radius * (highlight ? 3.2 : 2.3), 20, 20]} />
        <Mat color={highlight ? pal.accent : pal.neutral} opacity={Math.max(opacity, 0.35)} />
      </mesh>
      {labels &&
        ax.map((a, i) => (
          <Label key={i} position={add(o, scale(a, size + 0.07))} color={AXIS_COLORS[i]} dim={dim} plain>
            {labels[i]}
          </Label>
        ))}
      {name && (
        <Label position={add(o, scale(add(add(ax[0], ax[1]), ax[2]), -nameOffset))} dim={dim}>
          {name}
        </Label>
      )}
    </group>
  );
}
