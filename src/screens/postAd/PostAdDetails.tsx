import LocationPicker from "@/src/components/LocationPicker";
import { post } from "@/src/services/api";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

// Hooks
import { GENERATION_STEPS, usePostAdAI } from "../../hooks/usePostAdAI";
import { usePostAdData } from "../../hooks/usePostAdData";
import { useUserLocation } from "../../hooks/useUserLocation";

// Components
import { PostAdApi } from "./Api";
import AISuggestedTag from "./components/AISuggestedTag";
import EditableRow from "./components/EditableRow";
import ImagePreviewCard from "./components/ImagePreviewCard";
import PostAdSkeleton from "./components/PostAdSkeleton";
import SelectRow from "./components/SelectRow";
import SuccessModal from "./components/SuccessModal";

/* -------------------------------------------------------------------------- */
/*                           MAIN SCREEN COMPONENT                            */
/* -------------------------------------------------------------------------- */
const PostAdDetails = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  /* --- INITIAL PARAMS --- */
  const initialDescription = params.description as string;
  const initialImages = useMemo(() => {
    try {
      return params.images
        ? (JSON.parse(params.images as string) as string[])
        : [];
    } catch (e) {
      if (__DEV__) console.warn("Failed to parse images param", e);
      return [];
    }
  }, [params.images]);

  /* --- CUSTOM HOOKS --- */
  const {
    coordinates,
    place,
    updateLocation,
    useCurrentLocation,
    getPlaceName,
    getCoordinatesFromName,
  } = useUserLocation();

  const {
    generationStep,
    isFormLoading,
    data,
    setData,
    questions,
    specMetadata,
    fetchPreview,
    normalizeFieldKey,
  } = usePostAdAI();

  const {
    categories,
    subcategories,
    divisions,
    isLoadingSubcategories,
    isLoadingDivisions,
  } = usePostAdData(data.categoryId, data.subcategoryId);

  /* --- LOCAL UI STATES --- */
  const [clicked, setClicked] = useState(false);
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [questionAnswers, setQuestionAnswers] = useState<any>({});

  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const hasInitialized = React.useRef(false);

  /* --- INITIALIZATION --- */
  useEffect(() => {
    if (
      !initialDescription ||
      initialImages.length === 0 ||
      hasInitialized.current
    )
      return;
    hasInitialized.current = true;
    fetchPreview(initialDescription, initialImages);
  }, [initialDescription, initialImages]);

  /* --- MEMOIZED NAMES --- */
  const categoryName = useMemo(() => {
    if (!data?.categoryId || categories.length === 0) {
      return data?.category?.name || data?.category?.label || "";
    }
    const cat = categories.find(
      (c) => (c.id || c._id || c.value) === data.categoryId,
    );
    return cat?.name || cat?.label || data?.category?.name || "";
  }, [categories, data.categoryId, data?.category]);

  const subcategoryName = useMemo(() => {
    if (!data?.subcategoryId || subcategories.length === 0) {
      return data?.subcategory?.name || data?.subcategory?.label || "";
    }
    const sub = subcategories.find(
      (s) => (s.id || s._id || s.value) === data.subcategoryId,
    );
    return sub?.name || sub?.label || data?.subcategory?.name || "";
  }, [subcategories, data.subcategoryId, data?.subcategory]);

  const hasValidSpecs = useMemo(() => {
    if (!data?.specs) return false;
    return Object.values(data.specs).some(
      (v) => v !== null && v !== "" && v !== undefined,
    );
  }, [data.specs]);
  // Auto-map string division to ID if possible
  useEffect(() => {
    if (
      divisions.length > 0 &&
      data.division &&
      typeof data.division === "string" &&
      !data.divisionId
    ) {
      const match = divisions.find(
        (d) =>
          d.name?.toLowerCase() === (data.division as string).toLowerCase() ||
          d.label?.toLowerCase() === (data.division as string).toLowerCase(),
      );
      if (match) {
        setData((prev: any) => ({
          ...prev,
          division: match,
          divisionId: match.id || match._id || match.value,
        }));
      }
    }
  }, [divisions, data.division, data.divisionId]);

  /* --- SUBMISSION LOGIC --- */
  const handleSubmit = async () => {
    if (clicked) return;
    setClicked(true);

    if (
      !coordinates ||
      typeof coordinates.lat !== "number" ||
      typeof coordinates.lon !== "number" ||
      coordinates.lat === 0
    ) {
      Toast.show({
        type: "info",
        text1: "Location Required",
        text2: "Requesting location permission...",
      });
      try {
        useCurrentLocation();
      } catch (err) {
        console.error("Failed to request location", err);
      }
      Toast.show({
        type: "error",
        text1: "Location not found",
        text2: "Please enable location and try again",
      });
      setClicked(false);
      return;
    }

    try {
      const rawPrice = Number(data.price);
      const normalizedPrice = isNaN(rawPrice) ? 0 : rawPrice;

      const formattedSpecs: any = {};

      if (data.specs) {
        Object.entries(data.specs).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") {
            formattedSpecs[k] = { value: v, label: specMetadata[k]?.name || k };
          }
        });
      }

      Object.entries(questionAnswers).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
          const meta = specMetadata[k];
          const q = questions.find((q) => {
            const qKey =
              q.key ||
              q.slug ||
              normalizeFieldKey(q.field || q.label || "question");
            return qKey === k;
          });
          formattedSpecs[k] = {
            value: v,
            label: meta?.name || q?.label || q?.field || k,
          };
        }
      });

      const payload = {
        ...data,
        categoryId: data.categoryId || data.category?.id || data.category?._id,
        subcategoryId:
          data.subcategoryId || data.subcategory?.id || data.subcategory?._id,
        divisionId: data.divisionId || data.division?.id || data.division?._id,
        category: undefined,
        subcategory: undefined,
        division: undefined,
        price: normalizedPrice,
        specs: formattedSpecs,
        negotiate: isNegotiable,
        description: data.enhancedDescription,
        location: {
          type: "Point",
          coordinates: [coordinates.lon, coordinates.lat],
        },
        images: (data.images?.length ?? 0) > 0 ? data.images : initialImages,
      };

      const res = await post(PostAdApi.createProduct, payload);

      if (res.status === 200 || res.status === 201) {
        const productId = res.data?.data?.id || res.data?.id || res.data?._id;
        setCreatedProductId(productId);
        setShowSuccessModal(true);
      } else {
        let errorMsg = res.message || "Failed to submit";
        if (res.data && typeof res.data === "object") {
          const details = res.data.message || res.data.errors || res.data;
          if (typeof details === "string") {
            errorMsg = details;
          } else if (Array.isArray(details)) {
            errorMsg = details
              .map((e: any) => e.msg || e.message || JSON.stringify(e))
              .join("\n");
          }
        }
        Toast.show({
          type: "error",
          text1: "Validation Error",
          text2: errorMsg,
        });
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to submit ad",
      });
    } finally {
      setClicked(false);
    }
  };

  return (
    <SafeAreaView
      className="flex-1"
      edges={["top"]}
    >
      <LinearGradient
        colors={["#f7e2fbff", "#d8ecf9ff", "#d7d1f3ff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View className="px-5 py-4 flex-row items-center border-b border-white/50 bg-white/50 backdrop-blur-md">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center bg-white rounded-full shadow-sm"
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#000"
            />
          </TouchableOpacity>
          <Text className="text-xl font-black text-gray-900 flex-1 text-center mr-10">
            Sell with AI
          </Text>
        </View>

        <ScrollView
          className="flex-1 px-5 pt-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <ImagePreviewCard
            isLoading={generationStep === GENERATION_STEPS.PREVIEW}
            imageUri={initialImages[0]}
            categoryName={categoryName}
            subcategoryName={subcategoryName}
            title={data.title}
            description={data.enhancedDescription}
          />

          {/* Basic Info */}
          <View className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 mb-3">
            <AISuggestedTag />
            <Text className="text-xl font-bold text-gray-900 mb-5">
              Basic Information
            </Text>
            {generationStep < GENERATION_STEPS.BASIC_FORM ? (
              <>
                <PostAdSkeleton className="h-12 w-full rounded-xl mb-3" />
                <PostAdSkeleton className="h-12 w-full rounded-xl mb-3" />
                <PostAdSkeleton className="h-12 w-full rounded-xl mb-3" />
              </>
            ) : (
              <>
                <EditableRow
                  label="Title"
                  value={data.title}
                  onChange={(val: string) =>
                    setData((prev) => ({ ...prev, title: val }))
                  }
                />
                <SelectRow
                  label="Category"
                  value={categoryName}
                  options={categories}
                  onSelect={(opt: any) => {
                    const catId = opt.id || opt._id || opt.value;
                    setData((prev) => ({
                      ...prev,
                      categoryId: catId,
                      category: opt,
                      subcategoryId: undefined,
                      subcategory: undefined,
                    }));
                  }}
                />
                <SelectRow
                  label="Subcategory"
                  value={subcategoryName}
                  options={subcategories}
                  isLoading={isLoadingSubcategories}
                  onSelect={(opt: any) => {
                    setData((prev) => ({
                      ...prev,
                      subcategoryId: opt.id || opt._id,
                      subcategory: opt,
                      divisionId: undefined,
                      division: undefined,
                    }));
                  }}
                />
              </>
            )}
          </View>

          {/* Specs */}
          {generationStep >= GENERATION_STEPS.BASIC_FORM &&
            (generationStep < GENERATION_STEPS.SPECS_FORM ||
              hasValidSpecs ||
              divisions.length > 0 ||
              !!data.division) && (
              <View className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 mb-3">
                <AISuggestedTag />
                <Text className="text-xl font-bold text-gray-900 mb-5">
                  Specifications
                </Text>
                {generationStep < GENERATION_STEPS.SPECS_FORM ? (
                  <>
                    <PostAdSkeleton className="h-12 w-full rounded-xl mb-3" />
                    <PostAdSkeleton className="h-12 w-full rounded-xl mb-3" />
                  </>
                ) : (
                  <>
                    {data.division && divisions.length === 0 && (
                      <View className="mb-4">
                        <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-wider mb-1.5 ml-1 capitalize">
                          Division
                        </Text>
                        <View className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5">
                          <Text className="text-gray-900 text-sm font-medium">
                            {typeof data.division === "string"
                              ? data.division
                              : data.division.name ||
                                data.division.label ||
                                "Selected"}
                          </Text>
                        </View>
                      </View>
                    )}

                    {data.specs &&
                      Object.entries(data.specs as Record<string, any>)
                        .filter(([_, val]) => {
                          const strVal = String(val ?? "")
                            .trim()
                            .toLowerCase();
                          return (
                            strVal &&
                            strVal !== "null" &&
                            strVal !== "undefined"
                          );
                        })
                        .map(([key, val]) => {
                          const meta = specMetadata[key];
                          const label =
                            meta?.name || meta?.label || key.replace(/_/g, " ");
                          const dataType = meta?.dataType;

                          let options = (meta?.options || []).map(
                            (opt: any) => ({
                              label:
                                typeof opt === "string"
                                  ? opt
                                  : opt.name || opt.label,
                              value:
                                typeof opt === "string"
                                  ? opt
                                  : opt.id ||
                                    opt._id ||
                                    opt.value ||
                                    opt.name ||
                                    opt.label,
                            }),
                          );

                          // Fallback for boolean if no options provided
                          if (dataType === "boolean" && options.length === 0) {
                            options = [
                              { label: "Yes", value: "Yes" },
                              { label: "No", value: "No" },
                            ];
                          }

                          const isBinary =
                            dataType === "boolean" ||
                            (options.length === 2 &&
                              options.some((o: any) =>
                                ["yes", "no", "true", "false"].includes(
                                  String(o.label || o.value).toLowerCase(),
                                ),
                              ));

                          if (isBinary) {
                            const isSelected = (optValue: string) => {
                              const currentVal = String(val).toLowerCase();
                              const targetVal = String(optValue).toLowerCase();
                              return (
                                currentVal === targetVal ||
                                (currentVal === "true" &&
                                  targetVal === "yes") ||
                                (currentVal === "false" && targetVal === "no")
                              );
                            };

                            return (
                              <View
                                key={key}
                                className="mb-6"
                              >
                                <Text className="text-gray-800 text-sm font-bold mb-3 ml-1 leading-5">
                                  {label}
                                </Text>
                                <View
                                  className="flex-row items-center flex-wrap"
                                  style={{ gap: 24 }}
                                >
                                  {options.map((opt: any) => (
                                    <TouchableOpacity
                                      key={opt.value}
                                      onPress={() => {
                                        setData((prev) => ({
                                          ...prev,
                                          specs: {
                                            ...prev.specs,
                                            [key]: opt.value,
                                          },
                                        }));
                                      }}
                                      className="flex-row items-center py-1 pr-4"
                                    >
                                      <View
                                        style={{
                                          width: 20,
                                          height: 20,
                                          borderRadius: 10,
                                          borderWidth: 2,
                                          borderColor: isSelected(opt.value)
                                            ? "#000"
                                            : "#D1D5DB",
                                          justifyContent: "center",
                                          alignItems: "center",
                                          marginRight: 8,
                                        }}
                                      >
                                        {isSelected(opt.value) && (
                                          <View
                                            style={{
                                              width: 10,
                                              height: 10,
                                              borderRadius: 5,
                                              backgroundColor: "#000",
                                            }}
                                          />
                                        )}
                                      </View>
                                      <Text
                                        className={`text-sm ${
                                          isSelected(opt.value)
                                            ? "text-black font-bold"
                                            : "text-gray-600 font-medium"
                                        }`}
                                      >
                                        {opt.label}
                                      </Text>
                                    </TouchableOpacity>
                                  ))}
                                </View>
                              </View>
                            );
                          }

                          if (dataType === "select") {
                            return (
                              <SelectRow
                                key={key}
                                label={label}
                                value={
                                  options.find((o: any) => o.value === val)
                                    ?.label || val
                                }
                                options={options}
                                onSelect={(opt: any) => {
                                  setData((prev) => ({
                                    ...prev,
                                    specs: {
                                      ...prev.specs,
                                      [key]:
                                        opt.id || opt._id || opt.value || opt,
                                    },
                                  }));
                                }}
                              />
                            );
                          }

                          return (
                            <EditableRow
                              key={key}
                              label={label}
                              value={val}
                              onChange={(text: string) =>
                                setData((prev) => ({
                                  ...prev,
                                  specs: { ...prev.specs, [key]: text },
                                }))
                              }
                            />
                          );
                        })}

                    {(!data.division || divisions.length > 0) && (
                      <SelectRow
                        label="Division / Type"
                        value={data.division?.name || data.division?.label}
                        options={divisions}
                        isLoading={isLoadingDivisions}
                        onSelect={(opt: any) => {
                          setData((prev) => ({
                            ...prev,
                            divisionId: opt.id || opt._id || opt.value,
                            division: opt,
                          }));
                        }}
                      />
                    )}
                  </>
                )}
              </View>
            )}

          {/* Questions */}
          {(generationStep < GENERATION_STEPS.DONE || questions.length > 0) &&
            generationStep >= GENERATION_STEPS.SPECS_FORM && (
              <View className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 mb-3">
                <AISuggestedTag />
                <Text className="text-xl font-bold text-gray-900 mb-5">
                  Helpful Details
                </Text>
                {generationStep < GENERATION_STEPS.DONE ? (
                  <>
                    <PostAdSkeleton className="h-20 w-full rounded-xl mb-3" />
                    <PostAdSkeleton className="h-20 w-full rounded-xl mb-3" />
                  </>
                ) : (
                  questions.map((q, idx) => {
                    const fieldKey =
                      q.key ||
                      q.slug ||
                      normalizeFieldKey(q.field || q.label || "question");

                    const meta = specMetadata[fieldKey];
                    const dataType = meta?.dataType;

                    // Support Boolean by providing Yes/No options
                    let options: string[] = [];
                    if (dataType === "boolean") {
                      options = ["Yes", "No"];
                    } else {
                      const rawOptions = q.options || meta?.options || [];
                      options = rawOptions
                        .map((opt: any) =>
                          typeof opt === "string" ? opt : opt.name || opt.label,
                        )
                        .filter((o: any) => !!o && String(o).trim().length > 0);
                    }

                    const isSelected = (opt: string) => {
                      const current = questionAnswers[fieldKey];
                      return (
                        current === opt ||
                        meta?.options?.find(
                          (o: any) => (o.id || o._id) === current,
                        )?.name === opt
                      );
                    };

                    const handleSelect = (opt: string) => {
                      setQuestionAnswers((prev: any) => {
                        const newState = { ...prev };
                        if (isSelected(opt)) {
                          delete newState[fieldKey];
                        } else {
                          // Try to find the original ID if it's a select spec
                          const originalOpt = meta?.options?.find(
                            (o: any) => o.name === opt || o.label === opt,
                          );
                          newState[fieldKey] = originalOpt
                            ? originalOpt.id || originalOpt._id
                            : opt;
                        }
                        return newState;
                      });
                    };

                    return (
                      <View
                        key={idx}
                        className="mb-6"
                      >
                        <Text className="text-gray-800 text-sm font-bold mb-3 ml-1 leading-5">
                          {q.question ||
                            q.label ||
                            q.field ||
                            `About the ${meta?.name || fieldKey}`}
                        </Text>

                        {options.length > 0 ? (
                          <View className="flex-row flex-wrap gap-2">
                            {options.map((opt: string) => (
                              <TouchableOpacity
                                key={opt}
                                onPress={() => handleSelect(opt)}
                                style={{
                                  paddingHorizontal: 16,
                                  paddingVertical: 10,
                                  borderRadius: 16,
                                  borderWidth: 1.5,
                                  borderColor: isSelected(opt)
                                    ? "#000"
                                    : "#E5E7EB",
                                  backgroundColor: isSelected(opt)
                                    ? "#000"
                                    : "#fff",
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 12,
                                    fontWeight: isSelected(opt) ? "700" : "500",
                                    color: isSelected(opt) ? "#fff" : "#4B5563",
                                  }}
                                >
                                  {opt}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        ) : (
                          <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4 h-14 justify-center shadow-inner shadow-gray-100/50">
                            <TextInput
                              value={questionAnswers[fieldKey] || ""}
                              onChangeText={(text) =>
                                setQuestionAnswers((prev: any) => ({
                                  ...prev,
                                  [fieldKey]: text,
                                }))
                              }
                              placeholder="Type your answer..."
                              placeholderTextColor="#9CA3AF"
                              keyboardType={
                                meta?.dataType === "number" ||
                                q.dataType === "number"
                                  ? "numeric"
                                  : "default"
                              }
                              className="text-gray-900 text-sm font-medium w-full h-full"
                            />
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </View>
            )}

          {/* Final Sections */}
          {generationStep === GENERATION_STEPS.DONE && (
            <>
              <View className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 mb-3">
                <Text className="text-xl font-bold text-gray-900 mb-5">
                  Set Price
                </Text>
                <View className="bg-gray-50 border border-gray-100 rounded-[6px] px-4 flex-row items-center">
                  <Text className="text-gray-400 font-bold mr-2">AED</Text>
                  <TextInput
                    placeholder="0"
                    keyboardType="numeric"
                    value={data.price?.toString()}
                    onChangeText={(v) =>
                      setData((prev) => ({ ...prev, price: v }))
                    }
                    className="flex-1 text-2xl font-black text-gray-900"
                  />
                </View>
                <TouchableOpacity
                  onPress={() => setIsNegotiable((prev) => !prev)}
                  className="flex-row items-center mt-6 ml-2"
                >
                  <View
                    className={`w-6 h-6 rounded-lg border-2 items-center justify-center mr-3 ${isNegotiable ? "bg-green-500 border-green-500" : "border-gray-200"}`}
                  >
                    {isNegotiable && (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color="white"
                      />
                    )}
                  </View>
                  <Text className="text-gray-700 font-bold text-sm">
                    Allow Price Negotiation
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 mb-3">
                <Text className="text-xl font-bold text-gray-900 mb-5">
                  Location
                </Text>
                <View className="mb-4">
                  <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-wider mb-1.5 ml-1">
                    Current Location
                  </Text>
                  <TouchableOpacity
                    onPress={() => setLocationPickerVisible(true)}
                    className="bg-white border border-gray-100 rounded-2xl px-4 h-12 flex-row justify-between items-center shadow-sm shadow-gray-100"
                  >
                    <View className="flex-row items-center flex-1 mr-2">
                      <Ionicons
                        name="location-sharp"
                        size={18}
                        color="#A855F7"
                      />
                      <Text
                        numberOfLines={1}
                        className="text-gray-900 text-sm font-medium ml-2 flex-1"
                      >
                        {place || "Select Location"}
                      </Text>
                    </View>
                    <Text className="text-purple-600 text-xs font-bold">
                      Change
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 mb-10">
                <AISuggestedTag />
                <Text className="text-xl font-bold text-gray-900 mb-5">
                  Final Description
                </Text>
                <View className="bg-gray-50 border border-gray-100 rounded-3xl p-5">
                  <TextInput
                    multiline
                    value={data.enhancedDescription}
                    onChangeText={(v) =>
                      setData((prev) => ({ ...prev, enhancedDescription: v }))
                    }
                    className="text-sm text-gray-800 leading-5"
                    textAlignVertical="top"
                    placeholder="Review the AI enhanced description..."
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={clicked || isFormLoading || !data.title}
                className={`rounded-2xl py-4 items-center justify-center flex-row shadow-sm ${
                  clicked || isFormLoading || !data.title
                    ? "bg-gray-100 border border-gray-200"
                    : "bg-black shadow-lg shadow-purple-500/20"
                }`}
              >
                {clicked ? (
                  <ActivityIndicator color="#A855F7" />
                ) : (
                  <>
                    <View
                      className={`mr-2 ${clicked || isFormLoading || !data.title ? "opacity-50" : ""}`}
                    >
                      <Ionicons
                        name="sparkles"
                        size={18}
                        color={
                          clicked || isFormLoading || !data.title
                            ? "#9CA3AF"
                            : "#A855F7"
                        }
                      />
                    </View>
                    <Text
                      className={`font-bold text-base ${clicked || isFormLoading || !data.title ? "text-gray-400" : "text-white"}`}
                    >
                      Post Ad Now
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </LinearGradient>

      <LocationPicker
        visible={locationPickerVisible}
        onClose={() => setLocationPickerVisible(false)}
        currentLocation={{
          coordinates: {
            lat: coordinates?.lat || 0,
            lon: coordinates?.lon || 0,
          },
          place: place || "Your location",
        }}
        onSelectLocation={updateLocation}
        onUseCurrentLocation={useCurrentLocation}
        getPlaceName={getPlaceName}
        getCoordinatesFromName={getCoordinatesFromName}
      />

      <SuccessModal
        visible={showSuccessModal}
        onDone={() => {
          setShowSuccessModal(false);
          if (createdProductId) {
            router.replace({
              pathname: "/product/[id]",
              params: { id: createdProductId },
            } as any);
          } else {
            router.replace("/home");
          }
        }}
      />
    </SafeAreaView>
  );
};

export default PostAdDetails;
