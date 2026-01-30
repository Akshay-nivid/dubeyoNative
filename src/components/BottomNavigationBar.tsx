import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Modal, Pressable, Text, View } from "react-native";

interface BottomNavigationBarProps {
  onAIMascotPress?: () => void;
}

const BottomNavigationBar: React.FC<BottomNavigationBarProps> = ({
  onAIMascotPress,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [showAIModal, setShowAIModal] = useState(false);

  // Animation values for AI mascot
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulsing animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    // Glow animation
    // const glowAnimation = Animated.loop(
    //   Animated.sequence([
    //     Animated.timing(glowAnim, {
    //       toValue: 1,
    //       duration: 2000,
    //       easing: Easing.inOut(Easing.ease),
    //       useNativeDriver: false,
    //     }),
    //     Animated.timing(glowAnim, {
    //       toValue: 0,
    //       duration: 2000,
    //       easing: Easing.inOut(Easing.ease),
    //       useNativeDriver: false,
    //     }),
    //   ])
    // );

    // Rotation animation
    // const rotateAnimation = Animated.loop(
    //   Animated.timing(rotateAnim, {
    //     toValue: 1,
    //     duration: 3000,
    //     easing: Easing.linear,
    //     useNativeDriver: true,
    //   })
    // );

    // pulseAnimation.start();
    // glowAnimation.start();
    // rotateAnimation.start();

    return () => {
      // pulseAnimation.stop();
      // glowAnimation.stop();
      // rotateAnimation.stop();
    };
  }, []);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const isActive = (route: string) => {
    return pathname === route || pathname?.startsWith(route);
  };

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
      label: "Home",
      icon: (active: boolean) => (
        <Ionicons
          name={active ? "home" : "home-outline"}
          size={22}
          color={active ? colors.primary : colors.text_tertiary}
        />
      ),
      route: "/home",
    },
    {
      id: "chat",
      label: "Chat",
      icon: (active: boolean) => (
        <Ionicons
          name={active ? "chatbubbles" : "chatbubbles-outline"}
          size={22}
          color={active ? colors.primary : colors.text_tertiary}
        />
      ),
      route: "/chat",
    },
    {
      id: "profile",
      label: "Profile",
      icon: (active: boolean) => (
        <Ionicons
          name={active ? "person" : "person-outline"}
          size={22}
          color={active ? colors.primary : colors.text_tertiary}
        />
      ),
      route: "/profile",
    },
  ];

  return (
    <>
      {/* AI Mascot Button - Floating on Right Corner */}
      <View
        style={{
          position: "absolute",
          bottom: 80,
          right: 20,
          width: 80,
          height: 80,
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
        }}
      >
        {/* Outer Glow Ring */}
        {/* <Animated.View
          style={{
            position: "absolute",
            width: 88,
            height: 88,
            borderRadius: 44,
            borderWidth: 2.5,
            borderColor: colors.primary,
            opacity: glowOpacity,
          }}
        /> */}

        {/* Middle Glow Ring */}
        {/* <Animated.View
          style={{
            position: "absolute",
            width: 100,
            height: 100,
            borderRadius: 50,
            borderWidth: 1,
            borderColor: colors.primary,
            opacity: glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.2, 0.6],
            }),
          }}
        /> */}

        {/* Animated Gradient Background */}
        <Animated.View
          style={{
            transform: [{ scale: pulseAnim }, { rotate: rotateInterpolate }],
            width: 80,
            height: 80,
            borderRadius: 40,
            overflow: "hidden",
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 12,
          }}
        >
          <LinearGradient
            colors={[colors.primary, "#8B5CF6", "#FF6B9D", colors.primary]}
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
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: "rgba(255, 255, 255, 0.98)",
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 3,
                borderColor: "rgba(255, 255, 255, 1)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 4,
              }}
            >
              <Image
                source={require("@/assets/images/fotor-ai-20260130115255.jpg")}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                }}
                contentFit="cover"
                transition={200}
              />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Pressable Overlay */}
        <Pressable
          onPress={handleAIMascotPress}
          style={({ pressed }) => ({
            position: "absolute",
            width: 80,
            height: 80,
            borderRadius: 40,
            opacity: pressed ? 0.8 : 1,
          })}
        />

        {/* Floating Particles Effect */}
        {/* <Animated.View
          style={{
            position: "absolute",
            top: -10,
            right: -10,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: colors.primary,
            opacity: glowAnim,
            transform: [
              {
                translateY: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -12],
                }),
              },
            ],
          }}
        /> */}
        {/* <Animated.View
          style={{
            position: "absolute",
            bottom: -8,
            left: -8,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: "#8B5CF6",
            opacity: glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 1],
            }),
            transform: [
              {
                translateY: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 10],
                }),
              },
            ],
          }}
        /> */}
        {/* <Animated.View
          style={{
            position: "absolute",
            top: 10,
            left: -12,
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: "#FF6B9D",
            opacity: glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.4, 0.9],
            }),
            transform: [
              {
                translateX: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -8],
                }),
              },
            ],
          }}
        /> */}
      </View>

      {/* Bottom Navigation Bar */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          alignItems: "center",
          paddingBottom: 20,
          paddingHorizontal: 16,
          zIndex: 999,
        }}
      >
        <BlurView
          intensity={80}
          tint="light"
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            borderRadius: 30,
            paddingHorizontal: 8,
            paddingVertical: 8,
            minHeight: 64,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 10,
            width: "100%",
            maxWidth: 400,
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.8)",
            overflow: "hidden",
          }}
        >
          {/* Left Navigation Items */}
          <View
            style={{
              flexDirection: "row",
              flex: 1,
              justifyContent: "space-around",
              alignItems: "center",
            }}
          >
            {navigationItems.map((item) => {
              const active = isActive(item.route);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => router.push(item.route as any)}
                  style={({ pressed }) => ({
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 4,
                    paddingHorizontal: 12,
                    minWidth: 60,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  {item.icon(active)}
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: active ? "600" : "400",
                      color: active ? colors.primary : colors.text_tertiary,
                      marginTop: 2,
                    }}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Post Ad Button - Center */}
          <Pressable
            onPress={() => router.push("/postAd" as any)}
            style={({ pressed }) => ({
              width: 36,
              height: 38,
              borderRadius: 28,
              backgroundColor: colors.primary,
              justifyContent: "center",
              alignItems: "center",
              marginHorizontal: 8,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Ionicons name="add" size={28} color={colors.text_white} />
          </Pressable>

          {/* Right Spacer for AI Mascot */}
          <View style={{ width: 60 }} />
        </BlurView>
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
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "flex-end",
          }}
          onPress={() => setShowAIModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: colors.bg_white,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              minHeight: 300,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: colors.text_primary,
                }}
              >
                AI Assistant
              </Text>
              <Pressable onPress={() => setShowAIModal(false)}>
                <Ionicons name="close" size={24} color={colors.text_primary} />
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
                  width: 140,
                  height: 140,
                  borderRadius: 70,
                  overflow: "hidden",
                  marginBottom: 20,
                }}
              >
                <LinearGradient
                  colors={[colors.primary, "#8B5CF6", colors.primary]}
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
                      width: 120,
                      height: 120,
                      borderRadius: 60,
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      justifyContent: "center",
                      alignItems: "center",
                      borderWidth: 3,
                      borderColor: "rgba(255, 255, 255, 1)",
                    }}
                  >
                    <Image
                      source={{
                        uri: "https://media.giphy.com/media/26BRv0ThflVHCVoDrK/giphy.gif",
                      }}
                      style={{
                        width: 110,
                        height: 110,
                        borderRadius: 55,
                      }}
                      contentFit="cover"
                      transition={200}
                    />
                  </View>
                </LinearGradient>
              </View>
              <Text
                style={{
                  fontSize: 16,
                  color: colors.text_tertiary,
                  marginTop: 16,
                  textAlign: "center",
                }}
              >
                AI Assistant coming soon
              </Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export default BottomNavigationBar;
