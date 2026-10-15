import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Badge } from '../AppPrimitives';
import { colors, radius } from '../../theme/tokens';

export type MapEngine = 'google' | 'leaflet';

export interface WebMapViewProps {
  treeLat: number;
  treeLng: number;
  treeName: string;
  userLat: number;
  userLng: number;
  locationAccuracyMeters: number | null;
  locationCapturedAt: string | null;
  apiKey?: string;
  initialEngine?: MapEngine;
  style?: StyleProp<ViewStyle>;
}

export function WebMapView({
  treeLat,
  treeLng,
  treeName,
  userLat,
  userLng,
  locationAccuracyMeters,
  locationCapturedAt,
  apiKey,
  initialEngine = 'google',
  style,
}: WebMapViewProps) {
  const [engine, setEngine] = useState<MapEngine>(initialEngine);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const effectiveApiKey =
    apiKey ||
    (Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS
      : process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID) ||
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    '';

  const htmlContent = useMemo(() => {
    const escapedName = JSON.stringify(treeName);
    const hasInitialUser = Boolean(locationCapturedAt);
    const initialUserLat = hasInitialUser ? userLat : 'null';
    const initialUserLng = hasInitialUser ? userLng : 'null';
    const initialAccuracy = locationAccuracyMeters ?? 15;

    if (engine === 'google' && effectiveApiKey) {
      return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #e5e3df; overflow: hidden; }
  </style>
  <script>
    function gm_authFailure() {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'GOOGLE_AUTH_FAILURE' }));
      }
    }
  </script>
  <script src="https://maps.googleapis.com/maps/api/js?key=${effectiveApiKey}&callback=initMap" async defer></script>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = null;
    var treeMarker = null;
    var treeCircle = null;
    var userMarker = null;
    var userCircle = null;
    var navPolyline = null;

    var treeLat = ${treeLat};
    var treeLng = ${treeLng};
    var treeName = ${escapedName};
    var initialUserLat = ${initialUserLat};
    var initialUserLng = ${initialUserLng};
    var initialAccuracy = ${initialAccuracy};

    window.initMap = function() {
      var treePos = { lat: treeLat, lng: treeLng };
      map = new google.maps.Map(document.getElementById('map'), {
        center: treePos,
        zoom: 17,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
          position: google.maps.ControlPosition.LEFT_BOTTOM
        },
        scaleControl: true,
        streetViewControl: false,
        fullscreenControl: false
      });

      treeMarker = new google.maps.Marker({
        position: treePos,
        map: map,
        title: treeName,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
          scaledSize: new google.maps.Size(38, 38)
        }
      });

      var infoWindow = new google.maps.InfoWindow({
        content: '<div style="font-weight:600;font-size:12px;padding:2px;">' + treeName + '<br/><span style="font-weight:normal;color:#555;">Vị trí cây được giao</span></div>'
      });
      treeMarker.addListener('click', function() {
        infoWindow.open(map, treeMarker);
      });

      treeCircle = new google.maps.Circle({
        strokeColor: '#15803d',
        strokeOpacity: 0.85,
        strokeWeight: 2,
        fillColor: '#22c55e',
        fillOpacity: 0.2,
        map: map,
        center: treePos,
        radius: 10
      });

      if (initialUserLat !== null && initialUserLng !== null) {
        window.updateUserLocation(initialUserLat, initialUserLng, initialAccuracy);
      }

      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
      }
    };

    window.updateUserLocation = function(lat, lng, acc) {
      if (!map || typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return;
      var userPos = { lat: lat, lng: lng };

      if (!userMarker) {
        userMarker = new google.maps.Marker({
          position: userPos,
          map: map,
          title: 'Vị trí thiết bị của bạn',
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            scaledSize: new google.maps.Size(36, 36)
          }
        });
      } else {
        userMarker.setPosition(userPos);
      }

      var accRadius = (typeof acc === 'number' && acc > 0) ? acc : 15;
      if (!userCircle) {
        userCircle = new google.maps.Circle({
          strokeColor: '#2563eb',
          strokeOpacity: 0.7,
          strokeWeight: 1,
          fillColor: '#3b82f6',
          fillOpacity: 0.12,
          map: map,
          center: userPos,
          radius: accRadius
        });
      } else {
        userCircle.setCenter(userPos);
        userCircle.setRadius(accRadius);
      }

      var lineCoordinates = [
        { lat: lat, lng: lng },
        { lat: treeLat, lng: treeLng }
      ];

      var lineSymbol = {
        path: 'M 0,-1 0,1',
        strokeOpacity: 1,
        scale: 3
      };

      if (!navPolyline) {
        navPolyline = new google.maps.Polyline({
          path: lineCoordinates,
          strokeColor: '#2563eb',
          strokeOpacity: 0,
          icons: [{
            icon: lineSymbol,
            offset: '0',
            repeat: '14px'
          }],
          map: map
        });
      } else {
        navPolyline.setPath(lineCoordinates);
      }

      var bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: treeLat, lng: treeLng });
      bounds.extend(userPos);
      map.fitBounds(bounds, { top: 60, bottom: 40, left: 40, right: 40 });
    };
  </script>
