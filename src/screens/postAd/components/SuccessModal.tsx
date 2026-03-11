import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface SuccessModalProps {
  visible: boolean;
  onDone: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ visible, onDone }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
    >
      <View className="flex-1 justify-center items-center">
        {/* Blurred Background with Fade In */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
          <BlurView
            intensity={80}
            tint="dark"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: "rgba(0,0,0,0.7)" },
            ]}
          />
        </Animated.View>

        {/* Success Card with Scale Animation */}
        <Animated.View
          className="bg-white rounded-[32px] p-8 w-[80%] items-center shadow-lg"
          style={{
            transform: [{ scale: scaleAnim }],
            elevation: 5,
          }}
        >
          {/* Confetti / Decoration (Simplified as circles for now, or just clean) */}
          {/* We can add small absolute positioned dots if needed for exact "confetti" look, 
                        but keeping it clean for "minimal professional" usually works best. 
                    */}

          {/* Primary Check Circle */}
          <View className="w-24 h-24 rounded-full border-[6px] border-purple-100 items-center justify-center mb-6">
            <View className="w-20 h-20 rounded-full bg-primary items-center justify-center shadow-sm shadow-purple-200">
              <Ionicons
                name="checkmark-sharp"
                size={48}
                color="white"
                style={{ fontWeight: "900" }}
              />
            </View>
          </View>

          <Text className="text-2xl font-black text-primary tracking-wider mb-3">
            SUCCESS!
          </Text>

          <Text className="text-center text-gray-500 mb-8 font-medium leading-5">
            Your ad has been posted successfully!
          </Text>

          <TouchableOpacity
            onPress={onDone}
            activeOpacity={0.8}
            className="bg-primary w-full py-4 rounded-full shadow-md shadow-purple-200 items-center"
          >
            <Text className="text-white font-bold text-lg tracking-wide">
              DONE
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default SuccessModal;
