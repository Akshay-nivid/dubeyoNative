import LocationPicker from "@/src/components/LocationPicker";
import { post } from "@/src/services/api";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState, useRef } from "react";
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
/*                              PURE HELPERS                                  */
/* -------------------------------------------------------------------------- */

/** Builds the specs payload combining data.specs + questionAnswers, tagged with metadata labels. */
const buildSpecsPayload = (
  specs: Record<string, any> | undefined,
  questionAnswers: Record<string, any>,
  specMetadata: Record<string, any>,
  questions: any[],
  normalizeFieldKey: (s: string) => string,
): Record<string, { value: any; label: string }> => {
  const formattedSpecs: Record<string, { value: any; label: string }> = {};

  if (specs) {
    Object.entries(specs).forEach(([k, v]) => {
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

  return formattedSpecs;
};

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
    imageKeys,
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

  /**
   * Computes the spec items and groups them into rows for the 2‑column grid.
   * Binary (Yes/No) items always get their own full-width row.
   * Moved out of the render block into a useMemo to avoid heavy re-computation on every render.
   */
  const specsGridGroups = useMemo(() => {
    const items: any[] = [];

    // Collect spec items
    if (data.specs) {
      Object.entries(data.specs as Record<string, any>).forEach(([key, val]) => {
        const strVal = String(val ?? "").trim();
        const lowerVal = strVal.toLowerCase();
        if (!strVal || lowerVal === "null" || lowerVal === "undefined") return;

        const meta = specMetadata[key];
        const dataType = meta?.dataType;

        const rawMetaOptions = Array.isArray(meta?.options) ? meta.options : [];
        const options = rawMetaOptions
          .filter((opt: any) => opt != null)
          .map((opt: any) => {
            if (typeof opt === "string") return { label: opt, value: opt };
            return {
              label: opt.name || opt.label || String(opt),
              value: opt.id || opt._id || opt.value || opt.name || opt.label || String(opt),
            };
          });

        if (dataType === "boolean" && options.length === 0) {
          options.push({ label: "Yes", value: "Yes" }, { label: "No", value: "No" });
        }

        const isBinary =
          dataType === "boolean" ||
          (options.length === 2 &&
            options.some((o: any) =>
              ["yes", "no", "true", "false"].includes(
                String(o.label || o.value).toLowerCase(),
              ),
            ));

        items.push({
          key,
          val,
          meta,
          options,
          isBinary,
          dataType,
          label: meta?.name || meta?.label || key.replace(/_/g, " "),
          type: "spec",
        });
      });
    }

    // Collect division item
    if (data.division) {
      items.push({
        key: "division",
        label: "Division / Type",
        val: data.division,
        type: "division",
        isBinary: false,
        options: divisions.map((d) => ({
          label: d.name || d.label,
          value: d.id || d._id || d.value,
        })),
      });
    }

    // Group into rows: binary items → full-width row; others → pair into 2-col rows
    const groups: any[][] = [];
    let currentGroup: any[] = [];

    items.forEach((item) => {
      if (item.isBinary) {
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
          currentGroup = [];
        }
        groups.push([item]);
      } else {
        currentGroup.push(item);
        if (currentGroup.length === 2) {
          groups.push(currentGroup);
          currentGroup = [];
        }
      }
    });
    if (currentGroup.length > 0) groups.push(currentGroup);

    return groups;
  }, [data.specs, data.division, specMetadata, divisions]);

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

  /* --- IMAGE HELPERS --- */
  // Derived image list: latest data.images, falling back to initialImages from params
  const currentImages: string[] = (data.images?.length ?? 0) > 0
    ? (data.images as string[])
    : (initialImages || []);

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

      // Use the extracted helper — no inline business logic in the component
      const formattedSpecs = buildSpecsPayload(
        data.specs,
        questionAnswers,
        specMetadata,
        questions,
        normalizeFieldKey,
      );

      // Prefer server-side imageKeys (from upload in hook) over raw local URIs.
      // Fall back to data.images then initialImages for robustness.
      const submissionImages =
        imageKeys.length > 0
          ? imageKeys
          : (data.images?.length ?? 0) > 0
            ? data.images
            : initialImages;

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
        images: submissionImages,
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
        colors={["#FFFFFF", "#F3F0FF", "#E9E0FF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View className="px-5 py-4 flex-row items-center justify-between border-b border-gray-100 bg-white">
          <View className="flex-row items-center flex-1 pr-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center bg-white border border-gray-200 rounded-full mr-4"
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color="#000"
              />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setLocationPickerVisible(true)}
              className="flex-1 justify-center"
            >
              <Text
                style={{
                  fontFamily: "DM Serif Display",
                  fontSize: 15,
                  fontWeight: "400",
                  color: "#333333",
                  lineHeight: 20,
                  marginBottom: 2,
                }}
              >
                Ad Details
              </Text>
              <View className="flex-row items-center">
                {place ? (
                  <Text
                    className="text-[14px] text-gray-500 font-medium"
                    numberOfLines={1}
                    style={{ maxWidth: 180 }}
                  >
                    {place}
                  </Text>
                ) : (
                  <Text className="text-[14px] text-gray-400 font-medium">
                    Select location
                  </Text>
                )}
                <Ionicons
                  name="chevron-down"
                  size={14}
                  color="#6366F1"
                  style={{ marginLeft: 4 }}
                />
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={clicked || isFormLoading || !data.title}
            className={`px-6 py-2.5 rounded-[24px] ${clicked || isFormLoading || !data.title
                ? "bg-gray-100"
                : "bg-[#1A1A1A]"
              }`}
          >
            {clicked ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className={`font-bold text-[15px] ${clicked || isFormLoading || !data.title ? "text-gray-400" : "text-white"}`}>
                Post
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1 px-5 pt-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Image Grid — managed by ImagePreviewCard */}
          <ImagePreviewCard
            images={currentImages}
            initialImages={initialImages}
            onChange={(newImages) =>
              setData((prev: any) => ({ ...prev, images: newImages }))
            }
          />

          {/* Basic Details Section */}
          <View className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 mb-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text 
                style={{ fontFamily: "DM Serif Display" }}
                className="text-xl text-gray-900"
              >
                Basic Details
              </Text>
              <AISuggestedTag />
            </View>
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
                <View className="flex-row justify-between w-full">
                  <SelectRow
                    label="Category"
                    value={categoryName}
                    options={categories}
                    containerStyle={{ width: "48%" }}
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
                    label="Sub Category"
                    value={subcategoryName}
                    options={subcategories}
                    isLoading={isLoadingSubcategories}
                    containerStyle={{ width: "48%" }}
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
                </View>
              </>
            )}
          </View>

          {/* Specifications Section */}
          {generationStep >= GENERATION_STEPS.BASIC_FORM &&
            (generationStep < GENERATION_STEPS.SPECS_FORM ||
              hasValidSpecs ||
              divisions.length > 0 ||
              !!data.division) && (
              <View className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 mb-6">
                <View className="flex-row justify-between items-center mb-6">
                  <Text 
                    style={{ fontFamily: "DM Serif Display" }}
                    className="text-xl text-gray-900"
                  >
                    Specifications
                  </Text>
                  <AISuggestedTag />
                </View>
                {generationStep < GENERATION_STEPS.SPECS_FORM ? (
                  <>
                    <PostAdSkeleton className="h-12 w-full rounded-xl mb-3" />
                    <PostAdSkeleton className="h-12 w-full rounded-xl mb-3" />
                  </>
                ) : (
                  <>
                    {/* Specs Grid — computed via useMemo, not recalculated every render */}
                    <View>
                      {specsGridGroups.map((group, gIdx) => {
                        // Binary items always occupy a full-width solo row
                        if (group.length === 1 && group[0].isBinary) {
                          const item = group[0];
                          const itemValId =
                            item.val && typeof item.val === "object"
                              ? item.val.id || item.val._id || item.val.value
                              : item.val;

                          const isSelected = (optValue: string) => {
                            const cVal = String(itemValId ?? "").toLowerCase();
                            const tVal = String(optValue).toLowerCase();
                            return (
                              cVal === tVal ||
                              (cVal === "true" && tVal === "yes") ||
                              (cVal === "false" && tVal === "no")
                            );
                          };

                          return (
                            <View key={item.key} className="mb-5 w-full">
                              <Text className="text-gray-600 font-bold text-[13px] mb-2 ml-1">
                                {item.label}
                              </Text>
                              <View className="flex-row items-center bg-gray-50/50 border border-gray-100 rounded-[18px] p-1.5">
                                {(item.options || []).map((opt: any) => (
                                  <TouchableOpacity
                                    key={opt.value}
                                    onPress={() => {
                                      if (item.type === "division") {
                                        const fullOpt = Array.isArray(divisions)
                                          ? divisions.find((d) => (d.id || d._id || d.value) === opt.value)
                                          : null;
                                        setData((prev) => ({
                                          ...prev,
                                          division: fullOpt || opt.value,
                                          divisionId: opt.value,
                                        }));
                                      } else {
                                        setData((prev) => ({
                                          ...prev,
                                          specs: { ...prev.specs, [item.key]: opt.value },
                                        }));
                                      }
                                    }}
                                    className={`flex-1 flex-row items-center justify-center py-2 rounded-[14px] ${isSelected(opt.value) ? "bg-white shadow-sm" : ""}`}
                                  >
                                    <Text className={`text-sm ${isSelected(opt.value) ? "text-black font-bold" : "text-gray-400 font-medium"}`}>
                                      {opt.label}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </View>
                          );
                        }

                        // Non-binary: render as a 2-column flex-row
                        return (
                          <View key={gIdx} className="flex-row justify-between w-full">
                            {group.map((item) => {
                              const width = group.length === 1 ? "100%" : "48%";
                              const isSelect =
                                item.dataType === "select" || item.type === "division";
                              const itemValId =
                                item.val && typeof item.val === "object"
                                  ? item.val.id || item.val._id || item.val.value
                                  : item.val;

                              const hasValue =
                                !!itemValId &&
                                String(itemValId).toLowerCase() !== "null";

                              // Fixed: normalize division object display to name/label string
                              const displayValue = isSelect
                                ? item.options.find((o: any) => o.value === itemValId)?.label ||
                                  (typeof item.val === "object"
                                    ? item.val?.name || item.val?.label || ""
                                    : item.val)
                                : item.val;

                              if (isSelect && !hasValue && item.type === "division" && divisions.length > 0) {
                                return (
                                  <SelectRow
                                    key={item.key}
                                    label={item.label}
                                    value={displayValue || "Select"}
                                    options={divisions}
                                    isLoading={isLoadingDivisions}
                                    containerStyle={{ width }}
                                    onSelect={(opt: any) => {
                                      setData((prev) => ({
                                        ...prev,
                                        divisionId: opt.id || opt._id || opt.value,
                                        division: opt,
                                      }));
                                    }}
                                  />
                                );
                              }

                              if (isSelect && !hasValue && item.type === "spec") {
                                return (
                                  <SelectRow
                                    key={item.key}
                                    label={item.label}
                                    value={displayValue || "Select"}
                                    options={item.options || []}
                                    containerStyle={{ width }}
                                    onSelect={(opt: any) => {
                                      setData((prev) => ({
                                        ...prev,
                                        specs: {
                                          ...prev.specs,
                                          [item.key]: opt.id || opt._id || opt.value || opt,
                                        },
                                      }));
                                    }}
                                  />
                                );
                              }

                              // Default: editable text field
                              return (
                                <EditableRow
                                  key={item.key}
                                  label={item.label}
                                  value={displayValue}
                                  containerStyle={{ width }}
                                  onChange={(text: string) => {
                                    if (item.type === "division") {
                                      setData((prev) => ({
                                        ...prev,
                                        division: text,
                                        divisionId: text,
                                      }));
                                    } else {
                                      setData((prev) => ({
                                        ...prev,
                                        specs: { ...prev.specs, [item.key]: text },
                                      }));
                                    }
                                  }}
                                />
                              );
                            })}
                          </View>
                        );
                      })}
                    </View>
                  </>
                )}
              </View>
            )}

          {/* Helpful Details Section */}
          {(generationStep < GENERATION_STEPS.DONE || questions.length > 0) &&
            generationStep >= GENERATION_STEPS.SPECS_FORM && (
              <View className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 mb-6">
                <View className="flex-row justify-between items-center mb-6">
                  <Text 
                    style={{ fontFamily: "DM Serif Display" }}
                    className="text-xl text-gray-900"
                  >
                    Helpful Details
                  </Text>
                  <AISuggestedTag />
                </View>
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
                      const optionsArray = Array.isArray(rawOptions) ? rawOptions : [];
                      options = optionsArray
                        .map((opt: any) =>
                          typeof opt === "string" ? opt : opt.name || opt.label,
                        )
                        .filter((o: any) => !!o && String(o).trim().length > 0);
                    }

                    const questionLabel =
                      q.question ||
                      q.label ||
                      q.field ||
                      `About the ${meta?.name || fieldKey}`;

                    const isSelected = (opt: string) => {
                      const current = questionAnswers[fieldKey];
                      const metaOptions = Array.isArray(meta?.options) ? meta.options : [];
                      return (
                        current === opt ||
                        metaOptions.find(
                          (o: any) => o && (o.id || o._id) === current,
                        )?.name === opt
                      );
                    };

                    const handleSelect = (opt: string) => {
                      setQuestionAnswers((prev: any) => {
                        const newState = { ...prev };
                        if (isSelected(opt)) {
                          delete newState[fieldKey];
                        } else {
                          const metaOptions = Array.isArray(meta?.options) ? meta.options : [];
                          const originalOpt = metaOptions.find(
                            (o: any) => o && (o.name === opt || o.label === opt),
                          );
                          newState[fieldKey] = originalOpt
                            ? originalOpt.id || originalOpt._id
                            : opt;
                        }
                        return newState;
                      });
                    };

                    if (options.length > 0 && (dataType === "select" || (options.length > 3))) {
                      return (
                        <SelectRow
                          key={idx}
                          label={questionLabel}
                          value={
                            options.find((opt: string) => isSelected(opt)) ||
                            questionAnswers[fieldKey] ||
                            "Select Option"
                          }
                          options={options.map((opt) => ({
                            label: opt,
                            value: opt,
                          }))}
                          onSelect={(opt: any) =>
                            handleSelect(opt.id || opt._id || opt.value || opt)
                          }
                        />
                      );
                    }

                    return (
                      <View
                        key={idx}
                        className="mb-6"
                      >
                        <Text className="text-gray-600 font-bold text-[13px] mb-2 ml-1">
                          {questionLabel}
                        </Text>

                        {options.length > 0 ? (
                          <View className="flex-row items-center bg-gray-50/50 border border-gray-100 rounded-[18px] p-1.5">
                            {options.map((opt: string) => (
                              <TouchableOpacity
                                key={opt}
                                onPress={() => handleSelect(opt)}
                                className={`flex-1 flex-row items-center justify-center py-2.5 rounded-[14px] ${isSelected(opt) ? "bg-white shadow-sm" : ""}`}
                              >
                                <Text
                                  className={`text-sm ${isSelected(opt) ? "text-black font-bold" : "text-gray-400 font-medium"}`}
                                >
                                  {opt}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        ) : (
                          <View className="bg-gray-50/50 border border-gray-100 rounded-[18px] px-4 h-12 justify-center shadow-sm shadow-black/[0.02]">
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
                              className="text-gray-900 text-sm font-semibold w-full h-full"
                              style={{ paddingVertical: 0 }}
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
              <View className="h-[1px] bg-gray-200 w-full my-6" />
              <View className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 mb-6">
                <Text 
                  style={{ fontFamily: "DM Serif Display" }}
                  className="text-xl text-gray-900 mb-6"
                >
                  Set Price
                </Text>
                <View className="bg-gray-50/50 border border-gray-100 rounded-[18px] px-4 flex-row items-center h-16 shadow-sm shadow-black/[0.02]">
                  <View className="bg-white px-3 py-1.5 rounded-xl border border-gray-100 mr-3 shadow-sm">
                    <Text className="text-gray-900 font-bold text-xs">AED</Text>
                  </View>
                  <TextInput
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={data.price?.toString()}
                    onChangeText={(v) =>
                      setData((prev) => ({ ...prev, price: v }))
                    }
                    className="flex-1 text-2xl font-black text-gray-900"
                    placeholderTextColor="#D1D5DB"
                  />
                </View>
                <TouchableOpacity
                  onPress={() => setIsNegotiable((prev) => !prev)}
                  className="flex-row items-center mt-6 ml-1"
                  activeOpacity={0.7}
                >
                  <View
                    className={`w-6 h-6 rounded-lg border-2 items-center justify-center mr-3 ${isNegotiable ? "bg-indigo-600 border-indigo-600" : "bg-gray-50 border-gray-200"}`}
                  >
                    {isNegotiable && (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color="white"
                      />
                    )}
                  </View>
                  <Text className={`text-sm font-semibold ${isNegotiable ? "text-indigo-600" : "text-gray-500"}`}>
                    Allow Price Negotiation
                  </Text>
                </TouchableOpacity>
              </View>


              <View className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 mb-10">
                <View className="flex-row justify-between items-center mb-6">
                  <Text 
                    style={{ fontFamily: "DM Serif Display" }}
                    className="text-xl text-gray-900"
                  >
                    Final Description
                  </Text>
                  <AISuggestedTag />
                </View>
                <View className="bg-gray-50/50 border border-gray-100 rounded-[24px] p-5 shadow-sm shadow-black/[0.02]">
                  <TextInput
                    multiline
                    value={data.enhancedDescription}
                    onChangeText={(v) =>
                      setData((prev) => ({ ...prev, enhancedDescription: v }))
                    }
                    className="text-sm text-gray-800 leading-5 font-medium"
                    textAlignVertical="top"
                    placeholder="Review the AI enhanced description..."
                    style={{ minHeight: 120 }}
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={clicked || isFormLoading || !data.title}
                activeOpacity={0.8}
                className={`mb-10 rounded-[24px] py-5 items-center justify-center flex-row shadow-xl ${
                  clicked || isFormLoading || !data.title
                    ? "bg-gray-100"
                    : "bg-[#1A1A1A]"
                }`}
              >
                {clicked ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <View
                      className={`mr-3 ${clicked || isFormLoading || !data.title ? "opacity-50" : ""}`}
                    >
                      <Ionicons
                        name="sparkles"
                        size={18}
                        color={
                          clicked || isFormLoading || !data.title
                            ? "#9CA3AF"
                            : "#818CF8"
                        }
                      />
                    </View>
                    <Text
                      className={`font-bold text-base tracking-tight ${clicked || isFormLoading || !data.title ? "text-gray-400" : "text-white"}`}
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
