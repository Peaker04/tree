import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Badge } from '../AppPrimitives';
import { colors, radius, spacing } from '../../theme/tokens';

export type MapEngine = 'google' | 'leaflet';

export interface WebMapViewProps {
  treeLat: number;
  treeLng: number;
  treeName: string;
  userLat: number;
  userLng: number;
  locationAccuracyMeters: number | null;
  locationCapturedAt: string | null;
  effectiveRadiusMeters?: number;
  trees?: Array<{ id: string; name: string; species?: string; lat: number; lng: number; healthStatus?: string }>;
  apiKey?: string;
  initialEngine?: MapEngine;
  style?: StyleProp<ViewStyle>;
}

export function WebMapView(props: WebMapViewProps) {
  const {
    treeLat,
    treeLng,
    treeName,
    userLat,
    userLng,
    locationAccuracyMeters,
    locationCapturedAt,
    effectiveRadiusMeters = 15,
    trees = [],
    initialEngine = 'leaflet',
    style,
  } = props;

  const [engine] = useState<MapEngine>(initialEngine);
  const [isLoading, setIsLoading] = useState(true);
  const [isMapReady, setIsMapReady] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const htmlContent = useMemo(() => {
    const escapedName = JSON.stringify(treeName);
    const hasInitialUser = Boolean(locationCapturedAt);
    const initialUserLat = hasInitialUser ? userLat : 'null';
    const initialUserLng = hasInitialUser ? userLng : 'null';
    const initialAccuracy = locationAccuracyMeters ?? 15;
    const initialRadius = effectiveRadiusMeters ?? 15;
    const sanitizedNearbyTrees = JSON.stringify(
      (trees ?? [])
        .filter((t) => t.id && (Math.abs(t.lat - treeLat) > 0.00005 || Math.abs(t.lng - treeLng) > 0.00005))
        .map((t) => ({ id: t.id, name: t.name, lat: t.lat, lng: t.lng })),
    );

    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #e5e3df; overflow: hidden; }
    .tree-pin {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #15803d;
      border: 2.5px solid #ffffff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .nearby-tree-pin {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #529e64;
      border: 1.5px solid #ffffff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.85;
    }
    .user-pin {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #2563eb;
      border: 2.5px solid #ffffff;
      box-shadow: 0 0 0 4px rgba(37,99,235,0.28), 0 2px 6px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .leaflet-control-attribution { display: none !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([${treeLat}, ${treeLng}], 18);

    var tileUrl = '${
      engine === 'google'
        ? 'https://mt{s}.google.com/vt/lyrs=m&hl=vi&gl=VN&x={x}&y={y}&z={z}'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    }';
    var subdomains = '${engine === 'google' ? '0123' : 'abc'}';

    L.tileLayer(tileUrl, {
      maxZoom: 20,
      subdomains: subdomains
    }).addTo(map);

    var treeIcon = L.divIcon({
      className: '',
      html: '<div class="tree-pin"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg></div>',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    var treeMarker = L.marker([${treeLat}, ${treeLng}], { icon: treeIcon }).addTo(map);
    treeMarker.bindTooltip(${escapedName}, { permanent: true, direction: 'bottom', offset: [0, 14] });

    var treeCheckinCircle = L.circle([${treeLat}, ${treeLng}], {
      radius: ${initialRadius},
      color: '#15803d',
      fillColor: '#22c55e',
      fillOpacity: 0.15,
      weight: 2,
      dashArray: '6, 6'
    }).addTo(map);

    var nearbyTrees = ${sanitizedNearbyTrees};
    var nearbyIcon = L.divIcon({
      className: '',
      html: '<div class="nearby-tree-pin"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/></svg></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
    nearbyTrees.forEach(function(t) {
      L.marker([t.lat, t.lng], { icon: nearbyIcon }).addTo(map);
    });

    var userMarker = null;
    var accuracyCircle = null;
    var navPolyline = null;

    var userIcon = L.divIcon({
      className: '',
      html: '<div class="user-pin"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="4" fill="#ffffff"/></svg></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    function updateUserLocation(lat, lng, accuracy) {
      if (lat === null || lng === null) return;
      if (!userMarker) {
        userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(map);
        accuracyCircle = L.circle([lat, lng], {
          radius: accuracy || 15,
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.15,
          weight: 1
        }).addTo(map);
      } else {
        userMarker.setLatLng([lat, lng]);
        accuracyCircle.setLatLng([lat, lng]);
        accuracyCircle.setRadius(accuracy || 15);
      }

      if (!navPolyline) {
        navPolyline = L.polyline([[lat, lng], [${treeLat}, ${treeLng}]], {
          color: '#2563eb',
          weight: 2,
          dashArray: '6, 6',
          opacity: 0.75
        }).addTo(map);
      } else {
        navPolyline.setLatLngs([[lat, lng], [${treeLat}, ${treeLng}]]);
      }
    }

    if (${initialUserLat} !== null && ${initialUserLng} !== null) {
      updateUserLocation(${initialUserLat}, ${initialUserLng}, ${initialAccuracy});
    }

    window.updateUserLocation = updateUserLocation;
    window.centerTree = function() { map.panTo([${treeLat}, ${treeLng}]); };
    window.centerUser = function(lat, lng) { if (lat && lng) map.panTo([lat, lng]); };

    setTimeout(function() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
      }
    }, 300);
  </script>
</body>
</html>`;
  }, [treeLat, treeLng, treeName, userLat, userLng, locationAccuracyMeters, locationCapturedAt, effectiveRadiusMeters, trees, engine]);

  useEffect(() => {
    if (!isMapReady || !webViewRef.current || !locationCapturedAt) return;
    const js = `if (window.updateUserLocation) { window.updateUserLocation(${userLat}, ${userLng}, ${locationAccuracyMeters ?? 15}); } true;`;
    webViewRef.current.injectJavaScript(js);
  }, [userLat, userLng, locationAccuracyMeters, locationCapturedAt, isMapReady]);

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'MAP_READY') {
        setIsLoading(false);
        setIsMapReady(true);
      }
    } catch {
      // Ignored
    }
  };

  const handleCenterTree = () => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript('if (window.centerTree) { window.centerTree(); } true;');
    }
  };

  const handleCenterUser = () => {
    if (webViewRef.current && locationCapturedAt) {
      webViewRef.current.injectJavaScript(
        `if (window.centerUser) { window.centerUser(${userLat}, ${userLng}); } true;`,
      );
    }
  };

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent, baseUrl: 'https://novyx.local' }}
        originWhitelist={['*']}
        onMessage={handleMessage}
        onLoadEnd={() => setIsLoading(false)}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        style={styles.webView}
      />

      {/* Top Header Badge */}
      <View pointerEvents="box-none" style={styles.topControlBar}>
        <Badge tone="green">Bản đồ Web (OSM)</Badge>
      </View>

      {/* Floating Recenter Controls */}
      <View pointerEvents="box-none" style={styles.floatingControls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Định tâm tới vị trí cây"
          style={styles.mapActionButton}
          onPress={handleCenterTree}
        >
          <Ionicons name="leaf" size={16} color={colors.primaryDark} />
        </Pressable>

        {locationCapturedAt ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Định tâm tới vị trí của bạn"
            style={styles.mapActionButton}
            onPress={handleCenterUser}
          >
            <Ionicons name="locate" size={16} color={colors.primaryDark} />
          </Pressable>
        ) : null}
      </View>

      {/* Attribution pill */}
      <View pointerEvents="none" style={styles.attributionPill}>
        <Text style={styles.attributionText}>
          Tọa độ cây • {treeLat.toFixed(4)}, {treeLng.toFixed(4)}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={colors.primaryDark} />
          <Text style={styles.loadingText}>Đang tải bản đồ...</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#e5e3df',
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: '#e5e3df',
  },
  topControlBar: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  floatingControls: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    gap: spacing.sm,
    alignItems: 'center',
    zIndex: 10,
  },
  mapActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.snowWhite,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  attributionPill: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    backgroundColor: 'rgba(252, 252, 247, 0.90)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 10,
  },
  attributionText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.pewter,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(252, 252, 247, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    zIndex: 20,
  },
  loadingText: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
});
