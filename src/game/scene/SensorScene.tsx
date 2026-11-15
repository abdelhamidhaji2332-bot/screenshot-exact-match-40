import { Html, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import type { ChapterId } from "@/game/ui/SimulationWorkbench";

type ScenePalette = Record<"board" | "dark" | "metal" | "gold" | "cyan" | "white" | "target", THREE.Color>;

const SCENE_COLOR_TOKENS: Record<keyof ScenePalette, string> = {
  board: "--scene-pcb",
  dark: "--scene-component",
  metal: "--scene-metal",
  gold: "--scene-gold",
  cyan: "--scene-wave",
  white: "--scene-silkscreen",
  target: "--scene-target",
};

function useScenePalette() {
  const [palette, setPalette] = useState<ScenePalette | null>(null);

  useEffect(() => {
    const samplingCanvas = document.createElement("canvas");
    samplingCanvas.width = 1;
    samplingCanvas.height = 1;
    const context = samplingCanvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;

    const rootStyle = getComputedStyle(document.documentElement);
    const resolveColor = (token: string) => {
      const cssColor = rootStyle.getPropertyValue(token).trim();
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = cssColor;
      context.fillRect(0, 0, 1, 1);
      const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
      return new THREE.Color(red / 255, green / 255, blue / 255);
    };

    setPalette(
      Object.fromEntries(
        Object.entries(SCENE_COLOR_TOKENS).map(([name, token]) => [name, resolveColor(token)]),
      ) as ScenePalette,
    );
  }, []);

  return palette;
}

function Traces({ palette }: { palette: ScenePalette }) {
  const lines = [
    [[-1.65, 0.225, -0.61], [-1.2, 0.225, -0.61], [-1.2, 0.225, 0.64]],
    [[1.65, 0.225, -0.61], [1.22, 0.225, -0.61], [1.22, 0.225, 0.64]],
    [[-1.62, 0.225, -0.83], [-0.98, 0.225, -0.83], [-0.98, 0.225, -0.33]],
    [[1.62, 0.225, -0.83], [0.96, 0.225, -0.83], [0.96, 0.225, -0.33]],
    [[-1.6, 0.225, -0.12], [-1.36, 0.225, -0.12], [-1.36, 0.225, 0.55]],
    [[1.6, 0.225, -0.12], [1.37, 0.225, -0.12], [1.37, 0.225, 0.55]],
    [[-1.53, 0.225, 0.89], [-0.94, 0.225, 0.89], [-0.94, 0.225, 0.63]],
    [[1.52, 0.225, 0.89], [0.94, 0.225, 0.89], [0.94, 0.225, 0.63]],
  ] as const;

  const geometry = useMemo(() => {
    const vertices: number[] = [];
    lines.forEach((line) => {
      line.slice(1).forEach((point, index) => {
        const previous = line[index];
        if (previous) vertices.push(...previous, ...point);
      });
    });
    const result = new THREE.BufferGeometry();
    result.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    return result;
  }, []);

  return <lineSegments geometry={geometry}><lineBasicMaterial color={palette.gold} transparent opacity={0.56} /></lineSegments>;
}

function HeaderPins({ palette }: { palette: ScenePalette }) {
  return (
    <group>
      {Array.from({ length: 4 }, (_, index) => {
        const x = -1.18 + index * 0.26;
        return (
          <mesh key={x} position={[x, -0.01, -1.01]} castShadow>
            <cylinderGeometry args={[0.036, 0.036, 0.3, 12]} />
            <meshStandardMaterial color={palette.gold} metalness={0.91} roughness={0.22} />
          </mesh>
        );
      })}
    </group>
  );
}

function SmdComponents({ palette }: { palette: ScenePalette }) {
  const chips = [
    { x: -0.62, z: -0.3, w: 0.58, d: 0.38, label: "U1" },
    { x: 0.29, z: -0.38, w: 0.5, d: 0.32, label: "U2" },
    { x: 0.75, z: 0.45, w: 0.36, d: 0.28, label: "C1" },
  ];
  return (
    <group>
      {chips.map((chip, index) => (
        <group key={chip.label}>
          <mesh position={[chip.x, 0.25, chip.z]} castShadow receiveShadow>
            <boxGeometry args={[chip.w, 0.11, chip.d]} />
            <meshStandardMaterial color={index === 2 ? palette.gold : palette.dark} metalness={0.42} roughness={0.31} />
          </mesh>
          {index < 2 && (
            <mesh position={[chip.x, 0.312, chip.z]}>
              <boxGeometry args={[chip.w * 0.6, 0.018, chip.d * 0.58]} />
              <meshStandardMaterial color={palette.metal} metalness={0.52} roughness={0.35} />
            </mesh>
          )}
          <Html position={[chip.x, 0.34, chip.z - chip.d * 0.63]} center distanceFactor={5}>
            <span className="scene-board-label">{chip.label}</span>
          </Html>
        </group>
      ))}

      {Array.from({ length: 7 }, (_, index) => (
        <mesh key={`resistor-${index}`} position={[-1.22 + (index % 4) * 0.22, 0.255, -0.2 + Math.floor(index / 4) * 0.68]}>
          <boxGeometry args={[0.12, 0.055, 0.065]} />
          <meshStandardMaterial color={index === 5 ? palette.gold : palette.metal} metalness={0.66} roughness={0.32} />
        </mesh>
      ))}

      <mesh position={[1.16, 0.28, -0.34]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.28, 20]} />
        <meshStandardMaterial color={palette.metal} metalness={0.88} roughness={0.24} />
      </mesh>
      <Html position={[1.16, 0.36, -0.54]} center distanceFactor={5}>
        <span className="scene-board-label">27 MHz</span>
      </Html>
    </group>
  );
}

