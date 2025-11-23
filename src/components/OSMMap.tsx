import React, { useMemo, useRef, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { ms, vs } from '../shared/constants/responsive';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import logger from '../shared/utils/logger';

type Marker = {
  id?: string | number;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  color?: string;
  label?: string;
  icon?: string; // optional image URL
  iconName?: string | null; // Ionicons name
  minZoom?: number; // optional per-marker minimum zoom to show details
};

type Props = {
  markers?: Marker[];
  userLocation?: { latitude: number; longitude: number } | null;
  onMarkerPress?: (id?: string | number) => void;
  onMapPress?: (lat: number, lng: number) => void;
  initialRegion?: { latitude: number; longitude: number; latitudeDelta?: number };
  centerTo?: { latitude: number; longitude: number; zoom?: number } | null;
  selectedId?: string | number | null;
  detailZoomThreshold?: number; // map-level fallback min zoom for details
  style?: any;
};

const OSMMap: React.FC<Props> = ({
  markers = [],
  userLocation = null,
  onMarkerPress,
  onMapPress,
  initialRegion,
  centerTo = null,
  selectedId = null,
  detailZoomThreshold = 13,
  style,
}) => {
  const webviewRef = useRef<WebView | null>(null);

  const initialCenter = initialRegion?.latitude && initialRegion?.longitude
    ? { lat: initialRegion.latitude, lng: initialRegion.longitude, zoom: 12 }
    : userLocation
      ? { lat: userLocation.latitude, lng: userLocation.longitude, zoom: 12 }
      : { lat: 35.7595, lng: -5.8340, zoom: 6 };

  const markersJson = useMemo(() => JSON.stringify(markers.map(m => ({
    id: m.id,
    lat: m.latitude,
    lng: m.longitude,
    title: m.title || '',
    description: m.description || '',
    color: m.color || '#E91E63',
    label: m.label || '',
    icon: m.icon || null,
    iconName: m.iconName || null,
    minZoom: m.minZoom || null,
  }))), [markers]);

  const userLocationJson = userLocation ? JSON.stringify({ lat: userLocation.latitude, lng: userLocation.longitude }) : 'null';

  const html = useMemo(() => `
  <!doctype html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script type="module" src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.esm.js"></script>
    <script nomodule src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.js"></script>
    <style>
      html, body, #map { height: 100%; margin: 0; padding: 0; }
      .leaflet-container { background: #fff; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      (function(){
        try {
          var map = L.map('map').setView([${initialCenter.lat}, ${initialCenter.lng}], ${initialCenter.zoom});
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);

          var markers = ${markersJson};
          var userLocation = ${userLocationJson};
          var detailZoomThreshold = ${detailZoomThreshold};
          var leafletMarkers = {};

          function createMarkerElement(m) {
            if (m.iconName) {
              return '<div style="width:' + ${ms(40)} + 'px;height:' + ${ms(40)} + 'px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);background:'+ (m.color || '#E91E63') +';">' +
                       '<ion-icon name="' + (m.iconName || '') + '" style="font-size:' + ${ms(18)} + 'px;color:white;display:block;"></ion-icon>' +
                       '</div>';
            }
            if (m.icon) {
              return '<div style="width:' + ${ms(40)} + 'px;height:' + ${ms(40)} + 'px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);background:'+ (m.color || '#E91E63') +';">' +
                '<img src="'+m.icon+'" style="width:' + ${ms(22)} + 'px;height:' + ${ms(22)} + 'px;border-radius:50%;object-fit:cover;"/>' +
                '</div>';
            }
            return '<div style="width:' + ${ms(40)} + 'px;height:' + ${ms(40)} + 'px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;font-weight:700;color:white;box-shadow:0 2px 6px rgba(0,0,0,0.3);background:'+ (m.color || '#E91E63') +';">'+(m.label || '')+'</div>';
          }

          markers.forEach(function(m){
            try {
              var elHtml = createMarkerElement(m);
              var icon = L.divIcon({ html: elHtml, className: '', iconSize: [${ms(40)},${ms(40)}], iconAnchor: [${ms(20)},${ms(20)}]});
              // disable zoomAnimation so icon keeps fixed pixel size
              var mk = L.marker([m.lat, m.lng], { icon: icon, zoomAnimation: false }).addTo(map);
              leafletMarkers[m.id] = mk;

              // initial visibility based on map zoom and marker.minZoom
              try {
                var curZ = map.getZoom();
                var minZ = (typeof m.minZoom === 'number' && m.minZoom) ? m.minZoom : detailZoomThreshold;
                if (curZ < minZ) {
                  var el = mk.getElement(); if (el) el.style.display = 'none';
                }
              } catch(e) {}

              mk.on('click', function(){
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerPress', id: m.id }));
              });
            } catch(e) { console.warn(e); }
          });

          map.on('click', function(e){
            try { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapPress', lat: e.latlng.lat, lng: e.latlng.lng })); } catch(e){}
          });

          // user location marker
          var userMarker = null;
          function createUserMarker(lat, lng) {
            try {
              var html = '<div style="width:' + ${ms(40)} + 'px;height:' + ${ms(40)} + 'px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);background:#2F80ED;">' +
                           '<ion-icon name="location" style="font-size:' + ${ms(18)} + 'px;color:white;display:block;transform:translateY(' + ${ms(1)} + 'px);"></ion-icon>' +
                           '</div>';
              var icon = L.divIcon({ html: html, className: '', iconSize: [${ms(40)},${ms(40)}], iconAnchor: [${ms(20)},${ms(20)}] });
              userMarker = L.marker([lat, lng], { icon: icon, interactive: false, zoomAnimation: false }).addTo(map);
            } catch(e) {}
          }

          if (userLocation && userLocation.lat && userLocation.lng) {
            try { createUserMarker(userLocation.lat, userLocation.lng); } catch(e) {}
          }

          window.setUserLocation = function(lat, lng) {
            try {
              if (userMarker) { userMarker.setLatLng([lat, lng]); }
              else { createUserMarker(lat, lng); }
            } catch(e) {}
          };

          window.goToLocation = function(lat, lng, zoom) {
            try {
              if (userMarker) { userMarker.setLatLng([lat, lng]); }
              else { createUserMarker(lat, lng); }
              try { map.setView([lat, lng], zoom || Math.max(map.getZoom(), 12)); } catch(e) {}
              try { map.flyTo([lat, lng], zoom || Math.max(map.getZoom(), 12), { duration: 0.35 }); } catch(e) {}
            } catch(e) {}
          };

          window.centerMap = function(lat, lng, zoom) {
            try { map.flyTo([lat, lng], zoom || 12, { duration: 0.6 }); } catch(e) { try { map.setView([lat, lng], zoom || 12); } catch(e){} }
          };

          window.selectMarker = function(id, zoom) {
            try {
              try { map.closePopup(); } catch(e) {}
              Object.keys(leafletMarkers).forEach(function(k){ try { leafletMarkers[k].setZIndexOffset(0); var el = leafletMarkers[k].getElement(); if (el) el.style.transform = 'scale(1)'; } catch(e){} });
              if (leafletMarkers[id]) {
                leafletMarkers[id].setZIndexOffset(1000);
                var selEl = leafletMarkers[id].getElement(); if (selEl) selEl.style.transform = 'scale(1.15)';
                try { var latlng = leafletMarkers[id].getLatLng(); var targetZoom = (typeof zoom === 'number' && zoom) ? zoom : Math.max(map.getZoom(), 18); try { map.flyTo([latlng.lat, latlng.lng], targetZoom, { duration: 0.6 }); } catch(e) { try { map.setView([latlng.lat, latlng.lng], targetZoom); } catch(e){} } } catch(e){}
              }
            } catch(e) {}
          };

          // hide/show markers on zoom
          map.on('zoomend', function(){
            try {
              var z = map.getZoom();
              Object.keys(leafletMarkers).forEach(function(k){
                try {
                  var mk = leafletMarkers[k];
                  var el = mk && mk.getElement && mk.getElement(); if (!el) return;
                  var markerData = markers.find(function(x){ return String(x.id) === String(k); });
                  var minZ = (markerData && typeof markerData.minZoom === 'number' && markerData.minZoom) ? markerData.minZoom : detailZoomThreshold;
                  if (z < minZ) { el.style.display = 'none'; } else { el.style.display = ''; }
                } catch(e){}
              });
            } catch(e){}
          });

        } catch(err) {
          try { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: String(err) })); } catch(e){}
        }
      })();
    </script>
  </body>
  </html>
  `, [markersJson, initialCenter.lat, initialCenter.lng, initialCenter.zoom, detailZoomThreshold]);

  const handleMessage = useCallback((e: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(e.nativeEvent.data);
      if (!data) return;
      if (data.type === 'markerPress') { onMarkerPress && onMarkerPress(data.id); }
      else if (data.type === 'mapPress') { onMapPress && onMapPress(Number(data.lat), Number(data.lng)); }
      else if (data.type === 'error') { logger.warn('OSMMap WebView error:', data.message); }
      else { logger.debug('OSMMap message:', data); }
    } catch(e) { /* ignore */ }
  }, [onMarkerPress, onMapPress]);

  // centerTo
  React.useEffect(() => {
    if (!centerTo || !webviewRef.current) return;
    const js = `try{window.centerMap(${centerTo.latitude}, ${centerTo.longitude}, ${centerTo.zoom || 12});}catch(e){};true;`;
    try { webviewRef.current.injectJavaScript(js); } catch(e) {}
  }, [centerTo]);

  // selectedId
  React.useEffect(() => {
    if (!webviewRef.current) return;
    if (selectedId === null || typeof selectedId === 'undefined') return;
    const js = `try{window.selectMarker(${JSON.stringify(selectedId)});}catch(e){};true;`;
    try { webviewRef.current.injectJavaScript(js); } catch(e) {}
  }, [selectedId]);

  // userLocation updates
  React.useEffect(() => {
    if (!webviewRef.current || !userLocation) return;
    const js = `try{window.setUserLocation(${userLocation.latitude}, ${userLocation.longitude});}catch(e){};true;`;
    try { webviewRef.current.injectJavaScript(js); } catch(e) {}
  }, [userLocation]);

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webviewRef}
        originWhitelist={["*"]}
        source={{ html }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="always"
        allowUniversalAccessFromFileURLs={true}
        allowFileAccess={true}
        scalesPageToFit={true}
        style={styles.webview}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1, backgroundColor: 'transparent' },
});

export default OSMMap;
