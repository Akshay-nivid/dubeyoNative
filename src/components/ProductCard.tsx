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
        images?: string[];
        price: string;
        status?: string;
        originalPrice?: number;
        discountedPrice?: number;
        specs?: Record<string, any>;
        features?: string[];
        seller?: {
            name?: string;
            profilePic?: string;
            verified?: boolean;
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

    // Extract currency and price value
    const extractCurrencyAndPrice = (priceStr: string): { currency: string; priceValue: string } => {
        if (!priceStr || typeof priceStr !== 'string') {
            return { currency: 'AED', priceValue: priceStr || '0' };
        }

        // Check if price already contains currency (e.g., "AED 45000" or "USD 100")
        const currencyMatch = priceStr.match(/^([A-Z]{2,4})\s+(.+)$/);
        if (currencyMatch) {
            return { currency: currencyMatch[1], priceValue: currencyMatch[2] };
        }

        // Default to AED if no currency found
        return { currency: 'AED', priceValue: priceStr };
    };

    const { currency, priceValue } = extractCurrencyAndPrice(item.price);

    // Extract specifications for both variants
    const getSpecValue = (key: string) => {
        if (!item.specs || typeof item.specs !== 'object') return null;
        const lowerKey = key.toLowerCase();
        try {
            for (const [specKey, value] of Object.entries(item.specs)) {
                if (specKey.toLowerCase().includes(lowerKey)) {
                    // If value is an object with label/value, extract the value
                    if (value && typeof value === 'object' && 'value' in value) {
                        return value.value;
                    }
                    // If value is an object with label, extract the label
                    if (value && typeof value === 'object' && 'label' in value) {
                        return value.label;
                    }
                    // Otherwise return the value as-is (string/number)
                    return value;
                }
            }
        } catch (e) {
            console.error('Error extracting spec value:', e);
            return null;
        }
        return null;
    };

    // Get icon for spec key
    const getSpecIcon = (key: string): string => {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('year') || lowerKey.includes('date') || lowerKey.includes('model')) {
            return 'calendar-outline';
        }
        if (lowerKey.includes('mileage') || lowerKey.includes('km') || lowerKey.includes('odometer')) {
            return 'speedometer-outline';
        }
        if (lowerKey.includes('fuel') || lowerKey.includes('gas')) {
            return 'car-outline';
        }
        if (lowerKey.includes('brand') || lowerKey.includes('manufacturer')) {
            return 'business-outline';
        }
        if (lowerKey.includes('condition') || lowerKey.includes('status')) {
            return 'checkmark-circle-outline';
        }
        if (lowerKey.includes('size') || lowerKey.includes('dimension')) {
            return 'resize-outline';
        }
        if (lowerKey.includes('color') || lowerKey.includes('colour')) {
            return 'color-palette-outline';
        }
        if (lowerKey.includes('material')) {
            return 'cube-outline';
        }
        if (lowerKey.includes('weight')) {
            return 'barbell-outline';
        }
        if (lowerKey.includes('price') || lowerKey.includes('cost')) {
            return 'cash-outline';
        }
        // Default icon
        return 'information-circle-outline';
    };

    // Get any available specifications
    const getAvailableSpecs = (): Array<{ key: string; value: string; icon: string }> => {
        const limit = variant === 'vertical' ? 3 : 4;
        const specs: Array<{ key: string; value: string; icon: string }> = [];
        if (!item.specs || typeof item.specs !== 'object') return specs;

        try {
            for (const [specKey, value] of Object.entries(item.specs)) {
                if (specs.length >= limit) break;

                let displayValue: string | null = null;

                // Handle different value types
                if (value && typeof value === 'object') {
                    if ('value' in value) {
                        displayValue = String(value.value);
                    } else if ('label' in value) {
                        displayValue = String(value.label);
                    } else {
                        // Skip complex objects
                        continue;
                    }
                } else if (value !== null && value !== undefined) {
                    displayValue = String(value);
                }

                // Skip empty values and common fields we don't want to show
                if (displayValue && displayValue.trim() &&
                    displayValue.toLowerCase() !== 'null' &&
                    displayValue.toLowerCase() !== 'undefined' &&
                    !specKey.toLowerCase().includes('id') &&
                    !specKey.toLowerCase().includes('image') &&
                    !specKey.toLowerCase().includes('photo') &&
                    !specKey.toLowerCase().includes('url')) {
                    specs.push({
                        key: specKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                        value: displayValue.trim(),
                        icon: getSpecIcon(specKey)
                    });
                }
            }
        } catch (e) {
            console.error('Error extracting specs:', e);
        }

        return specs;
    };

    const availableSpecs = getAvailableSpecs();

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
                <View className="w-full h-[120px] bg-bg_secondary overflow-hidden">
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

                <View className="p-2">
                    <View className="flex-row items-baseline gap-1.5 mb-0.5">
                        <Text className="text-sm font-medium text-text_tertiary">
                            {currency}
                        </Text>
                        <Text className="text-base font-bold text-primary" numberOfLines={1}>
                            {priceValue}
                        </Text>
                    </View>

                    <Text
                        className="text-[13px] font-medium text-text_primary leading-4 mb-1"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {item.title || "Untitled Product"}
                    </Text>

                    {/* Product Details - Show 3 details in single row */}
                    {availableSpecs.length > 0 && (
                        <View className="flex-row items-center mb-1 gap-1">
                            {availableSpecs.map((spec, index) => (
                                <View key={index} className="flex-1 flex-row items-center">
                                    <Ionicons name={spec.icon as any} size={10} color={colors.text_tertiary} />
                                    <Text className="text-[9px] text-text_tertiary ml-0.5 flex-1" numberOfLines={1}>
                                        {spec.value}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <View className="flex-row items-center justify-between mt-0.5">
                        {/* Location - Left */}
                        {address ? (
                            <View className="flex-row items-center flex-1">
                                <Ionicons name="location-sharp" size={10} color="red" />
                                <Text className="text-[10px] text-red-500 ml-1 flex-1" numberOfLines={1}>
                                    {address}
                                </Text>
                            </View>
                        ) : <View className="flex-1" />}

                        {/* Seller Name - Right */}
                        {item.seller?.name && (
                            <View className="flex-row items-center ml-2">
                                {item.seller?.profilePic ? (
                                    <Image
                                        source={{ uri: item.seller.profilePic }}
                                        className="w-3.5 h-3.5 rounded-full mr-1"
                                        contentFit="cover"
                                    />
                                ) : (
                                    <View className="w-3.5 h-3.5 rounded-full bg-bg_secondary justify-center items-center mr-1">
                                        <Ionicons
                                            name="person"
                                            size={9}
                                            color={colors.text_tertiary}
                                        />
                                    </View>
                                )}
                                <Text className="text-[10px] text-text_tertiary" numberOfLines={1}>
                                    {item.seller.name}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    // Get images array and image count - safely handle undefined/null
    let imagesArray: string[] = [];
    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
        imagesArray = item.images
            .map((img: any) => {
                if (typeof img === 'string') return img;
                if (img && typeof img === 'object') {
                    return img.url || img.image || img.src || null;
                }
                return null;
            })
            .filter((img: string | null): img is string => img !== null);
    }
    if (imagesArray.length === 0 && imageUrl) {
        imagesArray = [imageUrl];
    }
    const imageCount = imagesArray.length;
    const currentImageIndex = 1; // For now, showing first image

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            className="bg-bg_white rounded-xl mb-3 mx-4 overflow-hidden"
            style={{ elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 }}
        >
            {/* Top Section: Image and Primary Details */}
            <View className="flex-row">
                {/* Product Image - Left Side */}
                <View className="w-[180px] h-[180px] bg-bg_secondary overflow-hidden relative">
                    {showImage ? (
                        <>
                            <Image
                                source={{ uri: imageUrl ?? undefined }}
                                className="w-full h-full"
                                contentFit="cover"
                                transition={200}
                                recyclingKey={item.id != null ? String(item.id) : undefined}
                                onError={() => setImageError(true)}
                                style={{ width: '100%', height: '100%' }}
                            />
                            {/* Image Counter Overlay */}
                            {imageCount > 1 && (
                                <View
                                    className="absolute bottom-2 left-2 rounded px-2 py-1 flex-row items-center"
                                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
                                >
                                    <Ionicons name="camera" size={12} color="#ffffff" />
                                    <Text className="text-white text-xs ml-1 font-medium">
                                        {currentImageIndex}/{imageCount}
                                    </Text>
                                </View>
                            )}
                        </>
                    ) : (
                        <NoImagePlaceholder />
                    )}
                </View>

                {/* Product Details - Right Side */}
                <View className="flex-1 p-4">
                    {/* Price */}
                    <View className="flex-row items-baseline mb-2">
                        <Text className="text-lg font-medium text-text_tertiary mr-1">
                            {currency}
                        </Text>
                        <Text className="text-2xl font-bold" style={{ color: colors.primary }}>
                            {priceValue}
                        </Text>
                    </View>

                    {/* Product Name */}
                    <Text
                        className="text-lg font-bold text-text_primary mb-3"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {item.title || "Untitled Product"}
                    </Text>

                    {/* Specifications - Show 2 details per row */}
                    {availableSpecs.length > 0 && (
                        <View className="mb-3">
                            {/* First row - 2 details */}
                            {availableSpecs.length > 0 && (
                                <View className="flex-row mb-2">
                                    <View className="flex-1 flex-row items-center mr-2">
                                        <Ionicons name={availableSpecs[0].icon as any} size={14} color={colors.text_tertiary} />
                                        <Text className="text-sm text-text_primary ml-1 flex-1" numberOfLines={1}>
                                            {availableSpecs[0].value}
                                        </Text>
                                    </View>
                                    {availableSpecs.length > 1 && (
                                        <View className="flex-1 flex-row items-center ml-2">
                                            <Ionicons name={availableSpecs[1].icon as any} size={14} color={colors.text_tertiary} />
                                            <Text className="text-sm text-text_primary ml-1 flex-1" numberOfLines={1}>
                                                {availableSpecs[1].value}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}
                            {/* Second row - 2 details */}
                            {availableSpecs.length > 2 && (
                                <View className="flex-row">
                                    <View className="flex-1 flex-row items-center mr-2">
                                        <Ionicons name={availableSpecs[2].icon as any} size={14} color={colors.text_tertiary} />
                                        <Text className="text-sm text-text_primary ml-1 flex-1" numberOfLines={1}>
                                            {availableSpecs[2].value}
                                        </Text>
                                    </View>
                                    {availableSpecs.length > 3 && (
                                        <View className="flex-1 flex-row items-center ml-2">
                                            <Ionicons name={availableSpecs[3].icon as any} size={14} color={colors.text_tertiary} />
                                            <Text className="text-sm text-text_primary ml-1 flex-1" numberOfLines={1}>
                                                {availableSpecs[3].value}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </View>

            {/* Middle Section: Feature Tags */}
            {item.features && Array.isArray(item.features) && item.features.length > 0 && (
                <View className="px-4 pb-3 flex-row flex-wrap gap-2">
                    {item.features.slice(0, 3).map((feature, index) => {
                        // Extract feature text safely
                        let featureText = '';
                        if (typeof feature === 'string') {
                            featureText = feature;
                        } else if (feature && typeof feature === 'object') {
                            featureText = feature.name || feature.label || feature.value || feature.title || '';
                        }

                        // Skip if no valid text found
                        if (!featureText) return null;

                        return (
                            <View
                                key={index}
                                className="px-3 py-1.5 rounded-full flex-row items-center"
                                style={{
                                    backgroundColor: '#E8F5E9',
                                    borderWidth: 1,
                                    borderColor: '#4CAF50'
                                }}
                            >
                                <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                                <Text className="text-xs text-text_primary ml-1.5">
                                    {String(featureText)}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            )}

            {/* Bottom Section: Location and Seller Info */}
            <View className="px-4 pb-4 flex-row items-center justify-between">
                {/* Location */}
                {address && (
                    <View className="flex-row items-center flex-1">
                        <Ionicons name="location-sharp" size={14} color="#000000" />
                        <Text className="text-xs text-text_primary ml-1" numberOfLines={1}>
                            {address}
                        </Text>
                    </View>
                )}

                {/* Seller Information */}
                <View className="flex-row items-center ml-4">
                    {item.seller?.profilePic ? (
                        <Image
                            source={{ uri: item.seller.profilePic }}
                            className="w-6 h-6 rounded-full mr-2"
                            contentFit="cover"
                        />
                    ) : (
                        <View className="w-6 h-6 rounded-full bg-bg_secondary justify-center items-center mr-2">
                            <Ionicons
                                name="person"
                                size={14}
                                color={colors.text_tertiary}
                            />
                        </View>
                    )}
                    <View>
                        <Text className="text-xs font-bold text-text_primary">
                            {item.seller?.name || "Seller"}
                        </Text>
                        {item.seller?.verified && (
                            <View className="flex-row items-center mt-0.5">
                                <View className="px-2 py-0.5 rounded flex-row items-center" style={{ backgroundColor: '#3B82F6' }}>
                                    <Ionicons name="checkmark" size={10} color="#ffffff" />
                                    <Text className="text-[10px] text-white ml-1 font-medium">Verified seller</Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default ProductCard;
