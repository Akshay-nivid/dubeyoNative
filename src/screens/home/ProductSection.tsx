import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { colors } from "@/theme";

interface ProductSectionProps {
  title: string;
  products: any[];
  images: Record<string | number, string>;
}

const ProductSection: React.FC<ProductSectionProps> = ({
  title,
  products,
  images,
}) => {
  const router = useRouter();

  if (!products || products.length === 0) return null;

  return (
    <View className="mb-6">
      <View className="flex-row justify-between items-center px-4 mb-3">
        <Text className="text-lg font-bold" style={{ color: colors.text_primary }}>{title}</Text>
        <TouchableOpacity>
          <Text className="font-medium text-sm flex-row items-center" style={{ color: colors.text_secondary }}>
            See all <Ionicons name="arrow-forward" size={14} color={colors.text_secondary} />
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {products.slice(0, 5).map((item: any, index: number) => {
          const id = item.id || item.product_id || item._id;
          const img =
            images[id] ||
            item.image ||
            (Array.isArray(item.images) && item.images[0]?.url) ||
            (Array.isArray(item.images) && item.images[0]) ||
            "https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg";
          const productId = item.id || item.product_id || item._id;
          const productTitle = item.title || item.name || item.product_name || "Untitled";
          const productPrice = item.price || item.product_price;

          return (
            <TouchableOpacity
              key={productId || index}
              className="mr-3 w-40 bg-white rounded-xl overflow-hidden mb-1"
              activeOpacity={0.8}
              onPress={() => router.push(`/product/${productId}` as any)}
            >
              <Image
                source={{ uri: img }}
                className="w-full h-32 bg-gray-200 rounded-xl"
                resizeMode="cover"
              />
              <View className="pt-2">
                <Text
                  className="text-sm font-bold mb-0.5"
                  style={{ color: colors.text_primary }}
                  numberOfLines={1}
                >
                  {productPrice ? `AED ${productPrice}` : "Price on request"}
                </Text>
                <Text
                  className="text-xs font-medium mb-1"
                  style={{ color: colors.text_secondary }}
                  numberOfLines={1}
                >
                  {productTitle}
                </Text>
              </View>
              {/* Heart Icon Overlay */}
              <TouchableOpacity className="absolute top-2 right-2 bg-white/70 p-1.5 rounded-full">
                <Ionicons name="heart-outline" size={16} color={colors.icon_primary} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default ProductSection;
