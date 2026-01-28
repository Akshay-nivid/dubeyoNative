import { get, post } from "@/src/services/api";
import { colors } from "@/theme";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { Api } from "./Api";

interface ClassifiedShowCardProps {
  open: boolean;
  onClose: () => void;
  category: any;
}

const ClassifiedShowCard: React.FC<ClassifiedShowCardProps> = ({
  open,
  onClose,
  category,
}) => {
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState<any>(null);
  const [categoryName, setCategoryName] = useState("");
  const [data, setData] = useState({
    subcategoryId: "",
    divisionId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && category) {
      fetchSubcategories();
    } else {
      // Reset state when modal closes
      setSubcategories([]);
      setSelectedSubcategory(null);
      setError(null);
      setData({ subcategoryId: "", divisionId: "" });
    }
  }, [category, open]);

  const fetchSubcategories = async () => {
    setLoading(true);
    setError(null);

    try {
      let categoryId = category?.categoryId || category?.id || category?.value;
      let name = category?.name || category?.label || "";

      // If no categoryId, try to find it from categories list
      if (!categoryId && name) {
        try {
          const categoriesRes = await get(Api.CategoriesAll);
          const categories = categoriesRes?.data?.data || categoriesRes?.data || [];

          const matchedCategory = categories.find((cat: any) => {
            const catName = (cat.label || cat.name || "").toLowerCase().trim();
            const searchName = name.toLowerCase().trim();
            return catName === searchName;
          });

          if (matchedCategory) {
            categoryId = matchedCategory.value || matchedCategory.id || matchedCategory.category_id || matchedCategory.categoryId;
            name = matchedCategory.label || matchedCategory.name || name;
          }
        } catch (err) {
          console.error("Error fetching categories:", err);
        }
      }

      if (!categoryId) {
        throw new Error("Category not found");
      }

      setCategoryName(name);

      // Fetch subcategories
      const res = await post(Api.SubcategoriesByCategory, { categoryId });
      
      if (res?.status === 200) {
        const list = res.data?.data || res.data || [];
        setSubcategories(
          list.map((sub: any) => ({
            id: sub.id,
            name: sub.name,
            division_type: sub.division_type || [],
          }))
        );
        
        if (list.length > 0) {
          setSelectedSubcategory({
            id: list[0].id,
            name: list[0].name,
            division_type: list[0].division_type || [],
          });
          setData((d) => ({ ...d, subcategoryId: list[0]?.id ?? "" }));
        } else {
          setSelectedSubcategory(null);
        }
      } else {
        throw new Error("Failed to fetch subcategories");
      }
    } catch (err: any) {
      console.error("Failed to fetch subcategories", err);
      setError(err?.message || "Failed to load subcategories");
      setSubcategories([]);
      setSelectedSubcategory(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDivision = (division: any) => {
    setData((prev) => ({
      ...prev,
      divisionId: division.id,
    }));
  };

  const handleChangeSubCategory = (sub: any) => {
    setSelectedSubcategory(sub);
    setData((prev) => ({
      ...prev,
      subcategoryId: sub?.id,
      divisionId: "",
    }));
  };

  const handleViewItems = () => {
    onClose();
    console.log("View items", data);
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <TouchableOpacity
          className="flex-1"
          onPress={onClose}
          activeOpacity={0.7}
        />

        <View
          className="rounded-t-[30px] h-[65%] w-full overflow-hidden"
          style={{ backgroundColor: colors.bg_white }}
        >
          <View
            className="p-6 border-b flex-row justify-between items-center"
            style={{
              borderColor: colors.border_primary,
              // backgroundColor: colors.bg_secondary,
            }}
          >
            <Text
              className="text-xl font-bold"
              style={{ color: colors.text_primary }}
            >
              {categoryName || category?.name || "Category"}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="rounded-full p-2"
              style={{ backgroundColor: colors.bg_secondary }}
            >
              <Text
                className="font-bold px-2"
                style={{ color: colors.text_primary }}
              >
                X
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="mt-4" style={{ color: colors.text_secondary }}>
                Loading subcategories...
              </Text>
            </View>
          ) : error ? (
            <View className="flex-1 justify-center items-center px-6">
              <Text style={{ color: colors.error }}>{error}</Text>
            </View>
          ) : subcategories.length > 0 ? (
            <View className="flex-1">
              {/* Subcategories Section - Top */}
              <View className="p-4 pb-3" style={{ backgroundColor: colors.bg_white }}>
                <Text
                  className="text-base font-semibold mb-4"
                  style={{ color: colors.text_primary }}
                >
                  Sub Category
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  {subcategories.map((sub) => (
                    <TouchableOpacity
                      key={sub.id}
                      onPress={() => handleChangeSubCategory(sub)}
                      className="px-4 py-2 rounded-full border"
                      style={{
                        backgroundColor:
                          selectedSubcategory?.id === sub.id
                            ? colors.primary
                            : colors.bg_white,
                        borderColor:
                          selectedSubcategory?.id === sub.id
                            ? colors.primary
                            : colors.border_primary,
                      }}
                    >
                      <Text
                        className="text-md font-normal"
                        style={{
                          color:
                            selectedSubcategory?.id === sub.id
                              ? colors.text_light
                              : colors.text_primary,
                        }}
                      >
                        {sub.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Divider */}
              <View
                className="h-px w-full"
                style={{ backgroundColor: colors.border_primary }}
              />

              {/* Type/Division Section - Bottom */}
              <View
                className="p-4 pt-3 pb-0"
                style={{ backgroundColor: colors.bg_white }}
              >
                <Text
                  className="text-base font-semibold mb-4"
                  style={{ color: colors.text_primary }}
                >
                  Type
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  {selectedSubcategory?.division_type?.length > 0 ? (
                    selectedSubcategory.division_type.map((d: any) => (
                      <TouchableOpacity
                        key={d.id}
                        onPress={() => handleSelectDivision(d)}
                        className="px-4 py-2 rounded-full border"
                        style={{
                          backgroundColor:
                            data.divisionId === d.id
                              ? colors.primary
                              : colors.bg_white,
                          borderColor:
                            data.divisionId === d.id
                              ? colors.primary
                              : colors.border_primary,
                        }}
                      >
                        <Text
                          className="text-md font-normal"
                          style={{
                            color:
                              data.divisionId === d.id
                                ? colors.text_light
                                : colors.text_primary,
                          }}
                        >
                          {d.name}
                        </Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text
                      className="italic"
                      style={{ color: colors.text_tertiary }}
                    >
                      No types available
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ) : (
            <View className="flex-1 justify-center items-center">
              <Text>No subcategories found</Text>
            </View>
          )}

          <View
            className="p-4 border-t shadow-lg"
            style={{
              borderColor: colors.border_primary,
              backgroundColor: colors.bg_white,
            }}
          >
            <TouchableOpacity
              className="items-center justify-center py-4 rounded-xl shadow-md"
              style={{ backgroundColor: colors.primary }}
              onPress={handleViewItems}
            >
              <Text
                className="font-bold text-base tracking-wide"
                style={{ color: colors.text_light }}
              >
                VIEW ITEMS
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ClassifiedShowCard;
