import { colors } from '@/theme';
import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { Defs, LinearGradient, Rect, Stop, Svg } from "react-native-svg";

interface ThemedBackgroundProps extends ViewProps {
    children: React.ReactNode;
}

export const ThemedBackground: React.FC<ThemedBackgroundProps> = ({ children, style, ...props }) => {
    return (
        <View style={[styles.container, style]} {...props}>
            <View style={StyleSheet.absoluteFill}>
                <Svg height="50%" width="100%" style={{ position: 'absolute', top: 0 }}>
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
                <Svg height="50%" width="100%" style={{ position: 'absolute', bottom: 0, transform: [{ scaleY: -1 }] }}>
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
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg_white, // Ensure base bg is white
    },
});

export default ThemedBackground;
