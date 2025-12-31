// // hooks/useMapMarkers.ts
// import { useState, useCallback, useRef, useEffect } from 'react';
// import type { Property, School, Comp, SearchResult } from '../types/map.types';

// export const useMapMarkers = (map: google.maps.Map | null) => {
//   const [propertyMarkers, setPropertyMarkers] = useState<Map<string, google.maps.marker.AdvancedMarkerElement[]>>(new Map());
//   const [schoolMarkers, setSchoolMarkers] = useState<Map<string, google.maps.marker.AdvancedMarkerElement[]>>(new Map());
//   const [transitMarkers, setTransitMarkers] = useState<Map<string, google.maps.marker.AdvancedMarkerElement[]>>(new Map());
//   const [searchMarkers, setSearchMarkers] = useState<google.maps.marker.AdvancedMarkerElement[]>([]);
//   const [searchCenterMarker, setSearchCenterMarker] = useState<google.maps.marker.AdvancedMarkerElement | null>(null);
  
//   const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
//   const propertyCirclesRef = useRef<Map<google.maps.marker.AdvancedMarkerElement, google.maps.Circle>>(new Map());

//   const ONE_MILE_IN_METERS = 1609.34;

//   const sponsorColors = {
//     'hdc': '#7fbd45',
//     'ozn': '#b23b7c',
//     'anew': '#f06449',
//     'apodments.com': '#0082ca',
//     'acquisitions': '#734968',
//     'comps': '#407f7f'
//   };

//   const schoolColors = {
//     'LACCD': '#bfb05e',
//     'public': '#3e5d80',
//     'private': '#734968'
//   };

//   const transitColors = {
//     'transit': 'red',
//     'bus': 'green',
//     'light_rail': 'blue',
//     'train': 'black',
//     'subway': 'pink'
//   };

//   useEffect(() => {
//     if (map && !infoWindowRef.current) {
//       infoWindowRef.current = new google.maps.InfoWindow();
//     }
//   }, [map]);

//   const createPropertyMarker = useCallback((property: Property): google.maps.marker.AdvancedMarkerElement | null => {
//     if (!map || !window.google) return null;

//     const content = document.createElement("div");
//     const owner = property.owner.toLowerCase();
//     const color = sponsorColors[owner as keyof typeof sponsorColors] || '#407f7f';

//     content.classList.add("property");
//     content.innerHTML = `
//       <div class="icon">
//         <i aria-hidden="true" class="fa fa-icon fa-building" title="building" style="color: ${color};"></i>
//         <span class="fa-sr-only">building</span>
//       </div>
//       <div class="details">
//         <div class="owner">${property.owner}: ${property.name}</div>
//         <div class="address">${property.address}</div>
//         <div class="features">
//           <div>
//             <i aria-hidden="true" class="fa-solid fa-door-open" title="room"></i>
//             <span class="fa-sr-only">room</span>
//             <span>${property.units}</span>
//           </div>
//           <div>
//             <i aria-hidden="true" class="fa-solid fa-person-walking" title="walk_score"></i>
//             <span class="fa-sr-only">Walk Score</span>
//             <span>${property.walk_score}/100</span>
//           </div>
//           <div>
//             <i aria-hidden="true" class="fa fa-ruler fa-lg size" title="size"></i>
//             <span class="fa-sr-only">size</span>
//             <span>${property.bld_size} ft<sup>2</sup></span>
//           </div>
//         </div>
//       </div>
//     `;

//     const marker = new google.maps.marker.AdvancedMarkerElement({
//       map: null, // Initially hidden
//       content: content,
//       position: {
//         lat: parseFloat(property.lat),
//         lng: parseFloat(property.lng)
//       },
//       title: property.owner,
//     });

//     // Create radius circle
//     const circle = new google.maps.Circle({
//       strokeColor: color,
//       strokeOpacity: 0.4,
//       strokeWeight: 1,
//       fillColor: color,
//       fillOpacity: 0.1,
//       radius: ONE_MILE_IN_METERS,
//       map: null, // Initially hidden
//       center: {
//         lat: parseFloat(property.lat),
//         lng: parseFloat(property.lng)
//       }
//     });

//     propertyCirclesRef.current.set(marker, circle);

//     // Add click listener
//     marker.addListener("gmp-click", () => {
//       toggleHighlight(marker, property);
//     });

//     return marker;
//   }, [map]);

//   const createSchoolMarker = useCallback((school: School): google.maps.marker.AdvancedMarkerElement | null => {
//     if (!map || !window.google) return null;

