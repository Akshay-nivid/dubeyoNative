import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

interface ProductSectionProps {
  title: string;
  products: any[];
  images: Record<string | number, string>;
  onSeeAll?: () => void;
}

const ProductSection: React.FC<ProductSectionProps> = ({
  title,
  products,
  images,
  onSeeAll,
}) => {
  const router = useRouter();

  if (!products || !Array.isArray(products) || products.length === 0) return null;

  return (
    <View className="mb-6">
      <View className="flex-row justify-between items-center px-4 mb-3">
        <Text className="text-lg font-bold" style={{ color: colors.text_primary }}>{title}</Text>
        <TouchableOpacity onPress={onSeeAll}>
          <Text className="font-medium text-sm flex-row items-center" style={{ color: colors.text_primary }}>
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
              className="mr-3 bg-white rounded-xl overflow-hidden"
              style={{ width: 180 }}
              activeOpacity={0.8}
              onPress={() => router.push(`/product/${productId}` as any)}
            >
              <View className="relative">
                <Image
                  source={{ uri: img }}
                  className="w-full bg-gray-200 rounded-t-xl"
                  style={{ height: 120 }}
                  resizeMode="cover"
                />
              </View>
              <View className="p-3">
                <Text
                  className="text-base font-bold mb-1"
                  style={{ color: colors.text_primary }}
                  numberOfLines={1}
                >
                  {productPrice ? `AED ${productPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "Price on request"}
                </Text>
                <Text
                  className="text-sm font-normal"
                  style={{ color: colors.text_primary }}
                  numberOfLines={2}
                >
                  {productTitle}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default ProductSection;
