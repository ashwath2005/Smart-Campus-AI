/**
 * Campus 3D Coordinate Mapping & Building Metadata
 * Mathematically derived from georeferenced SKCET ground truth
 */
import { CAMPUS_BUILDINGS_GEO, CAMPUS_BOUNDARY, CAMPUS_ROADS_GEO, CAMPUS_SPORTS_GEO, CAMPUS_GATES_GEO } from "../data/skcetGeoData";
import { geoToLocal, polygonToThreeShape, calculatePolygonCentroid } from "./geoProjection";

export { CAMPUS_BOUNDARY, CAMPUS_ROADS_GEO, CAMPUS_SPORTS_GEO, CAMPUS_GATES_GEO };

// Define key major landmarks for collision-free progressive disclosure
const MAJOR_LANDMARK_CODES = new Set(["VLC", "ADMIN", "C1-C2", "SKH", "SKS"]);

// Build real Three.js structures with geometric shapes from footprint polygons
export const CAMPUS_BUILDINGS = CAMPUS_BUILDINGS_GEO.map((bldg) => {
  const shapeData = polygonToThreeShape(bldg.footprint);
  const [cx, cz] = shapeData ? shapeData.center : geoToLocal(bldg.latitude, bldg.longitude);
  const width = shapeData ? shapeData.dimensionsMeters[0] * 0.25 : 12;
  const depth = shapeData ? shapeData.dimensionsMeters[1] * 0.25 : 12;
  const height = (bldg.floors || 3) * 2.2;
  const isMajorLandmark = MAJOR_LANDMARK_CODES.has(bldg.code) || bldg.isMajorLandmark || false;

  return {
    ...bldg,
    isMajorLandmark,
    position: [cx, 0, cz],
    dimensions: [Math.max(6, width), height, Math.max(6, depth)],
    shape: shapeData?.shape || null,
    localPoints: shapeData?.localPoints || []
  };
});

// Camera Presets aligned to true georeferenced landmarks
export const CAMERA_PRESETS = [
  {
    id: "overview",
    name: "Campus Overview",
    description: "Isometric perspective of the complete SKCET campus",
    position: [40, 68, 72],
    target: [8, 0, 10]
  },
  {
    id: "library-admin",
    name: "Vankatram Library & Admin",
    description: "Central governance and iconic digital library rotunda",
    position: [22, 38, 26],
    target: [5, 0, -10]
  },
  {
    id: "academic-quad",
    name: "C1-C2 Academic Quad",
    description: "C1-C2 quadrangle, EEE, ECE, Mech and Mechatronics blocks",
    position: [38, 42, 48],
    target: [8, 0, 24]
  },
  {
    id: "stadium",
    name: "Sri Krishna Stadium",
    description: "400m synthetic athletic track & sports arena",
    position: [82, 46, 38],
    target: [42, 0, 18]
  },
  {
    id: "krishna-square",
    name: "Krishna Square Plaza",
    description: "Central quadrangle forum and western academic avenues",
    position: [8, 32, 28],
    target: [-12, 0, 12]
  }
];

/**
 * Resolver to map any legacy query or alias to the verified SKCET building
 */
export function resolveBuilding(query) {
  if (!query) return null;
  const q = String(query).trim().toLowerCase();
  return (
    CAMPUS_BUILDINGS.find(
      (b) =>
        b.id.toLowerCase() === q ||
        b.name.toLowerCase() === q ||
        b.code.toLowerCase() === q ||
        (b.aliases && b.aliases.some((alias) => alias.toLowerCase() === q))
    ) || null
  );
}

export const getDensityColor = (densityPct) => {
  if (densityPct >= 75) {
    return {
      hex: "#EF4444",
      emissive: "#DC2626",
      status: "High Activity",
      badge: "High Density"
    };
  }
  if (densityPct >= 45) {
    return {
      hex: "#F59E0B",
      emissive: "#D97706",
      status: "Moderate Activity",
      badge: "Moderate"
    };
  }
  return {
    hex: "#10B981",
    emissive: "#059669",
    status: "Optimal Flow",
    badge: "Normal"
  };
};
