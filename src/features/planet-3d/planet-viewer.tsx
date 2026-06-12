"use client";

import React, { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ErrorBoundary } from "@/components/error-boundary";
import { LeafLoader } from "@/components/leaf-loader";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";

interface PlanetViewerProps {
  vegetation: number;
  rivers: number;
  wildlife: number;
  atmosphereClarity: number;
  pollution: number;
  desertification: number;
  cloudSpeedMultiplier?: number;
  isNightMode?: boolean;
  autoRotate?: boolean;
}

// 1. Procedural fBm 3D Noise function (seamless sine-based wave summation)
const noise3D = (x: number, y: number, z: number): number => {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1.0;

  for (let i = 0; i < 4; i++) {
    value += (
      Math.sin(x * frequency) * Math.cos(y * frequency + 1.0) +
      Math.sin(y * frequency * 1.5 + 2.0) * Math.cos(z * frequency) +
      Math.sin(z * frequency * 2.0 + 3.0) * Math.cos(x * frequency)
    ) * amplitude * 0.33;

    amplitude *= 0.5;
    frequency *= 2.2;
  }
  return value;
};

// 2. Displaced Flat-Shaded Land Core Component
const LandCore: React.FC<{
  pollution: number;
  desertification: number;
  vegetation: number;
}> = ({ pollution, desertification, vegetation }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Slowly rotate land core
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.045;
    }
  });

  const landGeometry = useMemo(() => {
    const geom = new THREE.IcosahedronGeometry(2.0, 4); // low poly resolution
    const pos = geom.getAttribute("position");
    const colors = [];
    const temp = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
      temp.fromBufferAttribute(pos, i);
      const len = temp.length();
      const dx = temp.x / len;
      const dy = temp.y / len;
      const dz = temp.z / len;

      // Displacement height
      const n = noise3D(dx * 2.5, dy * 2.5, dz * 2.5);
      const h = n * 0.45; // displacement amplitude

      // Submerge ocean beds, raise landmasses
      const finalLen = 2.0 + (h < 0.0 ? h * 0.15 : h);
      temp.set(dx * finalLen, dy * finalLen, dz * finalLen);
      pos.setXYZ(i, temp.x, temp.y, temp.z);

      // Height coloring mapping
      const color = new THREE.Color();
      if (h < -0.05) {
        // Submerged deep land bed
        color.set(pollution > 0.55 ? "#3d3220" : "#13231a");
      } else if (h <= 0.02) {
        // Sand beach boundaries
        color.set(pollution > 0.55 ? "#564c3c" : "#dfc59f");
      } else if (h < 0.24) {
        // Grasslands and plains
        const healthyColor = new THREE.Color("#00e676");
        const pollutedColor = new THREE.Color("#564c33"); // dry brown
        color.copy(healthyColor).lerp(pollutedColor, pollution);
      } else if (h < 0.42) {
        // Mountains ridges
        const healthyColor = new THREE.Color("#666d6d");
        const pollutedColor = new THREE.Color("#3d362e");
        color.copy(healthyColor).lerp(pollutedColor, pollution);
      } else {
        // Snowy peaks (darkens / melts if heavily polluted)
        color.set(pollution > 0.6 ? "#777777" : "#ffffff");
      }

      colors.push(color.r, color.g, color.b);
    }

    geom.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geom.computeVertexNormals();
    return geom;
  }, [pollution]);

  return (
    <mesh ref={meshRef} geometry={landGeometry} castShadow receiveShadow>
      <meshStandardMaterial
        vertexColors
        roughness={0.9}
        metalness={0.05}
        flatShading
      />
    </mesh>
  );
};

// 3. Separate Water Sphere Component
const WaterSphere: React.FC<{ pollution: number; rivers: number }> = ({ pollution, rivers }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Slow water surface rotation
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.02;
    }
  });

  const waterColor = useMemo(() => {
    const healthyWater = new THREE.Color("#1de9b6"); // teal
    const pollutedWater = new THREE.Color("#3e4733"); // toxic brown green
    return healthyWater.lerp(pollutedWater, pollution);
  }, [pollution]);

  return (
    <mesh ref={meshRef} receiveShadow>
      <sphereGeometry args={[2.0, 32, 32]} />
      <meshStandardMaterial
        color={waterColor}
        transparent
        opacity={0.65}
        roughness={0.15}
        metalness={0.6}
        flatShading
      />
    </mesh>
  );
};

