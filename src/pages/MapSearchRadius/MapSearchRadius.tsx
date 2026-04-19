import { useEffect, useRef, useState, useCallback } from 'react';
import './MapSearchRadius.css';
import { PostAPI } from '../../api/api';
import RoomCardHome from '../../components/rooms/RoomCardHome';
import RoomDetail from '../../components/rooms/RoomDetail';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default icon bị mất khi dùng với Vite/Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const activeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// ─── Types ───────────────────────────────────────────────────────────────────

interface Coords {
  lat: number;
  lng: number;
}

interface Room {
  _id: string;
  title: string;
  description: string;
  price: number;
  city: string;
  district: string;
  ward?: string;
  address: string;
  superficies?: number;
  images?: string[];
  coords?: Coords | null;
  distance?: number;
}

interface RoomApiItem {
  _id: string;
  title: string;
  description: string;
  price: number;
  city: string;
  district: string;
  ward?: string;
  address: string;
  superficies?: number;
  images?: string[];
  lat?: number | string;
  lon?: number | string;
  lng?: number | string;
  latitude?: number | string;
  longitude?: number | string;
  location?: {
    lat?: number | string;
    lon?: number | string;
    lng?: number | string;
    latitude?: number | string;
    longitude?: number | string;
  };
  distance?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(p: number): string {
  if (p >= 1000000) return (p / 1000000).toFixed(1).replace('.0', '') + ' triệu';
  return p.toLocaleString() + ' đ';
}

function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
  return `${distanceKm.toFixed(1)} km`;
}

function getRoomAddress(room: Room): string {
  return [room.address, room.ward, room.district, room.city].filter(Boolean).join(', ');
}

function extractCoords(room: RoomApiItem): Coords | null {
  const lat = room.lat ?? room.latitude ?? room.location?.lat ?? room.location?.latitude;
  const lng = room.lng ?? room.lon ?? room.longitude ?? room.location?.lng ?? room.location?.lon ?? room.location?.longitude;
  const latNum = lat !== undefined ? Number(lat) : NaN;
  const lngNum = lng !== undefined ? Number(lng) : NaN;
  if (Number.isFinite(latNum) && Number.isFinite(lngNum)) return { lat: latNum, lng: lngNum };
  return null;
}