function PiezoCan({
  name,
  x,
  exploded,
  palette,
}: {
  name: string;
  x: number;
  exploded: boolean;
  palette: ScenePalette;
}) {
  const shell = useRef<THREE.Group>(null);
  const explosionAmount = useRef(0);

  useFrame((_, delta) => {
    const target = exploded ? 1 : 0;
    explosionAmount.current = THREE.MathUtils.damp(explosionAmount.current, target, 5, delta);
    if (shell.current) shell.current.position.y = -0.13 + explosionAmount.current * 0.32;
  });

  return (
    <group position={[x, 0.68, 0.78]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.35, 0.16, 40]} />
        <meshStandardMaterial color={palette.gold} metalness={0.89} roughness={0.26} />
      </mesh>
      <mesh position={[0, 0.19, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.24, 0.06, 32]} />
        <meshStandardMaterial color={palette.board} metalness={0.66} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.235, 0]}>
        <cylinderGeometry args={[0.19, 0.19, 0.025, 32]} />
        <meshStandardMaterial color={palette.cyan} metalness={0.12} roughness={0.28} emissive={palette.cyan} emissiveIntensity={exploded ? 0.65 : 0.14} />
      </mesh>
      <group ref={shell} position={[0, -0.13, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.35, 0.35, 0.48, 40, 1, true]} />
          <meshStandardMaterial color={palette.metal} metalness={0.86} roughness={0.24} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.235, 0]} castShadow>
          <cylinderGeometry args={[0.34, 0.34, 0.05, 40]} />
          <meshStandardMaterial color={palette.dark} metalness={0.48} roughness={0.62} />
        </mesh>
        <mesh position={[0, 0.265, 0]}>
          <circleGeometry args={[0.275, 48]} />
          <meshStandardMaterial color={palette.dark} roughness={0.93} />
        </mesh>
        {Array.from({ length: 7 }, (_, index) => (
          <mesh key={index} position={[0, 0.267, -0.23 + index * 0.077]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.53, 8]} />
            <meshStandardMaterial color={palette.metal} metalness={0.72} roughness={0.32} />
          </mesh>
        ))}
      </group>
      <Html position={[0, -0.28, 0.02]} center distanceFactor={5}>
        <span className="scene-transducer-label">{name}</span>
      </Html>
    </group>
  );
}

