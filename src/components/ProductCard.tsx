import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Location from 'expo-location';
import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface ProductCardProps {
    item: {
        id: string | number;
        title: string;
        image: string;
        price: string;
        status?: string;
        originalPrice?: number;
        discountedPrice?: number;
        seller?: {
            name?: string;
            profilePic?: string;
        };
        location?: {
            type: string;
            coordinates: number[];
        };
    };
    onPress: () => void;
    variant?: 'horizontal' | 'vertical';
}

const NoImagePlaceholder = () => (
    <View className="w-full h-full bg-bg_secondary justify-center items-center">
        <Ionicons name="image-outline" size={32} color={colors.text_tertiary} />
    </View>
);

const ProductCard: React.FC<ProductCardProps> = ({ item, onPress, variant = 'horizontal' }) => {
    const noImageUrl =
        "https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg";
    const imageUrl =
        item.image && !item.image.includes("undefined") ? item.image : null;
    const hasImage = imageUrl && imageUrl !== noImageUrl;

    const [imageError, setImageError] = useState(false);
    const [address, setAddress] = useState<string>("");

    useEffect(() => {
        setImageError(false);
    }, [imageUrl]);

    useEffect(() => {
        let isMounted = true;
        const fetchAddress = async () => {
            // console.log("Item Location:", item.location); // DEBUG
            if (item.location?.coordinates && item.location.coordinates.length === 2) {
                try {
                    const [lon, lat] = item.location.coordinates;
                    // console.log(`Geocoding: ${lat}, ${lon}`); // DEBUG
                    const [result] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
                    // console.log("Geocode Result:", result); // DEBUG

                    if (isMounted) {
                        if (result) {
                            const place = result.city || result.district || result.region || result.subregion || result.name;
                            setAddress(place || `${lat.toFixed(2)}, ${lon.toFixed(2)}`);
                        } else {
                            setAddress(`${lat.toFixed(2)}, ${lon.toFixed(2)}`);
                        }
                    }
                } catch (e) {
                    console.log("Geocoding failed", e);
                    if (isMounted) setAddress(`${item.location.coordinates[1].toFixed(2)}, ${item.location.coordinates[0].toFixed(2)}`);
                }
            } else {
                // console.log("No coordinates found for item", item.id);
            }
        };

        fetchAddress();
        return () => { isMounted = false; };
    }, [item.location]);

    const showImage = hasImage && !imageError;

    if (variant === 'vertical') {
        return (
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.7}
                className="bg-bg_white rounded-xl mb-3 flex-1 overflow-hidden"
                style={{
                    elevation: 2,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                    marginHorizontal: 6, // Spacing for grid
                    maxWidth: '48%' // Ensure 2 columns fit
                }}
            >
                <View className="w-full h-[150px] bg-bg_secondary overflow-hidden">
                    {showImage ? (
                        <Image
                            source={{ uri: imageUrl ?? undefined }}
                            className="w-full h-full"
                            contentFit="cover"
                            transition={200}
                            recyclingKey={item.id != null ? String(item.id) : undefined}
                            onError={() => setImageError(true)}
                            style={{ width: '100%', height: '100%' }}
                        />
                    ) : (
                        <NoImagePlaceholder />
                    )}
                </View>

                <View className="p-3">
                    <View className="flex-row items-baseline gap-1.5 mb-1">
                        <Text className="text-lg font-bold text-primary" numberOfLines={1}>
                            {item.price}
                        </Text>
                    </View>

                    <Text
                        className="text-[14px] font-medium text-text_primary leading-5 mb-2"
                        numberOfLines={2}
                    >
                        {item.title || "Untitled Product"}
                    </Text>

                    <View className="flex-row items-center mt-1">
                        {address ? (
                            <>
                                <Ionicons name="location-sharp" size={12} color="red" />
                                <Text className="text-[11px] text-red-500 ml-1 flex-1" numberOfLines={1}>
                                    {address}
                                </Text>
                            </>
                        ) : null}
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            className="bg-bg_white rounded-xl mb-3 mx-4 flex-row overflow-hidden"
            style={{ elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 }}
        >
            <View className="w-[120px] h-[120px] bg-bg_secondary overflow-hidden">
                {showImage ? (
                    <Image
                        source={{ uri: imageUrl ?? undefined }}
                        className="w-full h-full min-w-[120px] min-h-[120px]"
                        contentFit="cover"
                        transition={200}
                        recyclingKey={item.id != null ? String(item.id) : undefined}
                        onError={() => setImageError(true)}
                        style={{ width: 120, height: 120 }}
                    />
                ) : (
                    <NoImagePlaceholder />
                )}
            </View>

            <View className="flex-1 p-3 justify-between">
                <View className="flex-1">
                    <Text
                        className="text-[15px] font-medium text-text_primary leading-5 mb-2"
                        numberOfLines={2}
                    >
                        {item.title || "Untitled Product"}
                    </Text>

                    <View className="flex-row items-center mb-2">
                        {item.seller?.profilePic ? (
                            <Image
                                source={{ uri: item.seller.profilePic }}
                                className="w-5 h-5 rounded-full mr-1.5"
                                contentFit="cover"
                            />
                        ) : (
                            <View className="w-5 h-5 rounded-full bg-bg_secondary justify-center items-center mr-1.5">
                                <Ionicons
                                    name="person"
                                    size={12}
                                    color={colors.text_tertiary}
                                />
                            </View>
                        )}
                        <Text
                            className="text-xs text-text_tertiary flex-1"
                            numberOfLines={1}
                        >
                            {item.seller?.name || "Seller"}
                        </Text>
                    </View>
                </View>

                <View className="flex-row items-baseline gap-1.5">
                    {item.discountedPrice != null &&
                        item.originalPrice != null &&
                        item.originalPrice > item.discountedPrice && (
                            <Text className="text-[13px] text-text_tertiary line-through">
                                {item.price}
                            </Text>
                        )}
                    <Text className="text-lg font-bold text-primary">
                        {item.price}
                    </Text>
                </View>

                {address ? (
                    <View className="flex-row items-center mt-1">
                        <Ionicons name="location-sharp" size={12} color="red" />
                        <Text className="text-[11px] text-red-500 ml-1" numberOfLines={1}>
                            {address}
                        </Text>
                    </View>
                ) : null}
            </View>
        </TouchableOpacity>
    );
};

export default ProductCard;
