import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: "#F4F8F9",
          },
          headerTintColor: "#11313C",
          headerTitleStyle: {
            fontFamily: "Avenir Next",
            fontSize: 18,
            fontWeight: "700",
          },
          contentStyle: {
            backgroundColor: "#F4F8F9",
          },
        }}
      />
    </>
  );
}

