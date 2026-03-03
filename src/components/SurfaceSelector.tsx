import { Pressable, StyleSheet, Text, View } from "react-native";
import { SURFACES } from "../constants/dental";

type SurfaceSelectorProps = {
  selectedTooth: string | null;
  disabled: boolean;
  onSelect: (surfaceId: (typeof SURFACES)[number]["id"]) => void;
};

export function SurfaceSelector({
  selectedTooth,
  disabled,
  onSelect,
}: SurfaceSelectorProps) {
  return (
    <View style={styles.grid}>
      {SURFACES.map((surface) => (
        <Pressable
          key={surface.id}
          onPress={() => onSelect(surface.id)}
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
            {selectedTooth
              ? `Capture Tooth ${selectedTooth}`
              : "Select a tooth first"}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 12,
  },
  surfaceButton: {
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
