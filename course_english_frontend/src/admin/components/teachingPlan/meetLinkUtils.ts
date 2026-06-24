const MEET_HOST = /^(\w+\.)?meet\.google\.com$/i;
const ZOOM_HOST = /^(\w+\.)?zoom\.us$/i;

export function isValidMeetLink(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    if (host === "meet.new") return false;
    return MEET_HOST.test(host) || ZOOM_HOST.test(host);
  } catch {
    return false;
  }
}

export function meetLinkValidationMessage(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return "Vui lòng dán link Google Meet hoặc Zoom.";
  if (trimmed.includes("meet.new")) {
    return "Đây không phải link phòng. Hãy copy URL sau khi tạo phòng (meet.google.com/...).";
  }
  if (!isValidMeetLink(trimmed)) {
    return "Link không hợp lệ. Chỉ chấp nhận Google Meet (meet.google.com) hoặc Zoom (zoom.us).";
  }
  return null;
}
