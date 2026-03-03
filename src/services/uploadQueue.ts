import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CaptureRecord, QueuedUpload } from "../types/capture";
import { uploadToGoogleDrive } from "./googleDrive";
import { ensureAppFolder } from "./googleDrive";

const STORAGE_KEY = "@cuspiscam/pending-uploads";

export async function getPendingUploads(): Promise<QueuedUpload[]> {
  try {
    const storedValue = await AsyncStorage.getItem(STORAGE_KEY);

    if (!storedValue) {
      return [];
    }

    const parsedValue = JSON.parse(storedValue) as QueuedUpload[];
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

export async function getPendingUploadCount() {
  const queue = await getPendingUploads();
  return queue.length;
}

export async function enqueueUpload(capture: CaptureRecord) {
  const queue = await getPendingUploads();
  const nextQueue: QueuedUpload[] = [
    {
      ...capture,
      queuedAt: new Date().toISOString(),
      retryCount: 0,
    },
    ...queue.filter((item) => item.id !== capture.id),
  ];

  await persistQueue(nextQueue);
  return nextQueue;
}

export async function clearPendingUploads() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

async function persistQueue(queue: QueuedUpload[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

// ─── Sync all pending uploads to Google Drive ─────────────────────

export type SyncProgress = {
  total: number;
  completed: number;
  failed: number;
  current?: string;
};

export type SyncResult = {
  uploaded: number;
  failed: number;
  errors: string[];
};

export async function syncPendingUploads(
  accessToken: string,
  onProgress?: (progress: SyncProgress) => void,
): Promise<SyncResult> {
  const queue = await getPendingUploads();

  if (queue.length === 0) {
    return { uploaded: 0, failed: 0, errors: [] };
  }

  // Ensure the CuspisCam folder exists
  const folderId = await ensureAppFolder(accessToken);

  const progress: SyncProgress = {
    total: queue.length,
    completed: 0,
    failed: 0,
  };

  const errors: string[] = [];
  let remainingQueue = [...queue];

  for (const item of queue) {
    progress.current = item.fileName;
    onProgress?.(progress);

    try {
      await uploadToGoogleDrive(item, accessToken, folderId);

      // Remove from queue on success
      remainingQueue = remainingQueue.filter((q) => q.id !== item.id);
      await persistQueue(remainingQueue);

      progress.completed++;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown upload error";
      errors.push(`${item.fileName}: ${message}`);

      // Increment retry count
      remainingQueue = remainingQueue.map((q) =>
        q.id === item.id
          ? { ...q, retryCount: q.retryCount + 1, lastError: message }
          : q,
      );
      await persistQueue(remainingQueue);

      progress.failed++;
    }

    onProgress?.(progress);
  }

  return {
    uploaded: progress.completed,
    failed: progress.failed,
    errors,
  };
}

