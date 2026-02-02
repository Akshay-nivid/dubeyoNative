
import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Dimensions, Image, Modal, Pressable, Text, View } from "react-native";
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
        <Ionicons
          name={active ? "home" : "home-outline"}
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
        <Ionicons
          name={active ? "chatbubbles" : "chatbubbles-outline"}
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
      route: "/profile",
      label: "Profile",
      icon: (active: boolean) => (
        <Ionicons
          name={active ? "person" : "person-outline"}
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

    // Cleaner circular arc approximation
    return `
      M 0 0
      L ${leftHoleStart} 0
      C ${leftHoleStart + 20} 0, ${center - 25} ${holeDepth}, ${center} ${holeDepth}
      C ${center + 25} ${holeDepth}, ${rightHoleEnd - 20} 0, ${rightHoleEnd} 0
      L ${width} 0
      L ${width} ${tabHeight} 
      L 0 ${tabHeight}
Z
    `;
  }, []);

  return (
    <View className="absolute bottom-0 left-0 right-0 h-[84px] justify-end bg-transparent z-50">
      {/* Liquid Glass Background */}
      <View className="absolute top-0 left-0 right-0 bottom-0">
        <Svg
          width={width}
          height={100}
          className="shadow-sm shadow-black/10"
          style={{ elevation: 8 }} // Keep elevation for Android
        >
          <Defs>
            <SvgLinearGradient id="glassGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.bg_white} stopOpacity="1" />
              <Stop offset="1" stopColor={colors.bg_white} stopOpacity="1" />
            </SvgLinearGradient>
          </Defs>
          <Path d={curveTabPath} fill="url(#glassGradient)" stroke="rgba(0,0,0,0.05)" strokeWidth={1} />
        </Svg>
      </View>

      <View className="flex-row items-center justify-between w-full px-5 h-[84px] pb-2.5">
        {navigationItems.map((item, index) => {
          if (item.isCenter) {
            return (
              <View
                key={item.id}
                className="absolute left-1/2 -top-[30px] -ml-[30px] w-[60px] h-[60px] items-center justify-center z-[1001]"
              >
                <Pressable
                  onPress={item.onPress}
                  className="w-[60px] h-[60px] rounded-full bg-white p-[3px] shadow-lg shadow-sky-500/40"
                  style={({ pressed }) => ({
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                    elevation: 8,
                    borderRadius: 30, // Force radius
                  })}
                >
                  <LinearGradient
                    colors={[colors.palette_dark_blue, colors.primary, '#d8b4fe']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="w-full h-full rounded-full justify-center items-center"
                    style={{ borderRadius: 30 }} // Explicit style for gradient
                  >
                    <Image
                      source={require("@/assets/images/ai icon.png")}
                      className="w-8 h-8"
                      resizeMode="contain"
                      style={{ tintColor: colors.text_white }}
                    />
                  </LinearGradient>
                </Pressable>
              </View>
            );
          }

          const active = item.route ? isActive(item.route) : false;
          return (
            <Pressable
              key={item.id}
              onPress={() => item.route && router.push(item.route)}
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
                      source={require("@/assets/images/ai icon.png")}
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
