import { useEffect, useRef, useState, useCallback } from 'react';
import './MapSearchRadius.css';
import { PostAPI } from '../../api/api';
import RoomCardHome from '../../components/rooms/RoomCardHome';
import RoomDetail from '../../components/rooms/RoomDetail';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { StyleSpecification } from 'maplibre-gl';

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
    type?: string;
    coordinates?: number[];
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
  const geoCoords = (room.location as any)?.coordinates;
  if (Array.isArray(geoCoords) && geoCoords.length >= 2) {
    const lngNum = Number(geoCoords[0]);
    const latNum = Number(geoCoords[1]);
    if (Number.isFinite(latNum) && Number.isFinite(lngNum)) {
      return { lat: latNum, lng: lngNum };
    }
  }
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

function buildCoordsMap(sourceRooms: Room[]): Record<string, Coords> {
  const coordsMap: Record<string, Coords> = {};
  for (const room of sourceRooms) {
    if (room.coords) coordsMap[room._id] = room.coords;
  }
  return coordsMap;
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

const MAPTILER_KEY = import.meta.env.VITE_APIMAP_KEY as string;
const mapStyle = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;
const DEFAULT_CENTER: Coords = { lat: 10.8512, lng: 106.7716 };

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

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Record<string, maplibregl.Marker>>({});
  const circleRef = useRef<boolean>(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const lastCenterRef = useRef<{ coords: Coords; label: string } | null>(null);
  const allRoomsRef = useRef<Room[]>([]);

  // ── Init MapLibre ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: mapStyle, // Sử dụng biến mapStyle vừa sửa ở Bước 1
      center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
      zoom: 12,
    });

    // Thêm nút điều hướng (phóng to/thu nhỏ)
    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Vẽ/xóa circle bán kính ────────────────────────────────────────────────
  const drawCircle = useCallback((center: Coords, radiusKm: number) => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const sourceId = 'radius-circle';
    const layerFillId = 'radius-fill';
    const layerBorderId = 'radius-border';

    // Tạo GeoJSON circle
    const points = 64;
    const coords: [number, number][] = [];
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      const dx = (radiusKm / 111.32) * Math.cos(angle);
      const dy = (radiusKm / (111.32 * Math.cos(center.lat * Math.PI / 180))) * Math.sin(angle);
      coords.push([center.lng + dy, center.lat + dx]);
    }
    coords.push(coords[0]);

    const geojson: GeoJSON.Feature<GeoJSON.Polygon> = {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: [coords] },
    };

    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojson);
    } else {
      map.addSource(sourceId, { type: 'geojson', data: geojson });
      map.addLayer({
        id: layerFillId,
        type: 'fill',
        source: sourceId,
        paint: { 'fill-color': '#14B8A6', 'fill-opacity': 0.08 },
      });
      map.addLayer({
        id: layerBorderId,
        type: 'line',
        source: sourceId,
        paint: { 'line-color': '#14B8A6', 'line-width': 2, 'line-dasharray': [6, 4] },
      });
      circleRef.current = true;
    }
  }, []);

  // ── Cập nhật markers trên map ──────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const updateMarkers = () => {
      // Xóa marker cũ không còn trong danh sách
      Object.keys(markersRef.current).forEach((id) => {
        if (!coordsByRoomId[id]) {
          markersRef.current[id].remove();
          delete markersRef.current[id];
        }
      });

      // Thêm/cập nhật marker
      rooms.forEach((room) => {
        const coords = coordsByRoomId[room._id];
        if (!coords) return;

        const isActive = active === room._id;

        if (markersRef.current[room._id]) {
          // Cập nhật màu marker nếu active thay đổi
          const el = markersRef.current[room._id].getElement();
          el.style.filter = isActive
            ? 'hue-rotate(140deg) saturate(2)'
            : '';
          return;
        }

        // Tạo marker element
        const el = document.createElement('div');
        el.style.cssText = `
          width: 28px; height: 28px; border-radius: 50% 50% 50% 0;
          background: ${isActive ? '#ef4444' : '#14B8A6'};
          border: 2px solid #fff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          cursor: pointer;
          transform: rotate(-45deg);
          transition: background 0.2s;
        `;

        // Popup
        const distKm = distanceByRoomId[room._id];
        const popup = new maplibregl.Popup({
          offset: 25,
          closeButton: true,
          maxWidth: '240px',
        }).setHTML(`
          <div style="font-family:inherit;padding:4px">
            ${room.images?.[0] ? `<img src="${room.images[0]}" alt="${room.title}"
              style="width:100%;height:90px;object-fit:cover;border-radius:6px;margin-bottom:8px;display:block"/>` : ''}
            <div style="font-weight:700;font-size:13px;margin-bottom:3px;line-height:1.3">${room.title}</div>
            <div style="font-size:11px;color:#64748b;margin-bottom:6px">📍 ${room.district}, ${room.city}</div>
            <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #f1f5f9;padding-top:6px">
              <span style="font-weight:700;color:#0D9488;font-size:13px">
                ${formatPrice(room.price)}
                <span style="font-weight:400;color:#94a3b8;font-size:11px">/tháng</span>
              </span>
              ${distKm !== undefined ? `<span style="font-size:11px;color:#fff;background:#14B8A6;border-radius:20px;padding:2px 7px">${formatDistance(distKm)}</span>` : ''}
            </div>
            ${room.superficies ? `<div style="font-size:11px;color:#94a3b8;margin-top:4px">📐 ${room.superficies} m²</div>` : ''}
          </div>
        `);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([coords.lng, coords.lat])
          .setPopup(popup)
          .addTo(map);

        el.addEventListener('click', () => {
          setActive(room._id);
          cardRefs.current[room._id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });

        markersRef.current[room._id] = marker;
      });
    };

    if (map.isStyleLoaded()) {
      updateMarkers();
    } else {
      map.once('load', updateMarkers);
    }
  }, [rooms, coordsByRoomId, active, distanceByRoomId]);

  // ── Fly to khi chọn room ──────────────────────────────────────────────────
  useEffect(() => {
    if (!active || !mapRef.current) return;
    const coords = coordsByRoomId[active];
    if (coords) {
      mapRef.current.flyTo({ center: [coords.lng, coords.lat], zoom: 16, duration: 800 });
    }
  }, [active, coordsByRoomId]);

  // ── Fit bounds khi mapCenter thay đổi ────────────────────────────────────
  useEffect(() => {
    if (!mapCenter || !mapRef.current) return;
    const map = mapRef.current;
    const km = radius;
    const delta = km / 111.32;
    const bounds: maplibregl.LngLatBoundsLike = [
      [mapCenter.lng - delta, mapCenter.lat - delta],
      [mapCenter.lng + delta, mapCenter.lat + delta],
    ];

    const fitOrDraw = () => {
      map.fitBounds(bounds, { padding: 40, duration: 600 });
      drawCircle(mapCenter, km);
    };

    if (map.isStyleLoaded()) {
      fitOrDraw();
    } else {
      map.once('load', fitOrDraw);
    }
  }, [mapCenter, radius, drawCircle]);

  // ── geocodeAddress ─────────────────────────────────────────────────────────
  const geocodeAddress = useCallback(async (query: string): Promise<Coords | null> => {
    try {
      const resp = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${MAPTILER_KEY}`
      );
      const data = await resp.json();
      
      // MapTiler trả về tọa độ trong feature.center [lng, lat]
      const feature = data?.features?.[0];
      if (!feature) return null;

      return {
        lng: feature.center[0],
        lat: feature.center[1],
      };
    } catch (error) {
      console.error("Lỗi tìm kiếm tọa độ:", error);
      return null;
    }
  }, []);

  // ── fetchRooms ─────────────────────────────────────────────────────────────
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
        allRoomsRef.current = mapped;

        const initialCoordsMap = buildCoordsMap(mapped);
        setCoordsByRoomId(initialCoordsMap);

        const roomsNeedGeocode = mapped.filter((r: Room) => !initialCoordsMap[r._id]);
        if (roomsNeedGeocode.length > 0) {
          const extraCoordsMap: Record<string, Coords> = { ...initialCoordsMap };
          for (const room of roomsNeedGeocode) {
            const coords = await geocodeAddress(`${getRoomAddress(room)}, Việt Nam`);
            if (coords) extraCoordsMap[room._id] = coords;
          }
          setCoordsByRoomId({ ...extraCoordsMap });
        }
        setDistanceByRoomId({});
      } catch (err) {
        console.error('[fetchRooms]', err);
      }
    };
    fetchRooms();
  }, [geocodeAddress]);

  // ── searchWithCenter ───────────────────────────────────────────────────────
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

      setAllRooms(mapped);
      setRooms(mapped);

      const distanceMap: Record<string, number> = {};
      const coordsMap: Record<string, Coords> = {};

      for (const room of mapped) {
        const cachedRoom = allRoomsRef.current.find(r => r._id === room._id);
        let coords = room.coords ?? cachedRoom?.coords ?? null;
        if (!coords) {
          coords = await geocodeAddress(`${getRoomAddress(room)}, Việt Nam`);
        }
        if (coords) coordsMap[room._id] = coords;

        let distanceKm: number | null = null;
        if (room.distance !== undefined && room.distance !== null) {
          const raw = Number(room.distance);
          if (Number.isFinite(raw)) distanceKm = raw > 50 ? raw / 1000 : raw;
        }
        if (distanceKm === null && coords) distanceKm = haversineDistanceKm(center, coords);
        if (distanceKm !== null && Number.isFinite(distanceKm)) distanceMap[room._id] = distanceKm;
      }

      const sorted = [...mapped].sort(
        (a, b) => (distanceMap[a._id] ?? Infinity) - (distanceMap[b._id] ?? Infinity)
      );
      setRooms(sorted);
      setDistanceByRoomId(distanceMap);
      setCoordsByRoomId(prev => ({ ...prev, ...coordsMap }));
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
        setCoordsByRoomId(buildCoordsMap(allRooms));
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

  useEffect(() => {
    if (!lastCenterRef.current) return;
    void searchWithCenter(lastCenterRef.current.coords, lastCenterRef.current.label, false);
  }, [radius]);

  const handleSelectRoom = (roomId: string) => {
    setActive(roomId);
    cardRefs.current[roomId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

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
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
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
          postId={modal._id}
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