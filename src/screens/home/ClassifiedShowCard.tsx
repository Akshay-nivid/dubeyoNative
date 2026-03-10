import { get, post } from "@/src/services/api";
import { colors } from "@/theme";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import {
  FontAwesome5,
  FontAwesome6,
  MaterialCommunityIcons,
  Entypo,
  Ionicons
} from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { Api } from "./Api";

interface ClassifiedShowCardProps {
  open: boolean;
  onClose: () => void;
  category: any;
}

// need to change on future
const subCategoryIcons: Record<string, { lib: any, name: string }> = {
  // Classifieds
  "Miscellaneous": { lib: FontAwesome5, name: "globe" },
  "Tools & Hardware": { lib: FontAwesome5, name: "wrench" },
  "Lost & Found": { lib: FontAwesome5, name: "search" },
  "Free Items": { lib: FontAwesome5, name: "gift" },
  "Business for Sale": { lib: FontAwesome5, name: "handshake" },
  "Antiques": { lib: MaterialCommunityIcons, name: "clock-outline" },
  "Collectibles": { lib: FontAwesome5, name: "coins" },
  "Gift Items": { lib: FontAwesome5, name: "ribbon" },
  "Pet Accessories": { lib: FontAwesome5, name: "bone" },
  "Pet Supplies": { lib: MaterialCommunityIcons, name: "bowl-mix-outline" },
  "Kids' Clothes": { lib: FontAwesome5, name: "tshirt" },
  "Baby Clothes": { lib: MaterialCommunityIcons, name: "baby-face-outline" },
  "Baby Gear": { lib: FontAwesome5, name: "baby-carriage" },
  "Toys & Games": { lib: FontAwesome5, name: "robot" },
  "Hobbies & Crafts": { lib: FontAwesome5, name: "paint-brush" },
  "Musical Instruments": { lib: FontAwesome5, name: "guitar" },
  "Outdoor & Camping": { lib: FontAwesome5, name: "campground" },
  "Fitness & Gym": { lib: FontAwesome5, name: "dumbbell" },

  // Motors
  "Cars": { lib: FontAwesome5, name: "car" },
  "Car Parts": { lib: FontAwesome5, name: "cogs" },
  "Car Accessories": { lib: FontAwesome5, name: "oil-can" },
  "Bikes": { lib: FontAwesome5, name: "motorcycle" },
  "Motorbikes": { lib: FontAwesome5, name: "motorcycle" },
  "Boats": { lib: FontAwesome5, name: "ship" },
  "Heavy Vehicles": { lib: FontAwesome5, name: "truck-moving" },
  "Number Plates": { lib: MaterialCommunityIcons, name: "numeric" },

  // Property
  "Property for Rent": { lib: FontAwesome5, name: "building" },
  "Property for Sale": { lib: FontAwesome5, name: "home" },
  "Commercial for Rent": { lib: FontAwesome5, name: "city" },
  "Commercial for Sale": { lib: FontAwesome5, name: "store" },
  "Rooms for Rent": { lib: FontAwesome5, name: "bed" },
  "Short Term Rental": { lib: FontAwesome5, name: "calendar-check" },

  // Electronics & Mobile
  "Mobile Phones": { lib: FontAwesome5, name: "mobile-alt" },
  "Mobile Accessories": { lib: FontAwesome5, name: "headphones" },
  "Laptops & Computers": { lib: FontAwesome5, name: "laptop" },
  "Home Appliances": { lib: MaterialCommunityIcons, name: "washing-machine" },
  "Tablets": { lib: FontAwesome5, name: "tablet-alt" },
  "Audio & Video": { lib: FontAwesome5, name: "volume-up" },
  "Gadgets": { lib: FontAwesome5, name: "blender" },

  // Jobs
  "Accounting": { lib: FontAwesome5, name: "calculator" },
  "Architecture": { lib: FontAwesome5, name: "drafting-table" },
  "Customer Service": { lib: FontAwesome5, name: "headset" },
  "Education": { lib: FontAwesome5, name: "graduation-cap" },
  "Engineering": { lib: FontAwesome5, name: "hard-hat" },
  "Healthcare": { lib: FontAwesome5, name: "user-md" },
  "Human Resources": { lib: FontAwesome5, name: "users" },
  "IT & Software": { lib: FontAwesome5, name: "code" },
  "Marketing": { lib: FontAwesome5, name: "ad" },
  "Sales": { lib: FontAwesome5, name: "chart-line" },
  "Transportation": { lib: FontAwesome5, name: "truck" },

  // Services
  "Computer Services": { lib: FontAwesome5, name: "desktop" },
  "Home Services": { lib: FontAwesome5, name: "tools" },
  "Health Services": { lib: FontAwesome5, name: "heartbeat" },
  "Legal Services": { lib: FontAwesome5, name: "balance-scale" },
  "Moving & Storage": { lib: FontAwesome5, name: "box-open" },
  "Tutorials": { lib: FontAwesome5, name: "chalkboard-teacher" },
  "Web Services": { lib: FontAwesome5, name: "laptop-code" },

  // Fashion & Beauty
  "Clothing": { lib: FontAwesome5, name: "tshirt" },
  "Shoes": { lib: MaterialCommunityIcons, name: "shoe-formal" },
  "Accessories": { lib: FontAwesome5, name: "gem" },
  "Jewelry": { lib: FontAwesome5, name: "ring" },
  "Watches": { lib: MaterialCommunityIcons, name: "watch" },
  "Cosmetics": { lib: MaterialCommunityIcons, name: "lipstick" },
};

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
  const [loadingDivisions, setLoadingDivisions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState<'subcategory' | 'division'>('subcategory');

  const panY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;


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
          // Gently fade out backdrop as user drags down
          const newOpacity = Math.max(0, 1 - (gestureState.dy / (Dimensions.get('window').height * 0.5)));
          fadeAnim.setValue(newOpacity);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 150 || gestureState.vy > 0.5) {
          Animated.parallel([
            Animated.timing(panY, {
              toValue: Dimensions.get('window').height,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            })
          ]).start(onClose);
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

      // Opening Animation - Snappy "Blinking" Pop
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Closing Animation (handled by onClose usually, but reset here for next time)
      fadeAnim.setValue(0);
      slideAnim.setValue(Dimensions.get('window').height);
      scaleAnim.setValue(0.9);

      setSubcategories([]);
      setSelectedSubcategory(null);
      setError(null);
      setData({ subcategoryId: "", divisionId: "" });
      setCurrentStep('subcategory');
    }
  }, [category, open]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: Dimensions.get('window').height,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  useEffect(() => {
    const fetchDivisions = async () => {
      if (!selectedSubcategory) {
        setDivisions([]);
        return;
      }
      setLoadingDivisions(true);
      try {
        const res = await get(`${Api.DivisionBySubcategory}?subCategoryId=${selectedSubcategory.id}`);
        const divData = res?.data?.data || res?.data || [];
        setDivisions(Array.isArray(divData) ? divData : []);
      } catch (err) {
        console.error("Failed to fetch divisions", err);
        setDivisions([]);
      } finally {
        setLoadingDivisions(false);
      }
    };
    if (currentStep === 'division') {
      fetchDivisions();
    }
  }, [selectedSubcategory, currentStep]);

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
      const res = await get("/subcategory/all");
      if (res?.status === 200) {
        const allList = res.data?.data || res.data || [];
        const filteredList = allList.filter((sub: any) => sub.categoryId === categoryId);
        setSubcategories(
          filteredList.map((sub: any) => ({
            id: sub.id,
            name: sub.name,
            division_type: sub.division_type || [],
          }))
        );

        setSelectedSubcategory(null);
        setData((d) => ({ ...d, subcategoryId: "" }));
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
    const newData = {
      ...data,
      divisionId: division.value,
    };
    setData(newData);
    // Automatic navigation after selecting division
    handleViewItems(newData, divisions);
  };

  const handleChangeSubCategory = async (sub: any) => {
    setSelectedSubcategory(sub);
    setData((prev) => ({
      ...prev,
      subcategoryId: sub?.id,
      divisionId: "",
    }));

    setLoadingDivisions(true);
    try {
      const res = await get(`${Api.DivisionBySubcategory}?subCategoryId=${sub.id}`);
      const divData = res?.data?.data || res?.data || [];
      const fetchedDivisions = Array.isArray(divData) ? divData : [];
      setDivisions(fetchedDivisions);

      if (fetchedDivisions.length > 0) {
        setCurrentStep('division');
      } else {
        // Automatic navigation if no divisions found
        handleViewItems({ subcategoryId: sub.id, divisionId: "" }, [], sub.name);
      }
    } catch (err) {
      console.error("Failed to fetch divisions", err);
      handleViewItems({ subcategoryId: sub.id, divisionId: "" }, [], sub.name);
    } finally {
      setLoadingDivisions(false);
    }
  };

  const handleViewItems = (currentData?: any, currentDivisions?: any[], currentSubName?: string) => {
    const finalData = currentData || data;
    const finalDivisions = currentDivisions || divisions;

    if (!finalData.subcategoryId) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please select a subcategory",
      });
      return;
    }

    handleClose();

    // Navigate to product listing with params
    const selectedDivision = finalData.divisionId
      ? finalDivisions.find((d: any) => d.value === finalData.divisionId)
      : null;

    router.push({
      pathname: "/products" as any,
      params: {
        subcategoryId: finalData.subcategoryId,
        subcategoryName: currentSubName || selectedSubcategory?.name || categoryName,
        divisionTypes: JSON.stringify(finalDivisions),
        selectedDivision: selectedDivision ? JSON.stringify(selectedDivision) : "",
      },
    });
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <View
        className="flex-1 justify-end"
        style={{ zIndex: 10000 }}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { opacity: fadeAnim }
          ]}
        >
          <TouchableOpacity
            className="flex-1"
            style={{ flex: 1 }}
            onPress={handleClose}
            activeOpacity={1}
          >
            <BlurView
              intensity={70}
              tint="dark"
              style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
            />
          </TouchableOpacity>
        </Animated.View>
        <Animated.View
          className="rounded-t-[25px] w-full overflow-hidden"
          style={{
            maxHeight: '75%',
            zIndex: 10001,
            marginBottom: 0,
            paddingBottom: 0,
            backgroundColor: 'white',
            transform: [
              { translateY: Animated.add(slideAnim, panY) },
              { scale: scaleAnim }
            ]
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
            className="px-6 pb-6 border-b flex-row items-center justify-between"
            style={{
              borderColor: colors.border_primary,
            }}
          >
            {currentStep === 'division' ? (
              <TouchableOpacity
                onPress={() => setCurrentStep('subcategory')}
                className="p-2 -ml-2"
              >
                <Ionicons name="arrow-back" size={24} color={colors.text_primary} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}

            <Text
              className="text-xl font-bold flex-1 text-center"
              style={{ color: colors.text_primary }}
            >
              {currentStep === 'subcategory'
                ? (categoryName || category?.name || "Category")
                : (selectedSubcategory?.name || "Select Type")
              }
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
            style={{ backgroundColor: '#FFFFFF' }}
          >
            {loading ? (
              <View className="py-12 justify-center items-center">
                <ActivityIndicator size="large" color={colors.primary} />
                <Text className="mt-4" style={{ color: colors.text_secondary }}>
                  Loading...
                </Text>
              </View>
            ) : error ? (
              <View className="py-12 justify-center items-center px-6">
                <Text style={{ color: colors.error }}>{error}</Text>
              </View>
            ) : currentStep === 'subcategory' ? (
              <View className="p-4 pb-3">
                <View className="flex-row flex-wrap gap-3 justify-between px-2">
                  {subcategories.map((sub) => {
                    const isSelected = selectedSubcategory?.id === sub.id;
                    const iconData = subCategoryIcons[sub.name];
                    const IconLib = iconData?.lib || Ionicons;
                    const iconName = iconData?.name || "grid-outline";

                    const isSingleGrid = subcategories.length <= 5;

                    return (
                      <TouchableOpacity
                        key={sub.id}
                        onPress={() => handleChangeSubCategory(sub)}
                        className={`${isSingleGrid ? "w-full px-4 py-4" : "w-[48%] px-3 py-3.5"} rounded-2xl border flex-row items-center mb-1`}
                        style={{
                          backgroundColor: '#EBF3FF',
                          borderColor: isSelected ? '#5B4EB3' : 'transparent',
                          borderWidth: isSelected ? 2 : 1,
                        }}
                      >
                        <View className="mr-2.5">
                          {/* need to change on future */}
                          <IconLib name={iconName} size={20} color="#5B4EB3" />
                        </View>
                        <Text
                          className="text-xs font-bold flex-1"
                          style={{ color: '#2D3436' }}
                          numberOfLines={1}
                        >
                          {sub.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : (
              <View className="p-4 pt-3">
                <View className="flex-row flex-wrap gap-3 justify-between px-2">
                  {loadingDivisions ? (
                    <View className="flex-1 py-12 items-center">
                      <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                  ) : divisions?.length > 0 ? (
                    divisions.map((d: any) => {
                      const isSelected = data.divisionId === d.value;
                      return (
                        <TouchableOpacity
                          key={d.value}
                          onPress={() => handleSelectDivision(d)}
                          className="w-full px-5 py-4 rounded-2xl border flex-row items-center mb-3 shadow-sm"
                          style={{
                            backgroundColor: isSelected ? '#F5F3FF' : '#FFFFFF',
                            borderColor: isSelected ? '#5B4EB3' : '#E5E7EB',
                            borderWidth: isSelected ? 2 : 1,
                          }}
                        >
                          <Text
                            className="text-sm font-bold flex-1"
                            style={{ color: isSelected ? '#5B4EB3' : '#2D3436' }}
                            numberOfLines={1}
                          >
                            {d.label}
                          </Text>
                          <Ionicons
                            name="chevron-forward"
                            size={18}
                            color={isSelected ? '#5B4EB3' : '#9CA3AF'}
                            style={{ opacity: 0.8 }}
                          />
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <View className="flex-1 py-12 items-center">
                      <Text
                        className="italic"
                        style={{ color: colors.text_tertiary }}
                      >
                        No types available
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default ClassifiedShowCard;