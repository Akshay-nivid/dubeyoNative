import { useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";

interface EditableRowProps {
  label: string;
  value: string | number;
  onChange: (text: string) => void;
  placeholder?: string;
  type?: "default" | "number";
  containerStyle?: object | any[];
}

const EditableRow = ({
  label,
  value,
  onChange,
  placeholder,
  type = "default",
  containerStyle,
}: EditableRowProps) => {
  const [localValue, setLocalValue] = useState(value?.toString() || "");

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value?.toString() || "");
  }, [value]);

  return (
    <View className="mb-4" style={containerStyle}>
      <Text 
        className="text-gray-900 font-semibold text-[12px] mb-1.5 ml-1"
        style={{ flexWrap: 'wrap' }}
      >
        {label}
      </Text>
      <View 
        className="bg-gray-50/50 border border-gray-100 rounded-[8px] px-4 h-12 justify-center shadow-sm shadow-black/[0.02]"
      >
        <TextInput
          value={localValue}
          onChangeText={(text) => {
            setLocalValue(text);
            onChange(text);
          }}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType={type === "number" ? "numeric" : "default"}
          className="text-gray-900 text-sm font-semibold"
          style={{ paddingVertical: 0 }}
        />
      </View>
    </View>
  );
};

export default EditableRow;
