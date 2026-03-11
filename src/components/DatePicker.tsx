import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { BlurView } from "expo-blur";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface Props {
  label: string | React.ReactNode;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export default function DatePicker({
  label,
  name,
  value,
  onChange,
  placeholder = "Select date",
  required = false,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [date, setDate] = useState<Date>(value ? new Date(value) : new Date());

  const panY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(
    new Animated.Value(Dimensions.get("window").height),
  ).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const isVerticalSwipe =
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
        return isVerticalSwipe && Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
          const newOpacity = Math.max(
            0,
            1 - gestureState.dy / (Dimensions.get("window").height * 0.5),
          );
          fadeAnim.setValue(newOpacity);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 150 || gestureState.vy > 0.5) {
          Animated.parallel([
            Animated.timing(panY, {
              toValue: Dimensions.get("window").height,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }),
          ]).start(() => setShowPicker(false));
        } else {
          Animated.spring(panY, {
            toValue: 0,
            bounciness: 4,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  useEffect(() => {
    if (showPicker && Platform.OS === "ios") {
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
      slideAnim.setValue(Dimensions.get("window").height);
      scaleAnim.setValue(0.9);
    }
  }, [showPicker]);

  const handleClose = () => {
    if (Platform.OS === "ios") {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: Dimensions.get("window").height,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowPicker(false);
      });
    } else {
      setShowPicker(false);
    }
  };

  useEffect(() => {
    if (value) {
      setDate(new Date(value));
    }
  }, [value]);

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      if (event.type === "set" && selectedDate) {
        setDate(selectedDate);
        const formattedDate = formatDate(selectedDate);
        onChange(name, formattedDate);
      }
      handleClose();
    } else {
      // iOS
      if (selectedDate) {
        setDate(selectedDate);
      }
    }
  };

  const handleConfirm = () => {
    const formattedDate = formatDate(date);
    onChange(name, formattedDate);
    handleClose();
  };

  const getLabelText = () => {
    if (typeof label === "string") return label;
    // Extract text from ReactNode if it contains Text components
    return "Date of Birth";
  };
  const labelText = getLabelText();

  return (
    <View className="mb-5">
      <Pressable
        onPress={() => setShowPicker(true)}
        className="w-full rounded-xl px-4 py-3.5 flex-row items-center justify-between bg-bg_white border border-border_primary"
      >
        <Text
          className={`flex-1 text-base ${value ? "text-text_primary" : "text-text_tertiary"}`}
        >
          {value ? formatDisplayDate(value) : labelText}
        </Text>
        <Ionicons
          name="calendar-outline"
          size={20}
          color={colors.icon_secondary}
        />
      </Pressable>

      {showPicker && Platform.OS === "android" && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      {showPicker && Platform.OS === "ios" && (
        <Modal
          visible={showPicker}
          transparent
          animationType="none"
          onRequestClose={handleClose}
          statusBarTranslucent={true}
        >
          <View className="flex-1 justify-end" style={{ zIndex: 10000 }}>
            <Animated.View
              style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}
            >
              <Pressable className="flex-1" onPress={handleClose}>
                <BlurView
                  intensity={70}
                  tint="dark"
                  style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: "rgba(0,0,0,0.3)" },
                  ]}
                />
              </Pressable>
            </Animated.View>
            <Animated.View
              className="rounded-t-3xl bg-bg_white overflow-hidden"
              style={{
                transform: [
                  { translateY: Animated.add(slideAnim, panY) },
                  { scale: scaleAnim },
                ],
              }}
              {...panResponder.panHandlers}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                <View className="py-4 px-6 border-b border-border_primary flex-row justify-between items-center">
                  <Pressable onPress={handleClose}>
                    <Text className="text-base text-primary">Cancel</Text>
                  </Pressable>

                  <Text className="text-lg font-semibold text-text_primary">
                    Select Date
                  </Text>
                  <Pressable onPress={handleConfirm}>
                    <Text className="text-base font-semibold text-primary">
                      Done
                    </Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              </Pressable>
            </Animated.View>
          </View>
        </Modal>
      )}
    </View>
  );
}
