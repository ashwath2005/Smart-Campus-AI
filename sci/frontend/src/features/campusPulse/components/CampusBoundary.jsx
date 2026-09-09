import React, { useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { CAMPUS_BOUNDARY, CAMPUS_GATES_GEO } from "../data/skcetGeoData";
import { geoToLocal } from "../utils/geoProjection";

export function CampusBoundary({ debugMode = false }) {
  // Convert 44 WGS84 GPS boundary vertices to local Three.js coordinates
  const boundaryPoints = useMemo(() => {
    return CAMPUS_BOUNDARY.map(([lat, lon]) => {
      const [x, z] = geoToLocal(lat, lon);
      return new THREE.Vector3(x, 0.05, z);
    });
  }, []);

  // Create Three.js LineLoop geometry
  const boundaryGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry().setFromPoints(boundaryPoints);
    return geom;
  }, [boundaryPoints]);

  return (
    <group name="CampusBoundary">
      {/* 1. Real Campus Boundary Perimeter Line */}
      <lineLoop geometry={boundaryGeometry}>
        <lineBasicMaterial
          color={debugMode ? "#F21722" : "#222222"}
          linewidth={2}
          transparent
          opacity={debugMode ? 0.9 : 0.4}
        />
      </lineLoop>

      {/* 2. Perimeter Curb Footing Marker */}
      {debugMode && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <planeGeometry args={[200, 200]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.5} />
        </mesh>
      )}

      {/* 3. Verified Physical Campus Gates */}
      {CAMPUS_GATES_GEO.map((gate) => {
        const [gx, gz] = geoToLocal(gate.latitude, gate.longitude);

        return (
          <group key={gate.id} position={[gx, 0, gz]}>
            {/* Gate Archway Posts */}
            <mesh position={[-1.8, 1.8, 0]} castShadow>
              <boxGeometry args={[0.5, 3.6, 0.5]} />
              <meshStandardMaterial color="#3F3F46" roughness={0.7} />
            </mesh>
            <mesh position={[1.8, 1.8, 0]} castShadow>
              <boxGeometry args={[0.5, 3.6, 0.5]} />
              <meshStandardMaterial color="#3F3F46" roughness={0.7} />
            </mesh>
            {/* Gate Crossbeam with SKCET Emblem Plate */}
            <mesh position={[0, 3.7, 0]} castShadow>
              <boxGeometry args={[4.2, 0.4, 0.6]} />
              <meshStandardMaterial color="#27272A" roughness={0.5} />
            </mesh>
            <mesh position={[0, 4.1, 0]} castShadow>
              <boxGeometry args={[2.4, 0.35, 0.1]} />
              <meshStandardMaterial color="#F21722" roughness={0.4} />
            </mesh>

            {/* Security Guard Checkpoint Cabin */}
            <group position={[3.2, 0, 0]}>
              <mesh position={[0, 1.3, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.8, 2.6, 2.0]} />
                <meshStandardMaterial color="#1E293B" roughness={0.7} />
              </mesh>
              {/* Cabin Glass Window */}
              <mesh position={[-0.91, 1.4, 0]}>
                <planeGeometry args={[1.2, 0.8]} />
                <meshStandardMaterial color="#38BDF8" roughness={0.1} metalness={0.9} />
              </mesh>
              {/* Cabin Roof Overhang */}
              <mesh position={[0, 2.65, 0]}>
                <boxGeometry args={[2.2, 0.1, 2.4]} />
                <meshStandardMaterial color="#0F172A" roughness={0.5} />
              </mesh>
            </group>

            {/* Automated Boom Barrier Arm */}
            <mesh position={[-0.8, 0.85, 0.5]} rotation={[0, 0, Math.PI / 16]}>
              <boxGeometry args={[2.6, 0.08, 0.08]} />
              <meshStandardMaterial color="#DC2626" roughness={0.4} />
            </mesh>
            <mesh position={[-2.1, 0.5, 0.5]}>
              <cylinderGeometry args={[0.12, 0.14, 1.0, 8]} />
              <meshStandardMaterial color="#F59E0B" roughness={0.5} />
            </mesh>

            {/* Security CCTV Pole */}
            <group position={[-2.8, 0, 0]}>
              <mesh position={[0, 2.2, 0]}>
                <cylinderGeometry args={[0.05, 0.07, 4.4, 8]} />
                <meshStandardMaterial color="#64748B" metalness={0.8} />
              </mesh>
              <mesh position={[0.2, 4.3, 0]} rotation={[0.4, 0, 0]}>
                <boxGeometry args={[0.15, 0.15, 0.35]} />
                <meshStandardMaterial color="#0F172A" roughness={0.3} />
              </mesh>
            </group>

            {/* Entry Threshold Apron */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
              <planeGeometry args={[7.0, 4.0]} />
              <meshStandardMaterial color="#141417" roughness={0.8} />
            </mesh>

            {/* Gate Label Badge */}
            <Html position={[0, 4.8, 0]} center zIndexRange={[50, 0]}>
              <div
                className="dt-gate-badge"
                title={`${gate.name} — ${gate.description}`}
                style={{
                  background: "rgba(10, 10, 10, 0.95)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "6px",
                  padding: "2px 8px",
                  color: "#E4E4E7",
                  fontSize: "0.68rem",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px"
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#F21722" }} />
                <span>{gate.code}</span>
                <span style={{ color: "#71717A" }}>• {gate.name.split("(")[0]}</span>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
