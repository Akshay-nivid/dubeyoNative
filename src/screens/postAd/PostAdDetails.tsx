import LocationPicker from "@/src/components/LocationPicker";
import { post } from "@/src/services/api";
import { Ionicons, Feather } from "@expo/vector-icons";
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
import { StatusBar } from "expo-status-bar";

import {
  GENERATION_STEPS,
  normalizeFieldKey,
  usePostAdAI,
} from "../../hooks/usePostAdAI";
import { usePostAdData } from "../../hooks/usePostAdData";
import { useUserLocation } from "../../hooks/useUserLocation";

import { PostAdApi } from "./Api";
import AISuggestedTag from "./components/AISuggestedTag";
import { AmenitiesSection } from "./components/AmenitiesSection";
import EditableRow from "./components/EditableRow";
import ImagePreviewCard from "./components/ImagePreviewCard";
import { InlinePicker } from "./components/InlinePicker";
import { InlineToggle } from "./components/InlineToggle";
import PostAdSkeleton from "./components/PostAdSkeleton";
import SuccessModal from "./components/SuccessModal";

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS & LOCAL COMPONENTS
───────────────────────────────────────────────────────────────────────────── */

const LocalTextInput = ({ value, onChangeText, ...props }: any) => {
  const [local, setLocal] = useState(value?.toString() || "");
  useEffect(() => setLocal(value?.toString() || ""), [value]);
  return (
    <TextInput
      {...props}
      value={local}
      onChangeText={(t) => {
        setLocal(t);
        if (onChangeText) onChangeText(t);
      }}
    />
  );
};

const buildSpecsPayload = (
  specs: Record<string, any> | undefined,
  questionAnswers: Record<string, any>,
): Record<string, any> => {
  const out: Record<string, any> = {};
  if (specs) {
    Object.entries(specs).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") out[k] = v;
    });
  }
  Object.entries(questionAnswers).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") out[k] = v;
  });
  return out;
};

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN SCREEN
───────────────────────────────────────────────────────────────────────────── */

