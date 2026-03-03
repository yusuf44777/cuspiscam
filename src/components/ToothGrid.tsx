import { Pressable, StyleSheet, Text, View } from "react-native";
import { TOOTH_ROWS } from "../constants/dental";

type ToothGridProps = {
  selectedTooth: string | null;
  onSelect: (tooth: string) => void;
};

export function ToothGrid({ selectedTooth, onSelect }: ToothGridProps) {
  return (
    <View style={styles.wrapper}>
      {TOOTH_ROWS.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map((tooth) => {
            const isSelected = selectedTooth === tooth;

            return (
              <Pressable
                key={tooth}
                onPress={() => onSelect(tooth)}
                style={({ pressed }) => [
                  styles.toothButton,
                  isSelected && styles.toothButtonSelected,
                  pressed && styles.toothButtonPressed,
                ]}
              >
                <Text
                  selectable
                  style={[
                    styles.toothLabel,
                    isSelected && styles.toothLabelSelected,
                  ]}
                >
                  {tooth}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  toothButton: {
    minWidth: 60,
    flexGrow: 1,
    minHeight: 60,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D2E0E5",
    backgroundColor: "#F7FBFC",
    alignItems: "center",
    justifyContent: "center",
  },
  toothButtonSelected: {
    borderColor: "#0E788E",
    backgroundColor: "#0E788E",
  },
  toothButtonPressed: {
    opacity: 0.92,
  },
  toothLabel: {
    color: "#11313C",
    fontSize: 18,
    fontWeight: "700",
  },
  toothLabelSelected: {
    color: "#FFFFFF",
  },
});

