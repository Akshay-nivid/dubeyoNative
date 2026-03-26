import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export interface InlineToggleProps {
  options: string[];
  selectedChecker: (opt: string) => boolean;
  onSelect: (opt: string) => void;
}

export const InlineToggle: React.FC<InlineToggleProps> = ({ options, selectedChecker, onSelect }) => (
  <View className="flex-row flex-wrap items-center bg-gray-50/50 border border-gray-100 rounded-[8px] p-1.5 shadow-sm shadow-black/[0.02]">
    {options.map((opt) => {
      const selected = selectedChecker(opt);
      const isDuo = options.length <= 2;

      return (
        <TouchableOpacity
          key={opt}
          onPress={() => onSelect(opt)}
          activeOpacity={0.75}
          style={[
            s.button,
            isDuo ? s.buttonDuo : s.buttonMulti,
            selected && s.buttonSelected,
            selected && { elevation: 2 }
          ]}
        >
          <Text style={[
            s.text,
            selected ? s.textSelected : s.textUnselected
          ]}>
            {String(opt)}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const s = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 6,
  },
  buttonDuo: {
    flex: 1,
  },
  buttonMulti: {
    paddingHorizontal: 16,
    margin: 4,
    minWidth: "44%",
  },
  buttonSelected: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  text: {
    fontSize: 13,
  },
  textSelected: {
    color: "#4F46E5",
    fontWeight: "bold",
  },
  textUnselected: {
    color: "#9CA3AF",
    fontWeight: "600",
  },
});
