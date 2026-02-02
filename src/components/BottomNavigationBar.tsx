import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { Dimensions, Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";

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

  return (
    <View style={styles.container}>
      {/* Background Gradient Mesh */}
      <LinearGradient
        colors={['transparent', 'rgba(255,255,255,0.8)', '#ffffff']}
        locations={[0, 0.55, 1]}
        style={styles.backgroundGradient}
        pointerEvents="none"
      />

      {/* Bottom Icons Row */}
      <View style={styles.iconRow}>
        {navigationItems.map((item, index) => {
          if (item.isCenter) {
            return (
              <View key={item.id} style={styles.centerButtonContainer}>
                <Pressable
                  onPress={item.onPress}
                  style={({ pressed }) => [
                    styles.centerOrb,
                    { transform: [{ scale: pressed ? 0.95 : 1 }], backgroundColor: 'transparent', shadowOpacity: 0.3 }
                  ]}
                >
                  <Image
                    source={{ uri: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Crystal%20Ball.png' }}
                    style={styles.mascotImage}
                    resizeMode="contain"
                  />
                </Pressable>
              </View>
            );
          }

          const active = item.route ? isActive(item.route) : false;
          return (
            <Pressable
              key={item.id}
              onPress={() => item.route && router.push(item.route as any)}
              style={({ pressed }) => [
                styles.navItem,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <View style={{ height: 32, justifyContent: 'center', alignItems: 'center' }}>
                {item.icon && item.icon(active)}
              </View>
              <Text
                style={{
                  fontSize: 10,
                  color: active ? "black" : "#6b7280",
                  marginTop: 2,
                  fontWeight: active ? "600" : "400",
                  textAlign: "center",
                }}
              >
                {item.label}
              </Text>
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
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "flex-end",
          }}
          onPress={() => setShowAIModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: "white",
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
                  color: "#1f2937",
                }}
              >
                AI Assistant
              </Text>
              <Pressable onPress={() => setShowAIModal(false)}>
                <Ionicons name="close" size={24} color="#1f2937" />
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
                  colors={['#60A5FA', '#A78BFA', '#F472B6']}
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
                  </View>
                </LinearGradient>
              </View>
              <Text
                style={{
                  fontSize: 16,
                  color: "#4b5563",
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
    alignItems: 'center',
    paddingBottom: 5, // Moved down as requested
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 110, // Reduced height since pill is gone
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 25,
    height: 60,
  },
  navItem: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerOrb: {
    width: 48,
    height: 48,
    borderRadius: 24,
    shadowColor: "#A78BFA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  orbGradient: {
    flex: 1,
    borderRadius: 24,
  },
  mascotImage: {
    width: '100%',
    height: '100%',
  }
});

export default BottomNavigationBar;
