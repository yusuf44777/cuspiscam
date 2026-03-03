import type { SurfaceId } from "../constants/dental";

type BuildCaptureFileNameParams = {
  sessionId: string;
  tooth: string;
  surfaceId: SurfaceId;
  capturedAt: string;
  extension?: string;
};

export function createGeneratedSessionId(date = new Date()) {
  return `SESSION-${createCompactStamp(date.toISOString())}`;
}

export function buildCaptureFileName({
  sessionId,
  tooth,
  surfaceId,
  capturedAt,
  extension = "jpg",
}: BuildCaptureFileNameParams) {
  const safeSessionId = sanitizeFileSegment(sessionId);
  const safeExtension = sanitizeFileSegment(extension) || "jpg";

  return `${safeSessionId}_Tooth-${tooth}_Surface-${surfaceId}_${createCompactStamp(
    capturedAt,
  )}.${safeExtension}`;
}

export function sanitizeFileSegment(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");
}

export function createCompactStamp(dateLike: string) {
  const date = new Date(dateLike);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  const seconds = `${date.getSeconds()}`.padStart(2, "0");

  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

export function formatReadableDate(dateLike: string) {
  const date = new Date(dateLike);

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