//     const content = document.createElement("div");
//     const category = school.category.toLowerCase();
//     const color = schoolColors[category as keyof typeof schoolColors] || '#bfb05e';

//     content.classList.add("school");
//     content.innerHTML = `
//       <div class="icon">
//         <i aria-hidden="true" class="fa fa-icon fa-graduation-cap" title="school" style="color: ${color};"></i>
//         <span class="fa-sr-only">school</span>
//       </div>
//       <div class="details">
//         <div class="name">${school.name}</div>
//         <div class="address">${school.address}</div>
//         <div class="category">${school.category}</div>
//       </div>
//     `;

//     const marker = new google.maps.marker.AdvancedMarkerElement({
//       map: null,
//       content: content,
//       position: {
//         lat: parseFloat(school.lat),
//         lng: parseFloat(school.lng)
//       },
//       title: school.name
//     });

//     marker.addListener("gmp-click", () => {
//       toggleHighlight(marker, school);
//     });

//     return marker;
//   }, [map]);

//   const createTransitMarker = useCallback((place: any, type: string): google.maps.marker.AdvancedMarkerElement | null => {
//     if (!map || !window.google) return null;

//     const content = document.createElement("div");
//     const color = transitColors[type as keyof typeof transitColors] || 'red';

//     content.classList.add("transit-station");
//     content.innerHTML = `
//       <div class="icon">
//         <i aria-hidden="true" class="fa fa-train" style="color: ${color};"></i>
//         <span class="fa-sr-only">transit station</span>
//       </div>
//       <div class="details">
//         <div class="name">${place.name}</div>
//         <div class="type">${type.replace('_', ' ').toUpperCase()}</div>
//         <div class="address">${place.vicinity}</div>
//         <div class="rating">Rating: ${place.rating ? place.rating + '/5' : 'N/A'}</div>
//       </div>
//     `;

//     const marker = new google.maps.marker.AdvancedMarkerElement({
//       map: null,
//       content: content,
//       position: {
//         lat: place.geometry.location.lat(),
//         lng: place.geometry.location.lng()
//       },
//       title: place.name
//     });

//     marker.addListener("gmp-click", () => {
//       toggleHighlight(marker, place);
//     });

//     return marker;
//   }, [map]);

//   const toggleHighlight = useCallback((marker: google.maps.marker.AdvancedMarkerElement, data: any) => {
//     const content = marker.content as HTMLElement;
    
//     if (content.classList.contains("highlight")) {
//       content.classList.remove("highlight");
//       marker.zIndex = null;
//     } else {
//       content.classList.add("highlight");
//       marker.zIndex = 1;
//     }
//   }, []);

//   const showPropertyMarkers = useCallback(async (sponsor: string) => {
//     if (!map) return;

//     const existingMarkers = propertyMarkers.get(sponsor) || [];
//     if (existingMarkers.length > 0) {
//       existingMarkers.forEach(marker => marker.map = map);
//       return;
//     }

//     try {
//       const response = await fetch('/HDC_Map/getDataServlet');
//       const properties: Property[] = await response.json();
      
//       const sponsorProperties = properties.filter(prop => 
//         prop.owner.toLowerCase() === sponsor.toLowerCase()
//       );

//       const markers = sponsorProperties
//         .map(property => createPropertyMarker(property))
//         .filter(marker => marker !== null) as google.maps.marker.AdvancedMarkerElement[];

//       markers.forEach(marker => marker.map = map);
      
//       setPropertyMarkers(prev => new Map(prev.set(sponsor, markers)));
//     } catch (error) {
//       console.error('Error fetching properties:', error);
//     }
//   }, [map, createPropertyMarker, propertyMarkers]);

//   const hidePropertyMarkers = useCallback((sponsor: string) => {
//     const markers = propertyMarkers.get(sponsor) || [];
//     markers.forEach(marker => marker.map = null);
//   }, [propertyMarkers]);

//   const showSchoolMarkers = useCallback(async (category: string) => {
//     if (!map) return;

//     const existingMarkers = schoolMarkers.get(category) || [];
//     if (existingMarkers.length > 0) {
//       existingMarkers.forEach(marker => marker.map = map);
//       return;
//     }

//     try {
//       const response = await fetch('/HDC_Map/getSchoolsServlet');
//       const schools: School[] = await response.json();
      
//       const categorySchools = schools.filter(school => 
//         school.category.toLowerCase() === category.toLowerCase()
//       );

