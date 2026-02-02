import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Dimensions, Modal, Pressable, StyleSheet, Text, View } from "react-native";
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
    <View style={styles.container}>
      {/* Liquid Glass Background */}
      <View style={styles.absoluteFill}>
        <Svg width={width} height={100} style={styles.shadowData}>
          <Defs>
            <SvgLinearGradient id="glassGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.bg_white} stopOpacity="1" />
              <Stop offset="1" stopColor={colors.bg_white} stopOpacity="1" />
            </SvgLinearGradient>
          </Defs>
          <Path d={curveTabPath} fill="url(#glassGradient)" stroke="rgba(0,0,0,0.05)" strokeWidth={1} />
        </Svg>
      </View>

      <View style={styles.iconRow}>
        {navigationItems.map((item, index) => {
          if (item.isCenter) {
            return (
              <View key={item.id} style={styles.centerButtonContainer}>
                <Pressable
                  onPress={item.onPress}
                  style={({ pressed }) => [
                    styles.centerButton,
                    { transform: [{ scale: pressed ? 0.96 : 1 }] }
                  ]}
                >
                  <LinearGradient
                    colors={[colors.palette_dark_blue, colors.primary, '#d8b4fe']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.centerButtonGradient}
                  >
                    <Ionicons name="sparkles" size={28} color={colors.text_white} />
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
              style={({ pressed }) => [
                styles.navItem,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ height: 26, justifyContent: 'center', marginBottom: 2 }}>
                  {item.icon && item.icon(active)}
                </View>
                <Text
                  style={{
                    fontSize: 10,
                    color: active ? colors.text_primary : colors.text_secondary,
                    fontWeight: active ? "600" : "500",
                    marginBottom: 2,
                  }}
                >
                  {item.label}
                </Text>
                {active && (
                  <View style={styles.activeDot} />
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
        onRequestClose={() => setShowAIModal(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.3)", // Dimmed overlay
            justifyContent: "flex-end",
          }}
          onPress={() => setShowAIModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: colors.bg_white,
              borderTopLeftRadius: 32, // More rounded
              borderTopRightRadius: 32,
              paddingHorizontal: 30,
              paddingBottom: 40,
              paddingTop: 16,
              minHeight: 320,
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: -10,
              },
              shadowOpacity: 0.1,
              shadowRadius: 20,
              elevation: 25, // Visual float
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Grab Handle */}
            <View
              style={{
                width: 40,
                height: 5,
                borderRadius: 3,
                backgroundColor: colors.border_primary,
                alignSelf: 'center',
                marginBottom: 25,
              }}
            />

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <Text
                style={{
                  fontSize: 22, // Slightly larger
                  fontWeight: "700",
                  color: colors.text_primary,
                }}
              >
                AI Assistant
              </Text>
              <Pressable
                onPress={() => setShowAIModal(false)}
                style={{
                  padding: 4,
                  backgroundColor: colors.bg_secondary,
                  borderRadius: 20,
                }}
              >
                <Ionicons name="close" size={20} color={colors.text_secondary} />
              </Pressable>
            </View>
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 120, // Slightly smaller for better proportion
                  height: 120,
                  borderRadius: 60,
                  overflow: "hidden",
                  marginBottom: 20,
                  shadowColor: colors.primary, // Glow effect for mascot
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  elevation: 10,
                  backgroundColor: colors.bg_white,
                }}
              >
                <LinearGradient
                  colors={[colors.palette_dark_blue, colors.primary, '#d8b4fe']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: "100%",
                    height: "100%",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 104,
                      height: 104,
                      borderRadius: 52,
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      justifyContent: "center",
                      alignItems: "center",
                      borderWidth: 2,
                      borderColor: "rgba(255, 255, 255, 1)",
                    }}
                  >
                    <Ionicons name="sparkles" size={48} color={colors.primary} />
                  </View>
                </LinearGradient>
              </View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '500',
                  color: colors.text_secondary,
                  marginTop: 8,
                  textAlign: "center",
                }}
              >
                How can I help you today?
              </Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    height: 84, // Correct height for standard bar
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shadowData: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    height: 84, // Match container
    paddingBottom: 10,
  },
  navItem: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.text_primary,
  },
  centerButtonContainer: {
    position: 'absolute',
    left: width / 2 - 30, // Center: half of 60
    top: -30, // Positioned to float
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
  },
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30, // Perfect circle
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    backgroundColor: colors.bg_white,
    padding: 3,
  },
  centerButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BottomNavigationBar;
