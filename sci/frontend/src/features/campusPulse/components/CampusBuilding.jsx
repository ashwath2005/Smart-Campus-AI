import React, { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { getDensityColor } from "../utils/campusCoordinates";

export function CampusBuilding({
  building,
  density = 65,
  isSelected,
  isHovered,
  debugMode = false,
  onSelect,
  onHover,
  onUnhover
}) {
  const meshGroupRef = useRef();
  const [localHover, setLocalHover] = useState(false);

  const activeHover = isHovered || localHover;
  const [width, height, depth] = building.dimensions;
  const [cx, , cz] = building.position;

  const colorMeta = useMemo(() => getDensityColor(density), [density]);

  // Subtle architectural hover elevation
  useFrame(() => {
    if (!meshGroupRef.current) return;
    const targetY = isSelected ? 0.35 : activeHover ? 0.18 : 0;
    meshGroupRef.current.position.y = THREE.MathUtils.lerp(
      meshGroupRef.current.position.y,
      targetY,
      0.14
    );
  });

  const floors = Math.max(2, building.floors || 3);
  const archetype = building.archetype || "academic";

  // Outline geometry for debug or selection highlighting
  const outlineGeometry = useMemo(() => {
    if (!building.localPoints || building.localPoints.length < 3) return null;
    const pts = building.localPoints.map(([lx, lz]) => new THREE.Vector3(lx, 0.05, lz));
    pts.push(pts[0].clone()); // Close loop
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [building.localPoints]);

  return (
    <group position={[cx, 0, cz]}>
      {/* 1. Footprint Ground Boundary Line */}
      {outlineGeometry && (
        <lineLoop geometry={outlineGeometry}>
          <lineBasicMaterial
            color={isSelected ? "#F21722" : activeHover ? "#EF4444" : debugMode ? "#404040" : "#242424"}
            linewidth={debugMode ? 2 : 1}
            transparent
            opacity={isSelected ? 0.95 : activeHover ? 0.8 : debugMode ? 0.75 : 0.3}
          />
        </lineLoop>
      )}

      {/* 2. Main Extruded Physical Building */}
      <group
        ref={meshGroupRef}
        position={[0, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(building);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setLocalHover(true);
          onHover(building);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setLocalHover(false);
          onUnhover();
          document.body.style.cursor = "auto";
        }}
      >
        {building.shape ? (
          /* REAL POLYGONAL EXTRUSION FROM SURVEYED WGS84 GPS FOOTPRINT */
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            castShadow
            receiveShadow
          >
            <extrudeGeometry
              args={[
                building.shape,
                {
                  depth: height,
                  bevelEnabled: true,
                  bevelSegments: 1,
                  steps: 1,
                  bevelSize: 0.1,
                  bevelThickness: 0.1
                }
              ]}
            />
            <meshStandardMaterial
              color={
                isSelected
                  ? "#2A1417"
                  : activeHover
                  ? "#38383E"
                  : "#24242A"
              }
              roughness={0.55}
              metalness={0.28}
            />
          </mesh>
        ) : (
          /* Fallback bounding box if polygon lacks vertices */
          <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial
              color={isSelected ? "#2A1417" : activeHover ? "#38383E" : "#24242A"}
              roughness={0.55}
              metalness={0.28}
            />
          </mesh>
        )}

        {/* Multi-tier Floor Window Bands along the polygon height */}
        {Array.from({ length: floors }).map((_, i) => {
          const floorY = (height / floors) * (i + 0.5);
          if (!building.localPoints || building.localPoints.length < 3) return null;

          const ringPoints = building.localPoints.map(([lx, lz]) => new THREE.Vector3(lx, floorY, lz));
          ringPoints.push(ringPoints[0].clone());
          const geom = new THREE.BufferGeometry().setFromPoints(ringPoints);

          return (
            <lineLoop key={i} geometry={geom}>
              <lineBasicMaterial
                color="#8E9196"
                transparent
                opacity={0.45}
              />
            </lineLoop>
          );
        })}

        {/* Distinct Architectural Features per Archetype */}
        {archetype === "library" && (
          /* Central Glass Skylight Dome & Stepped Rotunda for Vankatram Library */
          <group position={[0, height, 0]}>
            <mesh position={[0, 0.4, 0]} castShadow>
              <sphereGeometry args={[Math.min(width, depth) * 0.28, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial
                color="#0A0A0A"
                emissive="#38BDF8"
                emissiveIntensity={0.25}
                roughness={0.15}
                metalness={0.85}
              />
            </mesh>
            {/* Library Rooftop Parapet Ring */}
            <mesh position={[0, 0.15, 0]}>
              <cylinderGeometry args={[Math.min(width, depth) * 0.32, Math.min(width, depth) * 0.34, 0.3, 24]} />
              <meshStandardMaterial color="#27272A" roughness={0.6} />
            </mesh>
          </group>
        )}

        {archetype === "admin" && (
          /* Central Governance Portico Pediment & Entrance Columns */
          <group position={[0, height, 0]}>
            <mesh position={[0, 0.35, 0]}>
              <cylinderGeometry args={[width * 0.18, width * 0.22, 0.6, 4]} />
              <meshStandardMaterial color="#3F3F46" roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.7, 0]}>
              <boxGeometry args={[width * 0.25, 0.15, depth * 0.25]} />
              <meshStandardMaterial color="#F21722" roughness={0.4} />
            </mesh>
          </group>
        )}

        {archetype === "academic-quad" && (
          /* Quad Courtyard Rooftop Lift Machine Rooms & Stair Cores */
          <group position={[0, height, 0]}>
            {[-width * 0.25, width * 0.25].map((sx, si) => (
              <mesh key={si} position={[sx, 0.5, 0]} castShadow>
                <boxGeometry args={[width * 0.15, 1.0, depth * 0.2]} />
                <meshStandardMaterial color="#27272A" roughness={0.7} />
              </mesh>
            ))}
          </group>
        )}

        {archetype === "auditorium" && (
          /* Sloped Acoustics Fly-Tower on Sri Krishna Hall */
          <mesh position={[0, height + 0.6, 0]} castShadow>
            <boxGeometry args={[width * 0.45, 1.2, depth * 0.45]} />
            <meshStandardMaterial color="#18181B" roughness={0.8} />
          </mesh>
        )}

        {/* Rooftop Solar Panels & Water Utilities for Multi-floor Blocks */}
        {floors >= 3 && archetype !== "auditorium" && (
          <group position={[0, height, 0]}>
            {/* Water Tank */}
            <mesh position={[width * 0.2, 0.4, depth * 0.2]}>
              <cylinderGeometry args={[0.5, 0.5, 0.8, 12]} />
              <meshStandardMaterial color="#0284C7" roughness={0.5} />
            </mesh>
            {/* Solar Array Incline */}
            <mesh position={[-width * 0.15, 0.25, -depth * 0.15]} rotation={[-Math.PI / 8, 0, 0]}>
              <boxGeometry args={[Math.min(width * 0.35, 4), 0.08, Math.min(depth * 0.35, 3)]} />
              <meshStandardMaterial color="#0F172A" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        )}

        {/* Building Ground Entrance Canopy & Accessible Paving Steps */}
        <group position={[0, 0, depth * 0.45]}>
          <mesh position={[0, 0.1, 0.4]}>
            <boxGeometry args={[Math.min(width * 0.35, 3.5), 0.2, 0.8]} />
            <meshStandardMaterial color="#3F3F46" roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.4, 0.4]}>
            <boxGeometry args={[Math.min(width * 0.4, 4.0), 0.1, 1.2]} />
            <meshStandardMaterial color="#18181B" roughness={0.4} />
          </mesh>
        </group>

        {/* 3. Progressive Disclosure Institutional Label Badge */}
        {/* Only rendered when hovered, selected, or if the building is a primary major landmark */}
        {(isSelected || activeHover || building.isMajorLandmark || debugMode) && (
          <Html
            position={[0, height + 1.2, 0]}
            center
            zIndexRange={[100, 0]}
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
                onSelect(building);
              }}
              className={`dt-3d-badge ${isSelected ? "selected" : ""} ${
                activeHover ? "hovered" : ""
              } ${debugMode ? "debug-mode" : ""}`}
              title={`${building.name} (${building.code}) — ${building.department}`}
            >
              <span
                className="dt-status-dot"
                style={{ backgroundColor: colorMeta.hex }}
              />
              <span className="dt-badge-name">{building.name}</span>
              {/* Only show percentage when hovered or selected, never permanently across all buildings */}
              {(isSelected || activeHover) && (
                <span className="dt-badge-density">{density}%</span>
              )}
              {debugMode && (
                <span style={{ fontSize: "0.6rem", color: "#38BDF8", marginLeft: 4 }}>
                  [{building.footprint?.length || 0}v]
                </span>
              )}
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}
