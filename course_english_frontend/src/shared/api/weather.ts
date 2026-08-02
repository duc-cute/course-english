/** Open-Meteo weather client — no API key, browser-safe CORS. */

export type WeatherLocation = {
  name: string;
  latitude: number;
  longitude: number;
  /** preset id | "gps" | "custom" */
  source?: "preset" | "gps" | "custom";
  presetId?: string;
  /** true khi user chọn tỉnh/TP hoặc bấm GPS trong menu — không bị auto-ghi đè */
  userPicked?: boolean;
};

export type WeatherSnapshot = {
  location: WeatherLocation;
  temperatureC: number;
  feelsLikeC: number;
  humidityPercent: number;
  windKmh: number;
  uvIndex: number;
  rainChancePercent: number;
  weatherCode: number;
  skyLabel: string;
  skyLabelVi: string;
  fetchedAt: string;
};

export type WeatherCityPreset = WeatherLocation & {
  id: string;
  label: string;
};

/** Common teaching locations — user can pick instead of hardcoding one city. */
export const WEATHER_CITY_PRESETS: WeatherCityPreset[] = [
  {
    id: "ha-noi",
    label: "Hà Nội",
    name: "Hà Nội, Việt Nam",
    latitude: 21.0285,
    longitude: 105.8542,
    source: "preset",
    presetId: "ha-noi",
  },
  {
    id: "hung-yen",
    label: "Hưng Yên",
    name: "Hưng Yên, Việt Nam",
    latitude: 20.6464,
    longitude: 106.0511,
    source: "preset",
    presetId: "hung-yen",
  },
  {
    id: "hai-phong",
    label: "Hải Phòng",
    name: "Hải Phòng, Việt Nam",
    latitude: 20.8449,
    longitude: 106.6881,
    source: "preset",
    presetId: "hai-phong",
  },
  {
    id: "bac-ninh",
    label: "Bắc Ninh",
    name: "Bắc Ninh, Việt Nam",
    latitude: 21.1861,
    longitude: 106.0763,
    source: "preset",
    presetId: "bac-ninh",
  },
  {
    id: "bac-giang",
    label: "Bắc Giang",
    name: "Bắc Giang, Việt Nam",
    latitude: 21.2819,
    longitude: 106.1974,
    source: "preset",
    presetId: "bac-giang",
  },
  {
    id: "nam-dinh",
    label: "Nam Định",
    name: "Nam Định, Việt Nam",
    latitude: 20.4388,
    longitude: 106.1621,
    source: "preset",
    presetId: "nam-dinh",
  },
  {
    id: "thai-binh",
    label: "Thái Bình",
    name: "Thái Bình, Việt Nam",
    latitude: 20.4463,
    longitude: 106.3366,
    source: "preset",
    presetId: "thai-binh",
  },
  {
    id: "da-nang",
    label: "Đà Nẵng",
    name: "Đà Nẵng, Việt Nam",
    latitude: 16.0544,
    longitude: 108.2022,
    source: "preset",
    presetId: "da-nang",
  },
  {
    id: "ho-chi-minh",
    label: "TP. Hồ Chí Minh",
    name: "TP. Hồ Chí Minh, Việt Nam",
    latitude: 10.8231,
    longitude: 106.6297,
    source: "preset",
    presetId: "ho-chi-minh",
  },
  {
    id: "can-tho",
    label: "Cần Thơ",
    name: "Cần Thơ, Việt Nam",
    latitude: 10.0452,
    longitude: 105.7469,
    source: "preset",
    presetId: "can-tho",
  },
];

/** Fallback only when no preference and GPS unavailable. */
export const DEFAULT_WEATHER_LOCATION: WeatherLocation = WEATHER_CITY_PRESETS[0];

