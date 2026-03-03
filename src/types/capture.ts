import type { SurfaceId } from "../constants/dental";

export type CaptureRecord = {
  id: string;
  patientId?: string;
  sessionId: string;
  tooth: string;
  surfaceId: SurfaceId;
  capturedAt: string;
  fileName: string;
  localUri: string;
};

export type QueuedUpload = CaptureRecord & {
  queuedAt: string;
  retryCount: number;
  lastError?: string;
};