//       const markers = categorySchools
//         .map(school => createSchoolMarker(school))
//         .filter(marker => marker !== null) as google.maps.marker.AdvancedMarkerElement[];

//       markers.forEach(marker => marker.map = map);
      
//       setSchoolMarkers(prev => new Map(prev.set(category, markers)));
//     } catch (error) {
//       console.error('Error fetching schools:', error);
//     }
//   }, [map, createSchoolMarker, schoolMarkers]);

//   const hideSchoolMarkers = useCallback((category: string) => {
//     const markers = schoolMarkers.get(category) || [];
//     markers.forEach(marker => marker.map = null);
//   }, [schoolMarkers]);

//   const showTransitMarkers = useCallback(async (type: string) => {
//     if (!map) return;

//     const existingMarkers = transitMarkers.get(type) || [];
//     if (existingMarkers.length > 0) {
//       existingMarkers.forEach(marker => marker.map = map);
//       return;
//     }

//     const placesService = new google.maps.places.PlacesService(map);
//     const center = map.getCenter();
//     if (!center) return;

//     const transitTypes: { [key: string]: string[] } = {
//       'transit': ['transit_station'],
//       'bus': ['bus_station'],
//       'light_rail': ['light_rail_station'],
//       'train': ['train_station'],
//       'subway': ['subway_station']
//     };

//     const types = transitTypes[type] || [];
//     const processedPlaces = new Map();

//     try {
//       const allResults = await Promise.all(
//         types.map(placeType => 
//           new Promise<any[]>((resolve, reject) => {
//             const request = {
//               location: center,
//               radius: 10000, // 10km
//               type: placeType
//             };

//             placesService.nearbySearch(request, (results, status) => {
//               if (status === google.maps.places.PlacesServiceStatus.OK) {
//                 resolve(results || []);
//               } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
//                 resolve([]);
//               } else {
//                 reject(status);
//               }
//             });
//           })
//         )
//       );

//       const markers: google.maps.marker.AdvancedMarkerElement[] = [];

//       allResults.flat().forEach(place => {
//         if (!processedPlaces.has(place.place_id)) {
//           processedPlaces.set(place.place_id, place);
          
//           const marker = createTransitMarker(place, type);
//           if (marker) {
//             marker.map = map;
//             markers.push(marker);
//           }
//         }
//       });

//       setTransitMarkers(prev => new Map(prev.set(type, markers)));
//     } catch (error) {
//       console.error("Error fetching transit stations", error);
//     }
//   }, [map, createTransitMarker, transitMarkers]);

//   const hideTransitMarkers = useCallback((type: string) => {
//     const markers = transitMarkers.get(type) || [];
//     markers.forEach(marker => marker.map = null);
//   }, [transitMarkers]);

//   const toggleRadiusDisplay = useCallback((show: boolean) => {
//     propertyCirclesRef.current.forEach((circle, marker) => {
//       circle.setMap(show && marker.map ? map : null);
//     });
//   }, [map]);

//   const clearAllMarkers = useCallback(() => {
//     // Clear property markers
//     propertyMarkers.forEach(markers => {
//       markers.forEach(marker => marker.map = null);
//     });
    
//     // Clear school markers
//     schoolMarkers.forEach(markers => {
//       markers.forEach(marker => marker.map = null);
//     });
    
//     // Clear transit markers
//     transitMarkers.forEach(markers => {
//       markers.forEach(marker => marker.map = null);
//     });

//     // Clear search markers
//     searchMarkers.forEach(marker => marker.map = null);
//     setSearchMarkers([]);

//     if (searchCenterMarker) {
//       searchCenterMarker.map = null;
//       setSearchCenterMarker(null);
//     }

//     // Clear circles
//     propertyCirclesRef.current.forEach(circle => circle.setMap(null));
//   }, [propertyMarkers, schoolMarkers, transitMarkers, searchMarkers, searchCenterMarker]);

//   return {
//     // Property markers
//     showPropertyMarkers,
//     hidePropertyMarkers,
    
//     // School markers
//     showSchoolMarkers,
//     hideSchoolMarkers,
    
//     // Transit markers
//     showTransitMarkers,
//     hideTransitMarkers,
    
//     // Radius display
//     toggleRadiusDisplay,
    
//     // Utility
//     clearAllMarkers,
    
//     // State
//     propertyMarkers,
//     schoolMarkers,
//     transitMarkers,
//     searchMarkers,
//     searchCenterMarker
//   };
// };