// 4. Low-Poly Forest Elements and Wildlife Spawner
const EnvironmentElements: React.FC<{
  vegetation: number;
  wildlife: number;
  pollution: number;
}> = ({ vegetation, wildlife, pollution }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.045; // Match land rotation
    }
  });

  const elements = useMemo(() => {
    const list = [];
    const maxItems = Math.floor(vegetation * 60) + Math.floor(wildlife * 30);
    let seed = 12345;
    
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    for (let i = 0; list.length < maxItems && i < 1200; i++) {
      const u = random();
      const v = random();
      const theta = u * 2 * Math.PI;
      const phi = Math.acos(2 * v - 1);

      const dx = Math.sin(phi) * Math.cos(theta);
      const dy = Math.sin(phi) * Math.sin(theta);
      const dz = Math.cos(phi);

      const n = noise3D(dx * 2.5, dy * 2.5, dz * 2.5);
      const h = n * 0.45;

      // Only place on plain grasslands (above water level, below peaks)
      if (h > 0.04 && h < 0.22) {
        const r = 2.0 + h;
        const pos: [number, number, number] = [dx * r, dy * r, dz * r];

        const up = new THREE.Vector3(0, 1, 0);
        const target = new THREE.Vector3(dx, dy, dz).normalize();
        const quat = new THREE.Quaternion().setFromUnitVectors(up, target);

        const rand = random();
        let type: "pine" | "oak" | "grass" | "flower" | "rabbit" | "deer" | "butterfly" = "grass";

        if (rand < 0.35) {
          type = "pine";
        } else if (rand < 0.6) {
          type = "oak";
        } else if (rand < 0.76) {
          type = "grass";
        } else if (rand < 0.86) {
          type = "flower";
        } else if (rand < 0.91) {
          type = "rabbit";
        } else if (rand < 0.96) {
          type = "deer";
        } else {
          type = "butterfly";
        }

        list.push({
          key: `element-${list.length}`,
          position: pos,
          quaternion: [quat.x, quat.y, quat.z, quat.w] as [number, number, number, number],
          type,
          scale: 0.5 + random() * 0.6,
          colorSeed: random()
        });
      }
    }
    return list;
  }, [vegetation, wildlife, pollution]);

  const foliageColor = useMemo(() => {
    const healthy = new THREE.Color("#00e676");
    const dry = new THREE.Color("#6e6146");
    return healthy.lerp(dry, pollution);
  }, [pollution]);

  const grassColor = useMemo(() => {
    const healthy = new THREE.Color("#1de9b6");
    const dry = new THREE.Color("#5c4f39");
    return healthy.lerp(dry, pollution);
  }, [pollution]);

  return (
    <group ref={groupRef}>
      {elements.map((el) => {
        const quat = new THREE.Quaternion(el.quaternion[0], el.quaternion[1], el.quaternion[2], el.quaternion[3]);
        
        switch (el.type) {
          case "pine":
            return (
              <group key={el.key} position={el.position} quaternion={quat} scale={el.scale}>
                {/* Trunk */}
                <mesh castShadow>
                  <cylinderGeometry args={[0.012, 0.025, 0.18, 5]} />
                  <meshStandardMaterial color="#4a2e1d" roughness={0.9} flatShading />
                </mesh>
                {/* Foliage cones */}
                <mesh position={[0, 0.1, 0]} castShadow>
                  <coneGeometry args={[0.07, 0.15, 5]} />
                  <meshStandardMaterial color={foliageColor} roughness={0.8} flatShading />
                </mesh>
                <mesh position={[0, 0.17, 0]} castShadow>
                  <coneGeometry args={[0.05, 0.1, 5]} />
                  <meshStandardMaterial color={foliageColor} roughness={0.8} flatShading />
                </mesh>
              </group>
            );
          
          case "oak":
            return (
              <group key={el.key} position={el.position} quaternion={quat} scale={el.scale}>
                {/* Trunk */}
                <mesh castShadow>
                  <cylinderGeometry args={[0.015, 0.03, 0.16, 5]} />
                  <meshStandardMaterial color="#4a2e1d" roughness={0.9} flatShading />
                </mesh>
                {/* Foliage spheres */}
                <mesh position={[0, 0.12, 0]} castShadow>
                  <sphereGeometry args={[0.075, 6, 6]} />
                  <meshStandardMaterial color={foliageColor} roughness={0.85} flatShading />
                </mesh>
                <mesh position={[0.03, 0.16, 0.01]} castShadow>
                  <sphereGeometry args={[0.055, 5, 5]} />
                  <meshStandardMaterial color={foliageColor} roughness={0.85} flatShading />
                </mesh>
                <mesh position={[-0.03, 0.15, -0.01]} castShadow>
                  <sphereGeometry args={[0.05, 5, 5]} />
                  <meshStandardMaterial color={foliageColor} roughness={0.85} flatShading />
                </mesh>
              </group>
            );
          
          case "grass":
            return (
              <group key={el.key} position={el.position} quaternion={quat} scale={el.scale}>
                <mesh castShadow>
                  <boxGeometry args={[0.008, 0.045, 0.008]} />
                  <meshStandardMaterial color={grassColor} roughness={0.9} flatShading />
                </mesh>
                <mesh position={[0.01, 0.015, 0]} rotation={[0, 0, 0.3]} castShadow>
                  <boxGeometry args={[0.007, 0.035, 0.007]} />
                  <meshStandardMaterial color={grassColor} roughness={0.9} flatShading />
                </mesh>
                <mesh position={[-0.01, 0.015, 0]} rotation={[0, 0, -0.3]} castShadow>
                  <boxGeometry args={[0.007, 0.035, 0.007]} />
                  <meshStandardMaterial color={grassColor} roughness={0.9} flatShading />
                </mesh>
              </group>
            );

          case "flower": {
            const flowerColors = ["#ff5722", "#e91e63", "#ffeb3b", "#9c27b0", "#00bcd4"];
            const fColor = pollution > 0.6 ? "#776e5a" : flowerColors[Math.floor(el.colorSeed * flowerColors.length)];
            return (
              <group key={el.key} position={el.position} quaternion={quat} scale={el.scale}>
                {/* Stem */}
                <mesh>
                  <cylinderGeometry args={[0.004, 0.004, 0.05, 4]} />
                  <meshStandardMaterial color="#2e8b57" roughness={0.9} />
                </mesh>
                {/* Petals */}
                <mesh position={[0, 0.03, 0]}>
                  <sphereGeometry args={[0.02, 5, 5]} />
                  <meshStandardMaterial color={fColor} roughness={0.5} flatShading />
                </mesh>
              </group>
            );
          }

          case "rabbit":
            return (
              <Rabbit key={el.key} pos={el.position} quat={quat} scale={el.scale} />
            );

          case "deer":
            return (
              <Deer key={el.key} pos={el.position} quat={quat} scale={el.scale} />
            );

          case "butterfly":
            return (
              <Butterfly key={el.key} pos={el.position} quat={quat} scale={el.scale} colorSeed={el.colorSeed} />
            );

          default:
            return null;
        }
      })}
    </group>
  );
};

