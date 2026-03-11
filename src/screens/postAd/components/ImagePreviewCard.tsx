import { Image } from "expo-image";
import { Text, View } from "react-native";
import PostAdSkeleton from "./PostAdSkeleton";

interface ImagePreviewCardProps {
  isLoading: boolean;
  imageUri?: string;
  categoryName?: string;
  subcategoryName?: string;
  title?: string;
  description?: string;
}

const ImagePreviewCard = ({
  isLoading,
  imageUri,
  categoryName,
  subcategoryName,
  title,
  description,
}: ImagePreviewCardProps) => {
  return (
    <View className="bg-white rounded-3xl p-4 flex-row items-center shadow-lg shadow-gray-200 border border-gray-100 mb-3">
      <View className="w-24 h-20 rounded-2xl bg-gray-50 overflow-hidden items-center justify-center border border-gray-100">
        {isLoading ? (
          <PostAdSkeleton className="w-full h-full" />
        ) : (
          <Image
            source={{ uri: imageUri }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        )}
      </View>
      <View className="ml-4 flex-1">
        {isLoading ? (
          <>
            <PostAdSkeleton className="h-3 w-20 rounded-full mb-2" />
            <PostAdSkeleton className="h-5 w-48 rounded-md mb-2" />
            <PostAdSkeleton className="h-3 w-full rounded-full" />
          </>
        ) : (
          <>
            <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">
              {categoryName || "Detecting..."} • {subcategoryName || "..."}
            </Text>
            <Text
              className="text-gray-900 font-bold text-base mb-1"
              numberOfLines={1}
            >
              {title || "AI is generating title..."}
            </Text>
            <Text
              className="text-gray-500 text-[11px] leading-4"
              numberOfLines={2}
            >
              {description || "Analyzing description..."}
            </Text>
          </>
        )}
      </View>
    </View>
  );
};

export default ImagePreviewCard;
