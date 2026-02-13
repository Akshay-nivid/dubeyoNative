import "react-native-css-interop/jsx-runtime";
import "../global.css";

import BottomNavigationBar from "@/src/components/BottomNavigationBar";
import ThemedBackground from "@/src/components/ThemedBackground";
import { colors } from "@/theme";

import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Stack, usePathname, useRouter } from "expo-router";

import { Dimensions, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

const toastConfig = {
  bottomSheet: ({ text1, text2 }: any) => (
    <View style={styles.toastContainer}>
      <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(105, 68, 199, 0.05)' }]} />

      {/* Drag Handle */}
      <View style={styles.dragHandle} />

      <View className="flex-row items-center px-6 py-4">
        <View className="w-10 h-10 rounded-full bg-purple-100 items-center justify-center mr-4">
          <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
        </View>
        <View className="flex-1">
          <Text className="text-gray-900 font-bold text-base leading-tight">{text1}</Text>
          {text2 && <Text className="text-gray-500 text-xs mt-0.5">{text2}</Text>}
        </View>
      </View>
    </View>
  )
};

const styles = StyleSheet.create({
  toastContainer: {
    width: width - 32,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    marginBottom: 40,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
  }
});

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
        config={toastConfig}
        position="top"
        topOffset={60}
        bottomOffset={100}
        visibilityTime={4000}
        autoHide={true}
        keyboardOffset={0}
      />
    </SafeAreaProvider>
  );
}
