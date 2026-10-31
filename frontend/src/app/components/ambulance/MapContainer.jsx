import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// FALLBACK COORDINATES (Gwalior Region)
const DEFAULT_CENTER = [26.2183, 78.1828];

/**
 * Robust numeric coordinate validation
 * @param {any} lat 
 * @param {any} lng 
 * @returns {boolean}
 */
const isValidCoords = (lat, lng) => {
  return (
    typeof lat === 'number' && 
    typeof lng === 'number' && 
    !isNaN(lat) && 
    !isNaN(lng) &&
    lat !== 0 &&
    lng !== 0
  );
};

// Custom Ambulance Icon Generator
const createAmbulanceIcon = (status = 'online', isNearest = false) => {
  const color = status === 'busy' ? '#ef4444' : (isNearest ? '#06b6d4' : '#3b82f6');
  const pulseClass = status === 'online' ? 'animate-pulse' : '';
  const glowClass = isNearest ? 'shadow-[0_0_20px_rgba(6,182,212,0.6)]' : 'shadow-lg';

  return L.divIcon({
    className: 'custom-ambulance-icon',
    html: `<div class="relative group">
              ${isNearest ? `<div class="absolute -inset-4 bg-cyan-400/20 rounded-full animate-ping"></div>` : ''}
              <div class="relative bg-white dark:bg-slate-900 p-2 rounded-2xl ${glowClass} border-2 border-white dark:border-slate-800 transition-all transform hover:scale-110">
                <div class="p-1.5 rounded-xl" style="background-color: ${color}20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="${pulseClass}">
                    <path d="M10 10H6"/><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.684-.948V7a1 1 0 0 0-1-1h-2"/><path d="M7 18h4"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>
                  </svg>
                </div>
                ${status === 'online' ? `<div class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>` : ''}
              </div>
           </div>`,
    iconSize: [45, 45],
    iconAnchor: [22, 22],
  });
};

// Custom User/Pickup Icon
const pickupIcon = L.divIcon({
  className: 'custom-pickup-icon',
  html: `<div class="relative">
            <div class="absolute -inset-4 bg-red-500/20 rounded-full animate-ping"></div>
            <div class="relative bg-red-500 p-2.5 rounded-full shadow-2xl border-4 border-white dark:border-slate-900">
              <div class="w-3 h-3 bg-white rounded-full"></div>
            </div>
         </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Destination Icon
const destinationIcon = L.divIcon({
  className: 'custom-dest-icon',
  html: `<div class="relative">
            <div class="relative bg-slate-900 dark:bg-white p-2.5 rounded-2xl shadow-2xl border-2 border-white dark:border-slate-900">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white dark:text-slate-900">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/>
              </svg>
            </div>
         </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// Component to handle map center updates with smooth flight
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && isValidCoords(center[0], center[1])) {
      map.flyTo(center, zoom, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  }, [center, zoom, map]);
  return null;
}

const LeafletMap = ({ 
  center = DEFAULT_CENTER, 
  zoom = 13, 
  markers = [], 
  route = null,
  pickupLocation = null,
  destinationLocation = null
}) => {
  // Validate main map center, fallback if invalid
  const safeCenter = (Array.isArray(center) && isValidCoords(center[0], center[1])) 
    ? center 
    : DEFAULT_CENTER;

  return (
    <MapContainer 
      center={safeCenter} 
      zoom={zoom} 
      style={{ height: '100%', width: '100%', borderRadius: '1.5rem' }}
      zoomControl={false}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="map-tiles"
      />
      
      <ChangeView center={safeCenter} zoom={zoom} />

      {/* Pickup Location with Pulse Circle */}
      {pickupLocation && isValidCoords(pickupLocation.lat, pickupLocation.lng) && (
        <>
          <Circle 
            center={[pickupLocation.lat, pickupLocation.lng]} 
            radius={200}
            pathOptions={{ fillColor: '#ef4444', fillOpacity: 0.1, color: '#ef4444', weight: 1, dashArray: '5, 5' }}
          />
          <Marker position={[pickupLocation.lat, pickupLocation.lng]} icon={pickupIcon}>
            <Popup className="premium-popup">Pickup Point</Popup>
          </Marker>
        </>
      )}

      {/* Destination Marker */}
      {destinationLocation && isValidCoords(destinationLocation.lat, destinationLocation.lng) && (
        <Marker position={[destinationLocation.lat, destinationLocation.lng]} icon={destinationIcon}>
          <Popup className="premium-popup">Destination Hospital</Popup>
        </Marker>
      )}

      {/* Ambulance & User Markers */}
      {markers
        .filter(m => m.position && isValidCoords(m.position.lat, m.position.lng))
        .map((m, idx) => (
          <Marker 
            key={`${m.label}-${idx}`} 
            position={[m.position.lat, m.position.lng]} 
            icon={m.type === 'ambulance' ? createAmbulanceIcon(m.status || 'online', m.isNearest) : (m.type === 'user' ? pickupIcon : DefaultIcon)}
            zIndexOffset={m.isNearest ? 1000 : (m.type === 'user' ? 500 : 0)}
          >
            <Popup className="premium-popup">
              <div className="p-2">
                <p className="font-black text-sm mb-1">{m.label || 'Ambulance'}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{m.status || 'Available'}</p>
              </div>
            </Popup>
          </Marker>
      ))}

      {/* Route Polyline with Animation Effect */}
      {route && Array.isArray(route) && route.length > 0 && (
        <>
          <Polyline 
            positions={route} 
            color="#3b82f6" 
            weight={8} 
            opacity={0.3} 
            lineCap="round"
          />
          <Polyline 
            positions={route} 
            color="#2563eb" 
            weight={5} 
            opacity={0.8} 
            lineCap="round"
            dashArray="1, 10"
          />
        </>
      )}
    </MapContainer>
  );
};

export default LeafletMap;
