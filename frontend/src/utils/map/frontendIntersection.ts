// import * as turf from '@turf/turf';
// import type { Feature, Polygon, MultiPolygon } from 'geojson';
// import type { GeoJsonFeatureCollection, GeoJsonFeature, GeoJsonProperties } from '../types/geojson';

// interface LayerConfig {
//   id: string;
//   name: string;
//   layer?: google.maps.Data;
//   enabled: boolean;
// }

// // Extended interfaces for Google Maps geometry types to include getArray method
// interface GoogleMapsPolygonGeometry extends google.maps.Data.Geometry {
//   getArray(): GoogleMapsLinearRing[];
// }

// interface GoogleMapsMultiPolygonGeometry extends google.maps.Data.Geometry {
//   getArray(): GoogleMapsPolygonGeometry[];
// }

// interface GoogleMapsLinearRing {
//   getArray(): google.maps.LatLng[];
// }

// /**
//  * Process Google Maps geometry into GeoJSON format - directly from your working code
//  */
// function processShape(geometry: google.maps.Data.Geometry) {
//   console.log("in process shape2");
//   console.log("geometry: ", geometry);
//   console.log("type: ", geometry.getType());
  
//   if (geometry.getType() === 'Polygon') {
//     const polygonGeometry = geometry as GoogleMapsPolygonGeometry;
//     console.log("polygonGeometry.getArray():", polygonGeometry.getArray());
//     console.log("polygonGeometry.getArray()[0]:", polygonGeometry.getArray()[0]);
//     console.log("polygonGeometry.getArray()[0].getArray():", polygonGeometry.getArray()[0].getArray());
    
//     // Assuming geometry1[0] represents the exterior ring
//     const ring = polygonGeometry.getArray()[0].getArray().map((coord: google.maps.LatLng) => [coord.lng(), coord.lat()]); // Correctly map to [lng, lat]
    
//     // ensure first and last points are the same to close the ring
//     if (ring.length > 0 && (ring[0][0] != ring[ring.length - 1][0] || ring[0][1] != ring[ring.length - 1][1])) {
//       ring.push(ring[0]); // add the first point to the end to close the ring
//     }
    
//     const result = {
//       type: 'Polygon',
//       coordinates: [ring]
//     };
//     return result;
//   } else if (geometry.getType() === 'MultiPolygon') {
//     const multiPolygonGeometry = geometry as GoogleMapsMultiPolygonGeometry;
//     const polygons: number[][][][] = [];
//     console.log("hi", multiPolygonGeometry.getArray()[0]);
//     console.log("hi2", multiPolygonGeometry.getArray()[0].getArray());
//     console.log("hi3", multiPolygonGeometry.getArray()[0].getArray()[0].getArray());
    
//     multiPolygonGeometry.getArray().forEach((polygon: GoogleMapsPolygonGeometry) => {
//       console.log("polygon: ", polygon);
//       const ring = polygon.getArray()[0].getArray().map((coord: google.maps.LatLng) => [coord.lng(), coord.lat()]); // Correctly map to [lng, lat]
//       // ensure first and last points are the same to close the ring
//       if (ring.length > 0 && (ring[0][0] != ring[ring.length - 1][0] || ring[0][1] != ring[ring.length - 1][1])) {
//         ring.push(ring[0]); // add the first point to the end to close the ring
//       }
      
//       polygons.push([ring]); // Wrap ring in array for MultiPolygon structure
//     });
    
//     return {
//       type: 'MultiPolygon' as const,
//       coordinates: polygons
//     };
//   }
  
//   return null;
// }

// /**
//  * Perform frontend intersection using your working Turf.js algorithm
//  */
// export async function performFrontendIntersection(
//   layers: LayerConfig[],
//   onProgress?: (message: string) => void
// ): Promise<GeoJsonFeatureCollection | null> {
//   console.log("=== FRONTEND TURF INTERSECTION START ===");
//   const startTime = Date.now();
  
//   // Get enabled layers with data (your visible_layers logic)
//   const visibleLayers = layers.filter(layer => layer.enabled && layer.layer);
  
//   if (visibleLayers.length < 2) {
//     console.error('You need at least 2 layers to check overlaps');
//     return null;
//   }
  
//   onProgress?.(`Starting intersection of ${visibleLayers.length} layers...`);
  