// Hop animation component for rabbits
const Rabbit: React.FC<{ pos: [number, number, number]; quat: THREE.Quaternion; scale: number }> = ({ pos, quat, scale }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = Math.abs(Math.sin(time * 5.0 + scale)) * 0.06;
    }
  });

  return (
    <group position={pos} quaternion={quat}>
      <group ref={groupRef} scale={scale * 0.9} position={[0, 0.02, 0]}>
        {/* Body */}
        <mesh castShadow>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} flatShading />
        </mesh>
        {/* Head */}
        <mesh position={[0, 0.03, 0.025]} castShadow>
          <sphereGeometry args={[0.025, 5, 5]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} flatShading />
        </mesh>
        {/* Ears */}
        <mesh position={[0.01, 0.05, 0.01]} rotation={[0.1, 0, -0.1]} castShadow>
          <boxGeometry args={[0.006, 0.03, 0.006]} />
          <meshStandardMaterial color="#ffc0cb" roughness={0.9} />
        </mesh>
        <mesh position={[-0.01, 0.05, 0.01]} rotation={[0.1, 0, 0.1]} castShadow>
          <boxGeometry args={[0.006, 0.03, 0.006]} />
          <meshStandardMaterial color="#ffc0cb" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
};

// Node animation component for deers
const Deer: React.FC<{ pos: [number, number, number]; quat: THREE.Quaternion; scale: number }> = ({ pos, quat, scale }) => {
  const headRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (headRef.current) {
      headRef.current.rotation.x = Math.sin(time * 2.0 + scale) * 0.12;
    }
  });

  return (
    <group position={pos} quaternion={quat}>
      <group scale={scale * 0.9} position={[0, 0.03, 0]}>
        {/* Body */}
        <mesh castShadow position={[0, 0.04, 0]}>
          <boxGeometry args={[0.045, 0.045, 0.08]} />
          <meshStandardMaterial color="#ab6d3e" roughness={0.8} flatShading />
        </mesh>
        {/* Legs */}
        <mesh castShadow position={[0.018, 0.01, 0.025]}>
          <cylinderGeometry args={[0.004, 0.004, 0.04]} />
          <meshStandardMaterial color="#4a2e1d" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[-0.018, 0.01, 0.025]}>
          <cylinderGeometry args={[0.004, 0.004, 0.04]} />
          <meshStandardMaterial color="#4a2e1d" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[0.018, 0.01, -0.025]}>
          <cylinderGeometry args={[0.004, 0.004, 0.04]} />
          <meshStandardMaterial color="#4a2e1d" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[-0.018, 0.01, -0.025]}>
          <cylinderGeometry args={[0.004, 0.004, 0.04]} />
          <meshStandardMaterial color="#4a2e1d" roughness={0.9} />
        </mesh>
        {/* Head */}
        <group ref={headRef} position={[0, 0.065, 0.03]}>
          <mesh castShadow position={[0, 0.01, 0]} rotation={[-0.3, 0, 0]}>
            <cylinderGeometry args={[0.008, 0.01, 0.035]} />
            <meshStandardMaterial color="#ab6d3e" roughness={0.8} />
          </mesh>
          <mesh castShadow position={[0, 0.025, 0.008]} rotation={[0.2, 0, 0]}>
            <boxGeometry args={[0.02, 0.02, 0.035]} />
            <meshStandardMaterial color="#ab6d3e" roughness={0.8} />
          </mesh>
        </group>
      </group>
    </group>
  );
};

