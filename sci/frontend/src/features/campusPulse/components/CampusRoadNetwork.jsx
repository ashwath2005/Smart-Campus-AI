import React, { useMemo } from "react";
import * as THREE from "three";
import { CAMPUS_ROADS_GEO } from "../data/skcetGeoData";
import { geoToLocal } from "../utils/geoProjection";

export function CampusRoadNetwork({ debugMode = false }) {
  // Generate unified merged ribbon buffer geometry for all 119 real road segments
  const { asphaltGeometry, centerlineGeometry } = useMemo(() => {
    const vertices = [];
    const centerLines = [];

    CAMPUS_ROADS_GEO.forEach((road) => {
      const pts = road.points;
      if (!pts || pts.length < 2) return;

      const halfWidth = Math.max(0.4, (road.widthMeters * 0.25) / 2);

      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, z0] = geoToLocal(pts[i][0], pts[i][1]);
        const [x1, z1] = geoToLocal(pts[i + 1][0], pts[i + 1][1]);

        centerLines.push(new THREE.Vector3(x0, 0.04, z0));
        centerLines.push(new THREE.Vector3(x1, 0.04, z1));

        const dx = x1 - x0;
        const dz = z1 - z0;
        const len = Math.sqrt(dx * dx + dz * dz);
        if (len < 0.01) continue;

        // Normal vector perpendicular to segment
        const nx = (-dz / len) * halfWidth;
        const nz = (dx / len) * halfWidth;
        const yElev = 0.02;

        // Quad corners
        const p0x = x0 - nx, p0z = z0 - nz;
        const p1x = x0 + nx, p1z = z0 + nz;
        const p2x = x1 - nx, p2z = z1 - nz;
        const p3x = x1 + nx, p3z = z1 + nz;

        // Triangle 1: p0 -> p1 -> p2
        vertices.push(p0x, yElev, p0z);
        vertices.push(p1x, yElev, p1z);
        vertices.push(p2x, yElev, p2z);

        // Triangle 2: p1 -> p3 -> p2
        vertices.push(p1x, yElev, p1z);
        vertices.push(p3x, yElev, p3z);
        vertices.push(p2x, yElev, p2z);
      }
    });

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geom.computeVertexNormals();

    const lineGeom = new THREE.BufferGeometry().setFromPoints(centerLines);

    return { asphaltGeometry: geom, centerlineGeometry: lineGeom };
  }, []);

  return (
    <group name="CampusRoadNetwork">
      {/* Real Asphalt Pavement Mesh */}
      <mesh geometry={asphaltGeometry} receiveShadow>
        <meshStandardMaterial
          color="#121215"
          roughness={0.92}
          metalness={0.08}
        />
      </mesh>

      {/* Debug Mode Centerline Vectors */}
      {debugMode && (
        <lineSegments geometry={centerlineGeometry}>
          <lineBasicMaterial color="#52525B" transparent opacity={0.65} />
        </lineSegments>
      )}
    </group>
  );
}
