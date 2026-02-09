import { colors } from '@/theme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

interface ThemedBackgroundProps extends ViewProps {
    children: React.ReactNode;
}

export const ThemedBackground: React.FC<ThemedBackgroundProps> = ({ children, style, ...props }) => {
    return (
        <View style={[styles.container, style]} {...props}>
            <LinearGradient
                colors={[
                    colors.main_bg_gradient_start,
                    colors.main_bg_gradient_middle,
                    colors.main_bg_gradient_end,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default ThemedBackground;
