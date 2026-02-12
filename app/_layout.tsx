import BottomNavigationBar from "@/src/components/BottomNavigationBar";
import ThemedBackground from "@/src/components/ThemedBackground";
import { Stack, usePathname, useRouter } from "expo-router";
import { StatusBar } from "react-native";
import "react-native-css-interop/jsx-runtime";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from 'react-native-toast-message';
import "../global.css";

export default function RootLayout() {
  const router = useRouter();

  const pathname = usePathname();

  const showBottomBar = ['/home', '/chat'].includes(pathname);

  return (
    <SafeAreaProvider>
      <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent />
      <ThemedBackground style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' },
            animation: 'none',
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="home" options={{ headerShown: false }} />
          <Stack.Screen
            name="login"
            options={{
              headerShown: false,
              animation: 'slide_from_left',
            }}
          />
          <Stack.Screen
            name="signup"
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="search-drag"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
        </Stack>
        {showBottomBar && <BottomNavigationBar />}
      </ThemedBackground>
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
