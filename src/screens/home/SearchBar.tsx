import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { cssInterop } from "nativewind";
import React, { useState } from "react";
import { TextInput, TouchableOpacity, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
cssInterop(MaskedView, {
  className: {
    target: "style",
  },
});
cssInterop(LinearGradient, {
  className: {
    target: "style",
  },
});
const SearchBar: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const rotation = useSharedValue(0);
  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 3000,
        easing: Easing.linear,
      }),
      -1 // Infinite repeat
    );
  }, []);
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });
  return (
    <View className="px-4 py-4">
      {/* Shadow Container */}
      <View
        className="rounded-full bg-white shadow-cyan-400"
        style={{
          shadowColor: 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0,
          shadowRadius: 0,
          elevation: 0,
        }}
      >
        {/* Clipping Container for Border */}
        <View className="rounded-full overflow-hidden p-[2px]">
          {/* Rotating Gradient Background */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 700,
                height: 700,
                marginLeft: -350,
                marginTop: -350,
                opacity: 1,
                // zIndex removed to ensure it renders in flow (before TouchableOpacity) but not behind parent background
              },
              animatedStyle,
            ]}
          >
            <LinearGradient
              colors={['#59078cff', '#e6e1f6ff', '#59078cff']} // Purple -> White -> Purple (Loop)
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="w-[700px] h-[700px]"
            />
          </Animated.View>
          {/* Inner Content - White Background */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push('/search-drag' as any)}
            className="flex-row items-center bg-white/90 rounded-full px-4 h-[42px]"
          >
            <MaskedView
              maskElement={
                <Svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  {/* Magnifying Glass Ring (Arc) */}
                  <Path
                    d="M16.5 16.5 A 8 8 0 1 1 16.5 5.5"
                    stroke="black"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Handle */}
                  <Path
                    d="M17 17 L 21 21"
                    stroke="black"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M19 6 L 20 9 L 23 10 L 20 11 L 19 14 L 18 11 L 15 10 L 18 9 Z"
                    fill="black"
                  />
                </Svg>
              }
              className="w-[22px] h-[22px]"
            >
              <LinearGradient
                colors={['#14B8A6', '#3B82F6', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="flex-1"
              />
            </MaskedView>
            <TextInput
              className="flex-1 ml-3 text-base text-gray-700 h-full"
              placeholder="Search or ask with muscot..."
              placeholderTextColor="#9ca3af85"
              value={searchQuery}
              onChangeText={setSearchQuery}
              editable={false} // Disable direct editing here, redirect to search screen
              onPressIn={() => router.push('/search-drag' as any)} // Catch press for Android compatibility
              pointerEvents="none" // Ensure the parent TouchableOpacity handles the press
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
export default SearchBar;