// Wing flap component for butterflies
const Butterfly: React.FC<{
  pos: [number, number, number];
  quat: THREE.Quaternion;
  scale: number;
  colorSeed: number;
}> = ({ pos, quat, scale, colorSeed }) => {
  const leftWing = useRef<THREE.Mesh>(null);
  const rightWing = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const flap = Math.sin(time * 26.0 + colorSeed * 10) * 0.8;
    if (leftWing.current) leftWing.current.rotation.y = flap;
    if (rightWing.current) rightWing.current.rotation.y = -flap;
  });

  const butterflyColor = useMemo(() => {
    const colors = ["#ff5722", "#00bcd4", "#e91e63", "#ffeb3b", "#9c27b0"];
    return colors[Math.floor(colorSeed * colors.length)];
  }, [colorSeed]);

  return (
    <group position={pos} quaternion={quat} scale={scale}>
      <group position={[0, 0.02, 0]}>
        <mesh>
          <cylinderGeometry args={[0.003, 0.003, 0.025, 4]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        <mesh ref={leftWing} position={[-0.01, 0, 0]}>
          <boxGeometry args={[0.018, 0.001, 0.015]} />
          <meshStandardMaterial color={butterflyColor} roughness={0.2} transparent opacity={0.9} />
        </mesh>
        <mesh ref={rightWing} position={[0.01, 0, 0]}>
          <boxGeometry args={[0.018, 0.001, 0.015]} />
          <meshStandardMaterial color={butterflyColor} roughness={0.2} transparent opacity={0.9} />
        </mesh>
      </group>
    </group>
  );
};

// 5. Orbiting Flying Birds Component
const OrbitingBirds: React.FC<{ count: number }> = ({ count }) => {
  const birds = useMemo(() => {
    const list = [];
    for (let i = 0; i < count; i++) {
      list.push({
        id: i,
        orbitSpeed: 0.16 + i * 0.04,
        orbitRadius: 2.55 + i * 0.12,
        wingFlapSpeed: 14 + i * 2,
        phase: i * Math.PI * 0.67,
        pitchPhase: i * 3.5
      });
    }
    return list;
  }, [count]);

  return (
    <>
      {birds.map((b) => (
        <Bird key={b.id} birdData={b} />
      ))}
    </>
  );
};

