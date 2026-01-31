import React from 'react';
import { TextProps } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';

interface GradientTextProps extends TextProps {
    colors: string[];
    text: string;
    style?: any;
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    textAnchor?: "start" | "middle" | "end";
    x?: string | number;
}

const GradientText: React.FC<GradientTextProps> = ({
    colors,
    text,
    style,
    start = { x: 0, y: 0 },
    end = { x: 1, y: 0 },
    ...props
}) => {
    // Extract font size and weight from style if possible, or use defaults
    const fontSize = style?.fontSize || 24;
    const fontWeight = style?.fontWeight || 'bold';
    const fontFamily = style?.fontFamily;

    return (
        <Svg height={fontSize * 1.5} width="100%">
            <Defs>
                <LinearGradient id="grad" x1={start.x} y1={start.y} x2={end.x} y2={end.y}>
                    {colors.map((color, index) => (
                        <Stop
                            key={index}
                            offset={`${(index / (colors.length - 1)) * 100}%`}
                            stopColor={color}
                        />
                    ))}
                </LinearGradient>
            </Defs>
            <SvgText
                fill="url(#grad)"
                fontSize={fontSize}
                fontWeight={fontWeight}
                fontFamily={fontFamily}
                x="0"
                y={fontSize} // Align text properly
                {...props}
            >
                {text}
            </SvgText>
        </Svg>
    );
};

export default GradientText;
