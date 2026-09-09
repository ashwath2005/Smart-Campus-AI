import React, { useRef, Suspense, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { CampusGround } from "./CampusGround";
import { CampusBuilding } from "./CampusBuilding";
import { CampusCompass } from "./CampusCompass";
import { CAMPUS_BUILDINGS, CAMERA_PRESETS } from "../utils/campusCoordinates";

// Camera Controller with smooth georeferenced transitions
function CameraController({
  cameraMode,
  selectedBuilding,
  isPatrolActive,
  controlsRef,
  onUpdateCameraAngle
}) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(35, 60, 65));
  const targetLookAt = useRef(new THREE.Vector3(5, 0, 5));
  const isTransitioning = useRef(true);
  const patrolAngle = useRef(0);

  // Initial cinematic fly-in
  useEffect(() => {
    camera.position.set(45, 80, 80);
    camera.lookAt(5, 0, 5);
    isTransitioning.current = true;
  }, [camera]);

  // Update target when preset or selected building changes
  useEffect(() => {
    isTransitioning.current = true;

    if (selectedBuilding) {
      const [bx, , bz] = selectedBuilding.position;
      const heightOffset = Math.max(12, selectedBuilding.dimensions[1] * 2.2);
      targetPos.current.set(bx + 14, heightOffset, bz + 16);
      targetLookAt.current.set(bx, 1.5, bz);
      return;
    }

    if (cameraMode === "topdown") {
      // Perpendicular Top-Down Overhead View (North pointing strictly straight UP along -Z)
      // Balanced framing of academic quad, admin, library, and stadium
      targetPos.current.set(8, 125, 4.001);
      targetLookAt.current.set(8, 0, 4);
    } else {
      const preset = CAMERA_PRESETS.find((p) => p.id === cameraMode);
      if (preset) {
        targetPos.current.set(preset.position[0], preset.position[1], preset.position[2]);
        targetLookAt.current.set(preset.target[0], preset.target[1], preset.target[2]);
      } else {
        // Default Overview
        targetPos.current.set(35, 60, 65);
        targetLookAt.current.set(5, 0, 5);
      }
    }
  }, [cameraMode, selectedBuilding]);

  useFrame((state, delta) => {
    const controls = controlsRef?.current;

    // Report azimuthal camera angle to compass
    if (controls && onUpdateCameraAngle) {
      const angle = controls.getAzimuthalAngle ? controls.getAzimuthalAngle() : 0;
      onUpdateCameraAngle(angle);
    }

    // 1. Smooth Transition Lerp
    if (isTransitioning.current) {
      camera.position.lerp(targetPos.current, 0.08);
      if (controls) {
        controls.target.lerp(targetLookAt.current, 0.08);
        controls.update();
      }

      if (
        camera.position.distanceTo(targetPos.current) < 0.25 &&
        (!controls || controls.target.distanceTo(targetLookAt.current) < 0.25)
      ) {
        isTransitioning.current = false;
      }
    }
    // 2. Drone Patrol Mode (Continuous calm architectural orbit around campus core)
    else if (isPatrolActive && !selectedBuilding && cameraMode !== "topdown") {
      patrolAngle.current += delta * 0.09;
      const radius = 68;
      const cx = 5;
      const cz = 5;
      const x = cx + Math.sin(patrolAngle.current) * radius;
      const z = cz + Math.cos(patrolAngle.current) * radius;
      const y = 52 + Math.sin(patrolAngle.current * 0.5) * 6;

      camera.position.set(x, y, z);
      if (controls) {
        controls.target.set(cx, 0, cz);
        controls.update();
      }
    }
  });

  return null;
}

