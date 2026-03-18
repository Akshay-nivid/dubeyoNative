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
}: EditableRowProps) => (
  <View className="mb-4" style={containerStyle}>
    <Text 
      className="text-gray-900 font-bold text-[13px] mb-1.5 ml-1"
      style={{ flexWrap: 'wrap' }}
    >
      {label}
    </Text>
    <View 
      className="bg-gray-50/50 border border-gray-100 rounded-[18px] px-4 h-12 justify-center shadow-sm shadow-black/[0.02]"
    >
      <TextInput
        value={value?.toString()}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={type === "number" ? "numeric" : "default"}
        className="text-gray-900 text-sm font-semibold"
        style={{ paddingVertical: 0 }}
      />
    </View>
  </View>
);

export default EditableRow;
