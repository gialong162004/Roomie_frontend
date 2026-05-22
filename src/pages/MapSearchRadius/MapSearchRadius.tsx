import { useEffect, useRef, useState, useCallback } from 'react';
import './MapSearchRadius.css';
import { PostAPI } from '../../api/api';
import RoomCardHome from '../../components/rooms/RoomCardHome';
import RoomDetail from '../../components/rooms/RoomDetail';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';


interface Coords { lat: number; lng: number; }

interface Room {
  _id: string; title: string; description: string; price: number;
  city: string; district: string; ward?: string; address: string;
  superficies?: number; images?: string[]; coords?: Coords | null;
  distance?: number; posterId?: string; posterName?: string; phone?: string;
}

interface RoomApiItem {
  _id: string; title: string; description: string; price: number;
  city: string; district: string; ward?: string; address: string;
  superficies?: number; images?: string[];
  lat?: number | string; lon?: number | string; lng?: number | string;
  latitude?: number | string; longitude?: number | string;
  location?: { type?: string; coordinates?: number[]; lat?: number | string; lon?: number | string; lng?: number | string; latitude?: number | string; longitude?: number | string; };
  distance?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(p: number): string {
  if (p >= 1_000_000) return (p / 1_000_000).toFixed(1).replace('.0', '') + ' tr';
  return p.toLocaleString() + ' đ';
}

function formatPriceFull(p: number): string {
  if (p >= 1_000_000) return (p / 1_000_000).toFixed(1).replace('.0', '') + ' triệu';
  return p.toLocaleString() + ' đ';
}

function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function getRoomAddress(room: Room): string {
  return [room.address, room.ward, room.district, room.city].filter(Boolean).join(', ');
}

function extractCoords(room: RoomApiItem): Coords | null {
  const gc = (room.location as any)?.coordinates;
  if (Array.isArray(gc) && gc.length >= 2) {
    const ln = Number(gc[0]), la = Number(gc[1]);
    if (Number.isFinite(la) && Number.isFinite(ln)) return { lat: la, lng: ln };
  }
  const lat = room.lat ?? room.latitude ?? room.location?.lat ?? room.location?.latitude;
  const lng = room.lng ?? room.lon ?? room.longitude ?? room.location?.lng ?? room.location?.lon ?? room.location?.longitude;
  const la = lat !== undefined ? Number(lat) : NaN;
  const ln = lng !== undefined ? Number(lng) : NaN;
  if (Number.isFinite(la) && Number.isFinite(ln)) return { lat: la, lng: ln };
  return null;
}

function normalizeRoom(room: RoomApiItem): Room {
  return {
    _id: room._id, title: room.title, description: room.description,
    price: room.price, city: room.city, district: room.district, ward: room.ward,
    address: room.address, superficies: room.superficies, images: room.images,
    coords: extractCoords(room), distance: room.distance,
    posterId: (room as any).owner?._id ?? (room as any).userId?._id ?? (room as any).userId ?? (room as any).posterId,
    posterName: (room as any).owner?.name ?? (room as any).userId?.name ?? (room as any).posterName ?? 'Chủ nhà',
    phone: (room as any).owner?.phone ?? (room as any).phone ?? (room as any).userId?.phone,
  };
}

function toRad(v: number) { return (v * Math.PI) / 180; }
function haversineKm(from: Coords, to: Coords): number {
  const R = 6371, dLat = toRad(to.lat - from.lat), dLng = toRad(to.lng - from.lng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getBrowserLocation(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (!navigator?.geolocation) { reject(new Error('Not supported')); return; }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      reject, { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAPTILER_KEY = import.meta.env.VITE_APIMAP_KEY as string;
const MAP_STYLE = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;
const DEFAULT_CENTER: Coords = { lat: 10.8512, lng: 106.7716 };

// Bounding box giới hạn khu vực Việt Nam [minLng, minLat, maxLng, maxLat]
const VIETNAM_BOUNDS: [number, number, number, number] = [102.14, 8.56, 109.46, 23.39];

// ─── Component ────────────────────────────────────────────────────────────────

export default function MapSearchRadius() {
  // State
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [visibleRooms, setVisibleRooms] = useState<Room[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [modal, setModal] = useState<Room | null>(null);
  const [coordsMap, setCoordsMap] = useState<Record<string, Coords>>({});
  const [distMap, setDistMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ place_name: string; center: [number, number] }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Radius search mode
  const [radiusMode, setRadiusMode] = useState(false);   // true = đang chọn tâm
  const [radiusCenter, setRadiusCenter] = useState<Coords | null>(null);
  const [radiusKm, setRadiusKm] = useState(3);
  const [radiusActive, setRadiusActive] = useState(false); // đang filter theo bán kính

  // Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  
  const priceMarkersRef = useRef<Record<string, maplibregl.Marker>>({});
  
  const centerMarkerRef = useRef<maplibregl.Marker | null>(null);
  const allRoomsRef = useRef<Room[]>([]);
  const coordsMapRef = useRef<Record<string, Coords>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const listRef = useRef<HTMLDivElement | null>(null);

  // Refs sync inside handlers
  const radiusCenterRef = useRef<Coords | null>(null);
  const radiusActiveRef = useRef(false);
  const radiusKmRef = useRef(3);

  useEffect(() => { radiusCenterRef.current = radiusCenter; }, [radiusCenter]);
  useEffect(() => { radiusActiveRef.current = radiusActive; }, [radiusActive]);
  useEffect(() => { radiusKmRef.current = radiusKm; }, [radiusKm]);

  // ── Geocode ──────────────────────────────────────────────────────────────
  const geocodeAddress = useCallback(async (query: string): Promise<Coords | null> => {
    try {
      const res = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${MAPTILER_KEY}`
      );
      const data = await res.json();
      const f = data?.features?.[0];
      if (!f) return null;
      return { lng: f.center[0], lat: f.center[1] };
    } catch { return null; }
  }, []);

  // ── Fetch suggestions ─────────────────────────────────────────────────────
  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setSuggestions([]); return; }
    try {
      const res = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(q)}.json?key=${MAPTILER_KEY}&language=vi&country=vn&limit=5`
      );
      const data = await res.json();
      setSuggestions((data?.features ?? []).map((f: any) => ({ place_name: f.place_name, center: f.center })));
      setShowSuggestions(true);
    } catch { setSuggestions([]); }
  }, []);

  // ── Compute which rooms are visible in map viewport ───────────────────────
  const updateVisibleRooms = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const bounds = map.getBounds();
    const all = allRoomsRef.current;
    const cm = coordsMapRef.current;

    let filtered: Room[];

    const rc = radiusCenterRef.current;
    const ra = radiusActiveRef.current;
    const rkm = radiusKmRef.current;

    if (ra && rc) {
      filtered = all.filter(r => {
        const c = cm[r._id];
        if (!c) return false;
        return haversineKm(rc, c) <= rkm;
      });
    } else {
      filtered = all.filter(r => {
        const c = cm[r._id];
        if (!c) return false;
        return bounds.contains([c.lng, c.lat]);
      });
    }

    const center = rc && ra ? rc : { lat: map.getCenter().lat, lng: map.getCenter().lng };
    const distObj: Record<string, number> = {};
    filtered.forEach(r => {
      const c = cm[r._id];
      if (c) distObj[r._id] = haversineKm(center, c);
    });
    filtered = [...filtered].sort((a, b) => (distObj[a._id] ?? 999) - (distObj[b._id] ?? 999));

    setVisibleRooms(filtered);
    setDistMap(distObj);
  }, []);

  // ── Init Map ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
      zoom: 13,
      minZoom: 5, // Giới hạn không cho zoom out quá xa
      maxBounds: VIETNAM_BOUNDS, // Khóa tầm nhìn map trong giới hạn lãnh thổ VN
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    mapRef.current = map;

    map.on('load', () => {
      map.addSource('rooms-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 55,
      });

      map.addLayer({
        id: 'clusters-layer',
        type: 'circle',
        source: 'rooms-source',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': ['step', ['get', 'point_count'], '#FF385C', 10, '#FF385C', 30, '#C13584'],
          'circle-radius': ['step', ['get', 'point_count'], 22, 10, 28, 30, 34],
          'circle-stroke-width': 3,
          'circle-stroke-color': '#fff',
          'circle-opacity': 0.92,
        },
      });

      map.addLayer({
        id: 'cluster-count-layer',
        type: 'symbol',
        source: 'rooms-source',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 13,
        },
        paint: { 'text-color': '#fff' },
      });

      map.on('click', 'clusters-layer', async (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters-layer'] });
        const clusterId = features[0].properties.cluster_id;
        const source = map.getSource('rooms-source') as maplibregl.GeoJSONSource;
        try {
          const zoom = await new Promise<number>((res, rej) =>
            (source as any).getClusterExpansionZoom(clusterId, (err: any, z: number) => err ? rej(err) : res(z))
          );
          map.easeTo({ center: (features[0].geometry as any).coordinates, zoom });
        } catch (err) { console.error(err); }
      });

      map.on('mouseenter', 'clusters-layer', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'clusters-layer', () => { map.getCanvas().style.cursor = ''; });

      map.addSource('radius-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'radius-fill', type: 'fill', source: 'radius-source', paint: { 'fill-color': '#FF385C', 'fill-opacity': 0.06 } });
      map.addLayer({ id: 'radius-border', type: 'line', source: 'radius-source', paint: { 'line-color': '#FF385C', 'line-width': 2, 'line-dasharray': [5, 3] } });
    });

    const handleViewChange = () => updateVisibleRooms();
    map.on('moveend', handleViewChange);
    map.on('zoomend', handleViewChange);

    return () => { map.remove(); mapRef.current = null; };
  }, [updateVisibleRooms]);

  // ── Draw radius circle on map ─────────────────────────────────────────────
  const drawRadiusCircle = useCallback((center: Coords, km: number) => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const pts = 64;
    const coords: [number, number][] = [];
    for (let i = 0; i < pts; i++) {
      const angle = (i / pts) * 2 * Math.PI;
      const dx = (km / 111.32) * Math.cos(angle);
      const dy = (km / (111.32 * Math.cos(center.lat * Math.PI / 180))) * Math.sin(angle);
      coords.push([center.lng + dy, center.lat + dx]);
    }
    coords.push(coords[0]);
    const src = map.getSource('radius-source') as maplibregl.GeoJSONSource;
    if (src) src.setData({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [coords] } } as any);
  }, []);

  const clearRadiusCircle = useCallback(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const src = map.getSource('radius-source') as maplibregl.GeoJSONSource;
    if (src) src.setData({ type: 'FeatureCollection', features: [] });
    centerMarkerRef.current?.remove();
    centerMarkerRef.current = null;
  }, []);

  // ── Place center pin marker ───────────────────────────────────────────────
  const placeCenterMarker = useCallback((center: Coords) => {
    const map = mapRef.current;
    if (!map) return;
    centerMarkerRef.current?.remove();

    const el = document.createElement('div');
    el.style.cssText = `
      width:20px;height:20px;border-radius:50%;
      background:#FF385C;border:3px solid #fff;
      box-shadow:0 0 0 4px rgba(255,56,92,0.25);
      cursor:grab;
    `;
    centerMarkerRef.current = new maplibregl.Marker({ element: el, draggable: true })
      .setLngLat([center.lng, center.lat])
      .addTo(map);

    centerMarkerRef.current.on('dragend', () => {
      const lnglat = centerMarkerRef.current!.getLngLat();
      const newCenter = { lat: lnglat.lat, lng: lnglat.lng };
      radiusCenterRef.current = newCenter;
      setRadiusCenter(newCenter);
      drawRadiusCircle(newCenter, radiusKmRef.current);
      fitToRadius(newCenter, radiusKmRef.current);
      updateVisibleRooms();
    });
  }, [drawRadiusCircle, updateVisibleRooms]);

  // ── Map click handler for radius mode ────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      if (!radiusModeRef.current) return;
      const center = { lat: e.lngLat.lat, lng: e.lngLat.lng };
      setRadiusCenter(center);
      radiusCenterRef.current = center;
      setRadiusActive(true);
      radiusActiveRef.current = true;
      setRadiusMode(false);
      radiusModeRef.current = false;
      map.getCanvas().style.cursor = '';
      placeCenterMarker(center);
      drawRadiusCircle(center, radiusKmRef.current);
      fitToRadius(center, radiusKmRef.current);
      updateVisibleRooms();
    };

    map.on('click', handleClick);
    return () => { map.off('click', handleClick); };
  }, [drawRadiusCircle, placeCenterMarker, updateVisibleRooms]);

  const radiusModeRef = useRef(false);
  useEffect(() => {
    radiusModeRef.current = radiusMode;
    const map = mapRef.current;
    if (map) map.getCanvas().style.cursor = radiusMode ? 'crosshair' : '';
  }, [radiusMode]);

  const fitToRadius = (center: Coords, km: number) => {
    const map = mapRef.current;
    if (!map) return;
    const delta = km / 111.32;
    map.fitBounds(
      [[center.lng - delta, center.lat - delta], [center.lng + delta, center.lat + delta]],
      { padding: 60, duration: 500 }
    );
  };

  // ── Update radius when slider changes ────────────────────────────────────
  useEffect(() => {
    if (radiusActive && radiusCenter) {
      drawRadiusCircle(radiusCenter, radiusKm);
      fitToRadius(radiusCenter, radiusKm);
      updateVisibleRooms();
    }
  }, [radiusKm, radiusActive, radiusCenter, drawRadiusCircle, updateVisibleRooms]);

  // ── Fetch all rooms ───────────────────────────────────────────────────────
  useEffect(() => {
    const fetch_ = async () => {
      setLoading(true);
      try {
        // Cố gắng đặt query limit siêu lớn để lấy tối đa danh sách phòng
        const res = (await PostAPI.getPost({ limit: 10000, size: 10000, per_page: 10000, page: 1 })) as any;
        const posts = Array.isArray(res?.content) ? res.content
          : Array.isArray(res?.data?.content) ? res.data.content : [];
        const mapped = posts.filter((p: RoomApiItem) => p?._id && p?.address).map(normalizeRoom);
        allRoomsRef.current = mapped;
        setAllRooms(mapped);

        const cm: Record<string, Coords> = {};
        for (const r of mapped) { if (r.coords) cm[r._id] = r.coords; }

        const missing = mapped.filter((r: Room) => !cm[r._id]);
        for (const r of missing) {
          const c = await geocodeAddress(`${getRoomAddress(r)}, Việt Nam`);
          if (c) cm[r._id] = c;
        }

        coordsMapRef.current = cm;
        setCoordsMap({ ...cm });
        updateVisibleRooms();
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch_();
  }, [geocodeAddress, updateVisibleRooms]);


  // ── KIỂM SOÁT ĐỒNG BỘ MARKER NÂNG CAO ─────────────────────────────────────────

  // 1. Chỉ nạp dữ liệu GeoJSON mới vào source mỗi khi visibleRooms thay đổi.
  // Quá trình tính toán Cluster sẽ được maplibregl chạy ngầm sau bước này.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const source = map.getSource('rooms-source') as maplibregl.GeoJSONSource;
    if (source && map.isStyleLoaded()) {
      const features = visibleRooms
        .filter(r => coordsMap[r._id])
        .map(r => ({
          type: 'Feature' as const,
          properties: { roomId: r._id },
          geometry: { type: 'Point' as const, coordinates: [coordsMap[r._id].lng, coordsMap[r._id].lat] },
        }));
      source.setData({ type: 'FeatureCollection', features });
    }
  }, [visibleRooms, coordsMap]);

  // 2. Chịu trách nhiệm render/update HTML Markers dựa trên trạng thái Cluster thực tế
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const renderMarkers = () => {
      if (!map.isStyleLoaded()) return;

      // ĐÂY LÀ ĐIỂM QUYẾT ĐỊNH: Phải đợi source tính toán Cluster (gom cụm, load tile) xong 100%
      // Nếu map.isSourceLoaded() đang false có nghĩa là dữ liệu đang nạp, querySourceFeatures sẽ luôn rỗng ([])
      // Ta bỏ qua vòng lặp lúc này để tránh việc marker bị xóa sạch một cách oan uổng.
      const isLoaded = map.getSource('rooms-source') && map.isSourceLoaded('rooms-source');
      if (!isLoaded) return;

      const currentFeatures = map.querySourceFeatures('rooms-source');
      const activeIdsInView: Record<string, boolean> = {};

      currentFeatures.forEach(f => {
        if (f.properties && !f.properties.point_count && f.properties.roomId) {
          const roomId: string = f.properties.roomId;
          activeIdsInView[roomId] = true;
          
          const room = allRoomsRef.current.find(r => r._id === roomId);
          const coords = coordsMapRef.current[roomId];
          if (!room || !coords) return;

          const isActive = activeId === roomId;

          // Cập nhật DOM tự nhiên của Marker nếu đã có
          if (priceMarkersRef.current[roomId]) {
            const markerInstance = priceMarkersRef.current[roomId];
            const el = markerInstance.getElement();
            el.style.background = isActive ? '#222222' : '#ffffff';
            el.style.color = isActive ? '#ffffff' : '#222222';
            el.style.border = `1.5px solid ${isActive ? '#222222' : 'rgba(0,0,0,0.15)'}`;
            el.style.zIndex = isActive ? '9999' : '1';
            return;
          }

          // Khởi tạo mới
          const el = document.createElement('div');
          el.textContent = formatPrice(room.price) + '/th';
          el.style.cssText = `
            background: ${isActive ? '#222222' : '#ffffff'};
            color: ${isActive ? '#ffffff' : '#222222'};
            font-size: 12px; font-weight: 700;
            padding: 4px 8px; border-radius: 28px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.05);
            cursor: pointer; white-space: nowrap;
            border: 1.5px solid ${isActive ? '#222222' : 'rgba(0,0,0,0.15)'};
            box-sizing: border-box;
            transition: background-color 0.15s, color 0.15s, border-color 0.15s;
            z-index: ${isActive ? '9999' : '1'};
            height: 26px; display: flex; align-items: center; justify-content: center;
          `;

          const popup = new maplibregl.Popup({ offset: 12, closeButton: false, maxWidth: '260px', className: 'airbnb-popup' })
            .setHTML(`
              <div style="font-family:inherit;cursor:pointer;border-radius:12px;overflow:hidden" onclick="window.__openRoomModal('${room._id}')">
                ${room.images?.[0] ? `<img src="${room.images[0]}" alt="${room.title}" style="width:100%;height:100px;object-fit:cover;display:block"/>` : ''}
                <div style="padding:10px 12px">
                  <div style="font-weight:700;font-size:13px;line-height:1.3;margin-bottom:4px">${room.title}</div>
                  <div style="font-size:11px;color:#717171;margin-bottom:6px">📍 ${room.district}, ${room.city}</div>
                  <div style="font-weight:700;color:#222;font-size:13px">${formatPriceFull(room.price)}<span style="font-weight:400;color:#717171;font-size:11px">/tháng</span></div>
                </div>
              </div>
            `);

          const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
            .setLngLat([coords.lng, coords.lat])
            .setPopup(popup)
            .addTo(map);

          el.addEventListener('click', (e) => {
            e.stopPropagation();
            setActiveId(roomId);
            cardRefs.current[roomId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          });

          el.addEventListener('mouseenter', () => { if (activeId !== roomId) el.style.background = '#f7f7f7'; });
          el.addEventListener('mouseleave', () => { if (activeId !== roomId) el.style.background = '#ffffff'; });

          priceMarkersRef.current[roomId] = marker;
        }
      });

      // Xóa marker không còn nằm trong danh sách Rendered (hoặc đã bị thu vào cụm)
      Object.keys(priceMarkersRef.current).forEach(id => {
        if (!activeIdsInView[id]) {
          priceMarkersRef.current[id].remove();
          delete priceMarkersRef.current[id];
        }
      });
    };

    // Lắng nghe sự kiện render của maplibre. 
    // Nó bao phủ cả lúc kéo map, lướt qua map, hay khi cluster vừa tính toán xong.
    map.on('render', renderMarkers);
    renderMarkers(); // Gọi thử lần đầu khi load component

    return () => {
      map.off('render', renderMarkers);
    };
  }, [activeId]);


  // ── Fly to active room ────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeId || !mapRef.current) return;
    const c = coordsMap[activeId];
    if (c) mapRef.current.flyTo({ center: [c.lng, c.lat], zoom: 15, duration: 700 });
  }, [activeId, coordsMap]);

  // ── Modal global ─────────────────────────────────────────────────────────
  useEffect(() => {
    (window as any).__openRoomModal = (id: string) => {
      const room = allRooms.find(r => r._id === id);
      if (room) setModal(room);
    };
    return () => { delete (window as any).__openRoomModal; };
  }, [allRooms]);

  // ── Search handlers ───────────────────────────────────────────────────────
  const handleSearch = async () => {
    const kw = searchText.trim();
    if (!kw) return;
    const clean = ((/việt\s*nam/i.test(kw) ? kw : `${kw}, Việt Nam`)
      .replace(/\bĐ\.\s*/gi, 'Đường ')
      .replace(/\bP\.\s*/gi, 'Phường ')
      .replace(/\bQ\.\s*/gi, 'Quận ')
      .replace(/\bTP\.\s*/gi, 'Thành phố ')
      .replace(/\s+/g, ' ').trim());
    const center = await geocodeAddress(clean);
    if (!center || !mapRef.current) return;
    mapRef.current.flyTo({ center: [center.lng, center.lat], zoom: 14, duration: 700 });
    setTimeout(updateVisibleRooms, 800);
  };

  const handleMyLocation = async () => {
    try {
      const coords = await getBrowserLocation();
      mapRef.current?.flyTo({ center: [coords.lng, coords.lat], zoom: 14, duration: 700 });
      setTimeout(updateVisibleRooms, 800);
    } catch { alert('Không lấy được vị trí. Hãy cho phép truy cập vị trí.'); }
  };

  const cancelRadius = () => {
    setRadiusMode(false);
    setRadiusActive(false);
    setRadiusCenter(null);
    radiusCenterRef.current = null;
    radiusActiveRef.current = false;
    clearRadiusCircle();
    updateVisibleRooms();
  };

  return (
    <>
      <div style={{ display: 'flex', height: '100vh', fontFamily: "'Circular', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", overflow: 'hidden' }}>

        {/* ── LEFT: Room list ─────────────────────────────────────────────── */}
        <div style={{ width: 460, minWidth: 360, display: 'flex', flexDirection: 'column', background: '#fff', borderRight: '1px solid #ebebeb', zIndex: 2, overflow: 'hidden' }}>
          {/* Search bar */}
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #ebebeb', background: '#fff' }}>
            <div style={{ position: 'relative' }}>
              <input
                value={searchText}
                onChange={e => {
                  setSearchText(e.target.value);
                  if (debounceRef.current) clearTimeout(debounceRef.current);
                  debounceRef.current = setTimeout(() => fetchSuggestions(e.target.value), 300);
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Tìm khu vực, trường học..."
                style={{
                  width: '100%', padding: '12px 16px 12px 42px',
                  border: '1px solid #ddd', borderRadius: 10, fontSize: 14,
                  outline: 'none', boxSizing: 'border-box', background: '#f7f7f7',
                  transition: 'border 0.2s',
                }}
                onFocusCapture={e => { e.currentTarget.style.borderColor = '#222'; e.currentTarget.style.background = '#fff'; }}
                onBlurCapture={e => { e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.background = '#f7f7f7'; }}
              />
              <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#717171' }} width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, background: '#fff', border: '1px solid #ebebeb', borderRadius: 12, boxShadow: '0 8px 28px rgba(0,0,0,0.15)', zIndex: 9999, overflow: 'hidden' }}>
                  {suggestions.map((s, i) => (
                    <div key={i}
                      onMouseDown={() => {
                        setSearchText(s.place_name);
                        setShowSuggestions(false);
                        mapRef.current?.flyTo({ center: s.center, zoom: 14, duration: 700 });
                        setTimeout(updateVisibleRooms, 800);
                      }}
                      style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 13, borderBottom: i < suggestions.length - 1 ? '1px solid #f0f0f0' : 'none', display: 'flex', gap: 10, alignItems: 'center', color: '#222' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f7f7f7'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                    >
                      <span style={{ color: '#FF385C', fontSize: 16 }}>📍</span>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.place_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick action buttons */}
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <button onClick={handleMyLocation} style={{ flex: 1, padding: '9px 14px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#222', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#FF385C"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                Vị trí của tôi
              </button>
              <button
                onClick={() => { if (radiusActive) { cancelRadius(); } else { setRadiusMode(r => !r); } }}
                style={{ flex: 1, padding: '9px 14px', borderRadius: 8, border: `1px solid ${radiusMode || radiusActive ? '#FF385C' : '#ddd'}`, background: radiusMode || radiusActive ? '#fff5f5' : '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: radiusMode || radiusActive ? '#FF385C' : '#222', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="3" /><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" /></svg>
                {radiusActive ? 'Xóa bán kính' : radiusMode ? 'Chọn điểm trên bản đồ…' : 'Tìm theo bán kính'}
              </button>
            </div>

            {/* Radius slider */}
            {(radiusMode || radiusActive) && (
              <div style={{ marginTop: 10, padding: '10px 12px', background: '#fff5f5', borderRadius: 10, border: '1px solid #ffd6d6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, color: '#717171' }}>
                  <span style={{ fontWeight: 600, color: '#FF385C' }}>
                    {radiusMode ? '👆 Click vào bản đồ để chọn tâm' : `📍 Bán kính tìm kiếm`}
                  </span>
                  {radiusActive && <span style={{ fontWeight: 700, color: '#222' }}>{radiusKm} km</span>}
                </div>
                {radiusActive && (
                  <input type="range" min="1" max="15" step="0.5" value={radiusKm}
                    onChange={e => setRadiusKm(+e.target.value)}
                    style={{ width: '100%', accentColor: '#FF385C' }}
                  />
                )}
              </div>
            )}
          </div>

          {/* Room count header */}
          <div style={{ padding: '14px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#222', letterSpacing: '-0.3px' }}>
                {loading ? 'Đang tải…' : `${visibleRooms.length} phòng`}
              </div>
              <div style={{ fontSize: 12, color: '#717171', marginTop: 2 }}>
                {radiusActive && radiusCenter ? `Trong bán kính ${radiusKm} km` : 'Trong khu vực bản đồ hiện tại'}
              </div>
            </div>
            {!loading && visibleRooms.length > 0 && (
              <div style={{ fontSize: 11, color: '#717171', padding: '4px 10px', background: '#f7f7f7', borderRadius: 20 }}>
                {allRooms.length} tổng
              </div>
            )}
          </div>

          {/* Room list */}
          <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 16px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', alignContent: 'start' }}>
            {visibleRooms.length === 0 && !loading ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', color: '#717171', gridColumn: '1 / -1' }}>
                Không tìm thấy phòng trong khu vực này.
              </div>
            ) : (
              visibleRooms.map(room => (
                <div
                  key={room._id}
                  ref={el => { cardRefs.current[room._id] = el; }}
                  onClick={() => setActiveId(room._id)}
                  style={{
                    cursor: 'pointer',
                    outline: activeId === room._id ? '2px solid #222' : 'none',
                    borderRadius: 12, transition: 'outline 0.1s'
                  }}
                >
                  <RoomCardHome
                    _id={room._id}
                    image={room.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image'}
                    type={room.title}
                    area={room.superficies ? `${room.superficies} m²` : undefined}
                    address={getRoomAddress(room)}
                    price={formatPriceFull(room.price)}
                    badge={distMap[room._id] !== undefined ? formatDistance(distMap[room._id]) : undefined}
                    onView={() => { setActiveId(room._id); setModal(room); }}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── RIGHT: Map Pane ─────────────────────────────────────────────── */}
        <div style={{ flex: 1, position: 'relative', height: '100%' }}>
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
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
          price={formatPriceFull(modal.price)}
          badge={distMap[modal._id] !== undefined ? formatDistance(distMap[modal._id]) : undefined}
          description={modal.description}
          posterId={modal.posterId}
          posterName={modal.posterName}
          phone={modal.phone}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}