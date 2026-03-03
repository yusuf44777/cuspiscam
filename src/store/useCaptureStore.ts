import { create } from "zustand";
import type { CaptureRecord } from "../types/capture";
import type { SyncProgress } from "../services/uploadQueue";
import { createGeneratedSessionId } from "../utils/formatting";

export type BannerState =
  | {
      tone: "success" | "error" | "info";
      text: string;
    }
  | null;

type CaptureState = {
  // ── Session ────────────────────────────────
  patientIdInput: string;
  generatedSessionId: string;
  selectedTooth: string | null;
  recentCaptures: CaptureRecord[];
  pendingCount: number;
  isCapturing: boolean;
  banner: BannerState;

  // ── Google Auth ────────────────────────────
  accessToken: string | null;
  isSyncing: boolean;
  syncProgress: SyncProgress | null;

  // ── Session actions ────────────────────────
  setPatientIdInput: (value: string) => void;
  selectTooth: (tooth: string) => void;
  setPendingCount: (count: number) => void;
  beginCapture: () => void;
  finishCapture: (capture: CaptureRecord) => void;
  showBanner: (banner: Exclude<BannerState, null>) => void;
  clearBanner: () => void;

  // ── Auth actions ───────────────────────────
  setAccessToken: (token: string | null) => void;
  setIsSyncing: (syncing: boolean) => void;
  setSyncProgress: (progress: SyncProgress | null) => void;
  signOut: () => void;
};

export const useCaptureStore = create<CaptureState>((set) => ({
  patientIdInput: "",
  generatedSessionId: createGeneratedSessionId(),
  selectedTooth: null,
  recentCaptures: [],
  pendingCount: 0,
  isCapturing: false,
  banner: null,

  // Auth defaults
  accessToken: null,
  isSyncing: false,
  syncProgress: null,

  setPatientIdInput: (value) => set({ patientIdInput: value }),
  selectTooth: (tooth) => set({ selectedTooth: tooth }),
  setPendingCount: (count) => set({ pendingCount: count }),
  beginCapture: () => set({ isCapturing: true, banner: null }),
  finishCapture: (capture) =>
    set((state) => ({
      isCapturing: false,
      recentCaptures: [capture, ...state.recentCaptures].slice(0, 10),
      banner: {
        tone: "success",
        text: `Saved ${capture.fileName} to local storage and queued it for sync.`,
      },
    })),
  showBanner: (banner) => set({ isCapturing: false, banner }),
  clearBanner: () => set({ banner: null }),

  // Auth actions
  setAccessToken: (token) => set({ accessToken: token }),
  setIsSyncing: (syncing) => set({ isSyncing: syncing }),
  setSyncProgress: (progress) => set({ syncProgress: progress }),
  signOut: () =>
    set({
      accessToken: null,
      isSyncing: false,
      syncProgress: null,
      banner: { tone: "info", text: "Signed out of Google Drive." },
    }),
}));

