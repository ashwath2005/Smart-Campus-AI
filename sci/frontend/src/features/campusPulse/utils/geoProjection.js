import * as THREE from "three";

/**
 * SKCET Campus Geographic Coordinate Transformation Engine
 * Tangent-Plane Local Projection centered on SKCET (10.937800° N, 76.956000° E)
 * Preserves true geographic metric distances and North alignment
 */

export const ORIGIN_LAT = 10.937800;
export const ORIGIN_LON = 76.956000;
export const METERS_PER_UNIT = 4.0; // 1 Three.js unit = 4.0 meters
export const SCALE = 1.0 / METERS_PER_UNIT; // 0.25

const EARTH_RADIUS = 6378137.0; // WGS84 semi-major axis in meters
const ORIGIN_LAT_RAD = (ORIGIN_LAT * Math.PI) / 180.0;

/**
 * Convert WGS84 GPS (latitude, longitude) to local Three.js metric coordinates (x, z)
 * Orientation:
 *   +X = Due East
 *   -X = Due West
 *   -Z = Due North (Standard cartographic 3D)
 *   +Z = Due South
 */
export function geoToLocal(lat, lon) {
  const dLat = ((lat - ORIGIN_LAT) * Math.PI) / 180.0;
  const dLon = ((lon - ORIGIN_LON) * Math.PI) / 180.0;

  const northMeters = dLat * EARTH_RADIUS;
  const eastMeters = dLon * EARTH_RADIUS * Math.cos(ORIGIN_LAT_RAD);

  const x = eastMeters * SCALE;
  const z = -northMeters * SCALE;

  return [x, z];
}

/**
 * Inverse conversion: Three.js (x, z) to WGS84 GPS (latitude, longitude)
 */
export function localToGeo(x, z) {
  const eastMeters = x / SCALE;
  const northMeters = -z / SCALE;

  const dLat = northMeters / EARTH_RADIUS;
  const dLon = eastMeters / (EARTH_RADIUS * Math.cos(ORIGIN_LAT_RAD));

  const lat = ORIGIN_LAT + (dLat * 180.0) / Math.PI;
  const lon = ORIGIN_LON + (dLon * 180.0) / Math.PI;

  return [lat, lon];
}

/**
 * Calculate the 2D geometric centroid of a polygon defined by [lat, lon] coordinates
 */
export function calculatePolygonCentroid(latLngPoints) {
  if (!latLngPoints || latLngPoints.length === 0) return { lat: ORIGIN_LAT, lon: ORIGIN_LON, local: [0, 0] };

  // If closed loop with identical first and last point, exclude duplicate last point
  const pts = [...latLngPoints];
  if (pts.length > 2 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]) {
    pts.pop();
  }

  let sumLat = 0;
  let sumLon = 0;
  pts.forEach(([lat, lon]) => {
    sumLat += lat;
    sumLon += lon;
  });

  const avgLat = sumLat / pts.length;
  const avgLon = sumLon / pts.length;
  const local = geoToLocal(avgLat, avgLon);

  return {
    lat: avgLat,
    lon: avgLon,
    local
  };
}

/**
 * Calculate polygon area in square meters using Shoelace formula
 */
export function calculatePolygonAreaMeters(latLngPoints) {
  if (!latLngPoints || latLngPoints.length < 3) return 0;
  const pts = latLngPoints.map(([lat, lon]) => {
    const dLat = ((lat - ORIGIN_LAT) * Math.PI) / 180.0;
    const dLon = ((lon - ORIGIN_LON) * Math.PI) / 180.0;
    return [dLon * EARTH_RADIUS * Math.cos(ORIGIN_LAT_RAD), dLat * EARTH_RADIUS];
  });

  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    area += pts[i][0] * pts[j][1];
    area -= pts[j][0] * pts[i][1];
  }
  return Math.abs(area / 2.0);
}

/**
 * Convert [lat, lon] polygon vertices into a Three.js Shape centered at [0, 0]
 * Returns { shape, center, localPoints, boundingBox }
 */
export function polygonToThreeShape(latLngPoints) {
  if (!latLngPoints || latLngPoints.length < 3) return null;

  const centroid = calculatePolygonCentroid(latLngPoints);
  const [cx, cz] = centroid.local;

  const localPoints = latLngPoints.map(([lat, lon]) => {
    const [lx, lz] = geoToLocal(lat, lon);
    // Relative to centroid
    return [lx - cx, lz - cz];
  });

  // Create THREE.Shape
  const shape = new THREE.Shape();
  // Shape coordinates in X/Y plane for extrusion along Z, which we then orient in X/Z plane
  shape.moveTo(localPoints[0][0], -localPoints[0][1]);
  for (let i = 1; i < localPoints.length; i++) {
    shape.lineTo(localPoints[i][0], -localPoints[i][1]);
  }
  shape.closePath();

  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  localPoints.forEach(([px, pz]) => {
    if (px < minX) minX = px;
    if (px > maxX) maxX = px;
    if (pz < minZ) minZ = pz;
    if (pz > maxZ) maxZ = pz;
  });

  const width = (maxX - minX) * METERS_PER_UNIT;
  const depth = (maxZ - minZ) * METERS_PER_UNIT;

  return {
    shape,
    center: [cx, cz],
    lat: centroid.lat,
    lon: centroid.lon,
    localPoints,
    dimensionsMeters: [width, depth]
  };
}