</body>
</html>`;
    }

    // Leaflet OpenStreetMap Engine
    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #f0fdf4; overflow: hidden; }
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
      font-size: 16px;
      color: #ffffff;
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
      position: relative;
    }
    .user-pin::after {
      content: '';
      position: absolute;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #ffffff;
    }
    .pulse-ring {
      position: absolute;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      border: 2px solid rgba(37,99,235,0.5);
      animation: pulse 2s infinite ease-out;
    }
    @keyframes pulse {
      0% { transform: scale(0.6); opacity: 1; }
      100% { transform: scale(1.6); opacity: 0; }
    }
    .leaflet-control-zoom {
      margin-bottom: 12px !important;
      margin-right: 12px !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var treeLat = ${treeLat};
    var treeLng = ${treeLng};
    var treeName = ${escapedName};
    var initialUserLat = ${initialUserLat};
    var initialUserLng = ${initialUserLng};
    var initialAccuracy = ${initialAccuracy};

    var map = L.map('map', {
      zoomControl: true,
      attributionControl: false
    }).setView([treeLat, treeLng], 18);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    var treeIcon = L.divIcon({
      className: 'tree-pin',
      html: '🌲',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    var treeMarker = L.marker([treeLat, treeLng], { icon: treeIcon }).addTo(map);
    treeMarker.bindTooltip(treeName + ' (Cây cần chăm sóc)', { permanent: false, direction: 'top' });

    var treeCheckinCircle = L.circle([treeLat, treeLng], {
      radius: 10,
      color: '#15803d',
      fillColor: '#22c55e',
      fillOpacity: 0.18,
      weight: 2
    }).addTo(map);

    var userMarker = null;
    var userAccCircle = null;
    var navPolyline = null;

    window.updateUserLocation = function(lat, lng, acc) {
      if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return;

      if (!userMarker) {
        var userIcon = L.divIcon({
          className: 'user-pin',
          html: '<div class="pulse-ring"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
        userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(map);
        userMarker.bindTooltip('Vị trí thiết bị của bạn', { direction: 'bottom' });
      } else {
        userMarker.setLatLng([lat, lng]);
      }

      var accuracyRadius = (typeof acc === 'number' && acc > 0) ? acc : 15;
      if (!userAccCircle) {
        userAccCircle = L.circle([lat, lng], {
          radius: accuracyRadius,
          color: '#2563eb',
          fillColor: '#3b82f6',
          fillOpacity: 0.12,
          weight: 1
        }).addTo(map);
      } else {
        userAccCircle.setLatLng([lat, lng]);
        userAccCircle.setRadius(accuracyRadius);
      }

      if (!navPolyline) {
        navPolyline = L.polyline([[lat, lng], [treeLat, treeLng]], {
          color: '#2563eb',
          weight: 2,
          dashArray: '6, 6',
          opacity: 0.75
        }).addTo(map);
      } else {
        navPolyline.setLatLngs([[lat, lng], [treeLat, treeLng]]);
      }

      var bounds = L.latLngBounds([
        [treeLat, treeLng],
        [lat, lng]
      ]);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 18 });
    };

    if (initialUserLat !== null && initialUserLng !== null) {
      window.updateUserLocation(initialUserLat, initialUserLng, initialAccuracy);
    }

    function notifyReady() {
      var msg = JSON.stringify({ type: 'MAP_READY' });
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(msg);
      }
    }

    setTimeout(notifyReady, 300);
  </script>
</body>
</html>`;
  }, [
    treeLat,
    treeLng,
    treeName,
    locationCapturedAt,
    userLat,
    userLng,
    locationAccuracyMeters,
    engine,
    effectiveApiKey,
  ]);

  // Khi vị trí thiết bị thay đổi ở phía React Native, gửi cập nhật vào webview
  useEffect(() => {
    if (!isMapReady || !locationCapturedAt || !webViewRef.current) return;
    const script = `
      if (window.updateUserLocation) {
        window.updateUserLocation(${userLat}, ${userLng}, ${locationAccuracyMeters ?? 15});
      }
      true;
    `;
    webViewRef.current.injectJavaScript(script);
  }, [userLat, userLng, locationAccuracyMeters, locationCapturedAt, isMapReady]);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as { type?: string };
      if (data.type === 'MAP_READY') {
        setIsMapReady(true);
        setIsLoading(false);
      } else if (data.type === 'GOOGLE_AUTH_FAILURE') {
        // Nếu Google Maps API key bị lỗi quyền hoặc domain, tự động chuyển về Leaflet
        setEngine('leaflet');
      }
    } catch {
      // Bỏ qua lỗi parse
    }
  };

  const handleSwitchEngine = (targetEngine: MapEngine) => {
    if (engine === targetEngine) return;
    setIsLoading(true);
    setIsMapReady(false);
    setHasError(false);
    setEngine(targetEngine);
  };

  if (hasError) {
    return (
      <View style={[styles.container, styles.fallbackContainer, style]}>
        <View style={styles.fallbackIcon}>
          <Ionicons name="map-outline" size={32} color={colors.primaryDark} />
        </View>
        <Text style={styles.fallbackTitle}>Bản đồ không thể tải</Text>
        <Text style={styles.fallbackDesc}>
          Không thể kết nối dịch vụ bản đồ {engine === 'google' ? 'Google Maps' : 'Leaflet'}.
        </Text>
        <Pressable
          style={styles.retryButton}
          onPress={() => handleSwitchEngine(engine === 'google' ? 'leaflet' : 'google')}
        >
          <Text style={styles.retryButtonText}>Chuyển sang {engine === 'google' ? 'Leaflet OSM' : 'Google Maps'}</Text>
        </Pressable>
        <View style={styles.coordsCard}>
          <Text style={styles.coordText}>
            Cây: {treeLat.toFixed(5)}, {treeLng.toFixed(5)}
          </Text>
          <Text style={styles.coordText}>
            GPS: {userLat.toFixed(5)}, {userLng.toFixed(5)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <WebView
        key={`map-engine-${engine}`}
        ref={webViewRef}
        source={{ html: htmlContent, baseUrl: 'https://novyx.local' }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        onLoadEnd={() => setIsLoading(false)}
        onError={() => setHasError(true)}
        onHttpError={() => setHasError(true)}
        onMessage={handleMessage}
        style={styles.webView}
      />

      {/* Thanh điều khiển chuyển đổi giữa Google Maps và Leaflet OSM */}
      <View style={styles.topControlBar}>
        <View style={styles.switcherContainer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Chọn Google Maps"
            style={[styles.switcherButton, engine === 'google' && styles.switcherButtonActive]}
            onPress={() => handleSwitchEngine('google')}
          >
            <Ionicons name="logo-google" size={12} color={engine === 'google' ? colors.snowWhite : colors.pewter} />
            <Text style={[styles.switcherText, engine === 'google' && styles.switcherTextActive]}>Google Maps</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Chọn Leaflet OpenStreetMap"
            style={[styles.switcherButton, engine === 'leaflet' && styles.switcherButtonActive]}
            onPress={() => handleSwitchEngine('leaflet')}
          >
            <Ionicons name="map-outline" size={12} color={engine === 'leaflet' ? colors.snowWhite : colors.pewter} />
            <Text style={[styles.switcherText, engine === 'leaflet' && styles.switcherTextActive]}>Leaflet OSM</Text>
          </Pressable>
        </View>

        <Badge tone={engine === 'google' ? 'sky' : 'green'}>
          {engine === 'google' ? 'Google Maps' : 'Bản đồ Web (OSM)'}
        </Badge>
      </View>

      {isLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={colors.primaryDark} />
          <Text style={styles.loadingText}>Đang tải {engine === 'google' ? 'Google Maps...' : 'Leaflet OSM...'}</Text>
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
    backgroundColor: colors.backgroundAlt,
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
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
    gap: 8,
  },
  switcherContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: radius.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    gap: 2,
  },
  switcherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    minHeight: 30,
  },
  switcherButtonActive: {
    backgroundColor: colors.primaryDark,
  },
  switcherText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.foreground,
  },
  switcherTextActive: {
    color: colors.snowWhite,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(240, 253, 244, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    zIndex: 5,
  },
  loadingText: {
    fontSize: 12,
    color: colors.primaryDark,
    fontWeight: '500',
  },
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  fallbackIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  fallbackDesc: {
    fontSize: 12,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryButton: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.md,
    marginTop: 4,
  },
  retryButtonText: {
    color: colors.snowWhite,
    fontSize: 12,
    fontWeight: '600',
  },
  coordsCard: {
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    gap: 4,
    marginTop: 6,
  },
  coordText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: colors.pewter,
  },
});
