import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";
import { colors } from "@/theme";

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
  const [date, setDate] = useState<Date>(
    value ? new Date(value) : new Date()
  );

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
      setShowPicker(false);
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
    setShowPicker(false);
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
        className="w-full rounded-xl px-4 py-3.5 flex-row items-center justify-between"
        style={{ backgroundColor: colors.bg_white, borderColor: colors.border_primary, borderWidth: 1 }}
      >
        <Text
          className="flex-1 text-base"
          style={{ color: value ? colors.text_primary : colors.text_secondary }}
        >
          {value ? formatDisplayDate(value) : labelText}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={colors.icon_secondary} />
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
          animationType="slide"
          onRequestClose={() => setShowPicker(false)}
        >
          <Pressable
            className="flex-1 bg-black/50 justify-end"
            onPress={() => setShowPicker(false)}
          >
            <Pressable className="rounded-t-3xl" style={{ backgroundColor: colors.bg_white }}>
              <View className="py-4 px-6 border-b flex-row justify-between items-center" style={{ borderColor: colors.border_primary }}>
                <Pressable onPress={() => setShowPicker(false)}>
                  <Text className="text-base" style={{ color: colors.primary }}>Cancel</Text>
                </Pressable>
                <Text className="text-lg font-semibold" style={{ color: colors.text_primary }}>
                  Select Date
                </Text>
                <Pressable onPress={handleConfirm}>
                  <Text className="text-base font-semibold" style={{ color: colors.primary }}>
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
                style={{ backgroundColor: "white" }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}