const PostAdDetails = () => {
  /* ── 1. Hooks & State ── */
  const router = useRouter();
  const params = useLocalSearchParams();

  const initialDescription = params.description as string;
  const initialImages = useMemo(() => {
    try {
      return params.images
        ? (JSON.parse(params.images as string) as string[])
        : [];
    } catch {
      return [];
    }
  }, [params.images]);

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
    amenities,
    isAmenitiesLoading,
    fetchPreview,
    fetchAmenities,
  } = usePostAdAI();

  const {
    categories,
    subcategories,
    divisions,
    brands,
    models,
    isLoadingSubcategories,
    isLoadingDivisions,
    isLoadingBrands,
    isLoadingModels,
  } = usePostAdData(data.categoryId, data.subcategoryId, data.brandId);

  const [clicked, setClicked] = useState(false);
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, any>>(
    {},
  );
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const hasInitialized = React.useRef(false);

  /* ── 2. Lifecycle ── */

  // AI pipeline start
  useEffect(() => {
    if (
      !initialDescription ||
      initialImages.length === 0 ||
      hasInitialized.current
    )
      return;
    hasInitialized.current = true;
    fetchPreview(
      initialDescription,
      initialImages,
      coordinates ? { lat: coordinates.lat, lon: coordinates.lon } : null,
    );
  }, [initialDescription, initialImages]);

  // Fetch amenities when location changes, if required by the category
  useEffect(() => {
    if (data.isAmenitiesRequired && coordinates?.lat && coordinates?.lon) {
      fetchAmenities(coordinates.lat, coordinates.lon);
    }
  }, [
    coordinates?.lat,
    coordinates?.lon,
    !!data.isAmenitiesRequired,
    fetchAmenities,
  ]);

  // Sync division label → id
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

  // Sync brand label → id
  useEffect(() => {
    if (
      brands.length > 0 &&
      data.brand &&
      typeof data.brand === "string" &&
      !data.brandId
    ) {
      const match = brands.find(
        (b) =>
          b.name?.toLowerCase() === (data.brand as string).toLowerCase() ||
          b.label?.toLowerCase() === (data.brand as string).toLowerCase(),
      );
      if (match) {
        setData((prev: any) => ({
          ...prev,
          brand: match,
          brandId: match.id || match._id || match.value,
        }));
      }
    }
  }, [brands, data.brand, data.brandId]);

  // Sync model label → id
  useEffect(() => {
    if (
      models.length > 0 &&
      data.model &&
      typeof data.model === "string" &&
      !data.modelId
    ) {
      const match = models.find(
        (m) =>
          m.name?.toLowerCase() === (data.model as string).toLowerCase() ||
          m.label?.toLowerCase() === (data.model as string).toLowerCase(),
      );
      if (match) {
        setData((prev: any) => ({
          ...prev,
          model: match,
          modelId: match.id || match._id || match.value,
        }));
      }
    }
  }, [models, data.model, data.modelId]);

  /* ── 3. Derived Values ── */

  const categoryName = useMemo(() => {
    if (!data?.categoryId || categories.length === 0)
      return data?.category?.name || data?.category?.label || "";
    const cat = categories.find(
      (c) => (c.id || c._id || c.value) === data.categoryId,
    );
    return cat?.name || cat?.label || data?.category?.name || "";
  }, [categories, data.categoryId, data?.category]);

  const subcategoryName = useMemo(() => {
    if (!data?.subcategoryId || subcategories.length === 0)
      return data?.subcategory?.name || data?.subcategory?.label || "";
    const sub = subcategories.find(
      (s) => (s.id || s._id || s.value) === data.subcategoryId,
    );
    return sub?.name || sub?.label || data?.subcategory?.name || "";
  }, [subcategories, data.subcategoryId, data?.subcategory]);

  const brandName = useMemo(() => {
    if (!data?.brandId || brands.length === 0)
      return data?.brand?.name || data?.brand?.label || "";
    const brand = brands.find(
      (b) => (b.id || b._id || b.value) === data.brandId,
    );
    return brand?.name || brand?.label || data?.brand?.name || "";
  }, [brands, data.brandId, data?.brand]);

  const modelName = useMemo(() => {
    if (!data?.modelId || models.length === 0)
      return data?.model?.name || data?.model?.label || "";
    const model = models.find(
      (m) => (m.id || m._id || m.value) === data.modelId,
    );
    return model?.name || model?.label || data?.model?.name || "";
  }, [models, data.modelId, data?.model]);

  const hasValidSpecs = useMemo(
    () =>
      !!data?.specs &&
      Object.values(data.specs).some(
        (v) => v !== null && v !== "" && v !== undefined,
      ),
    [data.specs],
  );

  const currentImages: string[] =
    (data.images?.length ?? 0) > 0 ? (data.images as string[]) : initialImages;

  const showAmenities = useMemo(
    () =>
      data.isAmenitiesRequired === true &&
      amenities !== null &&
      Object.keys(amenities).length > 0,
    [data.isAmenitiesRequired, amenities],
  );

  const isPostDisabled = clicked || isFormLoading || !data.title;

  /* ── specs grid ── */

  const specsGridGroups = useMemo(() => {
    const items: any[] = [];

    if (data.specs) {
      Object.entries(data.specs as Record<string, any>).forEach(
        ([key, val]) => {
          const strVal = String(val ?? "").trim();
          if (
            val === null ||
            val === undefined ||
            strVal.toLowerCase() === "null" ||
            strVal.toLowerCase() === "undefined"
          )
            return;

          const meta = specMetadata[key];
          const dataType = meta?.dataType;

          const rawMetaOptions = Array.isArray(meta?.options)
            ? meta.options
            : [];
          const options = rawMetaOptions
            .filter((o: any) => o != null)
            .map((o: any) =>
              typeof o === "string"
                ? { label: o, value: o }
                : {
                    label: o.name || o.label || String(o),
                    value:
                      o.id ||
                      o._id ||
                      o.value ||
                      o.name ||
                      o.label ||
                      String(o),
                  },
            );

          if (dataType === "boolean" && options.length === 0) {
            options.push(
              { label: "Yes", value: "Yes" },
              { label: "No", value: "No" },
            );
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
        },
      );
    }

    if (data.division) {
      items.push({
        key: "division",
        label: "Division / Type",
        val: data.division,
        type: "division",
        isBinary: false,
        options: divisions.map((d) => ({
          label: d.name || d.label || "",
          value: d.id || d._id || d.value || "",
        })),
      });
    }

    const groups: any[][] = [];
    let cur: any[] = [];
    items.forEach((item) => {
      if (item.isBinary) {
        if (cur.length > 0) {
          groups.push(cur);
          cur = [];
        }
        groups.push([item]);
      } else {
        cur.push(item);
        if (cur.length === 2) {
          groups.push(cur);
          cur = [];
        }
      }
    });
    if (cur.length > 0) groups.push(cur);
    return groups;
  }, [data.specs, data.division, specMetadata, divisions]);

  /* ── submit ── */

  const handleSubmit = async () => {
    if (clicked) return;

    if (!data.title?.trim()) {
      Toast.show({
        type: "error",
        text1: "Title required",
        text2: "Please add a title for your ad.",
      });
      return;
    }
    if (!data.price || Number(data.price) <= 0) {
      Toast.show({
        type: "error",
        text1: "Price required",
        text2: "Please enter a valid price.",
      });
      return;
    }
    if (!coordinates?.lat || !coordinates?.lon || coordinates.lat === 0) {
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
        text2: "Please enable location and try again.",
      });
      return;
    }

    setClicked(true);
    try {
      const normalizedPrice = isNaN(Number(data.price))
        ? 0
        : Number(data.price);
      const formattedSpecs = buildSpecsPayload(data.specs, questionAnswers);
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
        brand: undefined,
        model: undefined,
        isAmenitiesRequired: undefined,
        isbrandrequired: undefined,
        isModelrequired: undefined,
        enhancedDescription: undefined,
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
          if (typeof details === "string") errorMsg = details;
          else if (Array.isArray(details))
            errorMsg = details
              .map((e: any) => e.msg || e.message || JSON.stringify(e))
              .join("\n");
        }
        Toast.show({
          type: "error",
          text1: "Submission Error",
          text2: errorMsg,
        });
      }
    } catch {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to submit ad. Please try again.",
      });
    } finally {
      setClicked(false);
    }
  };

  /* ── 4. Renderers ── */

  const renderSpecItem = (item: any, width: string | number) => {
    const itemValId =
      item.val && typeof item.val === "object"
        ? item.val.id || item.val._id || item.val.value
        : item.val;

    const displayValue =
      item.options.length > 0
        ? item.options.find((o: any) => o.value === itemValId)?.label ||
          (typeof item.val === "object"
            ? item.val?.name || item.val?.label || ""
            : item.val)
        : item.val;

    const safeDisplay = String(displayValue ?? "");

    if (item.type === "division" && divisions.length > 0) {
      return (
        <InlinePicker
          key={item.key}
          label={item.label}
          value={safeDisplay || "Select"}
          options={divisions.map((d) => ({
            label: d.name || d.label || "",
            value: d.id || d._id || d.value || "",
          }))}
          isLoading={isLoadingDivisions}
          containerStyle={{ width }}
          onSelect={(opt) => {
            const full = divisions.find(
              (d) => (d.id || d._id || d.value) === opt.value,
            );
            setData((prev: any) => ({
              ...prev,
              divisionId: opt.value,
              division: full || opt,
            }));
          }}
        />
      );
    }

    if (item.dataType === "select" && item.options.length > 0) {
      return (
        <InlinePicker
          key={item.key}
          label={item.label}
          value={safeDisplay || "Select"}
          options={item.options}
          containerStyle={{ width }}
          onSelect={(opt) =>
            setData((prev: any) => ({
              ...prev,
              specs: { ...prev.specs, [item.key]: opt.value },
            }))
          }
        />
      );
    }

    return (
      <EditableRow
        key={item.key}
        label={item.label}
        value={safeDisplay}
        containerStyle={{ width }}
        onChange={(text: string) => {
          if (item.type === "division") {
            setData((prev: any) => ({
              ...prev,
              division: text,
              divisionId: text,
            }));
          } else {
            setData((prev: any) => ({
              ...prev,
              specs: { ...prev.specs, [item.key]: text },
            }));
          }
        }}
      />
    );
  };

  const renderBinarySpecItem = (item: any, gIdx: number) => {
    const itemValId =
      item.val && typeof item.val === "object"
        ? item.val.id || item.val._id || item.val.value
        : item.val;

    const isSelected = (optLabel: string): boolean => {
      const v = itemValId;
      const isYesNo =
        item.dataType === "boolean" ||
        ["yes", "no", "true", "false"].includes(String(v ?? "").toLowerCase());
      if (isYesNo) {
        if (optLabel === "Yes")
          return (
            v === true ||
            String(v).toLowerCase() === "yes" ||
            String(v).toLowerCase() === "true"
          );
        if (optLabel === "No")
          return (
            v === false ||
            String(v).toLowerCase() === "no" ||
            String(v).toLowerCase() === "false"
          );
      }
      return String(v ?? "").toLowerCase() === String(optLabel).toLowerCase();
    };

    const handleToggle = (optLabel: string) => {
      const opt = (item.options || []).find(
        (o: any) => (o.label || o.value) === optLabel,
      );
      if (!opt) return;
      if (item.type === "division") {
        const full = Array.isArray(divisions)
          ? divisions.find((d) => (d.id || d._id || d.value) === opt.value)
          : null;
        setData((prev: any) => ({
          ...prev,
          division: full || opt.value,
          divisionId: opt.value,
        }));
      } else {
        setData((prev: any) => ({
          ...prev,
          specs: {
            ...prev.specs,
            [item.key]:
              item.dataType === "boolean" ? opt.value === "Yes" : opt.value,
          },
        }));
      }
    };

    const optionLabels: string[] = (item.options || []).map(
      (o: any) => o.label || o.value || "",
    );

    return (
      <View key={item.key || gIdx} className="mb-2 w-full">
        <Text 
          className="text-gray-900 font-semibold text-[12px] mb-1.5 ml-1"
          style={{ flexWrap: 'wrap' }}
        >
          {String(item.label || item.key || "")}
        </Text>
        <InlineToggle
          options={optionLabels}
          selectedChecker={isSelected}
          onSelect={handleToggle}
        />
      </View>
    );
  };

  const renderQuestionItem = (q: any, idx: number) => {
    if (!q) return null;

    const fieldKey =
      q.key ||
      q.slug ||
      normalizeFieldKey(String(q.field || q.label || "")) ||
      `question_${idx}`;

    const meta = specMetadata[fieldKey];
    const dataType = meta?.dataType || q.dataType;

    let options: string[] = [];
    if (dataType === "boolean") {
      options = ["Yes", "No"];
    } else {
      const raw = Array.isArray(q.options || meta?.options)
        ? q.options || meta?.options
        : [];
      options = raw
        .map((o: any) => (typeof o === "string" ? o : o.name || o.label))
        .filter((o: any) => !!o && String(o).trim().length > 0);
    }

    const questionLabel =
      q.question || q.label || q.field || `About the ${meta?.name || fieldKey}`;

    const isSelected = (opt: string): boolean => {
      if (!fieldKey) return false;
      const current = questionAnswers?.[fieldKey];
      const isBoolCtx =
        dataType === "boolean" ||
        ["yes", "no", "true", "false"].includes(
          String(current ?? "").toLowerCase(),
        );
      if (isBoolCtx) {
        if (opt === "Yes")
          return (
            current === true ||
            String(current).toLowerCase() === "yes" ||
            String(current).toLowerCase() === "true"
          );
        if (opt === "No")
          return (
            current === false ||
            String(current).toLowerCase() === "no" ||
            String(current).toLowerCase() === "false"
          );
      }
      const sCurrent = String(current ?? "").toLowerCase();
      const sOpt = String(opt ?? "").toLowerCase();
      if (sCurrent === sOpt) return true;
      const metaOptions = Array.isArray(meta?.options) ? meta.options : [];
      const matched = metaOptions.find(
        (o: any) =>
          o &&
          String(o.id || o._id || o.value || "").toLowerCase() === sCurrent,
      );
      return (
        String(
          matched?.name || matched?.label || matched?.value || "",
        ).toLowerCase() === sOpt
      );
    };

    const handleSelect = (opt: string) => {
      if (!fieldKey || opt == null) return;
      setQuestionAnswers((prev) => {
        const next = { ...(prev || {}) };
        if (dataType === "boolean") {
          next[fieldKey] = opt === "Yes";
        } else {
          const metaOptions = Array.isArray(meta?.options) ? meta.options : [];
          const original = metaOptions.find(
            (o: any) =>
              o &&
              (o.name === opt ||
                o.label === opt ||
                o.value === opt ||
                o === opt),
          );
          next[fieldKey] = original
            ? original.id || original._id || original.value
            : opt;
        }
        return next;
      });
    };

    const isBinary =
      dataType === "boolean" ||
      (options.length === 2 &&
        options.some((o) =>
          ["yes", "no", "true", "false"].includes(String(o).toLowerCase()),
        ));

    if (!isBinary && options.length > 0) {
      return (
        <InlinePicker
          key={fieldKey}
          label={String(questionLabel)}
          value={
            options.find((o) => isSelected(o)) ||
            questionAnswers?.[fieldKey] ||
            "Select Option"
          }
          options={options.map((o) => ({ label: String(o), value: String(o) }))}
          onSelect={(opt) => {
            if (opt) handleSelect(opt.value);
          }}
        />
      );
    }

    return (
      <View key={fieldKey} className="mb-2">
        <Text 
          className="text-gray-900 font-semibold text-[12px] mb-1.5 ml-1"
          style={{ flexWrap: 'wrap' }}
        >
          {String(questionLabel)}
        </Text>
        {options.length > 0 ? (
          <InlineToggle
            options={options}
            selectedChecker={isSelected}
            onSelect={handleSelect}
          />
        ) : (
          <View className="bg-gray-50/50 border border-gray-100 rounded-[8px] px-4 h-12 justify-center shadow-sm shadow-black/[0.02]">
            <LocalTextInput
              value={String(questionAnswers[fieldKey] ?? "")}
              onChangeText={(text: string) =>
                setQuestionAnswers((prev: any) => ({
                  ...prev,
                  [fieldKey]: text,
                }))
              }
              placeholder="Type your answer..."
              placeholderTextColor="#9CA3AF"
              keyboardType={meta?.dataType === "number" || q.dataType === "number" ? "numeric" : "default"}
              className="text-gray-900 text-sm font-semibold w-full h-full py-0"
            />
          </View>
        )}
      </View>
    );
  };

  /* ── 5. Render ── */

  return (
    <SafeAreaView className="flex-1 bg-[#F7F6F3]" edges={["top"]}>
      <StatusBar style="dark" backgroundColor="#F7F6F3" />
      <View className="flex-1 bg-[#F7F6F3]">
        {/* ── Header ── */}
        <View className="px-4 py-3 flex-row items-center justify-between border-b border-gray-200 bg-[#F7F6F3] shadow-lg z-10">
          <View className="flex-row items-center flex-1 pr-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center bg-white rounded-full mr-4 border border-gray-200 shadow-sm"
            >
              <Feather name="corner-up-left" size={20} color="black" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setLocationPickerVisible(true)}
              className="flex-1 justify-center"
            >
              <Text
                className="text-[15px] font-normal text-[#333333] leading-5 mb-0.5"
                style={{ fontFamily: "DM Serif Display" }}
              >
                Ad Details
              </Text>
              <View className="flex-row items-center">
                {place ? (
                  <Text
                    className="text-[14px] text-gray-500 font-medium max-w-[180px]"
                    numberOfLines={1}
                  >
                    {place}
                  </Text>
                ) : (
                  <Text className="text-[14px] text-gray-400 font-medium">
                    Select location
                  </Text>
                )}

              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isPostDisabled}
            className={`px-6 py-2.5 rounded-[24px] ${isPostDisabled ? "bg-gray-100" : "bg-[#1A1A1A]"}`}
          >
            {clicked ? (
              <ActivityIndicator
                size="small"
                color="#fff"
              />
            ) : (
              <Text
                className={`font-bold text-[15px] ${isPostDisabled ? "text-gray-400" : "text-white"}`}
              >
                Post
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Scroll ── */}
        <ScrollView
          className="flex-1 px-4 pt-3"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <ImagePreviewCard
            images={currentImages}
            initialImages={initialImages}
            onChange={(imgs) =>
              setData((prev: any) => ({ ...prev, images: imgs }))
            }
          />

          {/* ── Basic Details ── */}
          <View className="bg-white rounded-[16px] p-5 shadow-sm border border-gray-200 mb-3">
            <View className="flex-row justify-between items-center mb-5">
              <Text
                className="text-xl text-gray-900"
                style={{ fontFamily: "DM Serif Display" }}
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
                  onChange={(v: string) =>
                    setData((prev: any) => ({ ...prev, title: v }))
                  }
                />
                <View className="flex-row justify-between w-full">
                  <InlinePicker
                    label="Category"
                    value={categoryName}
                    options={categories
                      .map((c: any) => ({
                        label: c.name || c.label || "",
                        value: c.id || c._id || c.value || "",
                      }))
                      .filter(
                        (v, i, a) =>
                          a.findIndex((t) => t.value === v.value) === i,
                      )}
                    containerStyle={{ width: "48%" }}
                    onSelect={(opt: any) => {
                      const full = categories.find(
                        (c: any) => (c.id || c._id || c.value) === opt.value,
                      );
                      setData((prev: any) => ({
                        ...prev,
                        categoryId:
                          full?.id || full?._id || full?.value || opt.value,
                        category: full || opt,
                        subcategoryId: undefined,
                        subcategory: undefined,
                      }));
                    }}
                  />
                  <InlinePicker
                    label="Sub Category"
                    value={subcategoryName}
                    options={subcategories
                      .map((s: any) => ({
                        label: s.name || s.label || "",
                        value: s.id || s._id || s.value || "",
                      }))
                      .filter(
                        (v, i, a) =>
                          a.findIndex((t) => t.value === v.value) === i,
                      )}
                    isLoading={isLoadingSubcategories}
                    containerStyle={{ width: "48%" }}
                    onSelect={(opt: any) => {
                      const full = subcategories.find(
                        (s: any) => (s.id || s._id || s.value) === opt.value,
                      );
                      setData((prev: any) => ({
                        ...prev,
                        subcategoryId:
                          full?.id || full?._id || full?.value || opt.value,
                        subcategory: full || opt,
                        divisionId: undefined,
                        division: undefined,
                        brandId: undefined,
                        brand: undefined,
                        modelId: undefined,
                        model: undefined,
                      }));
                    }}
                  />
                </View>
                {(data.isbrandrequired || data.isModelrequired) && (
                  <View className="mt-4 flex-row justify-between w-full">
                    {data.isbrandrequired && (
                      <InlinePicker
                        label="Brand"
                        value={brandName}
                        options={brands
                          .map((b: any) => ({
                            label: b.name || b.label || "",
                            value: b.id || b._id || b.value || "",
                          }))
                          .filter(
                            (v, i, a) =>
                              a.findIndex((t) => t.label === v.label) === i,
                          )}
                        isLoading={isLoadingBrands}
                        containerStyle={{
                          width: data.isModelrequired ? "48%" : "100%",
                        }}
                        onSelect={(opt: any) => {
                          const full = brands.find(
                            (b: any) =>
                              (b.id || b._id || b.value) === opt.value,
                          );
                          setData((prev: any) => ({
                            ...prev,
                            brandId:
                              full?.id || full?._id || full?.value || opt.value,
                            brand: full || opt,
                            modelId: undefined,
                            model: undefined,
                          }));
                        }}
                      />
                    )}
                    {data.isModelrequired && (
                      <InlinePicker
                        label="Model"
                        value={modelName}
                        options={models
                          .map((m: any) => ({
                            label: m.name || m.label || "",
                            value: m.id || m._id || m.value || "",
                          }))
                          .filter(
                            (v, i, a) =>
                              a.findIndex((t) => t.label === v.label) === i,
                          )}
                        isLoading={isLoadingModels}
                        containerStyle={{
                          width: data.isbrandrequired ? "48%" : "100%",
                        }}
                        onSelect={(opt: any) => {
                          const full = models.find(
                            (m: any) =>
                              (m.id || m._id || m.value) === opt.value,
                          );
                          setData((prev: any) => ({
                            ...prev,
                            modelId:
                              full?.id || full?._id || full?.value || opt.value,
                            model: full || opt,
                          }));
                        }}
                      />
                    )}
                  </View>
                )}
              </>
            )}
          </View>

          {/* ── Specifications ── */}
          {generationStep >= GENERATION_STEPS.BASIC_FORM &&
            (generationStep < GENERATION_STEPS.SPECS_FORM ||
              hasValidSpecs || divisions.length > 0 || !!data.division) && (
              <View className="bg-white rounded-[16px] p-5 shadow-sm border border-gray-200 mb-3">
                <View className="flex-row justify-between items-center mb-5">
                  <Text
                    className="text-xl text-gray-900"
                    style={{ fontFamily: "DM Serif Display" }}
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
                  <View>
                    {specsGridGroups.map((group, gIdx) => {
                      if (group.length === 1 && group[0].isBinary) {
                        return renderBinarySpecItem(group[0], gIdx);
                      }
                      return (
                        <View
                          key={gIdx}
                          className="flex-row justify-between w-full"
                        >
                          {group.map((item) =>
                            renderSpecItem(
                              item,
                              group.length === 1 ? "100%" : "48%",
                            ),
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

          {/* ── Helpful Details ── */}
          {(generationStep < GENERATION_STEPS.DONE || questions.length > 0) &&
            generationStep >= GENERATION_STEPS.SPECS_FORM && (
              <View className="bg-white rounded-[16px] p-5 shadow-sm border border-gray-200 mb-3">
                <View className="flex-row justify-between items-center mb-5">
                  <Text
                    className="text-xl text-gray-900"
                    style={{ fontFamily: "DM Serif Display" }}
                  >
                    Helpful Details
                  </Text>
                  <AISuggestedTag />
                </View>

                {generationStep < GENERATION_STEPS.DONE ? (
                  <>
                    <PostAdSkeleton className="h-20 w-full rounded-xl mb-3" />
                    <PostAdSkeleton className="h-20 w-full rounded-xl mb-3" />
                    <PostAdSkeleton className="h-20 w-full rounded-xl mb-3" />
                  </>
                ) : (
                  questions.map((q, idx) => renderQuestionItem(q, idx))
                )}
              </View>
            )}

          {/* ── Nearby Amenities ── */}
          <AmenitiesSection
            generationStep={generationStep}
            isAmenitiesRequired={data.isAmenitiesRequired || false}
            amenities={amenities}
            isAmenitiesLoading={isAmenitiesLoading}
            showAmenities={showAmenities}
          />

          {/* ── Price + Description + Submit ── */}
          {generationStep === GENERATION_STEPS.DONE && (
            <>
              {/* Price */}
              <View className="bg-white rounded-[20px] p-5 shadow-sm border border-gray-200 mb-3">
                <Text className="text-xl text-gray-900 mb-5" style={{ fontFamily: "DM Serif Display" }}>
                  Set Price
                </Text>
                <View className="bg-gray-50/50 border border-gray-200 rounded-[18px] px-4 flex-row items-center h-16">
                  <View className="bg-white px-3 py-1.5 rounded-xl border border-gray-200 mr-3">
                    <Text className="text-gray-900 font-bold text-xs">AED</Text>
                  </View>
                  <LocalTextInput
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={data.price?.toString() || ""}
                    onChangeText={(v: string) =>
                      setData((prev: any) => ({ ...prev, price: v }))
                    }
                    className="flex-1 text-2xl font-black text-gray-900"
                    placeholderTextColor="#D1D5DB"
                  />
                </View>
                <TouchableOpacity
                  onPress={() => setIsNegotiable((p) => !p)}
                  className="flex-row items-center mt-4 ml-1"
                  activeOpacity={0.7}
                >
                  <View
                    className={`w-6 h-6 rounded-lg border-2 items-center justify-center mr-3 ${
                      isNegotiable
                        ? "bg-indigo-600 border-indigo-600"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    {isNegotiable && (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color="white"
                      />
                    )}
                  </View>
                  <Text
                    className={`text-sm font-semibold ${isNegotiable ? "text-indigo-600" : "text-gray-500"}`}
                  >
                    Allow Price Negotiation
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Final Description */}
              <View className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-200 mb-3">
                <View className="flex-row justify-between items-center mb-5">
                  <Text
                    className="text-xl text-gray-900"
                    style={{ fontFamily: "DM Serif Display" }}
                  >
                    Final Description
                  </Text>
                  <AISuggestedTag />
                </View>
                <View className="bg-gray-50/50 border border-gray-100 rounded-[24px] p-5">
                  <LocalTextInput
                    multiline
                    value={data.enhancedDescription}
                    onChangeText={(v: string) =>
                      setData((prev: any) => ({
                        ...prev,
                        enhancedDescription: v,
                      }))
                    }
                    placeholder="Review the AI enhanced description..."
                    className="text-sm text-gray-800 leading-5 font-medium"
                  />
                </View>
              </View>

              {/* Post button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isPostDisabled}
                activeOpacity={0.8}
                className={`mb-2 rounded-[24px] py-5 items-center justify-center flex-row shadow-xl ${
                  isPostDisabled ? "bg-gray-100" : "bg-[#1A1A1A]"
                }`}
              >
                {clicked ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <View
                      className={`mr-3 ${isPostDisabled ? "opacity-50" : ""}`}
                    >
                      <Ionicons
                        name="sparkles"
                        size={18}
                        color={isPostDisabled ? "#9CA3AF" : "#818CF8"}
                      />
                    </View>
                    <Text
                      className={`font-bold text-base tracking-tight ${isPostDisabled ? "text-gray-400" : "text-white"}`}
                    >
                      Post Ad Now
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>

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
            router.push(`/product/${createdProductId}`);
          } else {
            router.push("/home");
          }
        }}
      />
    </SafeAreaView>
  );
};

export default PostAdDetails;
