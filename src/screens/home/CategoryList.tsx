import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { categoryIcons } from "./Api";

const propertyIcon = require("../../../assets/images/home.png");
const carIcon = require("../../../assets/images/car.png");
const jobIcon = require("../../../assets/images/jobs.png");
const mobileIcon = require("../../../assets/images/mobile.png");
const professionalsIcon = require("../../../assets/images/professionals.png");
const classifiedsIcon = require("../../../assets/images/classifieds.png");
const furnitureGardenIcon = require("../../../assets/images/furnituregarden.png");

interface Category {
  key: string;
  name: string;
  categoryId: string | null;
}
interface CategoryListProps {
  categories: Category[];
  onSelect: (category: Category) => void;
  onSeeAll: () => void;
}
const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  onSelect,
  onSeeAll,
}) => {
  const realCategories = categories.slice(0, 7);
  const othersCategory = { key: "others", name: "Others", categoryId: null };
  const displayCategories = [...realCategories, othersCategory];
  return (
    <View className="px-4" style={{ marginBottom: 4 }}>
      <View className="flex-row flex-wrap justify-between">
        {displayCategories.map((c) => {
          const IconComponent = categoryIcons[c.name];
          const isOthers = c.name === "Others";
          return (
            <TouchableOpacity
              key={c.key}
              className="w-[23%] mb-4"
              onPress={() => onSelect(c)}
              activeOpacity={0.7}
            >
              <View
                className="w-full aspect-square rounded-xl items-center justify-center"
                style={{
                  backgroundColor: "#f5f6f6ff",
                  borderWidth: 1,
                  borderColor: "#ffffff",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 2,
                  paddingTop:
                    c.name === "Property" ||
                    c.name === "Properties" ||
                    c.name === "Mobiles Tablets" ||
                    c.name === "Mobiles & Tablets" ||
                    c.name === "Professional For Hire" ||
                    c.name === "Professinal For Hire" ||
                    c.name === "Services"
                      ? 6
                      : c.name === "Motors" ||
                          c.name === "Job" ||
                          c.name === "Jobs" ||
                          c.name === "Classifieds" ||
                          c.name === "Furniture Garden" ||
                          c.name === "Furniture & Garden"
                        ? 0
                        : 12,
                  paddingBottom:
                    c.name === "Motors" ||
                    c.name === "Job" ||
                    c.name === "Jobs" ||
                    c.name === "Classifieds" ||
                    c.name === "Furniture Garden" ||
                    c.name === "Furniture & Garden"
                      ? 6
                      : 8,
                  paddingHorizontal: 8,
                }}
              >
                {isOthers ? (
                  <Ionicons
                    name="grid-outline"
                    size={24}
                    color={colors.text_primary}
                  />
                ) : c.name === "Property" || c.name === "Properties" ? (
                  <Image
                    source={propertyIcon}
                    style={{ width: 48, height: 48 }}
                    resizeMode="contain"
                  />
                ) : c.name === "Motors" ? (
                  <View style={{ marginTop: -10, alignItems: "center" }}>
                    <Image
                      source={carIcon}
                      style={{ width: 60, height: 60 }}
                      resizeMode="contain"
                    />
                    <Text
                      className="text-[10px] text-center font-bold leading-3"
                      style={{ color: colors.text_primary, marginTop: -3 }}
                      numberOfLines={2}
                    >
                      {c.name}
                    </Text>
                  </View>
                ) : c.name === "Job" || c.name === "Jobs" ? (
                  <View style={{ marginTop: -17, alignItems: "center" }}>
                    <Image
                      source={jobIcon}
                      style={{ width: 80, height: 80 }}
                      resizeMode="contain"
                    />
                    <Text
                      className="text-[10px] text-center font-bold leading-3"
                      style={{ color: colors.text_primary, marginTop: -8 }}
                      numberOfLines={2}
                    >
                      {c.name}
                    </Text>
                  </View>
                ) : c.name === "Mobiles Tablets" ||
                  c.name === "Mobiles & Tablets" ? (
                  <Image
                    source={mobileIcon}
                    style={{ width: 49, height: 49 }}
                    resizeMode="contain"
                  />
                ) : c.name === "Classifieds" ? (
                  <View style={{ marginTop: -8, alignItems: "center" }}>
                    <Image
                      source={classifiedsIcon}
                      style={{ width: 59, height: 59 }}
                      resizeMode="contain"
                    />
                    <Text
                      className="text-[10px] text-center font-bold leading-3"
                      style={{ color: colors.text_primary, marginTop: 2 }}
                      numberOfLines={2}
                    >
                      {c.name}
                    </Text>
                  </View>
                ) : c.name === "Furniture Garden" ||
                  c.name === "Furniture & Garden" ? (
                  <View style={{ marginTop: -14, alignItems: "center" }}>
                    <Image
                      source={furnitureGardenIcon}
                      style={{ width: 63, height: 63 }}
                      resizeMode="contain"
                    />
                    <Text
                      className="text-[10px] text-center font-bold leading-3"
                      style={{ color: colors.text_primary, marginTop: 2 }}
                      numberOfLines={2}
                    >
                      {c.name}
                    </Text>
                  </View>
                ) : c.name === "Professional For Hire" ||
                  c.name === "Professinal For Hire" ||
                  c.name === "Services" ? (
                  <Image
                    source={professionalsIcon}
                    style={{ width: 66, height: 66 }}
                    resizeMode="contain"
                  />
                ) : (
                  IconComponent && (
                    <IconComponent size={24} color={colors.text_primary} />
                  )
                )}
                {c.name !== "Motors" &&
                  c.name !== "Job" &&
                  c.name !== "Jobs" &&
                  c.name !== "Classifieds" &&
                  c.name !== "Furniture Garden" &&
                  c.name !== "Furniture & Garden" && (
                    <Text
                      className="text-[10px] text-center font-bold leading-3"
                      style={{
                        color: colors.text_primary,
                        marginTop:
                          c.name === "Property" ||
                          c.name === "Properties" ||
                          c.name === "Mobiles Tablets" ||
                          c.name === "Mobiles & Tablets"
                            ? 2
                            : c.name === "Professional For Hire" ||
                                c.name === "Professinal For Hire" ||
                                c.name === "Services"
                              ? -13
                              : 6,
                      }}
                      numberOfLines={2}
                    >
                      {c.name}
                    </Text>
                  )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
export default CategoryList;
