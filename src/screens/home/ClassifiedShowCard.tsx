import { get, post } from "@/src/services/api";
import { colors } from "@/theme";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Toast from "react-native-toast-message";
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
  const router = useRouter();
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
        setError("Category not found. Please try selecting a different category.");
        setLoading(false);
        return;
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
    if (!data.subcategoryId) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please select a subcategory",
      });
      return;
    }

    onClose();
    
    // Navigate to product listing with params
    const divisionTypes = selectedSubcategory?.division_type || [];
    const selectedDivision = data.divisionId 
      ? divisionTypes.find((d: any) => d.id === data.divisionId)
      : null;

    router.push({
      pathname: "/products" as any,
      params: {
        subcategoryId: data.subcategoryId,
        subcategoryName: selectedSubcategory?.name || categoryName,
        divisionTypes: JSON.stringify(divisionTypes),
        selectedDivision: selectedDivision ? JSON.stringify(selectedDivision) : "",
      },
    });
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View className="flex-1 bg-black/60 justify-end z-[10000]">
        <TouchableOpacity
          className="flex-1"
          onPress={onClose}
          activeOpacity={0.7}
        />

        <View className="rounded-t-[30px] w-full overflow-hidden bg-bg_white h-[75%] z-[10001] mb-0 pb-0">
          <View className="p-6 border-b border-border_primary flex-row justify-between items-center bg-bg_white">
            <Text className="text-xl font-bold text-text_primary">
              {categoryName || category?.name || "Category"}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="rounded-full p-2 bg-bg_secondary"
            >
              <Text className="font-bold px-2 text-text_primary">
                X
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="mt-4 text-text_secondary">
                Loading subcategories...
              </Text>
            </View>
          ) : error ? (
            <View className="flex-1 justify-center items-center px-6">
              <Text className="text-error">{error}</Text>
            </View>
          ) : subcategories.length > 0 ? (
            <View className="flex-1">
              {/* Subcategories Section - Top */}
              <View className="p-4 pb-3 bg-bg_white">
                <Text className="text-base font-semibold mb-4 text-text_primary">
                  Sub Category
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  {subcategories.map((sub) => (
                    <TouchableOpacity
                      key={sub.id}
                      onPress={() => handleChangeSubCategory(sub)}
                      className={`px-4 py-2 rounded-full border ${
                        selectedSubcategory?.id === sub.id
                          ? "bg-primary border-primary"
                          : "bg-bg_white border-border_primary"
                      }`}
                    >
                      <Text
                        className={`text-md font-normal ${
                          selectedSubcategory?.id === sub.id
                            ? "text-text_light"
                            : "text-text_primary"
                        }`}
                      >
                        {sub.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Divider */}
              <View className="h-px w-full bg-border_primary" />

              {/* Type/Division Section - Bottom */}
              <View className="p-4 pt-3 pb-0 bg-bg_white">
                <Text className="text-base font-semibold mb-4 text-text_primary">
                  Type
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  {selectedSubcategory?.division_type?.length > 0 ? (
                    selectedSubcategory.division_type.map((d: any) => (
                      <TouchableOpacity
                        key={d.id}
                        onPress={() => handleSelectDivision(d)}
                        className={`px-4 py-2 rounded-full border ${
                          data.divisionId === d.id
                            ? "bg-primary border-primary"
                            : "bg-bg_white border-border_primary"
                        }`}
                      >
                        <Text
                          className={`text-md font-normal ${
                            data.divisionId === d.id
                              ? "text-text_light"
                              : "text-text_primary"
                          }`}
                        >
                          {d.name}
                        </Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text className="italic text-text_tertiary">
                      No types available
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ) : (
            <View className="flex-1 justify-center items-center">
              <Text className="text-text_primary">No subcategories found</Text>
            </View>
          )}

          <View className="p-4 border-t border-border_primary shadow-lg bg-bg_white">
            <TouchableOpacity
              className="items-center justify-center py-4 rounded-xl shadow-md bg-primary"
              onPress={handleViewItems}
            >
              <Text className="font-bold text-base tracking-wide text-text_light">
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
