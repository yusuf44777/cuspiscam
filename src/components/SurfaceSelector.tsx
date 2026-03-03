import { Pressable, StyleSheet, Text, View } from "react-native";
import { SURFACES } from "../constants/dental";

type SurfaceSelectorProps = {
  toothLabel: string | null;
  disabled: boolean;
  onSelect: (surfaceId: (typeof SURFACES)[number]["id"], source?: "camera" | "gallery") => void;
};

export function SurfaceSelector({
  toothLabel,
  disabled,
  onSelect,
}: SurfaceSelectorProps) {
  return (
    <View style={styles.grid}>
      {SURFACES.map((surface) => (
        <View key={surface.id} style={styles.surfaceRow}>
          <Pressable
            onPress={() => onSelect(surface.id, "camera")}
            disabled={disabled}
            style={({ pressed }) => [
              styles.surfaceButton,
              disabled && styles.surfaceButtonDisabled,
              pressed && !disabled && styles.surfaceButtonPressed,
            ]}
          >
            <Text selectable style={styles.surfaceCode}>
              {surface.shortLabel}
            </Text>
            <Text selectable style={styles.surfaceLabel}>
              {surface.label}
            </Text>
            <Text selectable style={styles.surfaceHint}>
              {toothLabel
                ? `Çekim: ${toothLabel}`
                : "Önce bir diş seçin"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onSelect(surface.id, "gallery")}
            disabled={disabled}
            style={({ pressed }) => [
              styles.galleryButton,
              disabled && styles.galleryButtonDisabled,
              pressed && !disabled && styles.surfaceButtonPressed,
            ]}
          >
            <Text selectable style={styles.galleryButtonText}>
              Galeriden{"\n"}Al
            </Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 12,
  },
  surfaceRow: {
    flexDirection: "row",
    gap: 10,
  },
  surfaceButton: {
    flex: 1,
    minHeight: 88,
    borderRadius: 22,
    backgroundColor: "#11313C",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
    justifyContent: "center",
    boxShadow: "0 8px 24px rgba(17, 49, 60, 0.12)",
  },
  surfaceButtonDisabled: {
    backgroundColor: "#C8D5DA",
    boxShadow: "0 0 0 rgba(0, 0, 0, 0)",
  },
  surfaceButtonPressed: {
    opacity: 0.94,
  },
  galleryButton: {
    width: 72,
    minHeight: 88,
    borderRadius: 22,
    backgroundColor: "#1A4A5A",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    boxShadow: "0 8px 24px rgba(17, 49, 60, 0.12)",
  },
  galleryButtonDisabled: {
    backgroundColor: "#C8D5DA",
    boxShadow: "0 0 0 rgba(0, 0, 0, 0)",
  },
  galleryButtonText: {
    color: "#8AD4E3",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 15,
  },
  surfaceCode: {
    color: "#8AD4E3",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  surfaceLabel: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  surfaceHint: {
    color: "#D6E6EA",
    fontSize: 13,
  },
});