function PulseRings({ distance, palette }: { distance: number; palette: ScenePalette }) {
  const groups = useRef<(THREE.Group | null)[]>([]);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    groups.current.forEach((group, index) => {
      if (!group) return;
      const phase = (elapsed * 0.44 + index * 0.24) % 1;
      group.scale.setScalar(0.35 + phase * 0.62);
      group.position.z = 1.31 + phase * (1.25 + (distance / 400) * 2.5);
      const material = (group.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial;
      material.opacity = (1 - phase) * 0.53;
    });
  });

  return (
    <group>
      {Array.from({ length: 4 }, (_, index) => (
        <group key={index} ref={(node) => { groups.current[index] = node; }}>
          <mesh rotation={[0, 0, 0]}>
            <torusGeometry args={[0.62, 0.011, 7, 72]} />
            <meshBasicMaterial color={palette.cyan} transparent opacity={0.38} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function CircuitBoard({ distance, temperature, exploded, palette }: {
  distance: number;
  temperature: number;
  exploded: boolean;
  palette: ScenePalette;
}) {
  const targetZ = 1.31 + (distance / 400) * 2.5;
  return (
    <>
      <ambientLight intensity={0.85} />
      <hemisphereLight args={[palette.white, palette.dark, 1.05]} />
      <directionalLight position={[-4, 7, 5]} intensity={2.6} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[1, 3, 1.8]} color={palette.cyan} intensity={20} distance={8} />
      <pointLight position={[-2, 1.5, -1.5]} color={palette.gold} intensity={9} distance={7} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]} receiveShadow>
        <planeGeometry args={[18, 18]} />
        <meshStandardMaterial color={palette.dark} metalness={0.14} roughness={0.87} />
      </mesh>
      <gridHelper args={[18, 40, palette.cyan, palette.dark]} position={[0, -0.185, 0]} />

      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.6, 0.2, 2.28]} />
        <meshPhysicalMaterial color={palette.board} metalness={0.34} roughness={0.36} clearcoat={0.7} clearcoatRoughness={0.24} />
      </mesh>

      <group>
        <mesh position={[-1.75, 0.108, -0.98]}>
          <cylinderGeometry args={[0.06, 0.06, 0.015, 24]} />
          <meshStandardMaterial color={palette.gold} metalness={0.96} roughness={0.18} />
        </mesh>
        <mesh position={[1.75, 0.108, -0.98]}>
          <cylinderGeometry args={[0.06, 0.06, 0.015, 24]} />
          <meshStandardMaterial color={palette.gold} metalness={0.96} roughness={0.18} />
        </mesh>
        <Traces palette={palette} />
        <SmdComponents palette={palette} />
        <HeaderPins palette={palette} />
        <PiezoCan name="ÉMETTEUR · T" x={-0.65} exploded={exploded} palette={palette} />
        <PiezoCan name="RÉCEPTEUR · R" x={0.65} exploded={exploded} palette={palette} />

        <Html position={[0, 0.5, -0.87]} center distanceFactor={5.2}>
          <span className="scene-board-label scene-board-title">HC—SR04</span>
        </Html>
        <Html position={[-1.57, 0.36, 0.01]} center distanceFactor={5}>
          <span className="scene-board-label">TRIG</span>
        </Html>
        <Html position={[1.58, 0.36, 0.01]} center distanceFactor={5}>
          <span className="scene-board-label">ECHO</span>
        </Html>
        {Array.from({ length: 4 }, (_, index) => (
          <mesh key={`pad-${index}`} position={[-1.55 + index * 0.25, 0.111, -1.04]}>
            <boxGeometry args={[0.14, 0.014, 0.18]} />
            <meshStandardMaterial color={palette.gold} metalness={0.9} roughness={0.2} />
          </mesh>
        ))}
      </group>

      <PulseRings distance={distance} palette={palette} />
      <mesh position={[0, 0.76, targetZ]}>
        <boxGeometry args={[2.2, 1.9, 0.08]} />
        <meshStandardMaterial color={palette.target} metalness={0.08} roughness={0.59} transparent opacity={0.76} />
      </mesh>
      <mesh position={[0, 0.76, targetZ - 0.055]}>
        <planeGeometry args={[2.0, 1.68]} />
        <meshBasicMaterial color={palette.target} transparent opacity={0.06} />
      </mesh>
      <Html position={[0, 1.88, targetZ]} center distanceFactor={7}>
        <span className="scene-target-label">CIBLE · {distance.toFixed(0)} CM</span>
      </Html>

      <Html position={[1.56, 0.69, 1.8]} center distanceFactor={8}>
        <div className="scene-temp-chip">
          <span className="scene-temp-dot" />
          <span>{temperature.toFixed(1)} °C</span>
          <span>c {(331.3 + 0.606 * temperature).toFixed(1)} m/s</span>
        </div>
      </Html>

      <EffectComposer>
        <Bloom intensity={0.48} luminanceThreshold={0.72} mipmapBlur />
      </EffectComposer>
      <OrbitControls enablePan={false} minDistance={5.2} maxDistance={10} minPolarAngle={0.35} maxPolarAngle={1.38} target={[0, 0.1, 0.32]} />
    </>
  );
}

export function SensorScene({
  distance,
  temperature,
  exploded,
  chapter,
}: {
  distance: number;
  temperature: number;
  exploded: boolean;
  chapter: ChapterId;
}) {
  const palette = useScenePalette();
  return (
    <div className="sensor-canvas-host" data-scene-ready={palette ? "1" : undefined}>
      {!palette ? (
        <div className="scene-loading">Initialisation du banc optique…</div>
      ) : (
        <Canvas camera={{ position: [0, 5.4, 7.2], fov: 42 }} shadows dpr={[1, 1.5]}>
          <CircuitBoard distance={distance} temperature={temperature} exploded={exploded || chapter === "piezo"} palette={palette} />
        </Canvas>
      )}
      <div className="scene-hud scene-hud-left"><span>RAYONNEMENT SONORE</span><span>40.000 kHz</span></div>
      <div className="scene-hud scene-hud-right"><span>MODE&nbsp; {exploded || chapter === "piezo" ? "ÉCLATÉ" : "ASSEMBLÉ"}</span><span>CAPTEUR&nbsp; / &nbsp;01</span></div>
      <div className="scene-camera-label">FAIRE GLISSER POUR ORBITER <span>·</span> MOLETTE POUR ZOOMER</div>
      <div className="scene-corner scene-corner-a" />
      <div className="scene-corner scene-corner-b" />
    </div>
  );
}