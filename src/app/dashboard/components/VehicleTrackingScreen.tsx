"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import mqtt, { MqttClient } from "mqtt";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const MapContainerAny: any = MapContainer;
const TileLayerAny: any = TileLayer;
const MarkerAny: any = Marker;
// Fix cho default marker icon của leaflet trong Next.js
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

interface TrackingPayload {
  deviceId: number; // ID device trong flespi
  imei: string;
  tmpToken: string; // token flespi tạm thời
  exp: number;
}

interface VehicleLocation {
  lat: number;
  lng: number;
  speed?: number;
  ts?: number;
}

interface VehicleTrackingScreenProps {
  vehicleId: string;
  backHref: string;
  backLabel?: string;
}

function parseCoord(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const num =
    typeof value === "string"
      ? parseFloat(value)
      : typeof value === "number"
      ? value
      : null;

  if (num === null || Number.isNaN(num)) return null;
  return num;
}

function extractLatLng(obj: any): { lat: number; lng: number } | null {
  if (!obj || typeof obj !== "object") return null;

  const candidates: Array<[any, any]> = [
    [obj.lastLatitude, obj.lastLongitude],
    [obj.lastLat, obj.lastLng],
    [obj.latitude, obj.longitude],
    [obj.lat, obj.lng],
    [obj["position.latitude"], obj["position.longitude"]],
    [obj["position.lat"], obj["position.lng"]],
    [obj["gps.latitude"], obj["gps.longitude"]],
    [obj["gps.lat"], obj["gps.lng"]],
    [obj?.location?.latitude, obj?.location?.longitude],
    [obj?.location?.lat, obj?.location?.lng],
    [obj?.currentLocation?.latitude, obj?.currentLocation?.longitude],
    [obj?.currentLocation?.lat, obj?.currentLocation?.lng],
    [obj?.position?.latitude, obj?.position?.longitude],
  ];

  for (const [rawLat, rawLng] of candidates) {
    const lat = parseCoord(rawLat);
    const lng = parseCoord(rawLng);
    if (lat !== null && lng !== null) {
      return { lat, lng };
    }
  }

  return null;
}

