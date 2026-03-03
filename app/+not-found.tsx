import { Link, Stack } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotFoundScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: "Bulunamadı" }} />
      <View style={styles.card}>
        <Text selectable style={styles.title}>
          Sayfa bulunamadı
        </Text>
        <Text selectable style={styles.description}>
          İstenen sayfa bu uygulamada mevcut değil.
        </Text>
        <Link href="/" asChild>
          <Pressable style={styles.button}>
            <Text selectable style={styles.buttonText}>
              Çekim ekranına dön
            </Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F8F9",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    padding: 24,
    boxShadow: "0 16px 40px rgba(17, 49, 60, 0.08)",
    gap: 12,
  },
  title: {
    color: "#11313C",
    fontFamily: "Avenir Next",
    fontSize: 24,
    fontWeight: "700",
  },
  description: {
    color: "#5F7781",
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    marginTop: 8,
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: "#0E788E",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

