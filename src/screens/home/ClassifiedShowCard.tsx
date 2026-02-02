import { get, post } from "@/src/services/api";
import { colors } from "@/theme";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  ScrollView,
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
  const panY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Capture gesture if it's a vertical swipe
        const isVerticalSwipe = Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
        return isVerticalSwipe && Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 150 || gestureState.vy > 0.5) {
          Animated.timing(panY, {
            toValue: Dimensions.get('window').height,
            duration: 250,
            useNativeDriver: true,
          }).start(onClose);
        } else {
          Animated.spring(panY, {
            toValue: 0,
            bounciness: 4,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;
  useEffect(() => {
    if (open && category) {
      panY.setValue(0);
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
      <View
        className="flex-1 justify-end"
        style={{ zIndex: 10000 }}
      >
        <TouchableOpacity
          className="flex-1"
          onPress={onClose}
          activeOpacity={0.7}
        />
        <Animated.View
          className="rounded-t-[30px] w-full overflow-hidden"
          style={{
            backgroundColor: colors.bg_white,
            maxHeight: '75%',
            zIndex: 10001,
            marginBottom: 0,
            paddingBottom: 0,
            transform: [{ translateY: panY }]
          }}
          {...panResponder.panHandlers}
        >
          {/* Drag Handle */}
          <View className="pt-3 pb-2 items-center">
            <View
              className="rounded-full"
              style={{
                width: 40,
                height: 4,
                backgroundColor: colors.border_secondary, // Use theme color
              }}
            />
          </View>
          {/* Header */}
          <View
            className="px-6 pb-6 border-b items-center"
            style={{
              borderColor: colors.border_primary,
            }}
          >
            <Text
              className="text-xl font-bold"
              style={{ color: colors.text_primary }}
            >
              {categoryName || category?.name || "Category"}
            </Text>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 0 }}
          >
            {loading ? (
              <View className="py-12 justify-center items-center">
                <ActivityIndicator size="large" color={colors.primary} />
                <Text className="mt-4" style={{ color: colors.text_secondary }}>
                  Loading subcategories...
                </Text>
              </View>
            ) : error ? (
              <View className="py-12 justify-center items-center px-6">
                <Text style={{ color: colors.error }}>{error}</Text>
              </View>
            ) : subcategories.length > 0 ? (
              <>
                {/* Subcategories Section - Top */}
                <View className="p-4 pb-3" style={{ backgroundColor: colors.bg_white }}>
                  <Text
                    className="text-base font-bold mb-4"
                    style={{ color: colors.text_primary }}
                  >
                    Sub Category
                  </Text>
                  <View className="flex-row flex-wrap gap-3 justify-start">
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
                                ? colors.text_white
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
                  className="p-4 pt-3"
                  style={{ backgroundColor: colors.bg_white }}
                >
                  <Text
                    className="text-base font-bold mb-4"
                    style={{ color: colors.text_primary }}
                  >
                    Type
                  </Text>
                  <View className="flex-row flex-wrap gap-3 justify-start">
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
                                  ? colors.text_white
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
              </>
            ) : (
              <View className="py-8 justify-center items-center">
                <Text style={{ color: colors.text_tertiary }}>No subcategories found</Text>
              </View>
            )}
          </ScrollView>
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
        </Animated.View>
      </View>
    </Modal>
  );
};
export default ClassifiedShowCard;