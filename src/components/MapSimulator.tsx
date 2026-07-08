import React from 'react';
import { Tree } from '../types';
import { Compass, Navigation, AlertTriangle, CheckCircle, Info } from 'lucide-react';

// Bounding box of the Tao Dan Park simulation area
const LAT_MIN = 10.7735;
const LAT_MAX = 10.7755;
const LNG_MIN = 106.6900;
const LNG_MAX = 106.6925;

export function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metres
}

interface MapSimulatorProps {
  targetTree?: Tree;
  allTrees: Tree[];
  userLat: number;
  userLng: number;
  onPositionSelect?: (lat: number, lng: number) => void;
  interactive?: boolean;
}

export const MapSimulator: React.FC<MapSimulatorProps> = ({
  targetTree,
  allTrees,
  userLat,
  userLng,
  onPositionSelect,
  interactive = false
}) => {
  // Convert lat/lng to percentage coordinates inside the 100x100 SVG space
  const getCoords = (lat: number, lng: number) => {
    const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * 100;
    const y = 100 - ((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * 100;
    return { x, y };
  };

  const userPos = getCoords(userLat, userLng);
  const targetPos = targetTree ? getCoords(targetTree.lat, targetTree.lng) : null;
  const distance = targetTree ? getDistanceMeters(userLat, userLng, targetTree.lat, targetTree.lng) : 0;

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!interactive || !onPositionSelect) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const pctX = (clickX / rect.width) * 100;
    const pctY = (clickY / rect.height) * 100;

    // Convert back to lat/lng
    const clickedLng = LNG_MIN + (pctX / 100) * (LNG_MAX - LNG_MIN);
    const clickedLat = LAT_MIN + ((100 - pctY) / 100) * (LAT_MAX - LAT_MIN);

    onPositionSelect(clickedLat, clickedLng);
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-emerald-50/30 flex flex-col">
      {/* Top Header info */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-slate-100 p-3 flex justify-between items-center text-xs">
        <div className="flex items-center gap-1.5 font-medium text-slate-700">
          <Compass className="w-3.5 h-3.5 text-emerald-600 animate-spin-slow" />
          <span>Bản đồ hiện trường Tao Đàn (GPS Live)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-100 font-mono text-[10px] text-slate-500">
            {userLat.toFixed(6)}, {userLng.toFixed(6)}
          </span>
        </div>
      </div>

      {/* SVG Map Canvas */}
      <div className="relative aspect-video w-full cursor-crosshair overflow-hidden bg-[#eaf4e8]">
        {/* Background park features */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full select-none"
          onClick={handleMapClick}
        >
          {/* Paths / Walkways */}
          <path
            d="M 10 50 Q 50 40 90 50 M 50 10 Q 45 50 50 90 M 20 20 L 80 80 M 80 20 L 20 80"
            fill="none"
            stroke="#f1f3f0"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M 10 50 Q 50 40 90 50 M 50 10 Q 45 50 50 90 M 20 20 L 80 80 M 80 20 L 20 80"
            fill="none"
            stroke="#dfebd6"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Central Lake (Pond) */}
          <ellipse
            cx="65"
            cy="60"
            rx="12"
            ry="8"
            fill="#cfecf7"
            stroke="#b8e2f2"
            strokeWidth="0.5"
          />
          <text x="65" y="61" fill="#4d89a5" fontSize="2.5" fontWeight="bold" textAnchor="middle">
            Hồ cảnh quan
          </text>

          {/* Park Temple (Đền Hùng area) */}
          <rect
            x="35"
            y="20"
            width="8"
            height="8"
            rx="1"
            fill="#f7e6cf"
            stroke="#e7c8a3"
            strokeWidth="0.5"
          />
          <text x="39" y="25" fill="#a47a46" fontSize="2" fontWeight="semibold" textAnchor="middle">
            Đền Hùng
          </text>

          {/* All Trees representation */}
          {allTrees.map((tree) => {
            const coords = getCoords(tree.lat, tree.lng);
            const isTarget = targetTree?.id === tree.id;
            
            // Choose color based on tree condition
            let fillColor = '#4CAF50'; // Healthy green
            if (tree.healthStatus === 'Cần chăm sóc') fillColor = '#FF9800'; // Amber
            if (tree.healthStatus === 'Sâu bệnh') fillColor = '#F44336'; // Red

            return (
              <g key={tree.id} className="transition-transform duration-300 hover:scale-125">
                {/* Visual tree shadow */}
                <ellipse
                  cx={coords.x}
                  cy={coords.y + 1}
                  rx="2"
                  ry="1"
                  fill="rgba(0,0,0,0.1)"
                />
                
                {/* Interactive tree canopy highlight */}
                {isTarget && (
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r="4"
                    fill="none"
                    stroke="#2E7D32"
                    strokeWidth="0.5"
                    strokeDasharray="1 1"
                    className="animate-spin-slow"
                  />
                )}

                {/* Tree point */}
                <circle
                  cx={coords.x}
                  cy={coords.y}
                  r={isTarget ? "2.5" : "2"}
                  fill={fillColor}
                  stroke={isTarget ? '#1B5E20' : '#ffffff'}
                  strokeWidth={isTarget ? '0.75' : '0.5'}
                />

                {/* Tree short text ID */}
                <text
                  x={coords.x}
                  y={coords.y - 3.5}
                  fill="#1b2a1a"
                  fontSize="2"
                  fontWeight="bold"
                  textAnchor="middle"
                  className="bg-white/80"
                >
                  {tree.id}
                </text>
              </g>
            );
          })}

          {/* User connection path to target */}
          {targetPos && (
            <line
              x1={userPos.x}
              y1={userPos.y}
              x2={targetPos.x}
              y2={targetPos.y}
              stroke={distance < 10 ? '#4CAF50' : '#FF9800'}
              strokeWidth="0.75"
              strokeDasharray="2 1.5"
            />
          )}

          {/* User current location indicator */}
          <g>
            {/* Pulsing radius */}
            <circle
              cx={userPos.x}
              cy={userPos.y}
              r="4.5"
              fill="rgba(33, 150, 243, 0.2)"
            >
              <animate
                attributeName="r"
                values="2;6;2"
                dur="2.5s"
                repeatCount="indefinite"
              />
            </circle>
            {/* Solid core */}
            <circle
              cx={userPos.x}
              cy={userPos.y}
              r="1.2"
              fill="#2196F3"
              stroke="#ffffff"
              strokeWidth="0.5"
            />
          </g>
        </svg>

        {/* Small tooltip indicating GPS interactive control if allowed */}
        {interactive && (
          <div className="absolute bottom-2 left-2 right-2 bg-slate-900/85 backdrop-blur-sm text-[10px] text-white py-1 px-2 rounded-lg flex items-center justify-between shadow-md">
            <span className="flex items-center gap-1">
              <Info className="w-3 h-3 text-sky-400" />
              <span>Chạm bản đồ để giả lập vị trí của bạn ngoài thực tế</span>
            </span>
          </div>
        )}
      </div>

      {/* Target Tree details panel inside Map (if target tree exists) */}
      {targetTree && (
        <div className="p-3 bg-white border-t border-slate-100 flex flex-col gap-2.5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                Cây mục tiêu
              </p>
              <h4 className="text-sm font-semibold text-slate-800">
                {targetTree.name} ({targetTree.id})
              </h4>
              <p className="text-xs text-slate-500 line-clamp-1 flex items-center gap-1">
                <Navigation className="w-3 h-3 text-slate-400 flex-shrink-0" />
                <span>{targetTree.address}</span>
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-[10px] text-slate-400 font-medium">KHOẢNG CÁCH</span>
              <p className={`text-base font-bold font-mono tracking-tight ${distance < 10 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {distance.toFixed(1)} m
              </p>
            </div>
          </div>

          {/* GPS Check Status Banner */}
          <div
            className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium border ${
              distance < 10
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                : 'bg-amber-50 border-amber-100 text-amber-800'
            }`}
          >
            {distance < 10 ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div className="flex-1 leading-tight">
                  <span className="font-semibold text-emerald-900">GPS Hợp lệ!</span> Bạn đang đứng trong phạm vi tác nghiệp an toàn ({distance.toFixed(1)}m &lt; 10m).
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <div className="flex-1 leading-tight">
                  <span className="font-semibold text-amber-900 font-semibold">Ngoài phạm vi!</span> Bạn cần đứng sát gốc cây (&lt; 10m) để kích hoạt quét QR & làm việc.
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