/** @deprecated use DEFAULT_WEATHER_LOCATION / presets */
export const HANOI_LOCATION: WeatherLocation = DEFAULT_WEATHER_LOCATION;
const CACHE_KEY = "ce_dashboard_weather_v1";
const PREF_KEY = "ce_weather_location_pref_v2";
const CACHE_TTL_MS = 45 * 60 * 1000;
const GPS_TIMEOUT_MS = 12000;

type CachedWeather = {
  expiresAt: number;
  data: WeatherSnapshot;
};

type StoredLocationPref = WeatherLocation;

export function loadWeatherLocationPreference(): WeatherLocation | null {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredLocationPref;
    if (
      !parsed ||
      typeof parsed.latitude !== "number" ||
      typeof parsed.longitude !== "number" ||
      !parsed.name
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveWeatherLocationPreference(location: WeatherLocation) {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(location));
  } catch {
    /* ignore */
  }
}

export function clearWeatherLocationPreference() {
  try {
    localStorage.removeItem(PREF_KEY);
  } catch {
    /* ignore */
  }
}

/** WMO Weather interpretation codes (WW) → short EN/VI labels. */
export function weatherCodeLabels(code: number): { en: string; vi: string } {
  if (code === 0) return { en: "Clear", vi: "Quang đãng" };
  if (code === 1) return { en: "Mainly clear", vi: "Ít mây" };
  if (code === 2) return { en: "Partly cloudy", vi: "Có mây" };
  if (code === 3) return { en: "Overcast", vi: "U ám" };
  if (code === 45 || code === 48) return { en: "Fog", vi: "Sương mù" };
  if (code >= 51 && code <= 57) return { en: "Drizzle", vi: "Mưa phùn" };
  if (code >= 61 && code <= 67) return { en: "Rain", vi: "Mưa" };
  if (code >= 71 && code <= 77) return { en: "Snow", vi: "Tuyết" };
  if (code >= 80 && code <= 82) return { en: "Showers", vi: "Mưa rào" };
  if (code >= 95 && code <= 99) return { en: "Thunderstorm", vi: "Dông" };
  return { en: "Cloudy", vi: "Nhiều mây" };
}

export function uvLabel(uv: number): string {
  if (uv < 3) return `${Math.round(uv)} (Thấp)`;
  if (uv < 6) return `${Math.round(uv)} (TB)`;
  if (uv < 8) return `${Math.round(uv)} (Cao)`;
  if (uv < 11) return `${Math.round(uv)} (Rất cao)`;
  return `${Math.round(uv)} (Cực đoan)`;
}

/** Instant classroom tip from weather — used before / if AI fails. */
export function buildRuleBasedWeatherTip(weather: WeatherSnapshot): string {
  const { weatherCode, temperatureC, rainChancePercent, uvIndex } = weather;
  if (weatherCode >= 95) {
    return "Trời dông — nên ưu tiên hoạt động indoor: listening, vocab quiz trên máy, tránh hoạt động ngoài trời.";
  }
  if (weatherCode >= 61 || rainChancePercent >= 50) {
    return "Trời mưa / ẩm — thích hợp listening & reading trong lớp; kết thúc bằng vòng hỏi đáp giữ nhịp lớp.";
  }
  if (weatherCode === 45 || weatherCode === 48) {
    return "Sương mù — chọn speaking cặp đôi trong phòng, hạn chế hoạt động ngoài trời.";
  }
  if (temperatureC >= 34 || uvIndex >= 8) {
    return "Nắng nóng / UV cao — ưu tiên hoạt động ngồi: role-play, flashcard, hạn chế chạy nhảy ngoài sân.";
  }
  if (weatherCode === 0 || weatherCode === 1) {
    return "Thời tiết đẹp! Thích hợp speaking, gallery walk hoặc trò chơi vận động nhẹ trong lớp.";
  }
  return "Thời tiết ổn — kết hợp warm-up speaking ngắn rồi chuyển sang bài chính theo kế hoạch hôm nay.";
}

