import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Text,
  View,
} from "react-native";
import AISuggestedTag from "./AISuggestedTag";
import PostAdSkeleton from "./PostAdSkeleton";

interface AmenityItem {
  name: string;
  distance_km: number;
}

interface AmenitiesData {
  [category: string]: AmenityItem[];
}

interface AmenitiesSectionProps {
  generationStep:       number;
  isAmenitiesRequired:  boolean;
  amenities:            AmenitiesData | null;
  isAmenitiesLoading:   boolean;
  showAmenities:        boolean;
}

export const AmenitiesSection: React.FC<AmenitiesSectionProps> = ({
  generationStep,
  isAmenitiesRequired,
  amenities,
  isAmenitiesLoading,
  showAmenities,
}) => {
  // Only render if needed
  if (generationStep !== 3 || !isAmenitiesRequired) return null; // 3 = GENERATION_STEPS.DONE

  return (
    <View className="bg-white rounded-[20px] p-5 shadow-sm border border-gray-100 mb-5">
      <View className="flex-row justify-between items-center mb-5">
        <Text 
          className="text-xl text-gray-900" 
          style={{ fontFamily: "DM Serif Display" }}
        >
          Nearby Amenities
        </Text>
        <AISuggestedTag />
      </View>

      {isAmenitiesLoading && amenities === null ? (
        <>
          <PostAdSkeleton className="h-12 w-full rounded-xl mb-3" />
          <PostAdSkeleton className="h-12 w-full rounded-xl mb-3" />
        </>
      ) : showAmenities ? (
        <View>
          {Object.entries(amenities!).map(([category, list]: [string, any]) => {
            if (!Array.isArray(list) || list.length === 0) return null;
            return (
              <View key={category} className="mb-4">
                <Text className="text-[#111827] font-bold text-[13px] mb-2 capitalize">
                  {category}s
                </Text>
                <View className="flex-row flex-wrap">
                  {list.map((item: any, idx: number) => (
                    <View 
                      key={idx} 
                      className="bg-[#F9FAFB] border border-[#F3F4F6] rounded-full px-3 py-1.5 mr-2 mb-2 flex-row items-center"
                    >
                      <Text className="text-[#374151] text-[12px] font-medium">
                        {item.name}
                      </Text>
                      <Text className="text-[#9CA3AF] text-[10px] ml-1.5">
                        {item.distance_km}km
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <Text className="text-gray-400 text-sm italic">
          No nearby amenities found for this location.
        </Text>
      )}
    </View>
  );
};
