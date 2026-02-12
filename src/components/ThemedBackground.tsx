import { colors } from '@/theme';
import React from 'react';
import { View, ViewProps } from 'react-native';
import { Defs, LinearGradient, Rect, Stop, Svg } from "react-native-svg";

interface ThemedBackgroundProps extends ViewProps {
    children: React.ReactNode;
}

export const ThemedBackground: React.FC<ThemedBackgroundProps> = ({ children, style, ...props }) => {
    return (
        <View
            className="flex-1"
            style={[{ backgroundColor: colors.bg_white }, style]}
            {...props}
        >
            <View className="absolute inset-0">
                <View className="absolute top-0 left-0 right-0 h-1/2">
                    <Svg height="100%" width="100%">
                        <Defs>
                            <LinearGradient
                                id="grad1"
                                x1="0%"
                                y1="0%"
                                x2="0%"
                                y2="100%"
                                gradientUnits="userSpaceOnUse"
                            >
                                <Stop offset="0%" stopColor={colors.main_bg_gradient_start} stopOpacity="1" />
                                <Stop offset="100%" stopColor={colors.main_bg_gradient_end} stopOpacity="0" />
                            </LinearGradient>
                        </Defs>
                        <Rect x="0" y="0" width="100%" height="100%" fill="#fff" />
                        <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad1)" />
                    </Svg>
                </View>
                <View className="absolute bottom-0 left-0 right-0 h-1/2" style={{ transform: [{ scaleY: -1 }] }}>
                    <Svg height="100%" width="100%">
                        <Defs>
                            <LinearGradient
                                id="grad3"
                                x1="0%"
                                y1="0%"
                                x2="0%"
                                y2="100%"
                                gradientUnits="userSpaceOnUse"
                            >
                                <Stop offset="0%" stopColor={colors.main_bg_gradient_start} stopOpacity="1" />
                                <Stop offset="100%" stopColor={colors.main_bg_gradient_end} stopOpacity="0" />
                            </LinearGradient>
                        </Defs>
                        <Rect x="0" y="0" width="100%" height="100%" fill="#fff" />
                        <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad3)" />
                    </Svg>
                </View>
            </View>
            {children}
        </View>
    );
};

export default ThemedBackground;