const Bird: React.FC<{ birdData: any }> = ({ birdData }) => {
  const birdRef = useRef<THREE.Group>(null);
  const leftWing = useRef<THREE.Mesh>(null);
  const rightWing = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const angle = time * birdData.orbitSpeed + birdData.phase;
    const r = birdData.orbitRadius;

    if (birdRef.current) {
      const x = Math.cos(angle) * r;
      const y = Math.sin(time * 0.6 + birdData.pitchPhase) * 0.25 + 0.15;
      const z = Math.sin(angle) * r;
      birdRef.current.position.set(x, y, z);

      // Point bird tangent forward
      const nextAngle = angle + 0.04;
      const nx = Math.cos(nextAngle) * r;
      const ny = Math.sin((time + 0.04) * 0.6 + birdData.pitchPhase) * 0.25 + 0.15;
      const nz = Math.sin(nextAngle) * r;
      birdRef.current.lookAt(nx, ny, nz);
    }

    if (leftWing.current && rightWing.current) {
      const flap = Math.sin(time * birdData.wingFlapSpeed) * 0.65;
      leftWing.current.rotation.z = flap;
      rightWing.current.rotation.z = -flap;
    }
  });

  return (
    <group ref={birdRef}>
      {/* Body */}
      <mesh castShadow>
        <coneGeometry args={[0.035, 0.12, 4]} />
        <meshStandardMaterial color="#ffffff" roughness={0.7} flatShading />
      </mesh>
      {/* Wings */}
      <mesh ref={leftWing} position={[-0.035, 0, 0]}>
        <boxGeometry args={[0.1, 0.008, 0.05]} />
        <meshStandardMaterial color="#eeeeee" roughness={0.8} />
      </mesh>
      <mesh ref={rightWing} position={[0.035, 0, 0]}>
        <boxGeometry args={[0.1, 0.008, 0.05]} />
        <meshStandardMaterial color="#eeeeee" roughness={0.8} />
      </mesh>
    </group>
  );
};

// 6. Dynamic Sunlight day-night cycle rotation
const DynamicSunlight: React.FC<{ isNightMode: boolean }> = ({ isNightMode }) => {
  const lightRef = useRef<THREE.DirectionalLight>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const speed = 0.035; // Sun orbit speed
    if (lightRef.current) {
      const angle = time * speed;
      const radius = 6.0;
      lightRef.current.position.set(
        Math.cos(angle) * radius,
        3.5,
        Math.sin(angle) * radius
      );
    }
  });

  return (
    <>
      <ambientLight intensity={isNightMode ? 0.05 : 0.3} />
      <directionalLight
        ref={lightRef}
        intensity={isNightMode ? 0.08 : 1.4}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0005}
      />
      {/* Soft blue moon ray fill */}
      <directionalLight
        position={[-4, -1, -4]}
        intensity={isNightMode ? 0.3 : 0.15}
        color={isNightMode ? "#00c3ff" : "#ffffff"}
      />
    </>
  );
};

