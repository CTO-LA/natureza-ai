
'use client';

import React, { useRef, useEffect, useState } from 'react';
import mapboxgl, { Map, LngLatLike, GeoJSONSource } from 'mapbox-gl';
import * as h3 from 'h3-js';

// IMPORTANT: Replace with your actual Mapbox access token
// Ensure NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN is set in your .env file
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'YOUR_MAPBOX_ACCESS_TOKEN_HERE';

interface HexFeature extends GeoJSON.Feature<GeoJSON.Polygon> {
  properties: {
    id: string;
    status: 'verified' | 'unverified';
  };
}

// Define mock H3 hexagon data (Acre, Brazil & Putumayo, Colombia examples - resolution 2, ~108 miles edge)
const mockHexData = [
  // Acre, Brazil (near Rio Branco) - Resolution 2
  { id: '82801ffffffffff', status: 'verified' }, // Approx location: -9.97, -67.81
  { id: '82803ffffffffff', status: 'unverified' }, // Nearby hex
  // Putumayo, Colombia (near Mocoa) - Resolution 2
  { id: '826e9ffffffffff', status: 'unverified' }, // Approx location: 1.15, -76.64
  { id: '826e1ffffffffff', status: 'verified' },   // Nearby hex
];


export const MapComponent: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  // Centered between Acre and Putumayo, zoomed out further
  const [lng] = useState<number>(-72.2); // Default longitude
  const [lat] = useState<number>(-4.4);  // Default latitude
  const [zoom] = useState<number>(3.5);    // Adjusted zoom level for larger hexagons

  useEffect(() => {
    if (map.current || !mapContainer.current) return; // Initialize map only once and if container exists

    // Basic check for access token
    if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN === 'YOUR_MAPBOX_ACCESS_TOKEN_HERE') {
      console.error("Mapbox Access Token is not set. Please configure it in .env.");
      // Optionally display an error message to the user in the map container
       if (mapContainer.current) {
           mapContainer.current.innerHTML = '<div class="p-4 text-center text-destructive bg-destructive/10 border border-destructive/30 rounded-md">Mapbox Access Token is missing. Please configure it in .env to view the map.</div>';
       }
      return;
    }

    console.log("Mapbox access token:", process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN);


    // Inject custom popup styles
    const styleId = 'mapbox-popup-custom-style';
    let styleElement = document.getElementById(styleId);
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        // Style popup to match the new dark theme
        styleElement.innerHTML = `
            .mapbox-popup-custom .mapboxgl-popup-content {
                background-color: hsl(var(--card));
                color: hsl(var(--card-foreground));
                padding: 8px 12px;
                font-size: 0.875rem; /* 14px */
                border-radius: 6px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                border: 1px solid hsl(var(--border));
            }
            .mapbox-popup-custom .mapboxgl-popup-close-button {
                color: hsl(var(--card-foreground));
            }
             .mapbox-popup-custom .mapboxgl-popup-anchor-top .mapboxgl-popup-tip,
             .mapbox-popup-custom .mapboxgl-popup-anchor-bottom .mapboxgl-popup-tip,
             .mapbox-popup-custom .mapboxgl-popup-anchor-left .mapboxgl-popup-tip,
             .mapbox-popup-custom .mapboxgl-popup-anchor-right .mapboxgl-popup-tip {
                border-color: transparent; /* Hide default tip border */
             }
             /* Adjust tip color to match card background */
             .mapbox-popup-custom.mapboxgl-popup-anchor-bottom .mapboxgl-popup-tip {
                 border-top-color: hsl(var(--card));
             }
             .mapbox-popup-custom.mapboxgl-popup-anchor-top .mapboxgl-popup-tip {
                 border-bottom-color: hsl(var(--card));
             }
             .mapbox-popup-custom.mapboxgl-popup-anchor-right .mapboxgl-popup-tip {
                 border-left-color: hsl(var(--card));
             }
             .mapbox-popup-custom.mapboxgl-popup-anchor-left .mapboxgl-popup-tip {
                 border-right-color: hsl(var(--card));
             }
        `;
        document.head.appendChild(styleElement);
    }


    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11', // Use a dark map style
      center: [lng, lat] as LngLatLike,
      zoom: zoom,
    });

    map.current.on('load', () => {
      if (!map.current) return;

      // Convert H3 IDs to GeoJSON features
      const features: HexFeature[] = mockHexData.map(hex => {
        // Get boundary as [lat, lon] pairs and convert to [lon, lat] for GeoJSON
        const boundary = h3.cellToBoundary(hex.id, true).map(coord => [coord[1], coord[0]]); // Correctly convert [lat, lng] to [lng, lat]
        return {
          type: 'Feature',
          properties: {
            id: hex.id,
            status: hex.status,
          },
          geometry: {
            type: 'Polygon',
            coordinates: [boundary], // GeoJSON Polygon requires an array of rings
          },
        };
      });

      const geojsonData: GeoJSON.FeatureCollection<GeoJSON.Polygon, HexFeature['properties']> = {
        type: 'FeatureCollection',
        features: features,
      };

      // Add the GeoJSON data as a source
      map.current.addSource('hexagons', {
        type: 'geojson',
        data: geojsonData,
      });

      // Add a layer to display the hexagons
      map.current.addLayer({
        id: 'hexagon-fills',
        type: 'fill',
        source: 'hexagons',
        paint: {
          'fill-color': [
            'match',
            ['get', 'status'], // Get the status property
            'verified', 'hsl(var(--primary))', // Use primary color (green) for verified
            'unverified', 'hsl(var(--accent))', // Use accent color (teal) for unverified
            'hsl(var(--muted))' // Default color (muted gray-cyan)
          ],
          'fill-opacity': 0.7, // Slightly increased opacity
          'fill-outline-color': 'hsl(var(--border))', // Use border color for outline
        },
      });

      // Optional: Add interactivity (e.g., popup on click)
      map.current.on('click', 'hexagon-fills', (e) => {
         if (e.features && e.features.length > 0) {
            const feature = e.features[0] as HexFeature; // Cast to our specific type
            const coordinates = e.lngLat;
            // Use theme colors in popup
            const statusColor = feature.properties.status === 'verified' ? 'hsl(var(--primary))' : 'hsl(var(--accent))';
            const description = `<div class="p-1 font-sans"><strong class="font-medium text-foreground/80">Hex ID:</strong> ${feature.properties.id}<br><strong class="font-medium text-foreground/80">Status:</strong> <span style="color: ${statusColor}; text-transform: capitalize;">${feature.properties.status}</span></div>`;

            new mapboxgl.Popup({ closeButton: true, className: 'mapbox-popup-custom' })
              .setLngLat(coordinates)
              .setHTML(description)
              .addTo(map.current!);
         }
      });

      // Change the cursor to a pointer when hovering over the hexagons layer.
      map.current.on('mouseenter', 'hexagon-fills', () => {
        if (map.current) {
            map.current.getCanvas().style.cursor = 'pointer';
        }
      });

      // Change it back to default when it leaves.
      map.current.on('mouseleave', 'hexagon-fills', () => {
         if (map.current) {
            map.current.getCanvas().style.cursor = '';
         }
      });

    });

    // Add resize listener to ensure map fills container
    const resizeObserver = new ResizeObserver(() => {
        map.current?.resize();
    });
    if (mapContainer.current) {
        resizeObserver.observe(mapContainer.current);
    }


    // Clean up on unmount
    return () => {
        resizeObserver.disconnect();
        map.current?.remove();
        map.current = null; // Ensure map instance is cleared
        // Clean up style element if needed, though generally fine to leave
        // const styleToRemove = document.getElementById(styleId);
        // if (styleToRemove) {
        //     styleToRemove.remove();
        // }
    };
  }, [lng, lat, zoom]); // Only re-run if lng, lat, or zoom change

  // Ensure the container takes full height and width
  return <div ref={mapContainer} className="h-full w-full" />;
};