//   try {
//     // Initialize the intersection layer with the first layer (your algorithm)
//     let intersectionLayer = visibleLayers[0].layer!;
    
//     // Iteratively find intersections with each subsequent layer
//     for (let i = 1; i < visibleLayers.length; i++) {
//       const nextLayer = visibleLayers[i].layer!;
//       const newIntersection = new google.maps.Data();
      
//       onProgress?.(`Intersecting with ${visibleLayers[i].name}...`);
      
//       intersectionLayer.forEach((feature1: google.maps.Data.Feature) => {
//         nextLayer.forEach((feature2: google.maps.Data.Feature) => {
//           console.log("feature 1: ", feature1);
//           console.log('feature 2: ', feature2);
          
//           if (!feature1.getGeometry() || !feature2.getGeometry()) return;
          
//           try {
//             const shape1 = processShape(feature1.getGeometry()!);
//             const shape2 = processShape(feature2.getGeometry()!);
            
//             if (!shape1 || !shape2) return;

//             let turfFeature1: Feature<Polygon | MultiPolygon>;
//             let turfFeature2: Feature<Polygon | MultiPolygon>;

//             if (shape1.type === 'Polygon') {
//               turfFeature1 = turf.polygon(shape1.coordinates as number[][][]);
//             } else {
//               turfFeature1 = turf.multiPolygon(shape1.coordinates as number[][][][]);
//             }

//             if (shape2.type === 'Polygon') {
//               turfFeature2 = turf.polygon(shape2.coordinates as number[][][]);
//             } else {
//               turfFeature2 = turf.multiPolygon(shape2.coordinates as number[][][][]);
//             }

//             console.log("TurfFeature1 type:", turfFeature1.type, "geometry type:", turfFeature1.geometry.type);
//             console.log("TurfFeature2 type:", turfFeature2.type, "geometry type:", turfFeature2.geometry.type);

//             // Try using turf.intersect from main package
//             // @ts-expect-error - turf.intersect type definitions are incorrect
//             const intersection = turf.intersect(turfFeature1, turfFeature2);
            
//             if (intersection) {
//               console.log("intersection: ", intersection);
              
//               const combinedProperties: GeoJsonProperties = {};
//               feature1.forEachProperty((value, key) => {
//                 combinedProperties[`${key}`] = value as string | number | boolean | null | undefined;
//               });
              
//               feature2.forEachProperty((value, key) => {
//                 combinedProperties[`${key}`] = value as string | number | boolean | null | undefined;
//               });
              
//               newIntersection.addGeoJson({
//                 type: 'Feature',
//                 geometry: intersection.geometry,
//                 properties: combinedProperties,
//               });
//             }
//           } catch (error) {
//             console.error('Error calculating intersection', error);
//           }
//         });
//       });
      
//       // Update intersection layer for the next iteration
//       intersectionLayer = newIntersection;
//     }
    
//     // Convert the final Google Maps Data layer to GeoJSON
//     const features: GeoJsonFeature[] = [];
//     intersectionLayer.forEach((feature: google.maps.Data.Feature) => {
//       const geometry = feature.getGeometry();
//       if (!geometry) return;
      
//       const properties: GeoJsonProperties = {};
//       feature.forEachProperty((value, key) => {
//         properties[key] = value as string | number | boolean | null | undefined;
//       });
      
//       // Convert geometry to GeoJSON format
//       const shape = processShape(geometry);
//       if (shape) {
//         features.push({
//           type: 'Feature',
//           geometry: shape as GeoJsonFeature['geometry'],
//           properties: properties
//         });
//       }
//     });
    
//     const totalTime = Date.now() - startTime;
//     console.log(`=== FRONTEND TURF INTERSECTION COMPLETE - Total time: ${totalTime}ms ===`);
//     console.log(`Final result: ${features.length} intersection features`);
    
//     onProgress?.(`Intersection complete: ${features.length} features found`);
    
//     // Return as GeoJSON FeatureCollection
//     const result: GeoJsonFeatureCollection = {
//       type: 'FeatureCollection',
//       features: features
//     };
    
//     return result;
    
//   } catch (error) {
//     console.error('Frontend intersection error:', error);
//     const totalTime = Date.now() - startTime;
//     console.log(`=== FRONTEND TURF INTERSECTION FAILED - Total time: ${totalTime}ms ===`);
//     return null;
//   }
// }