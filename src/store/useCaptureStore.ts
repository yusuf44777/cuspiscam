import { create } from "zustand";
import type { CaptureRecord } from "../types/capture";
import type { SyncProgress } from "../services/uploadQueue";
import type { ArchId, ToothTypeId } from "../constants/dental";

export type BannerState =
  | {
      tone: "success" | "error" | "info";
      text: string;
    }
  | null;

export type ProCameraResult = {
  path: string;
  width: number;
  height: number;
  tooth: string;
  surface: string;
} | null;

type CaptureState = {
  // ── Seçim ───────────────────────────────
  selectedArch: ArchId | null;
  selectedTooth: ToothTypeId | null;
  recentCaptures: CaptureRecord[];
  pendingCount: number;
  isCapturing: boolean;
  banner: BannerState;

  // ── Pro Camera ─────────────────────────
  proCameraResult: ProCameraResult;

  // ── Google Auth ────────────────────────────
  accessToken: string | null;
  isSyncing: boolean;
  syncProgress: SyncProgress | null;

  // ── Seçim aksiyonları ──────────────────────
  setArch: (arch: ArchId) => void;
  selectTooth: (tooth: ToothTypeId) => void;
  setPendingCount: (count: number) => void;
  beginCapture: () => void;
  finishCapture: (capture: CaptureRecord) => void;
  showBanner: (banner: Exclude<BannerState, null>) => void;
  clearBanner: () => void;

  // ── Pro Camera aksiyonları ─────────────
  setProCameraResult: (result: ProCameraResult) => void;
  clearProCameraResult: () => void;

  // ── Auth aksiyonları ───────────────────────
  setAccessToken: (token: string | null) => void;
  setIsSyncing: (syncing: boolean) => void;
  setSyncProgress: (progress: SyncProgress | null) => void;
  signOut: () => void;
};

export const useCaptureStore = create<CaptureState>((set) => ({
  selectedArch: null,
  selectedTooth: null,
  recentCaptures: [],
  pendingCount: 0,
  isCapturing: false,
  banner: null,

  // Pro Camera
  proCameraResult: null,

  // Auth defaults
  accessToken: null,
  isSyncing: false,
  syncProgress: null,

  setArch: (arch) => set({ selectedArch: arch, selectedTooth: null }),
  selectTooth: (tooth) => set({ selectedTooth: tooth }),
  setPendingCount: (count) => set({ pendingCount: count }),
  beginCapture: () => set({ isCapturing: true, banner: null }),
  finishCapture: (capture) =>
    set((state) => ({
      isCapturing: false,
      recentCaptures: [capture, ...state.recentCaptures].slice(0, 10),
      banner: {
        tone: "success",
        text: `${capture.fileName} yerel kayda alındı ve senkron kuyruğuna eklendi.`,
      },
    })),
  showBanner: (banner) => set({ isCapturing: false, banner }),
  clearBanner: () => set({ banner: null }),

  // Pro Camera actions
  setProCameraResult: (result) => set({ proCameraResult: result }),
  clearProCameraResult: () => set({ proCameraResult: null }),

  // Auth actions
  setAccessToken: (token) => set({ accessToken: token }),
  setIsSyncing: (syncing) => set({ isSyncing: syncing }),
  setSyncProgress: (progress) => set({ syncProgress: progress }),
  signOut: () =>
    set({
      accessToken: null,
      isSyncing: false,
      syncProgress: null,
      banner: { tone: "info", text: "Google Drive oturumu kapatıldı." },
    }),
}));