function readCache(locationKey: string): WeatherSnapshot | null {
  try {
    const raw = sessionStorage.getItem(`${CACHE_KEY}:${locationKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedWeather;
    if (!parsed?.expiresAt || !parsed?.data) return null;
    if (Date.now() > parsed.expiresAt) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(locationKey: string, data: WeatherSnapshot) {
  try {
    const payload: CachedWeather = { expiresAt: Date.now() + CACHE_TTL_MS, data };
    sessionStorage.setItem(`${CACHE_KEY}:${locationKey}`, JSON.stringify(payload));
  } catch {
    /* ignore quota */
  }
}

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    apparent_temperature?: number;
    weather_code?: number;
    wind_speed_10m?: number;
    precipitation?: number;
  };
  daily?: {
    uv_index_max?: number[];
    precipitation_probability_max?: number[];
  };
};

type BigDataCloudReverse = {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  countryName?: string;
};

function formatReverseName(data: BigDataCloudReverse): string {
  const city = data.city || data.locality || "";
  const province = data.principalSubdivision || "";
  if (city && province && city !== province) return `${city}, ${province}`;
  if (province) return `${province}, Việt Nam`;
  if (city) return `${city}, Việt Nam`;
  return "Vị trí của bạn";
}

function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** Nearest preset — keeps labels friendly (Bắc Giang, Hưng Yên…). */
function nearestPreset(lat: number, lon: number): WeatherCityPreset {
  let best = WEATHER_CITY_PRESETS[0];
  let bestDist = Number.POSITIVE_INFINITY;
  for (const city of WEATHER_CITY_PRESETS) {
    const d = distanceKm(lat, lon, city.latitude, city.longitude);
    if (d < bestDist) {
      bestDist = d;
      best = city;
    }
  }
  return best;
}

/**
 * Map GPS coords → label.
 * Prefer nearest preset within 70km (tránh reverse-geocode báo nhầm "Hà Nội"
 * khi ISP/WiFi định vị lệch về HN).
 */
export async function reverseGeocodeLocation(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<WeatherLocation> {
  const near = nearestPreset(latitude, longitude);
  const nearKm = distanceKm(latitude, longitude, near.latitude, near.longitude);
  if (nearKm <= 70) {
    return {
      name: near.name,
      latitude,
      longitude,
      source: "gps",
      presetId: near.id,
    };
  }

  try {
    const url =
      `https://api.bigdatacloud.net/data/reverse-geocode-client` +
      `?latitude=${latitude}&longitude=${longitude}&localityLanguage=vi`;
    const response = await fetch(url, { signal });
    if (response.ok) {
      const data = (await response.json()) as BigDataCloudReverse;
      return {
        name: formatReverseName(data),
        latitude,
        longitude,
        source: "gps",
      };
    }
  } catch {
    /* fall through */
  }

  return {
    name: `Gần ${near.label}`,
    latitude,
    longitude,
    source: "gps",
    presetId: near.id,
  };
}

function getBrowserPosition(timeoutMs = GPS_TIMEOUT_MS): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Trình duyệt không hỗ trợ định vị."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: timeoutMs,
      maximumAge: 5 * 60 * 1000,
    });
  });
}

export async function detectGpsWeatherLocation(signal?: AbortSignal): Promise<WeatherLocation> {
  const pos = await getBrowserPosition();
  if (signal?.aborted) throw new Error("aborted");
  return reverseGeocodeLocation(pos.coords.latitude, pos.coords.longitude, signal);
}

/**
 * Resolve where to fetch weather:
 * 1) Explicit override (menu / GPS button)
 * 2) Saved preference — luôn dùng lại, không gọi GPS mỗi lần reload
 * 3) GPS chỉ khi chưa có preference và preferGps=true
 * 4) Default Hà Nội
 */