export function CampusScene({
  densityMap = {},
  selectedBuilding,
  hoveredBuilding,
  onSelectBuilding,
  onHoverBuilding,
  onUnhoverBuilding,
  cameraMode = "overview",
  timeOfDay = "day",
  isPatrolActive = false,
  debugMode = false,
  onSnapTopDownNorth,
  controlsRef
}) {
  const [cameraAngle, setCameraAngle] = useState(0);

  // Time of Day Architectural Lighting - High Readability & Spatial Contrast
  const lighting = {
    day: {
      sunColor: "#FFFFFF",
      sunIntensity: 2.2,
      sunPos: [60, 85, 50],
      ambientIntensity: 1.15,
      hemiSky: "#E2E8F0",
      hemiGround: "#1E293B"
    },
    sunset: {
      sunColor: "#FDBA74",
      sunIntensity: 1.8,
      sunPos: [75, 45, -45],
      ambientIntensity: 0.85,
      hemiSky: "#FB923C",
      hemiGround: "#0F172A"
    },
    night: {
      sunColor: "#60A5FA",
      sunIntensity: 0.8,
      sunPos: [-35, 60, 25],
      ambientIntensity: 0.55,
      hemiSky: "#1E3A8A",
      hemiGround: "#020617"
    }
  }[timeOfDay] || {
    sunColor: "#FFFFFF",
    sunIntensity: 2.2,
    sunPos: [60, 85, 50],
    ambientIntensity: 1.15,
    hemiSky: "#E2E8F0",
    hemiGround: "#1E293B"
  };

  const handleResetNorth = () => {
    if (onSnapTopDownNorth) {
      onSnapTopDownNorth();
    } else if (controlsRef?.current) {
      // Reorient orbit angle
      controlsRef.current.reset();
    }
  };

  return (
    <div className="dt-scene-wrapper">
      {/* 1. Compass Rose Widget */}
      <CampusCompass
        azimuthAngle={cameraAngle}
        onResetNorth={handleResetNorth}
      />

      {/* 2. Three.js Canvas */}
      <Canvas
        shadows
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.35
        }}
        className="dt-canvas"
        onClick={() => onSelectBuilding(null)}
      >
        <PerspectiveCamera makeDefault position={[45, 80, 80]} fov={38} />

        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.07}
          maxPolarAngle={Math.PI / 2.05}
          minDistance={10}
          maxDistance={280}
          target={[5, 0, 5]}
        />

        <CameraController
          cameraMode={cameraMode}
          selectedBuilding={selectedBuilding}
          isPatrolActive={isPatrolActive}
          controlsRef={controlsRef}
          onUpdateCameraAngle={setCameraAngle}
        />

        {/* Pitch-Black Environment & Depth Fog */}
        <color attach="background" args={["#000000"]} />
        <fog attach="fog" args={["#000000", 90, 220]} />

        {/* Lighting Suite */}
        <ambientLight intensity={lighting.ambientIntensity} />
        <hemisphereLight
          skyColor={lighting.hemiSky}
          groundColor={lighting.hemiGround}
          intensity={0.65}
        />

        {/* Primary Key Sunlight */}
        <directionalLight
          position={lighting.sunPos}
          intensity={lighting.sunIntensity}
          color={lighting.sunColor}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-110}
          shadow-camera-right={110}
          shadow-camera-top={110}
          shadow-camera-bottom={-110}
          shadow-camera-near={10}
          shadow-camera-far={260}
          shadow-bias={-0.0004}
        />

        {/* Fill Light for clear building facade visibility */}
        <directionalLight
          position={[-60, 45, -60]}
          intensity={0.75}
          color="#F8FAFC"
        />

        {/* 3D Scene Elements */}
        <Suspense fallback={null}>
          <CampusGround debugMode={debugMode} />

          {CAMPUS_BUILDINGS.map((building) => {
            const densityInfo =
              densityMap[building.name] ||
              densityMap[building.code] ||
              densityMap[building.id] ||
              (building.aliases && building.aliases.find((a) => densityMap[a]));
            const density = densityInfo?.occupancyRate ?? densityInfo?.score ?? 58;

            return (
              <CampusBuilding
                key={building.id}
                building={building}
                density={density}
                isSelected={selectedBuilding?.id === building.id}
                isHovered={hoveredBuilding?.id === building.id}
                debugMode={debugMode}
                onSelect={onSelectBuilding}
                onHover={onHoverBuilding}
                onUnhover={onUnhoverBuilding}
              />
            );
          })}
        </Suspense>
      </Canvas>
    </div>
  );
}
