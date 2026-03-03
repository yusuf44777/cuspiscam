export const TOOTH_ROWS = [
  ["18", "17", "16", "15", "14", "13", "12", "11"],
  ["21", "22", "23", "24", "25", "26", "27", "28"],
  ["48", "47", "46", "45", "44", "43", "42", "41"],
  ["31", "32", "33", "34", "35", "36", "37", "38"],
] as const;

export const SURFACES = [
  {
    id: "OI",
    shortLabel: "O/I",
    label: "Occlusal / Incisal",
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
    label: "Buccal / Facial",
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

