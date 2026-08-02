import {
  apiCreateAiConversation,
  apiDeleteAiConversation,
  apiSendAiMessage,
} from "./ai";
import {
  buildRuleBasedWeatherTip,
  type WeatherSnapshot,
} from "./weather";

const TIP_CACHE_PREFIX = "ce_weather_ai_tip_v1";

function tipCacheKey(weather: WeatherSnapshot): string {
  const day = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
  return `${TIP_CACHE_PREFIX}:${day}:${weather.weatherCode}:${weather.temperatureC}:${weather.rainChancePercent}`;
}

function readTipCache(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeTipCache(key: string, tip: string) {
  try {
    sessionStorage.setItem(key, tip);
  } catch {
    /* ignore */
  }
}

function buildTeacherWeatherPrompt(weather: WeatherSnapshot): string {
  return [
    "Bạn là trợ lý của giáo viên tiếng Anh tại Việt Nam.",
    "Viết ĐÚNG 1–2 câu tiếng Việt (tối đa 40 từ), gợi ý hoạt động dạy học phù hợp thời tiết hôm nay.",
    "Không chào hỏi, không markdown, không gạch đầu dòng.",
    `Thời tiết: ${weather.skyLabelVi} (${weather.skyLabel}), ${weather.temperatureC}°C (cảm giác ${weather.feelsLikeC}°C),`,
    `độ ẩm ${weather.humidityPercent}%, gió ${weather.windKmh} km/h, UV ${weather.uvIndex}, khả năng mưa ${weather.rainChancePercent}%.`,
    `Địa điểm: ${weather.location.name}.`,
  ].join(" ");
}

function sanitizeTip(raw: string): string {
  return raw
    .replace(/^["'«»]+|["'«»]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Load AI tip after weather is ready.
 * Uses day+condition cache; cleans up ephemeral conversation.
 * Falls back to rule-based tip on any failure.
 */
export async function apiFetchWeatherTeachingTip(
  weather: WeatherSnapshot,
  options?: { signal?: AbortSignal },
): Promise<{ tip: string; source: "ai" | "cache" | "rule" }> {
  const key = tipCacheKey(weather);
  const cached = readTipCache(key);
  if (cached) {
    return { tip: cached, source: "cache" };
  }

  let conversationId: string | null = null;
  try {
    if (options?.signal?.aborted) {
      throw new Error("aborted");
    }
    const created = await apiCreateAiConversation("Dashboard · Weather tip");
    conversationId =
      created.data?.id ??
      (created as { result?: { id?: string } }).result?.id ??
      null;
    if (!conversationId) {
      throw new Error("Không tạo được conversation AI");
    }

    const reply = await apiSendAiMessage(conversationId, buildTeacherWeatherPrompt(weather));
    if (options?.signal?.aborted) {
      throw new Error("aborted");
    }
    const content = reply.data?.content ?? (reply as { result?: { content?: string } }).result?.content ?? "";
    const tip = sanitizeTip(String(content));
    if (!tip) {
      throw new Error("AI trả về rỗng");
    }
    writeTipCache(key, tip);
    return { tip, source: "ai" };
  } catch {
    const tip = buildRuleBasedWeatherTip(weather);
    return { tip, source: "rule" };
  } finally {
    if (conversationId) {
      void apiDeleteAiConversation(conversationId).catch(() => undefined);
    }
  }
}
