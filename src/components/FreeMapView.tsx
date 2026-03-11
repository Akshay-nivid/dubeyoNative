import React from "react";
import { ActivityIndicator, View } from "react-native";
import { WebView } from "react-native-webview";

interface FreeMapViewProps {
  latitude: number;
  longitude: number;
  title?: string;
  address?: string;
  zoom?: number;
}

const FreeMapView: React.FC<FreeMapViewProps> = ({
  latitude,
  longitude,
  title = "Location",
  address = "",
  zoom = 13,
}) => {
  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { height: 100vh; width: 100vw; }
          .leaflet-control-attribution { display: none !important; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map', {
            zoomControl: false,
            attributionControl: false
          }).setView([${latitude}, ${longitude}], ${zoom});

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
          }).addTo(map);

          const marker = L.marker([${latitude}, ${longitude}]).addTo(map);
          if ('${title}' || '${address}') {
            marker.bindPopup("<b>${title}</b><br>${address}").openPopup();
          }

          // Disable all interactions if needed, but here we keep it interactive
          // map.dragging.disable();
          // map.touchZoom.disable();
          // map.doubleClickZoom.disable();
          // map.scrollWheelZoom.disable();
        </script>
      </body>
    </html>
  `;

  return (
    <View className="flex-1 overflow-hidden rounded-2xl">
      <View className="flex-1">
        <WebView
          originWhitelist={["*"]}
          source={{ html: mapHtml }}
          style={{ flex: 1 }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View className="absolute inset-0 bg-[#f3f4f6] justify-center items-center">
              <ActivityIndicator size="large" color="#0000ff" />
            </View>
          )}
        />
      </View>
    </View>
  );
};

export default FreeMapView;