function normalizeRoom(room: RoomApiItem): Room {
  return {
    _id: room._id,
    title: room.title,
    description: room.description,
    price: room.price,
    city: room.city,
    district: room.district,
    ward: room.ward,
    address: room.address,
    superficies: room.superficies,
    images: room.images,
    coords: extractCoords(room),
    distance: room.distance,
  };
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function haversineDistanceKm(from: Coords, to: Coords): number {
  const R = 6371;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function filterRoomsByDistance(
  center: Coords,
  sourceRooms: Room[],
  maxRadiusKm: number,
  geocode: (query: string) => Promise<Coords | null>
): Promise<{
  filtered: Room[];
  distanceMap: Record<string, number>;
  coordsMap: Record<string, Coords>;
}> {
  const distanceMap: Record<string, number> = {};
  const coordsMap: Record<string, Coords> = {};
  const filtered: Room[] = [];

  for (const room of sourceRooms) {
    // Ưu tiên coords có sẵn trong room, sau đó geocode nếu chưa có
    let coords = room.coords ?? null;
    if (!coords) {
      coords = await geocode(`${getRoomAddress(room)}, Việt Nam`);
    }
    if (!coords) continue;

    // Tính khoảng cách: dùng distance từ API (m) nếu có, không thì tính Haversine
    const distanceKm =
      room.distance !== undefined
        ? room.distance / 1000
        : haversineDistanceKm(center, coords);

    if (distanceKm <= maxRadiusKm) {
      distanceMap[room._id] = distanceKm;
      coordsMap[room._id] = coords;          // ← luôn lưu coords dù distance từ API
      filtered.push({ ...room, coords });
    }
  }

  filtered.sort((a, b) => (distanceMap[a._id] ?? 0) - (distanceMap[b._id] ?? 0));
  return { filtered, distanceMap, coordsMap };
}

function getBrowserLocation(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (!navigator?.geolocation) { reject(new Error('Geolocation not supported')); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

// ─── MapController ────────────────────────────────────────────────────────────

function MapController({
  center,
  activeCoords,
  radiusKm,
}: {
  center: Coords | null;
  activeCoords: Coords | null;
  radiusKm: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (activeCoords) {
      map.setView([activeCoords.lat, activeCoords.lng], 16, { animate: true });
    } else if (center) {
      const bounds = L.latLng(center.lat, center.lng).toBounds(radiusKm * 1000 * 2);
      map.fitBounds(bounds, { animate: true, padding: [32, 32] });
    }
  }, [activeCoords, center, radiusKm]);

  return null;
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const PinIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
  </svg>
);

const SearchIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
  </svg>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MapSearchRadius() {
  const [search, setSearch] = useState('');
  const [radius, setRadius] = useState(5);
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [modal, setModal] = useState<Room | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [distanceByRoomId, setDistanceByRoomId] = useState<Record<string, number>>({});
  const [coordsByRoomId, setCoordsByRoomId] = useState<Record<string, Coords>>({});
  const [mapCenter, setMapCenter] = useState<Coords | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const geocodeCacheRef = useRef<Map<string, Coords | null>>(new Map());
  const lastCenterRef = useRef<{ coords: Coords; label: string } | null>(null);

  // Load tất cả phòng lúc mount (không cần dữ liệu giả)
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = (await PostAPI.getPost()) as any;
        const posts = Array.isArray(res?.content)
          ? res.content
          : Array.isArray(res?.data?.content)
            ? res.data.content
            : [];
        const mapped = posts
          .filter((p: RoomApiItem) => p?._id && p?.address)
          .map((p: RoomApiItem) => normalizeRoom(p));
        setAllRooms(mapped);
        setRooms(mapped);
      } catch (err) {
        console.error('[fetchRooms]', err);
      }
    };
    fetchRooms();
  }, []);

  const geocodeAddress = useCallback(async (query: string): Promise<Coords | null> => {
    const key = query.trim().toLowerCase();
    if (!key) return null;
    if (geocodeCacheRef.current.has(key)) return geocodeCacheRef.current.get(key) ?? null;
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`
      );
      if (!resp.ok) { geocodeCacheRef.current.set(key, null); return null; }
      const data = (await resp.json()) as Array<{ lat: string; lon: string }>;
      if (!data.length) { geocodeCacheRef.current.set(key, null); return null; }
      const coords = { lat: Number(data[0].lat), lng: Number(data[0].lon) };
      if (isNaN(coords.lat) || isNaN(coords.lng)) { geocodeCacheRef.current.set(key, null); return null; }
      geocodeCacheRef.current.set(key, coords);
      return coords;
    } catch {
      geocodeCacheRef.current.set(key, null);
      return null;
    }
  }, []);

  const searchWithCenter = useCallback(async (
    center: Coords,
    label: string,
    rememberCenter = true
  ) => {
    setSearchError(null);
    setActive(null);
    setSearching(true);
    setMapCenter(center);

    try {
      const res = await PostAPI.getNearbyPosts({
        lat: center.lat,
        lng: center.lng,
        maxDistance: radius * 1000,
        page: 1,
        limit: 20,
      }) as any;

      const posts = Array.isArray(res?.content)
        ? res.content
        : Array.isArray(res?.data?.content)
          ? res.data.content
          : Array.isArray(res) ? res : [];

      const mapped: Room[] = posts
        .filter((p: RoomApiItem) => p?._id && p?.address)
        .map((p: RoomApiItem) => normalizeRoom(p));

      if (!mapped.length) {
        setRooms([]);
        setDistanceByRoomId({});
        setCoordsByRoomId({});
        if (rememberCenter) lastCenterRef.current = { coords: center, label };
        return;
      }

      const { filtered, distanceMap, coordsMap } = await filterRoomsByDistance(
        center, mapped, radius, geocodeAddress
      );

      setAllRooms(mapped);
      setRooms(filtered);
      setDistanceByRoomId(distanceMap);
      setCoordsByRoomId(coordsMap);
      if (rememberCenter) lastCenterRef.current = { coords: center, label };
    } catch (err) {
      console.error('[searchWithCenter]', err);
      setSearchError('Không thể tìm phòng gần vị trí này. Vui lòng thử lại.');
    } finally {
      setSearching(false);
    }
  }, [radius, geocodeAddress]);

  const handleSearch = async () => {
    const keyword = search.trim();
    if (!keyword) {
      if (lastCenterRef.current) {
        await searchWithCenter(lastCenterRef.current.coords, lastCenterRef.current.label, false);
      } else {
        setRooms(allRooms);
        setDistanceByRoomId({});
        setCoordsByRoomId({});
      }
      return;
    }

    const alreadyHasVN = /việt\s*nam/i.test(keyword);
    const cleanedQuery = (alreadyHasVN ? keyword : `${keyword}, Việt Nam`)
      .replace(/\bĐ\.\s*/gi, 'Đường ')
      .replace(/\bP\.\s*/gi, 'Phường ')
      .replace(/\bQ\.\s*/gi, 'Quận ')
      .replace(/\bTX\.\s*/gi, 'Thị xã ')
      .replace(/\bTP\.\s*/gi, 'Thành phố ')
      .replace(/\s+/g, ' ').trim();

    const center = await geocodeAddress(cleanedQuery);
    if (!center) {
      setRooms([]);
      setDistanceByRoomId({});
      setCoordsByRoomId({});
      setSearchError('Không xác định được vị trí. Vui lòng nhập cụ thể hơn.');
      return;
    }
    await searchWithCenter(center, keyword);
  };

  const handleUseMyLocation = async () => {
    try {
      const coords = await getBrowserLocation();
      setSearch('');
      await searchWithCenter(coords, 'Vị trí của bạn');
    } catch {
      setSearchError('Không lấy được vị trí. Hãy cho phép truy cập và thử lại.');
    }
  };

  // Khi radius thay đổi, search lại với center cũ
  useEffect(() => {
    if (!lastCenterRef.current) return;
    void searchWithCenter(lastCenterRef.current.coords, lastCenterRef.current.label, false);
  }, [radius]);

  const handleSelectRoom = (roomId: string) => {
    setActive(roomId);
    cardRefs.current[roomId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const activeCoords = active ? (coordsByRoomId[active] ?? null) : null;
  const defaultCenter: Coords = mapCenter ?? { lat: 10.8512, lng: 106.7716 };

  return (
    <>
      <div className="app">

        {/* TOP BAR */}
        <div className="topbar">
          <div className="brand">
            <div className="brand-badge"><PinIcon size={14} color="#334155" /></div>
            Tìm phòng trọ
          </div>

          <div className="search-group">
            <div className="search-wrap">
              <span className="ico"><SearchIcon size={14} /></span>
              <input
                className="s-input"
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Nhập trường, quận... VD: UTE, Thủ Đức, Bách Khoa"
              />
            </div>
            <div className="radius-group">
              <input
                type="range" min="2" max="15" step="1" value={radius}
                onChange={e => setRadius(+e.target.value)}
              />
              <span className="r-val">{radius} km</span>
            </div>
            <button className="btn-find" onClick={handleSearch}>
              <SearchIcon size={13} /> Tìm kiếm
            </button>
            <button className="btn-find" onClick={handleUseMyLocation}>
              <PinIcon size={13} /> Dùng vị trí của tôi
            </button>
          </div>

          <div className="count-pill">{rooms.length}/{allRooms.length} phòng</div>
        </div>

        {/* SPLIT LAYOUT */}
        <div className="split">

          {/* MAP */}
          <div className="map-pane">
            <MapContainer
              center={[defaultCenter.lat, defaultCenter.lng]}
              zoom={13}
              style={{ width: '100%', height: '100%' }}
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapController center={mapCenter} activeCoords={activeCoords} radiusKm={radius} />

              {mapCenter && (
                <Circle
                  center={[mapCenter.lat, mapCenter.lng]}
                  radius={radius * 1000}
                  pathOptions={{
                    color: '#14B8A6',
                    fillColor: '#14B8A6',
                    fillOpacity: 0.08,
                    weight: 2,
                    dashArray: '6 4',
                  }}
                />
              )}

              {/* Markers: dùng coordsByRoomId (đã geocode + distance filter) */}
              {rooms.map((room) => {
                const coords = coordsByRoomId[room._id];
                if (!coords) return null;
                return (
                  <Marker
                    key={room._id}
                    position={[coords.lat, coords.lng]}
                    icon={active === room._id ? activeIcon : defaultIcon}
                    eventHandlers={{ click: () => handleSelectRoom(room._id) }}
                  >
                    <Popup>
                      <div style={{ minWidth: 180 }}>
                        {room.images?.[0] && (
                          <img
                            src={room.images[0]}
                            alt={room.title}
                            style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 6, marginBottom: 6 }}
                          />
                        )}
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{room.title}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{room.district}, {room.city}</div>
                        <div style={{ fontWeight: 700, color: '#0D9488', fontSize: 13 }}>
                          {formatPrice(room.price)}
                          <span style={{ fontWeight: 400, color: '#94a3b8' }}>/tháng</span>
                        </div>
                        {distanceByRoomId[room._id] !== undefined && (
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                            📍 {formatDistance(distanceByRoomId[room._id])}
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>

          {/* LIST */}
          <div className="list-pane">
            <div className="list-head">
              <div>
                <h2>Danh sách phòng trọ</h2>
                <p>
                  {rooms.length > 0
                    ? `${rooms.length} phòng${search ? ` gần "${search}"` : ' trong khu vực'}`
                    : 'Không tìm thấy phòng phù hợp'}
                </p>
                {searching && <p>Đang tính khoảng cách...</p>}
                {searchError && <p style={{ color: '#ef4444' }}>{searchError}</p>}
              </div>
              <div className="lcount">{rooms.length} phòng</div>
            </div>

            <div className="list-scroll" ref={listRef}>
              {rooms.length === 0 ? (
                <div className="empty">
                  <div className="empty-ico"><PinIcon size={24} color="#14B8A6" /></div>
                  <h3>Không tìm thấy phòng trọ</h3>
                  <p>Thử tăng bán kính hoặc thay đổi địa điểm tìm kiếm.</p>
                </div>
              ) : (
                <div className="room-grid">
                  {rooms.map((room) => (
                    <div
                      key={room._id}
                      ref={el => { cardRefs.current[room._id] = el; }}
                      onClick={() => handleSelectRoom(room._id)}
                      style={{
                        outline: active === room._id ? '2px solid #14B8A6' : '2px solid transparent',
                        borderRadius: 12,
                        transition: 'outline 0.15s',
                      }}
                    >
                      <RoomCardHome
                        _id={room._id}
                        image={room.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image'}
                        type={room.title}
                        area={room.superficies ? `${room.superficies} m²` : undefined}
                        address={getRoomAddress(room)}
                        price={formatPrice(room.price)}
                        badge={distanceByRoomId[room._id] !== undefined
                          ? formatDistance(distanceByRoomId[room._id])
                          : undefined}
                        onView={() => {
                          handleSelectRoom(room._id);
                          setModal(room);
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detail overlay */}
      {modal && (
        <RoomDetail
          images={modal.images?.length ? modal.images : ['https://via.placeholder.com/800x400?text=No+Image']}
          type={modal.title}
          area={modal.superficies ? `${modal.superficies} m²` : undefined}
          address={getRoomAddress(modal)}
          price={formatPrice(modal.price)}
          badge={distanceByRoomId[modal._id] !== undefined ? formatDistance(distanceByRoomId[modal._id]) : undefined}
          description={modal.description}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}