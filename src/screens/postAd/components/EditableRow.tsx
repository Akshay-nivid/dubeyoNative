import { Text, TextInput, View } from "react-native";

interface EditableRowProps {
    label: string;
    value: string | number;
    onChange: (text: string) => void;
    placeholder?: string;
    type?: "default" | "number";
}

const EditableRow = ({ label, value, onChange, placeholder, type = "default" }: EditableRowProps) => (
    <View className="mb-4">
        <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-wider mb-1.5 ml-1">{label}</Text>
        <View className="bg-white border border-gray-100 rounded-2xl px-4 h-12 justify-center shadow-sm shadow-gray-100">
            <TextInput
                value={value?.toString()}
                onChangeText={onChange}
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
                keyboardType={type === "number" ? "numeric" : "default"}
                className="text-gray-900 text-sm font-medium"
            />
        </View>
    </View>
);

export default EditableRow;
