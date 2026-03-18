import LocationPicker from "@/src/components/LocationPicker";
import { post } from "@/src/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

// Hooks
import { GENERATION_STEPS, usePostAdAI, normalizeFieldKey } from "../../hooks/usePostAdAI";
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
/*  ROOT CAUSE NOTE:
 *
 *  react-native-css-interop intercepts every component that receives a
 *  `className` prop. During its "upgrade warning" check it calls
 *  Object.entries() on the React Navigation context — which throws
 *  "Couldn't find a navigation context" when the component is rendered
 *  inside a .map() callback that fires from an async state update
 *  (questions arriving from the AI API) before navigation is fully settled.
 *
 *  FIX: inside every .map() callback (questions.map, specsGridGroups.map,
 *  options.map) use plain `style={...}` props only — never `className`.
 *  Outside of .map() (static JSX) className is fine.
 *
 *  SelectRow is also banned inside .map() because it uses useNavigation()
 *  internally. Use InlinePicker (pure RN Modal, zero nav dep) instead.
 * -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*                     SAFE INLINE PICKER (zero nav / className dep)          */
/* -------------------------------------------------------------------------- */
interface InlinePickerOption {
  label: string;
  value: string;
}

interface InlinePickerProps {
  label: string;
  value: string;
  options: InlinePickerOption[];
  containerStyle?: any;
  isLoading?: boolean;
  onSelect: (opt: InlinePickerOption) => void;
}

