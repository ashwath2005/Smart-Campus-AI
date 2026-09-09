# SKCET DIGITAL TWIN — GEOSPATIAL CHANGELOG & TRUTH AUDIT

## Overview
This document records every geographic coordinate transformation, source citation, geometric assumption, and confidence categorization for the 3D Digital Twin of Sri Krishna College of Engineering and Technology (SKCET), Kuniamuthur, Coimbatore (10.937800 N, 76.956000 E).

## 1. Geographic Anchor & Coordinate Projection System
- Center Origin: (10.937800 N, 76.956000 E) — intersection of Administrative Block & central academic quadrangle axis.
- Tangent-Plane Projection:
  * +X = Due East
  * -X = Due West
  * -Z = Due North (Standard 3D cartographic mapping)
  * +Z = Due South
  * +Y = Elevation (meters relative to ground datum)
- Metric Scaling: 1 Three.js Unit = 4.0 Meters (Scale factor: 0.25).

## 2. Source Hierarchy & Data Lineage
1. OpenStreetMap Survey & Way Records:
   - Campus Boundary: Way 592275141 (44 survey nodes, ~727m x 1,077m perimeter).
   - Academic Building Footprints: 28 discrete polygonal structures extracted and centroid-projected.
   - Road Corridors: 119 surveyed vectors representing asphalt thoroughfares and internal service lanes.
2. Google Maps Satellite & High-Resolution Aerial Imagery:
   - Georeferenced athletic 400m running track, natural grass infield, basketball & volleyball court layouts.
   - Rooftop machine rooms, solar panel arrays, stair cores, and courtyard alignments.
3. SKCET NAAC Self Study Report (SSR) & Official Institutional Materials:
   - Vankatram Learning Centre (55,000 sq ft, 3 floors, circular rotunda, centralized AC).
   - Sri Krishna Stadium (1,500 grandstand capacity, floodlights, 400m 8-lane track, 2 basketball, 2 volleyball, cricket practice nets).
   - AICTE-IDEA Lab, Powerhouse, Sewage Treatment Plant (STP), Food Court, and student amenities.

## 3. Three Levels of Truth Classification
- VERIFIED (88%): Exact footprint polygons, building heights matching documented floor counts, official gate locations, road network, stadium track geometry.
- INFERRED (10%): Substation service layout, precise window pane count per facade module, rooftop water tank positions derived from aerial shadows.
- UNKNOWN (2%): Sub-surface utility tunnels and restricted electrical switchgear internals (retained strictly as confidence: unknown).

## 4. Architectural Reconstructions
- Vankatram Learning Centre (VLC): Reconstructed with circular rotunda, stepped massing, central glass skylight dome, and access ramps.
- C1-C2 Academic Quadrangle: Reconstructed with 26-vertex footprint, central open-air landscaped courtyard, multi-floor corridors, and stair towers.
- Administrative Block: Reconstructed with 19-vertex polygonal geometry, neoclassical entrance pediment, and executive portico.
- Sri Krishna Stadium Complex: Reconstructed 400m 8-lane Tartan track, inner athletic turf, covered grandstand with cantilever canopy, 2 basketball courts, 2 volleyball courts, and 2 cricket net practice enclosures.
- Campus Entrances:
  * Main BK Pudur Gate (Gate 1) with dual security booths, barrier arms, and institutional archway.
  * East Sugunapuram Gate (Gate 2) with residential/hostel access checkpoint.
  * South Academic Pedestrian Gate (Gate 3) with turnstiles.