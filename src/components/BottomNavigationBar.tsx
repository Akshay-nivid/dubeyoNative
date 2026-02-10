
import { colors } from "@/theme";
import { Feather, Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view"; 
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Dimensions, Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, Path, Stop, LinearGradient as SvgLinearGradient } from "react-native-svg";

interface BottomNavigationBarProps {
  onAIMascotPress?: () => void;
}

const { width } = Dimensions.get("window");

const BottomNavigationBar: React.FC<BottomNavigationBarProps> = ({
  onAIMascotPress,
}) => {
  const router = useRouter();
  const pathname = usePathname();

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
          color={active ? "black" : "#4b5563"}
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
          color={active ? "black" : "#4b5563"}
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
          color={active ? "black" : "#4b5563"}
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
          color={active ? "black" : "#4b5563"}
        />
      ),
    },
  ];

  // Calculate the SVG Path for the floating bar with center cutout
  const curveTabPath = useMemo(() => {
    const tabHeight = 84;
    const buttonRadius = 30; // 60px button
    const gap = 12; // Comfortable gap
    const holeRadius = buttonRadius + gap; // 42px
    const holeWidth = holeRadius * 2; // 84px
    const holeDepth = 40; // Depth of the curve

    const center = width / 2;
    const leftHoleStart = center - holeWidth / 2;
    const rightHoleEnd = center + holeWidth / 2;

    return `
      M 18 0
      L ${center - 54} 0

      C ${center - 36} 0, ${center - 30} 36, ${center} 36
      C ${center + 30} 36, ${center + 36} 0, ${center + 54} 0

      L ${width - 18} 0
      Q ${width} 0, ${width} 18

      L ${width} 84
      L 0 84

      L 0 18
      Q 0 0, 18 0
      Z
    `;

  }, []);

  return (
    <View className="absolute bottom-0 left-0 right-0 h-[70px] justify-end bg-transparent z-50">
      {/* Liquid Glass Background */}
      <View className="absolute top-0 left-0 right-0 bottom-0 shadow-sm shadow-black/10" style={{ elevation: 8 }}>
        <MaskedView
          style={StyleSheet.absoluteFill}
          maskElement={
            <View style={{ flex: 1, backgroundColor: 'transparent' }}>
              <Svg
                width={width}
                height={84}
                style={{ position: 'absolute', top: 0, left: 0 }}
              >
                <Path d={curveTabPath} fill="black" />
              </Svg>
            </View>
          }
        >
          {/* Real Blur Effect */}


          {/* Frosted / Tint Overlay - Subtle White Gradient */}
          {/* Liquid Glass Gradient - Glossy Reflection */}
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0.95)', // Almost solid top
              'rgba(255, 255, 255, 0.85)', // Frosted middle
              'rgba(255, 255, 255, 0.95)'  // Solid bottom
            ]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />
        </MaskedView>

        {/* Top Highlight Stroke - Light Refraction */}
        <View className="absolute top-0 left-0 right-0 bottom-0" pointerEvents="none">
          <Svg width={width} height={84}>
            <Defs>
              <SvgLinearGradient id="borderGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="rgba(255,255,255,0.9)" stopOpacity="1" />
                <Stop offset="0.4" stopColor="rgba(255,255,255,0.2)" stopOpacity="1" />
                <Stop offset="1" stopColor="rgba(255,255,255,0.6)" stopOpacity="1" />
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
                  transform: [{ translateY: -36 }], // ✅ THIS WORKS ON MOBILE
                  zIndex: 1001,
                  elevation: 20,
                }}
              >
                <Pressable
                  onPress={item.onPress}
                  className="w-[60px] h-[60px] rounded-full bg-white p-[3px] shadow-lg shadow-sky-500/40"
                  style={({ pressed }) => ({
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                    elevation: 8,
                    borderRadius: 30,
                    marginTop: -30,
                  })}
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
        >
          <Pressable
            className="bg-bg_white rounded-t-[32px] px-[30px] pb-10 pt-4 min-h-[320px] shadow-xl shadow-black/10"
            style={{ elevation: 25 }}
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
