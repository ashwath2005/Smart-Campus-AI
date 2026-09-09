import React, { useMemo } from "react";
import * as THREE from "three";
import { CAMPUS_SPORTS_GEO } from "../data/skcetGeoData";
import { geoToLocal, polygonToThreeShape } from "../utils/geoProjection";
import { CampusBoundary } from "./CampusBoundary";
import { CampusRoadNetwork } from "./CampusRoadNetwork";

export function CampusGround({ debugMode = false }) {
  // Stadium footprint projected geometry
  const stadiumData = useMemo(() => {
    return polygonToThreeShape(CAMPUS_SPORTS_GEO.footprint);
  }, []);

  const [stadiumX, stadiumZ] = stadiumData
    ? stadiumData.center
    : geoToLocal(CAMPUS_SPORTS_GEO.latitude, CAMPUS_SPORTS_GEO.longitude);

  // Krishna Square central forum coordinates
  const [ksX, ksZ] = geoToLocal(10.937628, 76.955338);

  return (
    <group name="CampusGround">
      {/* 1. Main Pitch-Black Campus Foundation Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[260, 260]} />
        <meshStandardMaterial
          color="#000000"
          roughness={0.96}
          metalness={0.04}
        />
      </mesh>

      {/* 2. Precision Architectural Ground Grid */}
      <gridHelper
        args={[240, 60, "#18181B", "#080808"]}
        position={[0, 0.002, 0]}
      />

      {/* 3. Real Campus Perimeter Boundary (44 vertices) */}
      <CampusBoundary debugMode={debugMode} />

      {/* 4. Real Road & Pathway Network (119 vector segments) */}
      <CampusRoadNetwork debugMode={debugMode} />

      {/* 5. SRI KRISHNA STADIUM & ATHLETICS COMPLEX (Surveyed 400m Track, Grandstand, Floodlights, Courts) */}
      <group position={[stadiumX, 0, stadiumZ]}>
        {/* Stadium Apron Base Foundation */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} receiveShadow>
          <planeGeometry args={[44, 70]} />
          <meshStandardMaterial color="#0A0A0C" roughness={0.92} />
        </mesh>

        {/* 400m Synthetic 8-Lane Running Track (Tartan Polyurethane Red) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
          <planeGeometry args={[36, 58]} />
          <meshStandardMaterial color="#6B1419" roughness={0.78} metalness={0.08} />
        </mesh>

        {/* Outer and Inner Track Lane Lines */}
        {[16, 15, 14, 13, 12].map((laneR, idx) => (
          <mesh key={idx} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.022, 0]}>
            <ringGeometry args={[laneR - 0.04, laneR + 0.04, 48]} />
            <meshBasicMaterial color="#E4E4E7" transparent opacity={0.35} />
          </mesh>
        ))}

        {/* Inner Natural Athletic Turf (Football & Track and Field Ground) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]} receiveShadow>
          <planeGeometry args={[22, 42]} />
          <meshStandardMaterial color="#08381E" roughness={0.9} />
        </mesh>

        {/* White Football Pitch Boundary Line Markings */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.028, 0]}>
          <ringGeometry args={[10.8, 11.0, 32]} />
          <meshBasicMaterial color="#D4D4D8" transparent opacity={0.7} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.028, 0]}>
          <ringGeometry args={[3.2, 3.32, 28]} />
          <meshBasicMaterial color="#D4D4D8" transparent opacity={0.7} />
        </mesh>

        {/* Covered Grandstand (1,500 Spectator Seating Gallery) on West Boundary */}
        <group position={[-17.5, 0, 0]}>
          {/* Stepped Seating Gallery */}
          <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
            <boxGeometry args={[4.2, 3.6, 42]} />
            <meshStandardMaterial color="#1C1C20" roughness={0.75} />
          </mesh>
          {/* Cantilever Grandstand Roof Canopy */}
          <mesh position={[1.2, 5.8, 0]} rotation={[0, 0, -Math.PI / 14]} castShadow>
            <boxGeometry args={[6.2, 0.35, 44]} />
            <meshStandardMaterial color="#2A2A30" roughness={0.4} metalness={0.5} />
          </mesh>
          {/* Structural Support Trusses */}
          {[-18, -9, 0, 9, 18].map((tz, i) => (
            <mesh key={i} position={[-1.8, 2.9, tz]}>
              <boxGeometry args={[0.22, 5.8, 0.22]} />
              <meshStandardMaterial color="#52525B" metalness={0.8} roughness={0.3} />
            </mesh>
          ))}
        </group>

        {/* 4 Stadium High-Mast Floodlight Towers */}
        {[
          [-19, -29],
          [ 19, -29],
          [-19,  29],
          [ 19,  29]
        ].map(([fx, fz], idx) => (
          <group key={idx} position={[fx, 0, fz]}>
            <mesh position={[0, 8, 0]}>
              <cylinderGeometry args={[0.25, 0.45, 16, 6]} />
              <meshStandardMaterial color="#71717A" metalness={0.85} roughness={0.25} />
            </mesh>
            <mesh position={[0, 16.2, 0]} rotation={[0.35, 0, 0]}>
              <boxGeometry args={[2.2, 1.2, 0.4]} />
              <meshStandardMaterial
                color="#18181B"
                emissive="#FEF08A"
                emissiveIntensity={0.6}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* 5B. BASKETBALL & VOLLEYBALL COURTS & CRICKET NETS (Surveyed Sports Enclave) */}
      <group position={[stadiumX + 18, 0, stadiumZ - 6]}>
        {/* Basketball Court 1 */}
        <group position={[0, 0, -8]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
            <planeGeometry args={[7, 4.2]} />
            <meshStandardMaterial color="#1E3A8A" roughness={0.65} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.022, 0]}>
            <planeGeometry args={[5.6, 3.2]} />
            <meshStandardMaterial color="#991B1B" roughness={0.7} />
          </mesh>
          {[-3.3, 3.3].map((hx, i) => (
            <group key={i} position={[hx, 0, 0]}>
              <mesh position={[0, 0.9, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 1.8, 8]} />
                <meshStandardMaterial color="#475569" metalness={0.7} />
              </mesh>
              <mesh position={[hx > 0 ? -0.15 : 0.15, 1.75, 0]}>
                <boxGeometry args={[0.04, 0.45, 0.65]} />
                <meshStandardMaterial color="#F8FAFC" roughness={0.3} />
              </mesh>
            </group>
          ))}
        </group>

        {/* Basketball Court 2 */}
        <group position={[0, 0, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
            <planeGeometry args={[7, 4.2]} />
            <meshStandardMaterial color="#1E3A8A" roughness={0.65} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.022, 0]}>
            <planeGeometry args={[5.6, 3.2]} />
            <meshStandardMaterial color="#991B1B" roughness={0.7} />
          </mesh>
          {[-3.3, 3.3].map((hx, i) => (
            <group key={i} position={[hx, 0, 0]}>
              <mesh position={[0, 0.9, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 1.8, 8]} />
                <meshStandardMaterial color="#475569" metalness={0.7} />
              </mesh>
              <mesh position={[hx > 0 ? -0.15 : 0.15, 1.75, 0]}>
                <boxGeometry args={[0.04, 0.45, 0.65]} />
                <meshStandardMaterial color="#F8FAFC" roughness={0.3} />
              </mesh>
            </group>
          ))}
        </group>

        {/* Volleyball Courts */}
        <group position={[0, 0, 8]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
            <planeGeometry args={[5.2, 3]} />
            <meshStandardMaterial color="#78350F" roughness={0.95} />
          </mesh>
          <mesh position={[0, 0.45, 0]}>
            <boxGeometry args={[0.04, 0.9, 3.2]} />
            <meshStandardMaterial color="#E2E8F0" transparent opacity={0.65} />
          </mesh>
        </group>

        {/* Cricket Practice Nets */}
        <group position={[0, 0, 16]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
            <planeGeometry args={[6, 2.5]} />
            <meshStandardMaterial color="#065F46" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.8, 0]}>
            <boxGeometry args={[6.1, 1.6, 2.6]} />
            <meshStandardMaterial color="#18181B" wireframe transparent opacity={0.4} />
          </mesh>
        </group>
      </group>

      {/* 6. KRISHNA SQUARE CENTRAL FORUM PLAZA */}
      <group position={[ksX, 0, ksZ]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]} receiveShadow>
          <planeGeometry args={[22, 22]} />
          <meshStandardMaterial color="#141417" roughness={0.85} />
        </mesh>
        {/* Tiered Gathering Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.022, 0]}>
          <ringGeometry args={[5.5, 6.2, 36]} />
          <meshBasicMaterial color="#3F3F46" transparent opacity={0.6} />
        </mesh>
      </group>

      {/* 7. MANICURED CAMPUS OPEN SPACES & LAWNS */}
      {/* Central Admin Quad Lawn */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4, 0.016, 2]}>
        <planeGeometry args={[18, 14]} />
        <meshStandardMaterial color="#082816" roughness={0.92} />
      </mesh>

      {/* Library Forecourt Greenery */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2, 0.016, -14]}>
        <circleGeometry args={[8.5, 32]} />
        <meshStandardMaterial color="#082816" roughness={0.92} />
      </mesh>

      {/* 8. SURVEYED ARTERIAL CANOPY TREES (Gulmohar, Rain Trees along Academic Roads) */}
      {[
        [-18, 12], [-14, 8], [-10, 4], [-6, 0],
        [6, 4], [14, 4], [22, 4], [30, 4],
        [16, -12], [16, -26], [16, -40],
        [-12, -8], [-12, -22], [-12, -36],
        [-2, 24], [6, 24], [14, 28],
        [32, -4], [32, -20], [32, -36],
        [-35, 10], [-45, 15], [-55, 20]
      ].map(([tx, tz], idx) => (
        <group key={idx} position={[tx, 0, tz]}>
          {/* Trunk */}
          <mesh position={[0, 0.9, 0]}>
            <cylinderGeometry args={[0.16, 0.24, 1.8, 8]} />
            <meshStandardMaterial color="#292524" roughness={0.9} />
          </mesh>
          {/* Lush Canopy Dome */}
          <mesh position={[0, 2.3, 0]} castShadow>
            <sphereGeometry args={[1.25, 12, 10]} />
            <meshStandardMaterial color="#0A3E20" roughness={0.85} />
          </mesh>
          {/* Secondary Canopy Cluster */}
          <mesh position={[0.4, 2.7, 0.3]} castShadow>
            <sphereGeometry args={[0.9, 8, 8]} />
            <meshStandardMaterial color="#064E26" roughness={0.88} />
          </mesh>
        </group>
      ))}

      {/* 9. ROYAL AVENUE PALMS (Along Main Entrance Boulevard) */}
      {[
        [-65, 16], [-58, 14], [-51, 12], [-44, 10], [-37, 8],
        [-65, 20], [-58, 18], [-51, 16], [-44, 14], [-37, 12]
      ].map(([px, pz], idx) => (
        <group key={`palm-${idx}`} position={[px, 0, pz]}>
          {/* Slender Palm Trunk */}
          <mesh position={[0, 1.6, 0]}>
            <cylinderGeometry args={[0.08, 0.14, 3.2, 6]} />
            <meshStandardMaterial color="#44403C" roughness={0.9} />
          </mesh>
          {/* Palm Frond Fan */}
          <mesh position={[0, 3.3, 0]} rotation={[0, idx * 0.5, 0]} castShadow>
            <coneGeometry args={[1.4, 0.8, 7]} />
            <meshStandardMaterial color="#15803D" roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* 10. CAMPUS STREET LAMPS & PATHWAY LIGHTING */}
      {[
        [-16, 6], [-8, 2], [0, -2], [8, -6],
        [16, -18], [16, -32], [16, -46],
        [-14, -14], [-14, -28], [-14, -42],
        [-30, 12], [-45, 15]
      ].map(([lx, lz], idx) => (
        <group key={`lamp-${idx}`} position={[lx, 0, lz]}>
          <mesh position={[0, 1.4, 0]}>
            <cylinderGeometry args={[0.04, 0.06, 2.8, 6]} />
            <meshStandardMaterial color="#52525B" metalness={0.8} />
          </mesh>
          <mesh position={[0.2, 2.8, 0]}>
            <boxGeometry args={[0.4, 0.1, 0.15]} />
            <meshStandardMaterial color="#27272A" />
          </mesh>
          <mesh position={[0.3, 2.72, 0]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#FEF08A" emissive="#FEF08A" emissiveIntensity={0.8} />
          </mesh>
        </group>
      ))}

      {/* 11. CAMPUS CONCRETE BENCHES & PEDESTRIAN AMENITIES */}
      {[
        [2, 0.2, 6], [8, 0.2, 6], [-16, 0.2, 2], [-16, 0.2, -4],
        [0, 0.2, -18], [4, 0.2, -18]
      ].map(([bx, by, bz], idx) => (
        <group key={`bench-${idx}`} position={[bx, 0, bz]}>
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[1.4, 0.12, 0.45]} />
            <meshStandardMaterial color="#71717A" roughness={0.7} />
          </mesh>
          {[-0.5, 0.5].map((lx, li) => (
            <mesh key={li} position={[lx, 0.1, 0]}>
              <boxGeometry args={[0.12, 0.2, 0.4]} />
              <meshStandardMaterial color="#3F3F46" roughness={0.8} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
