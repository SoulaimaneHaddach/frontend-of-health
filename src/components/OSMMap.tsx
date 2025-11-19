import React, { useMemo, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

type Marker = {
  id?: string | number;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  color?: string;
  label?: string;
  icon?: string; // optional image URL (deprecated)
  iconName?: string | null; // Ionicons name to render inside marker
};

type Props = {
  markers?: Marker[];
  userLocation?: { latitude: number; longitude: number } | null;
  onMarkerPress?: (id?: string | number) => void;
  onMapPress?: (lat: number, lng: number) => void;
  initialRegion?: { latitude: number; longitude: number; latitudeDelta?: number };
  centerTo?: { latitude: number; longitude: number; zoom?: number } | null;
  selectedId?: string | number | null;
  style?: any;
};

const OSMMap: React.FC<Props> = ({ markers = [], userLocation = null, onMarkerPress, onMapPress, initialRegion, centerTo = null, selectedId = null, style }) => {
  const webviewRef = useRef<WebView | null>(null);

  const initialCenter = initialRegion?.latitude && initialRegion?.longitude
    ? { lat: initialRegion.latitude, lng: initialRegion.longitude, zoom: 12 }
    : userLocation
      ? { lat: userLocation.latitude, lng: userLocation.longitude, zoom: 12 }
      : { lat: 35.7595, lng: -5.8340, zoom: 6 };

  const userLocationJson = userLocation ? JSON.stringify({ lat: userLocation.latitude, lng: userLocation.longitude }) : 'null';

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
  }))), [markers]);

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
          var leafletMarkers = {};
          markers.forEach(function(m){
            try {
              var html = '';
                if (m.iconName) {
                  // Use 40x40 marker to match RN native marker size; icon font scaled to match
                  html = '<div style="width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);background:'+ (m.color || '#E91E63') +';transition:transform 120ms ease;">' +
                         '<ion-icon name="' + (m.iconName || '') + '" style="font-size:18px;color:white;display:block;"></ion-icon>' +
                         '</div>';
                  // Note: iconSize and anchor set to 40 to align center
                  var icon = L.divIcon({ html: html, className: '' , iconSize: [40,40], iconAnchor: [20,20]});
              } else if (m.icon) {
                html = '<div style="width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);background:'+ (m.color || '#E91E63') +';transition:transform 120ms ease;"><img src="'+m.icon+'" style="width:22px;height:22px;border-radius:50%;object-fit:cover;"/></div>';
                var icon = L.divIcon({ html: html, className: '' , iconSize: [40,40], iconAnchor: [20,20]});
              } else {
                html = '<div style="width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;font-weight:700;color:white;box-shadow:0 2px 6px rgba(0,0,0,0.3);background:'+ (m.color || '#E91E63') +';transition:transform 120ms ease;">'+(m.label || '')+'</div>';
                var icon = L.divIcon({ html: html, className: '' , iconSize: [40,40], iconAnchor: [20,20]});
              }
              var mk = L.marker([m.lat, m.lng], { icon: icon }).addTo(map);
              leafletMarkers[m.id] = mk;
              mk.on('click', function(){
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerPress', id: m.id }));
              });
            } catch(e) { console.warn(e); }
          });

          // map click (tap) handler
          map.on('click', function(e){
            try {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapPress', lat: e.latlng.lat, lng: e.latlng.lng }));
            } catch(err) { }
          });

          // Render user location marker if provided
          var userMarker = null;
          function createUserMarker(lat, lng) {
            try {
              // Use the same visual language as the native RN marker: circular blue background with the "location" icon
              var html = '<div style="width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);background:#2F80ED;">' +
                         '<ion-icon name="location" style="font-size:18px;color:white;display:block;transform:translateY(1px);"></ion-icon>' +
                         '</div>';
              var icon = L.divIcon({ html: html, className: '', iconSize: [40,40], iconAnchor: [20,20] });
              userMarker = L.marker([lat, lng], { icon: icon, interactive: false }).addTo(map);
            } catch(e) { }
          }

          if (userLocation && userLocation.lat && userLocation.lng) {
            try { createUserMarker(userLocation.lat, userLocation.lng); } catch(e) {}
          }

          // Expose helpers to update/create the user marker from RN
          window.setUserLocation = function(lat, lng) {
            try {
              if (userMarker) {
                userMarker.setLatLng([lat, lng]);
              } else {
                createUserMarker(lat, lng);
              }
            } catch(e) {}
          };

          // goToLocation: set the user marker immediately and center map without waiting for a long animation.
          // This reduces perceived delay when the user presses "go to my location" in RN.
          window.goToLocation = function(lat, lng, zoom) {
            try {
              // ensure marker exists and move it
              if (userMarker) {
                userMarker.setLatLng([lat, lng]);
              } else {
                createUserMarker(lat, lng);
              }
              // immediately set view to avoid long blank wait, then do a short flyTo for polish
              try { map.setView([lat, lng], zoom || Math.max(map.getZoom(), 12)); } catch(e) {}
              try { map.flyTo([lat, lng], zoom || Math.max(map.getZoom(), 12), { duration: 0.35 }); } catch(e) {}
            } catch(e) {}
          };

          // expose a method to center map from RN if needed (use flyTo for smooth animation)
          window.centerMap = function(lat, lng, zoom) {
            try {
              map.flyTo([lat, lng], zoom || 12, { duration: 0.6 });
            } catch(e) {
              try { map.setView([lat, lng], zoom || 12); } catch(e) {}
            }
          };

          // allow selecting/bringing a marker to front and center it
          // id: marker id
          // zoom: optional zoom level (if provided)
          window.selectMarker = function(id, zoom) {
            try {
              // close any open popup
              try { map.closePopup(); } catch(e) {}
              Object.keys(leafletMarkers).forEach(function(k){
                try { 
                  leafletMarkers[k].setZIndexOffset(0);
                  // ensure any open popup on the marker is closed
                  try { leafletMarkers[k].closePopup(); } catch(e) {}
                  var el = leafletMarkers[k].getElement();
                  if (el) el.style.transform = 'scale(1)';
                } catch(e){}
              });
              if (leafletMarkers[id]) {
                leafletMarkers[id].setZIndexOffset(1000);
                var selEl = leafletMarkers[id].getElement();
                if (selEl) selEl.style.transform = 'scale(1.15)';
                try {
                  // center and optionally zoom to the selected marker
                  var latlng = leafletMarkers[id].getLatLng();
                  // Default to a closer, street-level zoom when selecting a marker
                  var targetZoom = (typeof zoom === 'number' && zoom) ? zoom : Math.max(map.getZoom(), 18);
                  try { map.flyTo([latlng.lat, latlng.lng], targetZoom, { duration: 0.6 }); } catch(e) { try { map.setView([latlng.lat, latlng.lng], targetZoom); } catch(e) {} }
                } catch(e) {}
              }
            } catch(err) { }
          };
        } catch (err) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: String(err) }));
        }
      })();
    </script>
  </body>
  </html>
  `, [markersJson, initialCenter.lat, initialCenter.lng, initialCenter.zoom]);

  const handleMessage = useCallback((e: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(e.nativeEvent.data);
      if (data) {
        if (data.type === 'markerPress') {
          onMarkerPress && onMarkerPress(data.id);
        } else if (data.type === 'mapPress') {
          onMapPress && onMapPress(Number(data.lat), Number(data.lng));
        } else if (data.type === 'error') {
          // Surface WebView-side errors to RN logs for easier debugging in production builds
          console.warn('OSMMap WebView error:', data.message);
        } else {
          // unknown message - log for debugging
          console.log('OSMMap message:', data);
        }
      }
    } catch (err) {
      // ignore
    }
  }, [onMarkerPress, onMapPress]);

  // centerTo prop: when changed, ask the WebView to center the Leaflet map
  React.useEffect(() => {
    if (!centerTo || !webviewRef.current) return;
    const js = `try{window.centerMap(${centerTo.latitude}, ${centerTo.longitude}, ${centerTo.zoom || 12});}catch(e){};true;`;
    try {
      webviewRef.current.injectJavaScript(js);
    } catch (e) {
      // ignore
    }
  }, [centerTo]);

  // selectedId prop: bring selected marker to front in WebView
  React.useEffect(() => {
    if (!webviewRef.current) return;
    if (selectedId === null || typeof selectedId === 'undefined') return;
    const js = `try{window.selectMarker(${JSON.stringify(selectedId)});}catch(e){};true;`;
    try {
      webviewRef.current.injectJavaScript(js);
    } catch (e) {
      // ignore
    }
  }, [selectedId]);

  // Update user location marker when prop changes
  React.useEffect(() => {
    if (!webviewRef.current) return;
    if (!userLocation) return;
    const js = `try{window.setUserLocation(${userLocation.latitude}, ${userLocation.longitude});}catch(e){};true;`;
    try {
      webviewRef.current.injectJavaScript(js);
    } catch (e) {
      // ignore
    }
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
