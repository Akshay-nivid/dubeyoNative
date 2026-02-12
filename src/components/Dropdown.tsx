import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

interface Option {
  value: string;
  label: string;
}

interface Props {
  label: string | React.ReactNode;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  placeholder?: string;
  options: Option[];
  required?: boolean;
}

export default function Dropdown({
  label,
  name,
  value,
  onChange,
  placeholder = "Select an option",
  options,
  required = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const panY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const isVerticalSwipe = Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
        return isVerticalSwipe && Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
          const newOpacity = Math.max(0, 1 - (gestureState.dy / (Dimensions.get('window').height * 0.5)));
          fadeAnim.setValue(newOpacity);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 150 || gestureState.vy > 0.5) {
          Animated.parallel([
            Animated.timing(panY, {
              toValue: Dimensions.get('window').height,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            })
          ]).start(() => setIsOpen(false));
        } else {
          Animated.spring(panY, {
            toValue: 0,
            bounciness: 4,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (isOpen) {
      panY.setValue(0);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(Dimensions.get('window').height);
      scaleAnim.setValue(0.9);
    }
  }, [isOpen]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: Dimensions.get('window').height,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsOpen(false);
    });
  };

  const selectedOption = options.find((opt) => opt.value === value && opt.value !== "");

  const handleSelect = (optionValue: string) => {
    onChange(name, optionValue);
    handleClose();
  };

  const labelText = typeof label === "string" ? label : "Select";


  return (
    <View className="mb-5">
      <Pressable
        onPress={() => setIsOpen(true)}
        className="w-full rounded-xl px-4 py-3.5 flex-row items-center justify-between bg-bg_white border border-border_primary"
      >
        <Text
          className={`flex-1 text-base ${selectedOption && selectedOption.value !== "" ? "text-text_primary" : "text-text_tertiary"}`}
        >
          {selectedOption && selectedOption.value !== ""
            ? selectedOption.label
            : labelText}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.icon_secondary} />
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={handleClose}
        statusBarTranslucent={true}
      >
        <View
          className="flex-1 justify-end"
          style={{ zIndex: 10000 }}
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { opacity: fadeAnim }
            ]}
          >
            <Pressable
              className="flex-1"
              onPress={handleClose}
            >
              <BlurView
                intensity={70}
                tint="dark"
                style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
              />
            </Pressable>
          </Animated.View>
          <Animated.View
            className="rounded-t-3xl max-h-[80%] bg-bg_white overflow-hidden"
            style={{
              transform: [
                { translateY: Animated.add(slideAnim, panY) },
                { scale: scaleAnim }
              ]
            }}
            {...panResponder.panHandlers}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>

              <View className="py-4 px-6">
                <Text className="text-lg font-semibold text-text_primary">
                  {typeof label === "string" ? label : "Select"}
                </Text>
              </View>
              <View className="h-px mx-6 bg-border_primary" />
              <ScrollView className="max-h-96">
                {options
                  .filter((option) => option.value !== "")
                  .map((option) => (
                    <Pressable
                      key={option.value}
                      onPress={() => handleSelect(option.value)}
                      className={`px-6 py-4 ${value === option.value ? "bg-bg_secondary" : "bg-bg_white"}`}
                    >
                      <Text
                        className={`text-base ${value === option.value ? "font-medium text-primary" : "text-text_primary"}`}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
              </ScrollView>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