const InlinePicker: React.FC<InlinePickerProps> = ({
  label,
  value,
  options,
  containerStyle,
  isLoading,
  onSelect,
}) => {
  const [open, setOpen] = useState(false);

  // All styles are inline — no className anywhere in this component
  return (
    <View style={[{ marginBottom: 14 }, containerStyle]}>
      <Text style={ip.label}>{label}</Text>
      <TouchableOpacity
        onPress={() => !isLoading && setOpen(true)}
        style={ip.trigger}
        activeOpacity={0.7}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#6366F1" />
        ) : (
          <>
            <Text
              style={[
                ip.triggerText,
                { color: value && value !== "Select" && value !== "Select Option" ? "#111827" : "#9CA3AF" },
              ]}
              numberOfLines={1}
            >
              {value || "Select"}
            </Text>
            <Ionicons name="chevron-down" size={14} color="#6366F1" />
          </>
        )}
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={ip.backdrop} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={ip.sheet}>
            <View style={ip.handle} />
            <Text style={ip.sheetTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => { onSelect(item); setOpen(false); }}
                  style={ip.row}
                >
                  <Text style={[ip.rowText, item.label === value && { color: "#6366F1" }]}>
                    {item.label}
                  </Text>
                  {item.label === value && (
                    <Ionicons name="checkmark" size={16} color="#6366F1" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const ip = StyleSheet.create({
  label: { color: "#111827", fontWeight: "700", fontSize: 13, marginBottom: 6, marginLeft: 4 },
  trigger: {
    backgroundColor: "rgba(249,250,251,0.5)",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  triggerText: { fontSize: 13, fontWeight: "600", flex: 1 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: "60%",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitle: { fontWeight: "700", fontSize: 15, color: "#111827", marginBottom: 12, paddingHorizontal: 20 },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowText: { fontSize: 14, fontWeight: "600", color: "#374151" },
});

/* -------------------------------------------------------------------------- */
/*                     INLINE TOGGLE (safe, no className inside map)          */
/* -------------------------------------------------------------------------- */

// Extracted so we never accidentally add className inside a .map()
interface InlineToggleProps {
  options: string[];
  selectedChecker: (opt: string) => boolean;
  onSelect: (opt: string) => void;
}

const InlineToggle: React.FC<InlineToggleProps> = ({ options, selectedChecker, onSelect }) => (
  <View style={tog.wrap}>
    {options.map((opt) => {
      const selected = selectedChecker(opt);
      return (
        // NO className here — plain style only
        <TouchableOpacity
          key={opt}
          onPress={() => onSelect(opt)}
          style={[
            tog.btn,
            options.length <= 2 ? tog.btnFlex : tog.btnPad,
            selected ? tog.btnSelected : undefined,
          ]}
        >
          <Text style={[tog.txt, selected ? tog.txtSelected : tog.txtUnselected]}>
            {String(opt)}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const tog = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    backgroundColor: "rgba(249,250,251,0.5)",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 18,
    padding: 6,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 14,
  },
  btnFlex: { flex: 1 },
  btnPad: { paddingHorizontal: 16, margin: 4, minWidth: "44%" },
  btnSelected: { backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  txt: { fontSize: 13 },
  txtSelected: { color: "#6366F1", fontWeight: "700" },
  txtUnselected: { color: "#9CA3AF", fontWeight: "600" },
});

/* -------------------------------------------------------------------------- */
/*                              PURE HELPERS                                  */
/* -------------------------------------------------------------------------- */

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
        const qKey = q.key || q.slug || normalizeFieldKey(q.field || q.label || "question");
        return qKey === k;
      });
      formattedSpecs[k] = { value: v, label: meta?.name || q?.label || q?.field || k };
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

  const initialDescription = params.description as string;
  const initialImages = useMemo(() => {
    try {
      return params.images ? (JSON.parse(params.images as string) as string[]) : [];
    } catch (e) {
      if (__DEV__) console.warn("Failed to parse images param", e);
      return [];
    }
  }, [params.images]);

  const { coordinates, place, updateLocation, useCurrentLocation, getPlaceName, getCoordinatesFromName } = useUserLocation();
  const { generationStep, isFormLoading, data, setData, questions, specMetadata, imageKeys, fetchPreview } = usePostAdAI();
  const { categories, subcategories, divisions, isLoadingSubcategories, isLoadingDivisions } = usePostAdData(data.categoryId, data.subcategoryId);

  const [clicked, setClicked] = useState(false);
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [questionAnswers, setQuestionAnswers] = useState<any>({});
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const hasInitialized = React.useRef(false);

  useEffect(() => {
    if (!initialDescription || initialImages.length === 0 || hasInitialized.current) return;
    hasInitialized.current = true;
    fetchPreview(initialDescription, initialImages);
  }, [initialDescription, initialImages]);

  const categoryName = useMemo(() => {
    if (!data?.categoryId || categories.length === 0) return data?.category?.name || data?.category?.label || "";
    const cat = categories.find((c) => (c.id || c._id || c.value) === data.categoryId);
    return cat?.name || cat?.label || data?.category?.name || "";
  }, [categories, data.categoryId, data?.category]);

  const subcategoryName = useMemo(() => {
    if (!data?.subcategoryId || subcategories.length === 0) return data?.subcategory?.name || data?.subcategory?.label || "";
    const sub = subcategories.find((s) => (s.id || s._id || s.value) === data.subcategoryId);
    return sub?.name || sub?.label || data?.subcategory?.name || "";
  }, [subcategories, data.subcategoryId, data?.subcategory]);

  const hasValidSpecs = useMemo(() => {
    if (!data?.specs) return false;
    return Object.values(data.specs).some((v) => v !== null && v !== "" && v !== undefined);
  }, [data.specs]);

  const specsGridGroups = useMemo(() => {
    const items: any[] = [];

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
              ["yes", "no", "true", "false"].includes(String(o.label || o.value).toLowerCase()),
            ));

        items.push({
          key, val, meta, options, isBinary, dataType,
          label: meta?.name || meta?.label || key.replace(/_/g, " "),
          type: "spec",
        });
      });
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
    let currentGroup: any[] = [];

    items.forEach((item) => {
      if (item.isBinary) {
        if (currentGroup.length > 0) { groups.push(currentGroup); currentGroup = []; }
        groups.push([item]);
      } else {
        currentGroup.push(item);
        if (currentGroup.length === 2) { groups.push(currentGroup); currentGroup = []; }
      }
    });
    if (currentGroup.length > 0) groups.push(currentGroup);

    return groups;
  }, [data.specs, data.division, specMetadata, divisions]);

  useEffect(() => {
    if (divisions.length > 0 && data.division && typeof data.division === "string" && !data.divisionId) {
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

  const currentImages: string[] =
    (data.images?.length ?? 0) > 0 ? (data.images as string[]) : initialImages || [];

  const handleSubmit = async () => {
    if (clicked) return;
    setClicked(true);

    if (!coordinates || typeof coordinates.lat !== "number" || typeof coordinates.lon !== "number" || coordinates.lat === 0) {
      Toast.show({ type: "info", text1: "Location Required", text2: "Requesting location permission..." });
      try { useCurrentLocation(); } catch (err) { console.error("Failed to request location", err); }
      Toast.show({ type: "error", text1: "Location not found", text2: "Please enable location and try again" });
      setClicked(false);
      return;
    }

    try {
      const rawPrice = Number(data.price);
      const normalizedPrice = isNaN(rawPrice) ? 0 : rawPrice;

      const formattedSpecs = buildSpecsPayload(data.specs, questionAnswers, specMetadata, questions, normalizeFieldKey);

      const submissionImages =
        imageKeys.length > 0 ? imageKeys : (data.images?.length ?? 0) > 0 ? data.images : initialImages;

      const payload = {
        ...data,
        categoryId: data.categoryId || data.category?.id || data.category?._id,
        subcategoryId: data.subcategoryId || data.subcategory?.id || data.subcategory?._id,
        divisionId: data.divisionId || data.division?.id || data.division?._id,
        category: undefined, subcategory: undefined, division: undefined,
        price: normalizedPrice,
        specs: formattedSpecs,
        negotiate: isNegotiable,
        description: data.enhancedDescription,
        location: { type: "Point", coordinates: [coordinates.lon, coordinates.lat] },
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
          else if (Array.isArray(details)) errorMsg = details.map((e: any) => e.msg || e.message || JSON.stringify(e)).join("\n");
        }
        Toast.show({ type: "error", text1: "Validation Error", text2: errorMsg });
      }
    } catch (err) {
      Toast.show({ type: "error", text1: "Error", text2: "Failed to submit ad" });
    } finally {
      setClicked(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*  SPEC ITEM RENDERER
   *  Uses InlinePicker (no nav dep, no className) for all dropdown cases.
   *  Uses plain style= everywhere — no className.
   * -------------------------------------------------------------------------- */
  const renderSpecItem = (item: any, width: string | number) => {
    const itemValId =
      item.val && typeof item.val === "object"
        ? item.val.id || item.val._id || item.val.value
        : item.val;

    const displayValue =
      item.options.length > 0
        ? item.options.find((o: any) => o.value === itemValId)?.label ||
          (typeof item.val === "object" ? item.val?.name || item.val?.label || "" : item.val)
        : item.val;

    const safeDisplayValue = String(displayValue ?? "");

    if (item.type === "division" && divisions.length > 0) {
      return (
        <InlinePicker
          key={item.key}
          label={item.label}
          value={safeDisplayValue || "Select"}
          options={divisions.map((d) => ({ label: d.name || d.label || "", value: d.id || d._id || d.value || "" }))}
          isLoading={isLoadingDivisions}
          containerStyle={{ width }}
          onSelect={(opt) => {
            const fullOpt = divisions.find((d) => (d.id || d._id || d.value) === opt.value);
            setData((prev) => ({ ...prev, divisionId: opt.value, division: fullOpt || opt }));
          }}
        />
      );
    }

    if (item.dataType === "select" && item.options.length > 0) {
      return (
        <InlinePicker
          key={item.key}
          label={item.label}
          value={safeDisplayValue || "Select"}
          options={item.options}
          containerStyle={{ width }}
          onSelect={(opt) => {
            setData((prev) => ({ ...prev, specs: { ...prev.specs, [item.key]: opt.value } }));
          }}
        />
      );
    }

    return (
      <EditableRow
        key={item.key}
        label={item.label}
        value={safeDisplayValue}
        containerStyle={{ width }}
        onChange={(text: string) => {
          if (item.type === "division") {
            setData((prev) => ({ ...prev, division: text, divisionId: text }));
          } else {
            setData((prev) => ({ ...prev, specs: { ...prev.specs, [item.key]: text } }));
          }
        }}
      />
    );
  };

  /* -------------------------------------------------------------------------- */
  /*  SPEC BINARY ROW RENDERER
   *  Full-width Yes/No toggle — no className anywhere.
   * -------------------------------------------------------------------------- */
  const renderBinarySpecItem = (item: any, gIdx: number) => {
    const itemValId =
      item.val && typeof item.val === "object"
        ? item.val.id || item.val._id || item.val.value
        : item.val;

    const isSelected = (optValue: string) => {
      const cVal = itemValId;
      if (item.dataType === "boolean" || ["yes", "no", "true", "false"].includes(String(cVal).toLowerCase())) {
        if (optValue === "Yes") return cVal === true || String(cVal).toLowerCase() === "yes" || String(cVal).toLowerCase() === "true";
        if (optValue === "No") return cVal === false || String(cVal).toLowerCase() === "no" || String(cVal).toLowerCase() === "false";
      }
      return String(cVal ?? "").toLowerCase() === String(optValue).toLowerCase();
    };

    return (
      // NO className — plain style only
      <View key={item.key || gIdx} style={s.binaryRow}>
        <Text style={s.specLabel}>{String(item.label || item.key || "")}</Text>
        <View style={tog.wrap}>
          {(item.options || []).map((opt: any) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => {
                if (item.type === "division") {
                  const fullOpt = Array.isArray(divisions)
                    ? divisions.find((d) => (d.id || d._id || d.value) === opt.value)
                    : null;
                  setData((prev) => ({ ...prev, division: fullOpt || opt.value, divisionId: opt.value }));
                } else {
                  setData((prev) => ({
                    ...prev,
                    specs: {
                      ...prev.specs,
                      [item.key]: item.dataType === "boolean" ? opt.value === "Yes" : opt.value,
                    },
                  }));
                }
              }}
              style={[tog.btn, tog.btnFlex, isSelected(opt.value) ? tog.btnSelected : undefined]}
            >
              <Text style={[tog.txt, isSelected(opt.value) ? tog.txtSelected : tog.txtUnselected]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  /* -------------------------------------------------------------------------- */
  /*  QUESTION ITEM RENDERER
   *  Extracted so the render tree is clean and we can audit className usage.
   *  NO className on any element inside here.
   * -------------------------------------------------------------------------- */
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
      const rawOptions = q.options || meta?.options || [];
      const optionsArray = Array.isArray(rawOptions) ? rawOptions : [];
      options = optionsArray
        .map((opt: any) => (typeof opt === "string" ? opt : opt.name || opt.label))
        .filter((o: any) => !!o && String(o).trim().length > 0);
    }

    const questionLabel = q.question || q.label || q.field || `About the ${meta?.name || fieldKey}`;

    const isSelected = (opt: string) => {
      if (!fieldKey) return false;
      const current = questionAnswers?.[fieldKey];

      if (dataType === "boolean" || ["yes", "no", "true", "false"].includes(String(current).toLowerCase())) {
        if (opt === "Yes") return current === true || String(current).toLowerCase() === "yes" || String(current).toLowerCase() === "true";
        if (opt === "No") return current === false || String(current).toLowerCase() === "no" || String(current).toLowerCase() === "false";
      }

      const sCurrent = String(current ?? "").toLowerCase();
      const sOpt = String(opt ?? "").toLowerCase();
      if (sCurrent === sOpt) return true;

      const metaOptions = Array.isArray(meta?.options) ? meta.options : [];
      const matchingOpt = metaOptions.find(
        (o: any) => o && String(o.id || o._id || o.value || "").toLowerCase() === sCurrent,
      );
      return String(matchingOpt?.name || matchingOpt?.label || matchingOpt?.value || "").toLowerCase() === sOpt;
    };

    const handleSelect = (opt: string) => {
      if (!fieldKey || opt == null) return;
      setQuestionAnswers((prev: any) => {
        const newState = { ...(prev || {}) };
        if (dataType === "boolean") {
          newState[fieldKey] = opt === "Yes";
        } else {
          const metaOptions = Array.isArray(meta?.options) ? meta.options : [];
          const originalOpt = metaOptions.find(
            (o: any) => o && (o.name === opt || o.label === opt || o.value === opt || o === opt),
          );
          newState[fieldKey] = originalOpt ? originalOpt.id || originalOpt._id || originalOpt.value : opt;
        }
        return newState;
      });
    };

    // Large non-boolean lists → InlinePicker (no nav dep, no className)
    if (options.length > 3 && dataType !== "boolean" && options.length !== 2) {
      return (
        <InlinePicker
          key={fieldKey}
          label={String(questionLabel)}
          value={options.find((opt: string) => isSelected(opt)) || questionAnswers?.[fieldKey] || "Select Option"}
          options={options.map((opt) => ({ label: String(opt), value: String(opt) }))}
          onSelect={(opt) => { if (!opt) return; handleSelect(opt.value); }}
        />
      );
    }

    // Boolean / ≤3 options → InlineToggle (no className, no nav dep)
    return (
      // NO className — plain style only
      <View key={fieldKey} style={s.questionWrap}>
        <Text style={s.questionLabel}>{String(questionLabel)}</Text>

        {options.length > 0 ? (
          <InlineToggle
            options={options}
            selectedChecker={isSelected}
            onSelect={handleSelect}
          />
        ) : (
          <View style={s.textInputWrap}>
            <TextInput
              value={String(questionAnswers[fieldKey] ?? "")}
              onChangeText={(text) =>
                setQuestionAnswers((prev: any) => ({ ...prev, [fieldKey]: text }))
              }
              placeholder="Type your answer..."
              placeholderTextColor="#9CA3AF"
              keyboardType={meta?.dataType === "number" || q.dataType === "number" ? "numeric" : "default"}
              style={s.textInput}
            />
          </View>
        )}
      </View>
    );
  };

  /* -------------------------------------------------------------------------- */
  /*                                   RENDER                                   */
  /* -------------------------------------------------------------------------- */
  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#F7F6F3" }} edges={["top"]}>
      <View style={{ flex: 1, backgroundColor: "#F7F6F3" }}>
        {/* Header — static JSX, className is safe here */}
        <View className="px-5 py-4 flex-row items-center justify-between border-b border-gray-100 bg-white">
          <View className="flex-row items-center flex-1 pr-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center bg-white border border-gray-200 rounded-full mr-4"
            >
              <Ionicons name="chevron-back" size={20} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setLocationPickerVisible(true)} className="flex-1 justify-center">
              <Text style={{ fontFamily: "DM Serif Display", fontSize: 15, fontWeight: "400", color: "#333333", lineHeight: 20, marginBottom: 2 }}>
                Ad Details
              </Text>
              <View className="flex-row items-center">
                {place ? (
                  <Text className="text-[14px] text-gray-500 font-medium" numberOfLines={1} style={{ maxWidth: 180 }}>
                    {place}
                  </Text>
                ) : (
                  <Text className="text-[14px] text-gray-400 font-medium">Select location</Text>
                )}
                <Ionicons name="chevron-down" size={14} color="#6366F1" style={{ marginLeft: 4 }} />
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={clicked || isFormLoading || !data.title}
            className={`px-6 py-2.5 rounded-[24px] ${clicked || isFormLoading || !data.title ? "bg-gray-100" : "bg-[#1A1A1A]"}`}
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

        <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <ImagePreviewCard
            images={currentImages}
            initialImages={initialImages}
            onChange={(newImages) => setData((prev: any) => ({ ...prev, images: newImages }))}
          />

          {/* Basic Details — static, className safe */}
          <View className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 mb-5">
            <View className="flex-row justify-between items-center mb-5">
              <Text style={{ fontFamily: "DM Serif Display" }} className="text-xl text-gray-900">Basic Details</Text>
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
                  onChange={(val: string) => setData((prev) => ({ ...prev, title: val }))}
                />
                <View className="flex-row justify-between w-full">
                  {/* SelectRow here is safe — NOT inside .map() */}
                  <SelectRow
                    label="Category"
                    value={categoryName}
                    options={categories}
                    containerStyle={{ width: "48%" }}
                    onSelect={(opt: any) => {
                      const catId = opt.id || opt._id || opt.value;
                      setData((prev) => ({ ...prev, categoryId: catId, category: opt, subcategoryId: undefined, subcategory: undefined }));
                    }}
                  />
                  <SelectRow
                    label="Sub Category"
                    value={subcategoryName}
                    options={subcategories}
                    isLoading={isLoadingSubcategories}
                    containerStyle={{ width: "48%" }}
                    onSelect={(opt: any) => {
                      setData((prev) => ({ ...prev, subcategoryId: opt.id || opt._id, subcategory: opt, divisionId: undefined, division: undefined }));
                    }}
                  />
                </View>
              </>
            )}
          </View>

          {/* Specifications — renderBinarySpecItem + renderSpecItem, no className inside */}
          {generationStep >= GENERATION_STEPS.BASIC_FORM &&
            (generationStep < GENERATION_STEPS.SPECS_FORM || hasValidSpecs || divisions.length > 0 || !!data.division) && (
              <View className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 mb-5">
                <View className="flex-row justify-between items-center mb-5">
                  <Text style={{ fontFamily: "DM Serif Display" }} className="text-xl text-gray-900">Specifications</Text>
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
                        <View key={gIdx} style={{ flexDirection: "row", justifyContent: "space-between", width: "100%" }}>
                          {group.map((item) => renderSpecItem(item, group.length === 1 ? "100%" : "48%"))}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

          {/* Helpful Details — renderQuestionItem, no className inside */}
          {(generationStep < GENERATION_STEPS.DONE || questions.length > 0) &&
            generationStep >= GENERATION_STEPS.SPECS_FORM && (
              <View className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 mb-5">
                <View className="flex-row justify-between items-center mb-5">
                  <Text style={{ fontFamily: "DM Serif Display" }} className="text-xl text-gray-900">Helpful Details</Text>
                  <AISuggestedTag />
                </View>
                {generationStep < GENERATION_STEPS.DONE ? (
                  <>
                    <PostAdSkeleton className="h-20 w-full rounded-xl mb-3" />
                    <PostAdSkeleton className="h-20 w-full rounded-xl mb-3" />
                  </>
                ) : (
                  questions.map((q, idx) => renderQuestionItem(q, idx))
                )}
              </View>
            )}

          {/* Final Sections — static, className safe */}
          {generationStep === GENERATION_STEPS.DONE && (
            <>
              <View className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 mb-5">
                <Text style={{ fontFamily: "DM Serif Display" }} className="text-xl text-gray-900 mb-5">Set Price</Text>
                <View className="bg-gray-50/50 border border-gray-100 rounded-[18px] px-4 flex-row items-center h-16 shadow-sm shadow-black/[0.02]">
                  <View className="bg-white px-3 py-1.5 rounded-xl border border-gray-100 mr-3 shadow-sm">
                    <Text className="text-gray-900 font-bold text-xs">AED</Text>
                  </View>
                  <TextInput
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={data.price?.toString() || ""}
                    onChangeText={(v) => setData((prev) => ({ ...prev, price: v }))}
                    className="flex-1 text-2xl font-black text-gray-900"
                    placeholderTextColor="#D1D5DB"
                  />
                </View>
                <TouchableOpacity onPress={() => setIsNegotiable((prev) => !prev)} className="flex-row items-center mt-4 ml-1" activeOpacity={0.7}>
                  <View className={`w-6 h-6 rounded-lg border-2 items-center justify-center mr-3 ${isNegotiable ? "bg-indigo-600 border-indigo-600" : "bg-gray-50 border-gray-200"}`}>
                    {isNegotiable && <Ionicons name="checkmark" size={16} color="white" />}
                  </View>
                  <Text className={`text-sm font-semibold ${isNegotiable ? "text-indigo-600" : "text-gray-500"}`}>
                    Allow Price Negotiation
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 mb-8">
                <View className="flex-row justify-between items-center mb-5">
                  <Text style={{ fontFamily: "DM Serif Display" }} className="text-xl text-gray-900">Final Description</Text>
                  <AISuggestedTag />
                </View>
                <View className="bg-gray-50/50 border border-gray-100 rounded-[24px] p-5 shadow-sm shadow-black/[0.02]">
                  <TextInput
                    multiline
                    value={data.enhancedDescription}
                    onChangeText={(v) => setData((prev) => ({ ...prev, enhancedDescription: v }))}
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
                className={`mb-10 rounded-[24px] py-5 items-center justify-center flex-row shadow-xl ${clicked || isFormLoading || !data.title ? "bg-gray-100" : "bg-[#1A1A1A]"}`}
              >
                {clicked ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <View className={`mr-3 ${clicked || isFormLoading || !data.title ? "opacity-50" : ""}`}>
                      <Ionicons name="sparkles" size={18} color={clicked || isFormLoading || !data.title ? "#9CA3AF" : "#818CF8"} />
                    </View>
                    <Text className={`font-bold text-base tracking-tight ${clicked || isFormLoading || !data.title ? "text-gray-400" : "text-white"}`}>
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
        currentLocation={{ coordinates: { lat: coordinates?.lat || 0, lon: coordinates?.lon || 0 }, place: place || "Your location" }}
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
            router.replace({ pathname: "/product/[id]", params: { id: createdProductId } } as any);
          } else {
            router.replace("/home");
          }
        }}
      />
    </SafeAreaView>
  );
};

/* -------------------------------------------------------------------------- */
/*  Styles used inside .map() renderers — defined once, referenced by name.   */
/*  These replace every className that was previously on map-rendered nodes.  */
/* -------------------------------------------------------------------------- */
const s = StyleSheet.create({
  binaryRow: { marginBottom: 16, width: "100%" },
  specLabel: { color: "#111827", fontWeight: "700", fontSize: 13, marginBottom: 6, marginLeft: 2, flexWrap: "wrap", lineHeight: 18 },
  questionWrap: { marginBottom: 16 },
  questionLabel: { color: "#111827", fontWeight: "700", fontSize: 13, marginBottom: 6, marginLeft: 2, flexWrap: "wrap", lineHeight: 18 },
  textInputWrap: {
    backgroundColor: "rgba(249,250,251,0.5)",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 48,
    justifyContent: "center",
  },
  textInput: { color: "#111827", fontSize: 14, fontWeight: "600", width: "100%", height: "100%", paddingVertical: 0 },
});

export default PostAdDetails;