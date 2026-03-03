// ─── Çene (Arch) tanımları ────────────────────────────────────────

export const ARCHES = [
  { id: "maxillary", label: "Üst Çene", fileSegment: "Max" },
  { id: "mandibular", label: "Alt Çene", fileSegment: "Mand" },
] as const;

export type ArchDefinition = (typeof ARCHES)[number];
export type ArchId = ArchDefinition["id"];

// ─── Diş türü tanımları ──────────────────────────────────────────

export const TOOTH_TYPES = [
  { id: "Central", label: "Santral Kesici (Central)" },
  { id: "Lateral", label: "Lateral Kesici (Lateral)" },
  { id: "Canine", label: "Kanin (Canine)" },
  { id: "1stPremolar", label: "1. Premolar" },
  { id: "2ndPremolar", label: "2. Premolar" },
  { id: "1stMolar", label: "1. Molar" },
  { id: "2ndMolar", label: "2. Molar" },
  { id: "3rdMolar", label: "3. Molar (Yirmilik)" },
] as const;

export type ToothTypeDefinition = (typeof TOOTH_TYPES)[number];
export type ToothTypeId = ToothTypeDefinition["id"];

// ─── Diş yardımcı fonksiyonları ──────────────────────────────────

export function buildToothFileSegment(
  archId: ArchId,
  toothTypeId: ToothTypeId,
): string {
  const arch = ARCHES.find((a) => a.id === archId);
  return `${arch?.fileSegment ?? archId}-${toothTypeId}`;
}

export function getToothDisplayLabel(
  archId: ArchId,
  toothTypeId: ToothTypeId,
): string {
  const arch = ARCHES.find((a) => a.id === archId);
  const tooth = TOOTH_TYPES.find((t) => t.id === toothTypeId);
  return `${arch?.label ?? archId} – ${tooth?.label ?? toothTypeId}`;
}

export function parseToothDisplayFromSegment(segment: string): string {
  const dashIndex = segment.indexOf("-");
  if (dashIndex < 0) return segment;

  const archSegment = segment.slice(0, dashIndex);
  const toothSegment = segment.slice(dashIndex + 1);

  const arch = ARCHES.find((a) => a.fileSegment === archSegment);
  const tooth = TOOTH_TYPES.find((t) => t.id === toothSegment);

  if (arch && tooth) {
    return `${arch.label} – ${tooth.label}`;
  }
  return segment;
}

// ─── Yüzey tanımları ─────────────────────────────────────────────

export const SURFACES = [
  {
    id: "OI",
    shortLabel: "O/I",
    label: "Oklüzal / İnsisal",
  },
  {
    id: "M",
    shortLabel: "M",
    label: "Mesial",
  },
  {
    id: "D",
    shortLabel: "D",
    label: "Distal",
  },
  {
    id: "BF",
    shortLabel: "B/F",
    label: "Bukkal / Fasiyal",
  },
  {
    id: "LP",
    shortLabel: "L/P",
    label: "Lingual / Palatal",
  },
] as const;

export type SurfaceDefinition = (typeof SURFACES)[number];
export type SurfaceId = SurfaceDefinition["id"];

export function getSurfaceById(surfaceId: SurfaceId) {
  return SURFACES.find((surface) => surface.id === surfaceId);
}

