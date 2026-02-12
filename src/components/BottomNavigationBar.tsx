
import { colors } from "@/theme";
import { Feather, Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Dimensions, Image, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, Path, Stop, LinearGradient as SvgLinearGradient } from "react-native-svg";

interface BottomNavigationBarProps {
  onAIMascotPress?: () => void;
}

const { width } = Dimensions.get("window");

const BottomNavigationBar = ({
  onAIMascotPress,
}: BottomNavigationBarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const iosPadding = Platform.OS === "ios" ? insets.bottom : 0;

  const isActive = (route: string) => {
    return pathname === route || pathname?.startsWith(route);
  };

  const [showAIModal, setShowAIModal] = React.useState(false);

  const handleAIMascotPress = () => {
    if (onAIMascotPress) {
      onAIMascotPress();
    } else {
      setShowAIModal(true);
    }
  };

  const navigationItems = [
    {
      id: "home",
      route: "/home",
      label: "Home",
      icon: (active: boolean) => (
        <Feather
          name="home"
          size={24}
          color={active ? colors.primary : "#4b5563"}
        />
      ),
    },
    {
      id: "chat",
      route: "/chat",
      label: "Chat",
      icon: (active: boolean) => (
        <Feather
          name="message-circle"
          size={24}
          color={active ? colors.primary : "#4b5563"}
        />
      ),
    },
    {
      id: "ai-mascot",
      isCenter: true,
      onPress: handleAIMascotPress,
    },
    {
      id: "profile",
      route: "/profile/profilescreen",
      label: "Profile",
      icon: (active: boolean) => (
        <Feather
          name="user"
          size={24}
          color={active ? colors.primary : "#4b5563"}
        />
      ),
    },
    {
      id: "postAd",
      route: "/postAd",
      label: "PostAd",
      icon: (active: boolean) => (
        <Ionicons
          name="add"
          size={32}
          color={active ? colors.primary : "#4b5563"}
        />
      ),
    },
  ];

  // Calculate the SVG Path for the floating bar with center cutout
  const curveTabPath = useMemo(() => {
    const TAB_HEIGHT = 84;
    const tabHeight = TAB_HEIGHT + iosPadding;
    const BUTTON_RADIUS = 30; // 60px button
    const CURVE_DEPTH = 36; // Depth of the curve (was hardcoded as 36 in path)
    const CORNER_RADIUS = 18;
    const CURVE_WIDTH_OFFSET = 54;
    const CONTROL_POINT_X_OFFSET = 36;

    const center = width / 2;

    return `
      M ${CORNER_RADIUS} 0
      L ${center - CURVE_WIDTH_OFFSET} 0

      C ${center - CONTROL_POINT_X_OFFSET} 0, ${center - BUTTON_RADIUS} ${CURVE_DEPTH}, ${center} ${CURVE_DEPTH}
      C ${center + BUTTON_RADIUS} ${CURVE_DEPTH}, ${center + CONTROL_POINT_X_OFFSET} 0, ${center + CURVE_WIDTH_OFFSET} 0

      L ${width - CORNER_RADIUS} 0
      Q ${width} 0, ${width} ${CORNER_RADIUS}

      L ${width} ${tabHeight}
      L 0 ${tabHeight}

      L 0 ${CORNER_RADIUS}
      Q 0 0, ${CORNER_RADIUS} 0
      Z
    `;
  }, [iosPadding]);

  return (
    <View className="absolute bottom-0 left-0 right-0 justify-end bg-transparent z-50" style={{ height: 70 + iosPadding, paddingBottom: iosPadding }}>
      {/* Liquid Glass Background */}
      <View className="absolute top-0 left-0 right-0 bottom-0 shadow-sm shadow-black/10" style={{ elevation: 5 }}>
        <MaskedView
          style={StyleSheet.absoluteFill}
          maskElement={
            <View style={{ flex: 1, backgroundColor: 'transparent' }}>
              <Svg
                width={width}
                height={84 + iosPadding}
                style={{ position: 'absolute', top: 0, left: 0 }}
              >
                <Path d={curveTabPath} fill="black" />
              </Svg>
            </View>
          }
        >
          {/* Real Blur Effect - iOS Native Style */}
          <BlurView
            intensity={Platform.OS === "ios" ? 60 : 45}
            tint="light"
            experimentalBlurMethod="dimezisBlurView" // ⭐ stronger Android blur
            style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(255,255,255,0.015)" }]}
          />

          {/* iOS-Style Glass Highlight - Extremely Subtle Purple Wash */}
          <LinearGradient
            colors={[
              "rgba(255,255,255,0.08)",   // subtle highlight
              "rgba(255,255,255,0.02)",   // almost transparent
              "rgba(255,255,255,0.05)"    // soft frost bottom
            ]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFill}
          />
        </MaskedView>

        <View
          pointerEvents="none"
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "rgba(255,255,255,0.008)"
          }}
        />

        {/* Top Highlight Stroke - Light Refraction */}
        <View className="absolute top-0 left-0 right-0 bottom-0" pointerEvents="none" style={{ elevation: 5 }}>
          <Svg width={width} height={84 + iosPadding}>
            <Defs>
              <SvgLinearGradient id="borderGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="rgba(255, 255, 255, 0.8)" stopOpacity="1" />
                <Stop offset="0.1" stopColor="rgba(255, 255, 255, 0.2)" stopOpacity="1" />
                <Stop offset="1" stopColor="rgba(255, 255, 255, 0.05)" stopOpacity="1" />
              </SvgLinearGradient>
            </Defs>
            <Path
              d={curveTabPath}
              fill="none"
              stroke="url(#borderGradient)"
              strokeWidth={1.5}
            />
          </Svg>
        </View>
      </View>

      <View className="flex-row items-center justify-between w-full px-5 h-[60px] pb-2.5">
        {navigationItems.map((item, index) => {
          if (item.isCenter) {
            return (
              <View
                key={item.id}
                pointerEvents="box-none"
                style={{
                  width: 60,
                  alignItems: "center",
                  transform: [{ translateY: -36 }],
                  zIndex: 1001,
                  elevation: 10,
                }}
              >
                <Pressable
                  onPress={item.onPress}
                  className="w-[60px] h-[60px] rounded-full bg-white p-[3px] shadow-lg shadow-sky-500/25"
                  style={({ pressed }) => ({
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                    elevation: 10,
                    borderRadius: 30,
                    marginTop: -30,
                  })}
                  accessibilityRole="button"
                  accessibilityLabel="AI Assistant"
                >
                  <LinearGradient
                    colors={[colors.palette_dark_blue, colors.primary, '#d8b4fe']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="w-full h-full rounded-full justify-center items-center p-[3px]"
                    style={{ borderRadius: 30 }}
                  >
                    <View className="w-full h-full bg-white rounded-full items-center justify-center">
                      <Image
                        source={require("@/assets/images/ai_modal_icon.png")}
                        className="w-10 h-10"
                        resizeMode="contain"
                      />
                    </View>
                  </LinearGradient>
                </Pressable>
              </View>
            );
          }

          const active = item.route ? isActive(item.route) : false;
          return (
            <Pressable
              key={item.id}
              onPress={() => item.route && router.push(item.route as any)}
              className={`w-[60px] h-[60px] items-center justify-center ${active ? 'opacity-100' : 'opacity-100'}`}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: active }}
            >
              <View className="items-center justify-center">
                <View className="h-[26px] justify-center mb-0.5">
                  {item.icon && item.icon(active)}
                </View>
                <Text
                  className={`text-[10px] mb-0.5 ${active ? 'font-semibold text-text_primary' : 'font-medium text-gray-500'}`}
                >
                  {item.label}
                </Text>
                {active && (
                  <View className="w-1 h-1 rounded-full bg-text_primary" />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* AI Assistant Modal */}
      <Modal
        visible={showAIModal}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true} // Ensure it covers status bar
        onRequestClose={() => setShowAIModal(false)}
      >
        <Pressable
          style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.3)" }}
          onPress={() => setShowAIModal(false)}
          accessibilityRole="button"
          accessibilityLabel="Dismiss modal"
        >
          <Pressable
            className="bg-bg_white rounded-t-[32px] px-[30px] pb-10 pt-4 min-h-[320px] shadow-xl shadow-black/10"
            style={{ elevation: 15 }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Grab Handle */}
            <View className="w-10 h-[5px] rounded-full bg-border_primary self-center mb-[25px]" />

            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-[22px] font-bold text-text_primary">
                AI Assistant
              </Text>
              <Pressable
                onPress={() => setShowAIModal(false)}
                className="p-1 bg-bg_secondary rounded-full"
                accessibilityRole="button"
                accessibilityLabel="Close AI Assistant"
              >
                <Ionicons name="close" size={20} color={colors.text_secondary} />
              </Pressable>
            </View>
            <View className="flex-1 justify-center items-center">
              <View
                className="w-[120px] h-[120px] rounded-full overflow-hidden mb-5 bg-bg_white shadow-lg shadow-primary/30"
                style={{ elevation: 10, borderRadius: 60 }}
              >
                <LinearGradient
                  colors={[colors.palette_dark_blue, colors.primary, '#F472B6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="w-full h-full justify-center items-center"
                  style={{ borderRadius: 60 }} // Explicit radius
                >
                  <View className="w-[104px] h-[104px] rounded-full bg-white/90 justify-center items-center border-2 border-white">
                    <Image
                      source={require("@/assets/images/ai_modal_icon.png")}
                      className="w-16 h-16"
                      resizeMode="contain"
                    />
                  </View>
                </LinearGradient>
              </View>
              <Text className="text-base font-medium text-text_secondary mt-2 text-center">
                How can I help you today?
              </Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default BottomNavigationBar;