// 7. Low-Poly Clouds Component
const CloudsLayer: React.FC<{ speedMultiplier: number; pollution: number }> = ({ speedMultiplier, pollution }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.03 * speedMultiplier;
      groupRef.current.rotation.x += delta * 0.01 * speedMultiplier;
    }
  });

  const cloudColor = useMemo(() => {
    const clean = new THREE.Color("#ffffff");
    const smog = new THREE.Color("#4a4130"); // brown toxic smog
    return clean.lerp(smog, pollution);
  }, [pollution]);

  const cloudItems = useMemo(() => {
    const list = [];
    const r = 2.24;
    // 6 clouds coordinates distributed spherically
    for (let i = 0; i < 6; i++) {
      const theta = (i / 6) * 2 * Math.PI;
      const phi = Math.PI * 0.38 + Math.sin(i * 1.5) * 0.12;
      list.push({
        id: i,
        position: [
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.cos(phi),
          r * Math.sin(phi) * Math.sin(theta)
        ] as [number, number, number],
        scale: 0.2 + Math.sin(i * 2) * 0.06
      });
    }
    return list;
  }, []);

  return (
    <group ref={groupRef}>
      {cloudItems.map((c) => (
        <group key={c.id} position={c.position}>
          {/* Overlapping spherical clusters */}
          <mesh castShadow>
            <sphereGeometry args={[c.scale, 7, 7]} />
            <meshStandardMaterial color={cloudColor} roughness={0.9} transparent opacity={0.75} flatShading />
          </mesh>
          <mesh position={[c.scale * 0.5, 0, 0]} castShadow>
            <sphereGeometry args={[c.scale * 0.75, 6, 6]} />
            <meshStandardMaterial color={cloudColor} roughness={0.9} transparent opacity={0.75} flatShading />
          </mesh>
          <mesh position={[-0.4 * c.scale, 0.25 * c.scale, 0]} castShadow>
            <sphereGeometry args={[c.scale * 0.65, 6, 6]} />
            <meshStandardMaterial color={cloudColor} roughness={0.9} transparent opacity={0.75} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// 8. Glowing Atmosphere Smog Shell Component
const AtmosphericShell: React.FC<{ pollution: number }> = ({ pollution }) => {
  const shellRef = useRef<THREE.Mesh>(null);

  const colors = useMemo(() => {
    const cleanGlow = new THREE.Color("#00ffd5"); // neon teal
    const dirtySmog = new THREE.Color("#ff5500"); // orange toxic smog
    return cleanGlow.lerp(dirtySmog, pollution);
  }, [pollution]);

  return (
    <mesh ref={shellRef}>
      <sphereGeometry args={[2.32, 24, 24]} />
      <meshBasicMaterial
        color={colors}
        transparent
        opacity={0.07 + pollution * 0.16}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
};

// 9. Floating Fireflies/Dust Particles Component
const FireflyParticles: React.FC<{ pollution: number; count: number }> = ({ pollution, count }) => {
  const pointsRef = useRef<THREE.Points>(null);

  const activeCount = useMemo(() => {
    // Diminish firefly count as pollution spikes
    if (pollution > 0.45) return 0;
    return Math.floor(count * (1.0 - pollution * 1.5));
  }, [pollution, count]);

  const [positions, speeds] = useMemo(() => {
    const pos = [];
    const spd = [];
    for (let i = 0; i < count; i++) {
      const r = 2.05 + Math.random() * 0.4;
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(Math.random() * 2 - 1);
      pos.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
      spd.push(0.1 + Math.random() * 0.3);
    }
    return [new Float32Array(pos), new Float32Array(spd)];
  }, [count]);

  useFrame((state) => {
    if (activeCount === 0 || !pointsRef.current) return;
    const time = state.clock.getElapsedTime();
    const posAttr = pointsRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;

    for (let i = 0; i < activeCount; i++) {
      let px = posAttr.getX(i);
      let py = posAttr.getY(i);
      let pz = posAttr.getZ(i);

      px += Math.sin(time * speeds[i] + i) * 0.0018;
      py += Math.cos(time * speeds[i] * 1.3 + i) * 0.0018;
      pz += Math.sin(time * speeds[i] * 0.8 + i * 1.5) * 0.0018;

      posAttr.setXYZ(i, px, py, pz);
    }
    posAttr.needsUpdate = true;
  });

  if (activeCount === 0) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#39ff14" // neon green fireflies
        size={0.032}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

// Main Canvas Render Component
export const PlanetViewer: React.FC<PlanetViewerProps> = ({
  vegetation,
  rivers,
  wildlife,
  atmosphereClarity,
  pollution,
  desertification,
  cloudSpeedMultiplier = 1.0,
  isNightMode = false,
  autoRotate = false
}) => {
  return (
    <div className="w-full h-full relative" style={{ minHeight: "400px" }}>
      <ErrorBoundary>
        <Suspense fallback={<LeafLoader />}>
          <Canvas
            shadows
            camera={{ position: [0, 0, 4.6], fov: 60 }}
            gl={{ antialias: true }}
          >
        {/* Dynamic Sun/Moon and Shadows */}
        <DynamicSunlight isNightMode={isNightMode} />

        {/* Miniature displaced land core */}
        <LandCore
          pollution={pollution}
          desertification={desertification}
          vegetation={vegetation}
        />

        {/* Transparent liquid ocean boundaries */}
        <WaterSphere pollution={pollution} rivers={rivers} />

        {/* Forest clusters, flowers, and animals spawning on land */}
        <EnvironmentElements
          vegetation={vegetation}
          wildlife={wildlife}
          pollution={pollution}
        />

        {/* Low poly cloud systems */}
        <CloudsLayer speedMultiplier={cloudSpeedMultiplier} pollution={pollution} />

        {/* Smooth ambient atmosphere halo */}
        <AtmosphericShell pollution={pollution} />

        {/* Orbiting flying birds */}
        {wildlife > 0.1 && <OrbitingBirds count={Math.min(4, Math.floor(wildlife * 5) + 1)} />}

        {/* Drifting fireflies under clean skies */}
        <FireflyParticles pollution={pollution} count={35} />

        {/* Outer Stars background */}
        <Stars radius={90} depth={40} count={isNightMode ? 2500 : 1000} factor={3} saturation={0.8} fade speed={1.2} />

        {/* Inertial Orbit Controls */}
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={3.2}
          maxDistance={7.5}
          autoRotate={autoRotate}
          autoRotateSpeed={1.2}
        />
          </Canvas>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};