// Component để pan map khi vị trí thay đổi
function RecenterOnMarker({ position }: { position: LatLngExpression }) {
  const map = useMap();
  useEffect(() => {
    // Giữ nguyên zoom level hiện tại khi pan đến vị trí mới
    const currentZoom = map.getZoom();
    map.setView(position, currentZoom, {
      animate: true,
      duration: 0.5,
    });
    // Invalidate size để đảm bảo tiles được load đúng
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [position, map]);
  return null;
}

// Component để đảm bảo map hiển thị đúng khi zoom
function MapZoomHandler() {
  const map = useMap();
  
  useEffect(() => {
    const handleZoom = () => {
      // Invalidate size khi zoom để đảm bảo tiles được load
      setTimeout(() => {
        map.invalidateSize();
      }, 50);
    };
    
    map.on('zoomend', handleZoom);
    map.on('zoom', handleZoom);
    
    return () => {
      map.off('zoomend', handleZoom);
      map.off('zoom', handleZoom);
    };
  }, [map]);
  
  return null;
}

export default function VehicleTrackingScreen({
  vehicleId,
  backHref,
  backLabel = "← Quay lại danh sách xe",
}: VehicleTrackingScreenProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [licensePlate, setLicensePlate] = useState<string>("");
  const [payload, setPayload] = useState<TrackingPayload | null>(null);
  const [location, setLocation] = useState<VehicleLocation | null>(null);
  const [mqttStatus, setMqttStatus] = useState<string>("Disconnected");

  // 1) Gọi API tracking của BE để lấy tmpToken + deviceId
  useEffect(() => {
    let cancelled = false;

    async function loadTrackingInfo() {
      try {
        setLoading(true);
        const res = await fetch(`/api/vehicle/tracking/${vehicleId}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error("Tracking API failed:", res.status, res.statusText, errorText);
          return;
        }

        const text = await res.text();
        let json: any;
        try {
          json = text ? JSON.parse(text) : {};
        } catch (parseErr) {
          console.error("Failed to parse tracking response:", parseErr, text);
          return;
        }
        // Thử lấy vị trí cuối cùng từ response nếu có
        if (json && !cancelled) {
          const possibleLocation =
            extractLatLng(json.data) ||
            extractLatLng(json.data?.vehicle) ||
            extractLatLng(json.data?.trackingInfo) ||
            extractLatLng(json);

          if (possibleLocation) {
            setLocation(possibleLocation);
          }
        }

        // Xử lý nhiều cấu trúc response khác nhau
        // BE trả về: { success: true, data: { tempTrackingPayload: { tmpToken, deviceId, imei, ... } } }
        let trackingData: any = null;
        
        if (json.success && json.data) {
          // Ưu tiên lấy tempTrackingPayload (BE dùng tên này)
          if (json.data.tempTrackingPayload) {
            trackingData = json.data.tempTrackingPayload;
          } else if (json.data.tmpTrackingPayload) {
            trackingData = json.data.tmpTrackingPayload;
          } else {
            // Fallback: thử lấy từ data nếu không có payload wrapper
            trackingData = json.data;
          }
        } else if (json.data) {
          trackingData = json.data.tempTrackingPayload || json.data.tmpTrackingPayload || json.data;
        } else if (json.tempTrackingPayload || json.tmpTrackingPayload) {
          trackingData = json.tempTrackingPayload || json.tmpTrackingPayload;
        } else {
          trackingData = json;
        }
        const p = trackingData;
        const tmpToken = p?.tmpToken || p?.token || p?.tmp_token;
        const deviceId = p?.deviceId || p?.device_id;
        const imei = p?.imei;
        if (!tmpToken || (!deviceId && !imei)) {
          console.error(
            "Tracking payload thiếu token hoặc deviceId/imei:",
            { tmpToken, deviceId, imei, fullPayload: p, trackingData }
          );
          return;
        }

        // Tạo payload chuẩn
        const normalizedPayload: TrackingPayload = {
          tmpToken: tmpToken,
          deviceId: deviceId || 0,
          imei: imei || "",
          exp: p?.exp || 0,
        };

        if (!cancelled) {
          const licensePlate = json.data?.licensePlate || json.licensePlate || "";
          setLicensePlate(licensePlate);
          setPayload(normalizedPayload);
          // Nếu payload có sẵn vị trí cuối cùng thì tận dụng luôn
          const payloadLocation =
            extractLatLng(trackingData) ||
            extractLatLng(trackingData?.lastKnownLocation);
          if (payloadLocation) {
            setLocation(payloadLocation);
          }
        }
      } catch (err) {
        console.error("Error loading tracking info:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTrackingInfo();

    return () => {
      cancelled = true;
    };
  }, [vehicleId]);

  const fetchTelemetryPosition = useCallback(async (): Promise<VehicleLocation | null> => {
    if (!payload?.tmpToken || (!payload.deviceId && !payload.imei)) return null;

    try {
      const deviceIdentifier = payload.deviceId || payload.imei;
      const url = `https://flespi.io/gw/devices/${deviceIdentifier}/telemetry/position`;

      const res = await fetch(url, {
        headers: {
          Authorization: `FlespiToken ${payload.tmpToken}`,
        },
      });

      if (!res.ok) {
        console.warn(
          "Failed to fetch telemetry position:",
          res.status,
          res.statusText
        );
        return null;
      }

      const json = await res.json();
      const telemetryEntry = json?.result?.[0]?.telemetry?.position;
      const value = telemetryEntry?.value;

      if (!value) {
        console.warn(
          "Telemetry position response missing value for device",
          deviceIdentifier,
          json
        );
        return null;
      }

      const coords = extractLatLng({
        latitude: value.latitude ?? telemetryEntry?.latitude,
        longitude: value.longitude ?? telemetryEntry?.longitude,
        lat: value.lat,
        lng: value.lng,
      });

      if (!coords) return null;

      return {
        lat: coords.lat,
        lng: coords.lng,
        speed:
          parseCoord(value.speed) ??
          parseCoord(telemetryEntry?.speed) ??
          undefined,
        ts:
          parseCoord(value.ts) ??
          parseCoord(telemetryEntry?.ts) ??
          parseCoord(value.timestamp) ??
          parseCoord(telemetryEntry?.timestamp) ??
          undefined,
      };
    } catch (error) {
      console.error("Failed to fetch telemetry position:", error);
      return null;
    }
  }, [payload]);

  // 2) Kết nối MQTT WebSocket tới flespi và subscribe topic
  useEffect(() => {
    if (!payload?.tmpToken || (!payload.deviceId && !payload.imei)) return;

    const token = payload.tmpToken;
    const deviceId = payload.deviceId || payload.imei; // Dùng imei nếu không có deviceId

    // wss://mqtt.flespi.io:443  (WebSocket over SSL)
    const client: MqttClient = mqtt.connect("wss://mqtt.flespi.io", {
      username: token, // token flespi dùng làm username
      password: "", // password để trống
      reconnectPeriod: 3000, // tự reconnect sau 3s
      connectTimeout: 30_000,
      protocolVersion: 5,
    });

    setMqttStatus("Connecting...");

    client.on("connect", () => {
      setMqttStatus("Connected");

      const topic = `flespi/message/gw/devices/${deviceId}`;
      client.subscribe(topic, { qos: 0 }, (err) => {
        if (err) {
          console.error("Subscribe error:", err);
        } else {
        }
      });
    });

    client.on("reconnect", () => setMqttStatus("Reconnecting..."));
    client.on("close", () => setMqttStatus("Disconnected"));
    client.on("error", (err) => {
      console.error("MQTT error:", err);
      setMqttStatus("Error");
    });

    client.on("message", (topic, payloadBuf) => {
      try {
        const payloadStr = payloadBuf.toString();
        const msg = JSON.parse(payloadStr);
        // Flespi có thể trả về nhiều format khác nhau
        // Thử các cách parse khác nhau
        let lat: number | undefined;
        let lng: number | undefined;
        let speed: number | undefined;
        let ts: number | undefined;

        // Format 1: position.latitude, position.longitude (dấu chấm)
        if (msg["position.latitude"] !== undefined) {
          lat = msg["position.latitude"];
          lng = msg["position.longitude"];
          speed = msg["position.speed"];
        }
        // Format 2: position: { latitude, longitude }
        else if (msg.position?.latitude !== undefined) {
          lat = msg.position.latitude;
          lng = msg.position.longitude;
          speed = msg.position.speed;
        }
        // Format 3: latitude, longitude trực tiếp
        else if (msg.latitude !== undefined) {
          lat = msg.latitude;
          lng = msg.longitude;
          speed = msg.speed;
        }
        // Format 4: lat, lng
        else if (msg.lat !== undefined) {
          lat = msg.lat;
          lng = msg.lng;
          speed = msg.speed;
        }

        // Timestamp
        ts = msg.timestamp || msg["timestamp"] || msg.time || msg["time"] || Date.now() / 1000;
        if (typeof lat === "number" && typeof lng === "number" && !isNaN(lat) && !isNaN(lng)) {
          setLocation({
            lat,
            lng,
            speed,
            ts,
          });
        } else {
          console.warn("Message không có vị trí hợp lệ. Full message:", msg);
          console.warn("Available keys in message:", Object.keys(msg));
        }
      } catch (e) {
        console.error("Parse MQTT message error:", e, payloadBuf.toString());
      }
    });

    // cleanup khi unmount
    return () => {
      client.end(true);
    };
  }, [payload]);

  // 3) Fallback: gọi REST flespi để lấy location gần nhất nếu MQTT chưa gửi kịp
  useEffect(() => {
    if (!payload?.tmpToken || (!payload.deviceId && !payload.imei)) return;

    let cancelled = false;

    async function fetchAndSet() {
      const latest = await fetchTelemetryPosition();
      if (!cancelled && latest) {
        setLocation(latest);
      }
    }

    fetchAndSet();

    return () => {
      cancelled = true;
    };
  }, [payload, fetchTelemetryPosition]);

  // 4) Poll telemetry định kỳ (5-10s) để cập nhật vị trí mới nhất
  useEffect(() => {
    if (!payload?.tmpToken || (!payload.deviceId && !payload.imei)) return;

    const interval = setInterval(async () => {
      const latest = await fetchTelemetryPosition();
      if (latest) {
        setLocation((prev) => {
          if (prev?.lat === latest.lat && prev?.lng === latest.lng && prev?.ts === latest.ts) {
            return prev;
          }
          return latest;
        });
      }
    }, 8000); // ~8s để nằm giữa ngưỡng 5-10s

    return () => clearInterval(interval);
  }, [payload, fetchTelemetryPosition]);

  // vị trí mặc định nếu chưa có GPS (Hồ Chí Minh)
  const defaultCenter: LatLngExpression = [10.776, 106.7];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            {backLabel}
          </Link>
          <div>
            <h1 className="text-xl font-semibold">
              Theo dõi vị trí xe realtime
            </h1>
            <p className="text-sm text-gray-500">
              Vehicle ID: {vehicleId}{" "}
              {licensePlate && `| Biển số: ${licensePlate}`}
            </p>
          </div>
        </div>
        <div className="text-sm">
          <span className="font-medium">MQTT: </span>
          <span
            className={
              mqttStatus === "Connected"
                ? "text-green-500"
                : mqttStatus === "Error"
                ? "text-red-500"
                : "text-yellow-500"
            }
          >
            {mqttStatus}
          </span>
        </div>
      </div>

      {loading && (
        <div className="text-sm text-gray-500">Đang load tracking info...</div>
      )}

      {!loading && !payload && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 mb-4 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-red-900 mb-2">
                Xe này chưa được cấu hình tracking
              </h3>
              <p className="text-base text-red-800 mb-3">
                Không thể lấy được token tracking từ server. Xe này có thể chưa được cấu hình thiết bị GPS hoặc chưa được kích hoạt tính năng tracking.
              </p>
              <div className="bg-white rounded p-4 border border-red-200">
                <p className="text-sm text-red-700 font-medium mb-2">
                  Để kích hoạt tracking cho xe này, bạn cần:
                </p>
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1 ml-2">
                  <li>Cấu hình GPS Device ID hoặc Flespi Device ID trong thông tin xe</li>
                  <li>Đảm bảo thiết bị GPS đã được kết nối và hoạt động</li>
                  <li>Liên hệ quản trị viên hệ thống để kích hoạt tính năng tracking</li>
                </ul>
              </div>
              <div className="mt-4 pt-4 border-t border-red-200">
                <p className="text-xs text-red-600">
                  <strong>Lưu ý:</strong> Hiện tại chỉ có một số xe được cấu hình tracking. 
                  Vui lòng quay lại danh sách xe để xem các xe có hỗ trợ tracking.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && payload && !location && (
        <div className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded border border-yellow-200">
          <p className="font-medium">Đang chờ dữ liệu GPS từ thiết bị...</p>
          <p className="text-xs mt-1">
            MQTT đã kết nối và đang lắng nghe topic:{" "}
            <code className="bg-yellow-100 px-1 rounded">
              flespi/message/gw/devices/{payload.deviceId || payload.imei}
            </code>
          </p>
          <p className="text-xs mt-1 text-gray-600">
            Vui lòng đảm bảo thiết bị đang hoạt động và gửi dữ liệu GPS lên Flespi.
          </p>
        </div>
      )}

      {!loading && !payload ? (
        // Ẩn map khi không có tracking
        <div className="h-[300px] w-full rounded-lg overflow-hidden shadow bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
          <div className="text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <p className="text-gray-500 font-medium">Bản đồ không khả dụng</p>
            <p className="text-sm text-gray-400 mt-1">Xe này chưa được cấu hình tracking</p>
          </div>
        </div>
      ) : (
        <div className="h-[500px] w-full rounded-lg overflow-hidden shadow relative">
          <MapContainerAny
            ref={mapRef as any}
            key={location ? `${location.lat}-${location.lng}` : 'default'}
            center={location ? ([location.lat, location.lng] as any) : (defaultCenter as any)}
            zoom={location ? 15 : 13}
            minZoom={3}
            maxZoom={19}
            style={{ height: "100%", width: "100%" }}
            whenReady={() => {
              if (mapRef.current) {
                mapRef.current.invalidateSize();
              }
            }}
          >
          <TileLayerAny
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
            maxNativeZoom={19}
            tileSize={256}
            zoomOffset={0}
          />

          <MapZoomHandler />
          {location ? (
            <>
              <MarkerAny 
                position={[location.lat, location.lng]}
                icon={L.icon({
                  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
                  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41]
                })}
              >
                <Popup>
                  <div className="text-sm">
                    <div>
                      <b>Biển số:</b> {licensePlate || "N/A"}
                    </div>
                    <div>
                      <b>Vị trí:</b> {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </div>
                    <div>
                      <b>Tốc độ:</b>{" "}
                      {location.speed != null
                        ? `${location.speed} km/h`
                        : "N/A"}
                    </div>
                    <div>
                      <b>Thời gian:</b>{" "}
                      {location.ts
                        ? new Date(location.ts * 1000).toLocaleString("vi-VN")
                        : "N/A"}
                    </div>
                  </div>
                </Popup>
              </MarkerAny>
              {/* Pan map theo marker */}
              <RecenterOnMarker position={[location.lat, location.lng]} />
            </>
          ) : (
            // Hiển thị marker mặc định ở trung tâm bản đồ khi chưa có vị trí
            <MarkerAny position={defaultCenter}>
              <Popup>
                <div className="text-sm">
                  <b>Đang chờ vị trí GPS...</b>
                  <p className="text-xs mt-1 text-gray-500">
                    Chưa nhận được dữ liệu từ thiết bị
                  </p>
                </div>
              </Popup>
            </MarkerAny>
          )}
          </MapContainerAny>
        
          {/* Overlay thông tin khi chưa có vị trí */}
          {!location && payload && (
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200 z-[1000] max-w-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">
                  Đang chờ dữ liệu GPS
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Device ID: {payload.deviceId || payload.imei}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Kiểm tra console để xem message từ MQTT
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

