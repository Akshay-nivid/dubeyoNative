import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import "react-native-css-interop/jsx-runtime";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from 'react-native-toast-message';
import "../global.css";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar backgroundColor="white" barStyle="dark-content" />
      <Stack screenOptions={{ headerShown: false }} />
      <Toast
        position="top"
        topOffset={60}
        visibilityTime={4000}
        autoHide={true}
        keyboardOffset={0}
      />
    </SafeAreaProvider>
  );
}
