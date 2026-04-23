'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
const DEFAULT_CENTER: [number, number] = [-91.17780950467707, 30.41340666855488];

export default function Map() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<{ name: string, id: number } | null>(null);
  //const [currentFloor, setCurrentFloor] = useState<number>(1);

  const switchFloor = (floor: number) => {
    if (!map.current) return;

    //setCurrentFloor(floor);

    if (floor === 1) {
      map.current.setLayoutProperty('floor-1-layer', 'visibility', 'visible');
      map.current.setLayoutProperty('floor-2-layer', 'visibility', 'none');
    } else if (floor === 2){
      map.current.setLayoutProperty('floor-1-layer', 'visibility', 'none');
      map.current.setLayoutProperty('floor-2-layer', 'visibility', 'visible');
    }
  };
  useEffect(() => {
    if (!mapContainer.current) return;
    
    map.current = new maplibregl.Map({
      style: 'https://tiles.openfreemap.org/styles/bright',
      center: DEFAULT_CENTER,
      zoom: 15.5,
      container: mapContainer.current!,
      canvasContextAttributes: { antialias: true }
    });

    const geolocate = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
    });

    map.current.addControl(geolocate);
    map.current.on('load', () => {
      geolocate.trigger();

      //floor 1
      map.current?.addSource('floor-1-source', {
        type: 'image',
        url: '/pft1floor_copy.png',
        coordinates: [
            [-91.1801422, 30.4090024], //OLD top left
            //[-91.1801959, 30.4088667], //new top left
            [-91.1788229, 30.4086384], //OLDtop right
            //[-91.1788754, 30.4085151], //new top right
            [-91.1795364, 30.4066045], //bottom right
            [-91.1809159, 30.4069607], //bottom left
        ]
      });
 
 
      map.current?.addLayer({
          id: 'floor-1-layer',
          type: 'raster',
          source: 'floor-1-source',
          layout: { visibility: 'visible' }
      });
      //floor 2
      map.current?.addSource('floor-2-source', {
        type: 'image',
        url: '/pft2floor.png',
        coordinates: [
          [-91.1788229, 30.4086384], // Was Bottom-Left -> Now Top-Left
          [-91.1795364, 30.4066045], // Was Bottom-Right -> Now Top-Right
          [-91.1809159, 30.4069607], // Was Top-Right -> Now Bottom-Right
          [-91.1801422, 30.4090024], // Was Top-Left -> Now Bottom-Left
        ]
      });
 
 
      map.current?.addLayer({
          id: 'floor-2-layer',
          type: 'raster',
          source: 'floor-2-source',
          paint: {
              'raster-opacity': 1.0
          },
          layout: { visibility: 'none' }
      });

      map.current?.addSource('pft-floor-1', {
        type: 'geojson',
        data: '/pftF1Polygons2.0.geojson'
      });
      map.current?.addLayer({
        id: 'pft-floor-1-Layer',
        type: 'fill',
        source: 'pft-floor-1',
        paint:{
          'fill-color': [
            'match', ['get', 'type'],
            1, '#e6e6e6',
            2, '#ffffff',
            3, '#ffcc00',
            '#ccc'
          ],
          'fill-opacity': 0.1
        }
      });
      //clicking on classrooms
      map.current?.addLayer({
        id: 'pft-highlight-marker',
        type: 'fill',
        source: 'pft-floor-1',
        paint: {
          'fill-color': '#c3b1e1', // violet
          'fill-opacity': 0.9,
          'fill-outline-color': '#000000'
        },
        filter: ['==', ['get', 'id'], '']
      });
      map.current?.on('click', 'pft-floor-1-Layer', (e) => {
        if (e.features && e.features.length > 0){
          const feature = e.features[0];
          const { name, id, type } = feature.properties;

          if (type == 1){
            setSelectedRoom({ name, id});
            map.current?.setFilter('pft-highlight-marker', ['==', ['get', 'id'], id]);
          } else{
            setSelectedRoom(null);
          }
        }
      });
      map.current?.on('click', (e) => {
        const features = map.current?.queryRenderedFeatures(e.point, {
          layers: ['pft-floor-1-Layer']
        });
      
        // If no room was clicked → clear highlight
        if (!features || features.length === 0) {
          setSelectedRoom(null);
          map.current?.setFilter('pft-highlight-marker', ['==', ['get', 'id'], '']);
        }
      });
      map.current?.on('mouseenter', 'pft-floor-1-Layer', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current?.on('mouseleave', 'pft-floor-1-Layer', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
 
    });

    return () => map.current?.remove();
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <div ref={mapContainer} style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0}}/>
      {selectedRoom && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 10,
          backgroundColor: '#C3B1E1',
          padding: '15px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          minWidth: '250px'
        }}>
        <h3 style={{ margin: '0 0 10px 0', color: 'black', fontSize: '1.1rem' }}>{selectedRoom.name}</h3>
        <button style={{
          width: '100%', 
          backgroundColor: '#FDD023', 
          color: '#341539', 
          border: 'none', 
          padding: '8px', 
          borderRadius: '20px',
          cursor: 'pointer'
        }}
      >Navigate to Room</button>
    </div>
    )}
    <div
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <button style={{width: '100%', 
          backgroundColor: '#FDD023', 
          color: '#341539', 
          border: 'none', 
          padding: '8px', 
          borderRadius: '20px',
          cursor: 'pointer'}}onClick={() => switchFloor(1)}>Floor 1</button>
      <button style={{width: '100%', 
          backgroundColor: '#FDD023', 
          color: '#341539', 
          border: 'none', 
          padding: '8px', 
          borderRadius: '20px',
          cursor: 'pointer'}} onClick={() => switchFloor(2)}>Floor 2</button>
    </div>
    </div>
  );
}
