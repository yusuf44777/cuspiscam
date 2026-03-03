import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CaptureRecord, QueuedUpload } from "../types/capture";

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

