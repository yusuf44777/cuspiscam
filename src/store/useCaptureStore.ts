import { create } from "zustand";
import type { CaptureRecord } from "../types/capture";
import { createGeneratedSessionId } from "../utils/formatting";

export type BannerState =
  | {
      tone: "success" | "error" | "info";
      text: string;
    }
  | null;

type CaptureState = {
  patientIdInput: string;
  generatedSessionId: string;
  selectedTooth: string | null;
  recentCaptures: CaptureRecord[];
  pendingCount: number;
  isCapturing: boolean;
  banner: BannerState;
  setPatientIdInput: (value: string) => void;
  selectTooth: (tooth: string) => void;
  setPendingCount: (count: number) => void;
  beginCapture: () => void;
  finishCapture: (capture: CaptureRecord) => void;
  showBanner: (banner: Exclude<BannerState, null>) => void;
  clearBanner: () => void;
};

export const useCaptureStore = create<CaptureState>((set) => ({
  patientIdInput: "",
  generatedSessionId: createGeneratedSessionId(),
  selectedTooth: null,
  recentCaptures: [],
  pendingCount: 0,
  isCapturing: false,
  banner: null,
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
}));