export async function resolveWeatherLocation(options?: {
  signal?: AbortSignal;
  preferGps?: boolean;
  /** Bắt buộc lấy GPS (user bấm "Dùng vị trí hiện tại") */
  forceGps?: boolean;
  locationOverride?: WeatherLocation | null;
}): Promise<WeatherLocation> {
  if (options?.locationOverride) return options.locationOverride;

  const saved = loadWeatherLocationPreference();

  // Đã có vị trí lưu → dùng luôn (tránh GPS mỗi lần F5).
  if (saved && !options?.forceGps) return saved;

  if (options?.forceGps || (options?.preferGps && !saved)) {
    try {
      const gps = await detectGpsWeatherLocation(options.signal);
      const next = { ...gps, userPicked: Boolean(options?.forceGps) };
      saveWeatherLocationPreference(next);
      return next;
    } catch {
      /* fall through */
    }
  }

  return saved ?? DEFAULT_WEATHER_LOCATION;
}

export function locationFromPreset(preset: WeatherCityPreset): WeatherLocation {
  return {
    name: preset.name,
    latitude: preset.latitude,
    longitude: preset.longitude,
    source: "preset",
    presetId: preset.id,
    userPicked: true,
  };
}

export function weatherLocationCacheKey(location: WeatherLocation): string {
  return `${location.latitude.toFixed(3)},${location.longitude.toFixed(3)}`;
}

/** Sync peek — dùng để hiện weather ngay khi reload (không chờ mạng / GPS). */
export function peekCachedWeather(location?: WeatherLocation | null): WeatherSnapshot | null {
  const loc = location ?? loadWeatherLocationPreference();
  if (!loc) return null;
  return readCache(weatherLocationCacheKey(loc));
}

export async function apiFetchWeather(
  location?: WeatherLocation | null,
  options?: {
    signal?: AbortSignal;
    bypassCache?: boolean;
    preferGps?: boolean;
    forceGps?: boolean;
  },
): Promise<WeatherSnapshot> {
  const resolved =
    location ??
    (await resolveWeatherLocation({
      signal: options?.signal,
      preferGps: options?.preferGps ?? false,
      forceGps: options?.forceGps,
    }));

  const locationKey = weatherLocationCacheKey(resolved);
  if (!options?.bypassCache) {
    const cached = readCache(locationKey);
    if (cached) return cached;
  }

  const params = new URLSearchParams({
    latitude: String(resolved.latitude),
    longitude: String(resolved.longitude),
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "weather_code",
      "wind_speed_10m",
      "precipitation",
    ].join(","),
    daily: "uv_index_max,precipitation_probability_max",
    timezone: "Asia/Ho_Chi_Minh",
    forecast_days: "1",
    wind_speed_unit: "kmh",
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
    signal: options?.signal,
  });
  if (!response.ok) {
    throw new Error(`Weather HTTP ${response.status}`);
  }

  const json = (await response.json()) as OpenMeteoResponse;
  const current = json.current;
  if (!current || typeof current.temperature_2m !== "number") {
    throw new Error("Weather response thiếu dữ liệu current");
  }

  const code = Number(current.weather_code ?? 2);
  const labels = weatherCodeLabels(code);
  const precipProb = json.daily?.precipitation_probability_max?.[0];
  const precipMm = Number(current.precipitation ?? 0);
  const rainChance =
    typeof precipProb === "number"
      ? precipProb
      : precipMm > 0
        ? Math.min(100, Math.round(precipMm * 40))
        : 0;

  const snapshot: WeatherSnapshot = {
    location: resolved,
    temperatureC: Math.round(current.temperature_2m),
    feelsLikeC: Math.round(Number(current.apparent_temperature ?? current.temperature_2m)),
    humidityPercent: Math.round(Number(current.relative_humidity_2m ?? 0)),
    windKmh: Math.round(Number(current.wind_speed_10m ?? 0)),
    uvIndex: Number(json.daily?.uv_index_max?.[0] ?? 0),
    rainChancePercent: Math.round(rainChance),
    weatherCode: code,
    skyLabel: labels.en,
    skyLabelVi: labels.vi,
    fetchedAt: new Date().toISOString(),
  };

  writeCache(locationKey, snapshot);
  return snapshot;
}
