import { get, post } from "@/src/services/api";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useUserLocation } from "../../hooks/useUserLocation";
import { PostAdApi } from "./Api";

const GENERATION_STEPS = {
    PREVIEW: 0,
    BASIC_FORM: 1,
    SPECS_FORM: 2,
    DONE: 3,
};

const PostAdDetails = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { coordinates, refreshCurrentLocation } = useUserLocation();

    // From params
    const initialDescription = params.description as string;
    const initialImages = useMemo(() => {
        try {
            return params.images ? (JSON.parse(params.images as string) as string[]) : [];
        } catch (e) {
            if (__DEV__) console.warn("Failed to parse images param", e);
            return [];
        }
    }, [params.images]);

    // Refs
    const hasInitialized = React.useRef(false);

    // States
    const [generationStep, setGenerationStep] = useState(GENERATION_STEPS.PREVIEW);
    const [isFormLoading, setIsFormLoading] = useState(true);
    const [clicked, setClicked] = useState(false);

    const [images, setImages] = useState<string[]>(initialImages);
    const [data, setData] = useState<any>({});
    const [categories, setCategories] = useState<any[]>([]);
    const [subcategories, setSubcategories] = useState<any[]>([]);
    const [allSubcategories, setAllSubcategories] = useState<any[]>([]); // Added for local filtering
    const [isLoadingSubcategories, setIsLoadingSubcategories] = useState(false);
    const [negotiation, setNegotiation] = useState({ negotiate: false });
    const [questions, setQuestions] = useState<any[]>([]);
    const [imageKeys, setImageKeys] = useState<string[]>([]);
    const [questionAnswers, setQuestionAnswers] = useState<any>({});

    // Division fallback state
    const [divisions, setDivisions] = useState<any[]>([]);
    const [isLoadingDivisions, setIsLoadingDivisions] = useState(false);

    const normalizeFieldKey = (field: string) =>
        field
            .toLowerCase()
            .replace(/\s+/g, "")
            .replace(/[^a-z]/g, "");

    const hasValidSpecs = useMemo(() => {
        if (!data?.specs) {

            return false;
        }
        const hasSpecs = Object.values(data.specs).some(
            (v) => v !== null && v !== "" && v !== undefined
        );

        return hasSpecs;
    }, [data.specs]);

    /* ---------------- INIT ---------------- */
    useEffect(() => {
        if (!initialDescription || initialImages.length === 0 || hasInitialized.current) return;
        hasInitialized.current = true;
        fetchPreview(initialDescription, initialImages);
    }, [initialDescription, initialImages]);

    useEffect(() => {
        const fetchDropdowns = async () => {
            try {
                // Fetch Categories
                const catRes = await get(PostAdApi.categories);
                setCategories(catRes.data?.data || catRes.data || []);

                // Fetch Subcategories (Optimization: Fetch all once)
                setIsLoadingSubcategories(true);
                const subRes = await get(PostAdApi.subcategories);
                const allSubs = subRes.data?.data || subRes.data?.subcategories || subRes.data || [];
                setAllSubcategories(Array.isArray(allSubs) ? allSubs : []);
            } catch (err) {
                console.error("Failed loading dropdown data", err);
            } finally {
                setIsLoadingSubcategories(false);
            }
        };
        fetchDropdowns();
    }, []);

    // Filter subcategories locally when category changes
    useEffect(() => {
        if (data.categoryId && allSubcategories.length > 0) {
            const filtered = allSubcategories.filter((sub: any) => {
                const subCatId = sub.categoryId || sub.category_id || sub.category?.id;
                return subCatId === data.categoryId;
            });

            setSubcategories(filtered);
        } else {
            setSubcategories([]);
        }
    }, [data.categoryId, allSubcategories]);

    // Fetch divisions if subcategory changes
    useEffect(() => {
        const fetchDivisions = async () => {
            if (!data.subcategoryId) {
                setDivisions([]);
                return;
            }

            try {
                // If we don't have divisions yet, or subcategory changed, fetch them.
                // We always fetch to allow changing the division even if one is pre-selected by AI.
                setIsLoadingDivisions(true);
                const res = await get(`${PostAdApi.divisionBySubcategory}?subCategoryId=${data.subcategoryId}`);

                const divisionsData = res?.data?.data || res?.data || [];

                if (Array.isArray(divisionsData)) {
                    setDivisions(divisionsData);
                } else {
                    setDivisions([]);
                }
            } catch (error) {
                console.error("Failed to fetch divisions", error);
            } finally {
                setIsLoadingDivisions(false);
            }
        };
        fetchDivisions();
    }, [data.subcategoryId]);

    /* ---------------- SPECS NORMALIZATION ---------------- */
    // The backend returns specs as complex objects with metadata:
    // { brand: { type: "text", label: "Brand", value: "Land Rover", options: [], instruction: "..." } }
    // We need to extract just the values for display
    const normalizeSpecs = (specs: Record<string, any> | any[] = {}) => {


        if (!specs || typeof specs !== 'object') return {};

        // Handle array format (if backend sends array)
        if (Array.isArray(specs)) {
            const normalized = Object.fromEntries(
                specs
                    .filter((s: any) => s.value !== null && s.value !== undefined && s.value !== '')
                    .map((s: any) => [s.key || s.name || s.field || s.label, s.value])
            );

            return normalized;
        }

        // Handle object format with metadata
        // Extract value from each field object
        const normalized = Object.fromEntries(
            Object.entries(specs)
                .filter(([key, spec]) => {
                    // Skip if spec is null/undefined
                    if (!spec) return false;

                    // If spec is an object with a value property, check if value is valid
                    if (typeof spec === 'object' && 'value' in spec) {
                        const val = (spec as any).value;
                        return val !== null && val !== undefined && val !== '';
                    }

                    // If spec is a primitive value, check if it's valid
                    return spec !== null && spec !== undefined && spec !== '';
                })
                .map(([key, spec]) => {
                    // Extract the actual value
                    const value = spec && typeof spec === 'object' && 'value' in spec
                        ? (spec as any).value
                        : spec;

                    // Use the label if available, otherwise use the key
                    const label = spec && typeof spec === 'object' && 'label' in spec
                        ? (spec as any).label
                        : key;

                    return [label, value];
                })
        );


        return normalized;
    };

    /* ---------------- PREVIEW API ---------------- */
    async function fetchPreview(desc: string, imgs: string[]) {
        try {
            setIsFormLoading(true);
            setGenerationStep(GENERATION_STEPS.PREVIEW);

            const formData = new FormData();
            formData.append("level", "basic");
            formData.append("description", desc);

            imgs.forEach((uri) => {
                const fileName = uri.split('/').pop() || "image.jpg";
                const ext = fileName.split('.').pop()?.toLowerCase();
                // Ensure valid mime type, default to jpeg if unknown or missing
                const safeType = (ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'webp') ? ext : 'jpeg';

                formData.append('image', {
                    uri,
                    name: fileName,
                    type: `image/${safeType === 'jpg' ? 'jpeg' : safeType}`
                } as any);
            });

            const res = await post(PostAdApi.previewProduct, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (!res?.data) {
                Toast.show({ type: 'error', text1: 'Preview failed', text2: 'Failed to generate preview' });
                setIsFormLoading(false);
                return;
            }

            const basic = res.data;
            setImageKeys(basic.images || []);

            const uiData = {
                ...basic,
                title: basic.title || "",
                enhancedDescription: basic.enhanced_description || basic.description || "",
                categoryId: basic?.category?.id || basic?.category?._id || basic?.category?.value,
                subcategoryId: basic?.subcategory?.id || basic?.subcategory?._id || basic?.subcategory?.value,
                category: basic.category,
                subcategory: basic.subcategory,
                price: basic.price || "",
            };


            setData(uiData);
            setGenerationStep(GENERATION_STEPS.BASIC_FORM);

            await fetchIntermediate({
                ...basic,
                images: basic.images || [],
            });
        } catch (err) {
            console.error("Preview failed:", err);
            Toast.show({ type: 'error', text1: 'Error', text2: 'AI Analysis failed' });
            setIsFormLoading(false);
        }
    }

    async function fetchIntermediate(basic: any) {
        try {
            const res = await post(PostAdApi.previewProduct, {
                level: "intermediate",
                description: basic?.enhanced_description,
                basicData: {
                    ...basic,
                    images: basic?.images || [],
                },
            });

            if (!res?.data) {
                console.warn("Intermediate API returned no data");
            }


            const intermediate = res.data || {};

            // Extract specs logic:
            // 1. Check if there is an explicit 'specs' object (which seemingly contains the specs)
            let extractedSpecs: Record<string, any> = intermediate.specs || {};

            // 2. Also look for root-level fields that might be specs (legacy behavior or mixed response)
            Object.entries(intermediate).forEach(([key, value]) => {
                if (key === 'slug' || key === 'images' || key === 'questions' || key === 'specs') return;

                if (value && typeof value === 'object' && 'value' in value) {
                    const specObj = value as any;
                    // If it looks like a spec object (has value property)
                    if (specObj.value !== null && specObj.value !== undefined && specObj.value !== '') {
                        extractedSpecs[key] = specObj;
                    }
                }
            });



            // Merge intermediate data while preserving basic info
            setData((prev: any) => {
                const merged = {
                    ...prev,
                    ...intermediate,
                    title: intermediate.title || prev.title,
                    enhancedDescription: intermediate.enhanced_description || prev.enhancedDescription,
                    categoryId: intermediate?.category?.id || prev.categoryId,
                    subcategoryId: intermediate?.subcategory?.id || prev.subcategoryId,
                    category: intermediate.category || prev.category,
                    subcategory: intermediate.subcategory || prev.subcategory,
                    divisionId: intermediate?.division?.id || prev.divisionId,
                    specs: normalizeSpecs(extractedSpecs),
                    price: intermediate.price || prev.price,
                };

                return merged;
            });

            setGenerationStep(GENERATION_STEPS.SPECS_FORM);

            await fetchFinal({
                description: basic.enhanced_description,
                intermediate,
                images: basic.images // Pass images explicitly
            });
        } catch (err) {
            console.error("Intermediate AI failed:", err);
            setIsFormLoading(false);
            // Graceful recovery: Unlock UI so user can edit manually
            setGenerationStep(GENERATION_STEPS.DONE);
            Toast.show({ type: 'info', text1: 'AI Partial Completion', text2: 'Please review and fill remaining details.' });
        }
    }

    async function fetchFinal({ description, intermediate, images }: any) {
        try {
            const res = await post(PostAdApi.previewProduct, {
                level: "final",
                description,
                partialListing: {
                    ...intermediate,
                    images: images || imageKeys, // Use passed images or fallback
                },
            });



            const finalPayload = res.data ?? res;

            // Extract questions from various possible locations
            const questionsData = finalPayload.questions || finalPayload.dynamicQuestions || finalPayload.additionalQuestions || [];

            if (questionsData && questionsData.length > 0) {
                setQuestions(questionsData);
            }

            // Merge final data while preserving all previous info
            setData((prev: any) => {
                const merged = {
                    ...prev,
                    ...finalPayload,
                    title: finalPayload.title || prev.title,
                    enhancedDescription: finalPayload.enhanced_description || prev.enhancedDescription,
                    categoryId: finalPayload?.category?.id || prev.categoryId,
                    subcategoryId: finalPayload?.subcategory?.id || prev.subcategoryId,
                    category: finalPayload.category || prev.category,
                    subcategory: finalPayload.subcategory || prev.subcategory,
                    divisionId: finalPayload?.division?.id || prev.divisionId,
                    specs: normalizeSpecs(finalPayload.specs || finalPayload.specifications || prev.specs || {}),
                    price: finalPayload.price || prev.price,
                };

                return merged;
            });
            setIsFormLoading(false);
            setGenerationStep(GENERATION_STEPS.DONE);
        } catch (err) {
            console.error("Final AI generation error:", err);
            setIsFormLoading(false);
            // Graceful recovery
            setGenerationStep(GENERATION_STEPS.DONE);
        }
    }

    const categoryName = useMemo(() => {
        if (!data?.categoryId || categories.length === 0) {
            return data?.category?.name || data?.category?.label || "";
        }
        const cat = categories.find((c) => (c.id || c._id || c.value) === data.categoryId);
        return cat?.name || cat?.label || data?.category?.name || "";
    }, [categories, data.categoryId, data?.category]);

    const subcategoryName = useMemo(() => {
        if (!data?.subcategoryId || subcategories.length === 0) {
            return data?.subcategory?.name || data?.subcategory?.label || "";
        }
        const sub = subcategories.find((s) => (s.id || s._id || s.value) === data.subcategoryId);
        return sub?.name || sub?.label || data?.subcategory?.name || "";
    }, [subcategories, data.subcategoryId, data?.subcategory]);

    /* ---------------- SUBMIT ---------------- */
    const handleSubmit = async () => {
        if (clicked) {
            return;
        }
        setClicked(true);



        // Check if coordinates valid (not 0,0 and passed existence check)
        if (!coordinates || !coordinates.lat || coordinates.lat === 0) {
            Toast.show({ type: "info", text1: "Location Required", text2: "Requesting location permission..." });
            try {
                // once the state updates.
                refreshCurrentLocation();
            } catch (err) {
                console.error("Failed to request location", err);
            }
            Toast.show({ type: "error", text1: "Location not found", text2: "Please enable location and try again" });
            setClicked(false);
            return;
        }

        try {
            const rawPrice = Number(data.price);
            const normalizedPrice = isNaN(rawPrice) ? 0 : rawPrice;

            // Format complex specs for backend
            const formattedSpecs: any = {};

            // 1. Process existing numeric/text specs
            if (data.specs) {
                Object.entries(data.specs).forEach(([k, v]) => {
                    formattedSpecs[k] = { value: v, label: k };
                });
            }

            // 2. Process question answers
            Object.entries(questionAnswers).forEach(([k, v]) => {
                // Find original question to get proper label if possible
                const q = questions.find(q => {
                    const qKey = q.key || q.slug || normalizeFieldKey(q.field || q.label || "question");
                    return qKey === k;
                });
                formattedSpecs[k] = {
                    value: v,
                    label: q?.label || q?.field || k
                };
            });

            const payload = {
                // Spread necessary data but we'll override explicitly to be safe
                ...data,

                // Explicit IDs
                categoryId: data.categoryId || data.category?.id || data.category?._id,
                subcategoryId: data.subcategoryId || data.subcategory?.id || data.subcategory?._id,
                divisionId: data.divisionId || data.division?.id || data.division?._id, // Critical for user request: Check division submission

                // Remove objects that might cause backend validation errors if it expects IDs
                category: undefined,
                subcategory: undefined,
                division: undefined,

                price: normalizedPrice,
                specs: formattedSpecs,
                ...negotiation,
                description: data.enhancedDescription,
                location: {
                    type: "Point",
                    coordinates: [coordinates.lon, coordinates.lat],
                },

                // Ensure images are the array of keys/urls
                images: data.images || images || [],
            };

            const res = await post(PostAdApi.createProduct, payload);

            if (res.status === 200 || res.status === 201) {
                Toast.show({ type: 'success', text1: 'Success', text2: 'Ad posted successfully!' });
                router.replace("/home");
            } else {

                let errorMsg = res.message || 'Failed to submit';

                // If we have detailed validation errors (often in res.data or res.data.message)
                if (res.data && typeof res.data === 'object') {
                    // Check for common backend validation formats, e.g. express-validator or class-validator
                    const details = res.data.message || res.data.errors || res.data;
                    if (typeof details === 'string') {
                        errorMsg = details;
                    } else if (Array.isArray(details)) {
                        errorMsg = details.map((e: any) => e.msg || e.message || JSON.stringify(e)).join('\n');
                    } else if (typeof details === 'object') {
                        // Extract first error message from object values
                        const firstVal = Object.values(details)[0];
                        if (typeof firstVal === 'string') errorMsg = firstVal as string;
                    }
                }

                Toast.show({ type: 'error', text1: 'Validation Error', text2: errorMsg });
            }
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to submit ad' });
        } finally {
            setClicked(false);
        }
    };

    /* ---------------- RENDER HELPERS ---------------- */
    const AISuggestedTag = () => (
        <View className="flex-row items-center self-start px-2.5 py-1 rounded-full border border-purple-200 mb-3 bg-purple-50/50">
            <Text className="text-yellow-500 mr-1.5 text-xs">✨</Text>
            <Text className="text-purple-600 font-bold text-[10px] tracking-wider uppercase">AI Suggested</Text>
        </View>
    );

    const Skeleton = ({ className = "", style = {} }: any) => {
        const animatedValue = React.useRef(new Animated.Value(0)).current;

        useEffect(() => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(animatedValue, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(animatedValue, {
                        toValue: 0,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }, []);

        const opacity = animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.4, 0.8],
        });

        return (
            <Animated.View style={[{ opacity }, style]} className={`overflow-hidden ${className}`}>
                <LinearGradient
                    colors={['#f7e2fbff', '#d8ecf9ff', '#d7d1f3ff']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ flex: 1 }}
                />
            </Animated.View>
        );
    };

    const ImagePreviewCard = () => {
        const isLoading = generationStep === GENERATION_STEPS.PREVIEW;
        return (
            <View className="bg-white rounded-3xl p-4 flex-row items-center shadow-lg shadow-gray-200 border border-gray-100 mb-6">
                <View className="w-24 h-20 rounded-2xl bg-gray-50 overflow-hidden items-center justify-center border border-gray-100">
                    {isLoading ? (
                        <Skeleton className="w-full h-full" />
                    ) : (
                        <Image
                            source={{ uri: images[0] }}
                            style={{ width: '100%', height: '100%' }}
                            contentFit="cover"
                        />
                    )}
                </View>
                <View className="ml-4 flex-1">
                    {isLoading ? (
                        <>
                            <Skeleton className="h-3 w-20 rounded-full mb-2" />
                            <Skeleton className="h-5 w-48 rounded-md mb-2" />
                            <Skeleton className="h-3 w-full rounded-full" />
                        </>
                    ) : (
                        <>
                            <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                                {categoryName || "Detecting..."} • {subcategoryName || "..."}
                            </Text>
                            <Text className="text-gray-900 font-bold text-base mb-1" numberOfLines={1}>
                                {data.title || "AI is generating title..."}
                            </Text>
                            <Text className="text-gray-500 text-[11px] leading-4" numberOfLines={2}>
                                {data.enhancedDescription || "Analyzing description..."}
                            </Text>
                        </>
                    )}
                </View>
            </View>
        );
    };

    const EditableRow = ({ label, value, onChange, placeholder, type = "default" }: any) => (
        <View className="mb-4">
            <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-wider mb-1.5 ml-1">{label}</Text>
            <View className="bg-white border border-gray-100 rounded-2xl px-4 h-12 justify-center shadow-sm shadow-gray-100">
                <TextInput
                    value={value?.toString()}
                    onChangeText={onChange}
                    placeholder={placeholder}
                    placeholderTextColor="#9CA3AF"
                    keyboardType={type === "number" ? "numeric" : "default"}
                    className="text-gray-900 text-sm font-medium"
                />
            </View>
        </View>
    );

    const SelectRow = ({ label, value, options, onSelect, isLoading = false }: any) => {
        const [open, setOpen] = useState(false);

        return (
            <View className="mb-4">
                <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-wider mb-1.5 ml-1">{label}</Text>
                <TouchableOpacity
                    onPress={() => {
                        if (isLoading) return;

                        setOpen(!open);
                    }}
                    disabled={isLoading}
                    className={`bg-white border border-gray-100 rounded-2xl px-4 h-12 shadow-sm shadow-gray-100 flex-row justify-between items-center ${isLoading ? 'opacity-50' : ''}`}
                >
                    <Text className={`text-sm font-medium ${value ? 'text-gray-900' : 'text-gray-400'}`}>
                        {isLoading ? 'Loading...' : (value || `Select ${label}`)}
                    </Text>
                    <View className="flex-row items-center">
                        {isLoading && <ActivityIndicator size="small" color="#A855F7" className="mr-2" />}
                        {!isLoading && options?.length > 0 && null}
                        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color="#9CA3AF" />
                    </View>
                </TouchableOpacity>
                {open && options?.length > 0 && (
                    <View className="mt-2 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-xl shadow-black/5 max-h-64">
                        <ScrollView nestedScrollEnabled>
                            {options.map((opt: any) => (
                                <TouchableOpacity
                                    key={opt.id || opt._id || opt.value}
                                    onPress={() => {

                                        onSelect(opt);
                                        setOpen(false);
                                    }}
                                    className="px-4 py-3 border-b border-gray-50 active:bg-gray-50"
                                >
                                    <Text className="text-sm text-gray-700">{opt.name || opt.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
                {open && (!options || options.length === 0) && (
                    <View className="mt-2 bg-gray-50 border border-gray-100 rounded-2xl p-4">
                        <Text className="text-gray-400 text-sm text-center italic">No options available</Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1" edges={['top']}>
            <LinearGradient
                colors={['#f7e2fbff', '#d8ecf9ff', '#d7d1f3ff']} // Very light Pink, Blue, Purple
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
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text className="text-xl font-black text-gray-900 flex-1 text-center mr-10">Sell With Ai</Text>
                </View>

                <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    <ImagePreviewCard />

                    {/* Basic Info */}
                    <View className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 mb-3">
                        <AISuggestedTag />
                        <Text className="text-xl font-bold text-gray-900 mb-5">Basic Information</Text>
                        {generationStep < GENERATION_STEPS.BASIC_FORM ? (
                            <>
                                <Skeleton className="h-12 w-full rounded-xl mb-3" />
                                <Skeleton className="h-12 w-full rounded-xl mb-3" />
                                <Skeleton className="h-12 w-full rounded-xl mb-3" />
                            </>
                        ) : (
                            <>
                                <EditableRow label="Title" value={data.title} onChange={(val: string) => setData({ ...data, title: val })} />
                                <SelectRow
                                    label="Category"
                                    value={categoryName}
                                    options={categories}
                                    onSelect={(opt: any) => {
                                        const catId = opt.id || opt._id || opt.value;

                                        setData({ ...data, categoryId: catId, category: opt, subcategoryId: null, subcategory: null });
                                        setSubcategories([]);
                                    }}
                                />
                                <SelectRow
                                    label="Subcategory"
                                    value={subcategoryName}
                                    options={subcategories}
                                    isLoading={isLoadingSubcategories}
                                    onSelect={(opt: any) => {

                                        setData({ ...data, subcategoryId: opt.id || opt._id, subcategory: opt, division: null });
                                    }}
                                />
                            </>
                        )}
                    </View>

                    {/* Specs */}
                    {generationStep >= GENERATION_STEPS.BASIC_FORM && (generationStep < GENERATION_STEPS.SPECS_FORM || hasValidSpecs || !data.division || !!data.division) && (
                        <View className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 mb-3">
                            <AISuggestedTag />
                            <Text className="text-xl font-bold text-gray-900 mb-5">Specifications</Text>
                            {generationStep < GENERATION_STEPS.SPECS_FORM ? (
                                <>
                                    <Skeleton className="h-12 w-full rounded-xl mb-3" />
                                    <Skeleton className="h-12 w-full rounded-xl mb-3" />
                                </>
                            ) : (
                                <>
                                    {/* Division (If present from AI key/no options loaded) */}
                                    {data.division && divisions.length === 0 && (
                                        <View className="mb-4">
                                            <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-wider mb-1.5 ml-1 capitalize">Division</Text>
                                            <View className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5">
                                                <Text className="text-gray-900 text-sm font-medium">{data.division.name || data.division.label || "Selected"}</Text>
                                            </View>
                                        </View>
                                    )}

                                    {Object.entries(data.specs || {})
                                        .filter(([_, v]) => v !== null && v !== "")
                                        .map(([key, value]) => (
                                            <View key={key} className="mb-4">
                                                <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-wider mb-1.5 ml-1 capitalize">{key}</Text>
                                                <View className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-0.5">
                                                    <TextInput
                                                        value={value?.toString()}
                                                        onChangeText={(v) => setData({ ...data, specs: { ...data.specs, [key]: v } })}
                                                        className="text-gray-900 text-sm font-medium"
                                                    />
                                                </View>
                                            </View>
                                        ))}

                                    {/* Division Fallback (Dropdown) */}
                                    {(!data.division || divisions.length > 0) && (
                                        <SelectRow
                                            label="Division / Type"
                                            value={data.division?.name || data.division?.label}
                                            options={divisions}
                                            isLoading={isLoadingDivisions}
                                            onSelect={(opt: any) => {
                                                setData({ ...data, division: opt, divisionId: opt.id || opt._id });
                                            }}
                                        />
                                    )}
                                </>
                            )}
                        </View>
                    )}

                    {/* Questions */}
                    {generationStep >= GENERATION_STEPS.SPECS_FORM && (
                        <View className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 mb-3">
                            <AISuggestedTag />
                            <Text className="text-xl font-bold text-gray-900 mb-5">Helpful Details</Text>
                            {generationStep < GENERATION_STEPS.DONE ? (
                                <>
                                    <Skeleton className="h-20 w-full rounded-xl mb-3" />
                                    <Skeleton className="h-20 w-full rounded-xl mb-3" />
                                </>
                            ) : (
                                questions.length > 0 ? questions.map((q, idx) => {
                                    const fieldKey = q.key || q.slug || normalizeFieldKey(q.field || q.label || "question");
                                    return (
                                        <View key={idx} className="mb-6">
                                            <Text className="text-gray-800 text-sm font-bold mb-3 ml-1">{q.question || q.label || q.field}</Text>
                                            <View className="flex-row flex-wrap gap-2">
                                                {(q.options || []).map((opt: string) => (
                                                    <TouchableOpacity
                                                        key={opt}
                                                        onPress={() => setQuestionAnswers({ ...questionAnswers, [fieldKey]: opt })}
                                                        style={{
                                                            paddingHorizontal: 16,
                                                            paddingVertical: 10,
                                                            borderRadius: 16,
                                                            borderWidth: 1,
                                                            borderColor: questionAnswers[fieldKey] === opt ? '#000' : '#f3f4f6', // gray-100
                                                            backgroundColor: questionAnswers[fieldKey] === opt ? '#000' : '#fff',
                                                            shadowColor: "#000",
                                                            shadowOffset: { width: 0, height: 2 },
                                                            shadowOpacity: questionAnswers[fieldKey] === opt ? 0.2 : 0,
                                                            shadowRadius: 4,
                                                            elevation: questionAnswers[fieldKey] === opt ? 4 : 0
                                                        }}
                                                    >
                                                        <Text style={{
                                                            fontSize: 12,
                                                            fontWeight: questionAnswers[fieldKey] === opt ? '700' : '400',
                                                            color: questionAnswers[fieldKey] === opt ? '#fff' : '#4b5563' // gray-600
                                                        }}>{opt}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>
                                    );
                                }) : (
                                    <Text className="text-gray-400 italic text-sm text-center py-4">All set! No extra details needed.</Text>
                                )
                            )}
                        </View>
                    )}

                    {/* Final Sections */}
                    {generationStep === GENERATION_STEPS.DONE && (
                        <>
                            {/* Price */}
                            <View className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 mb-3">
                                <Text className="text-xl font-bold text-gray-900 mb-5">Set Price</Text>
                                <View className="bg-gray-50 border border-gray-100 rounded-[6px] px-4 flex-row items-center">
                                    <Text className="text-gray-400 font-bold mr-2">AED</Text>
                                    <TextInput
                                        placeholder="0"
                                        keyboardType="numeric"
                                        value={data.price?.toString()}
                                        onChangeText={(v) => setData({ ...data, price: v })}
                                        className="flex-1 text-2xl font-black text-gray-900"
                                    />
                                </View>

                                <TouchableOpacity
                                    onPress={() => setNegotiation({ ...negotiation, negotiate: !negotiation.negotiate })}
                                    className="flex-row items-center mt-6 ml-2"
                                >
                                    <View className={`w-6 h-6 rounded-lg border-2 items-center justify-center mr-3 ${negotiation.negotiate ? 'bg-green-500 border-green-500' : 'border-gray-200'}`}>
                                        {negotiation.negotiate && <Ionicons name="checkmark" size={16} color="white" />}
                                    </View>
                                    <Text className="text-gray-700 font-bold text-sm">Allow Price Negotiation</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Description */}
                            <View className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 mb-10">
                                <AISuggestedTag />
                                <Text className="text-xl font-bold text-gray-900 mb-5">Final Description</Text>
                                <View className="bg-gray-50 border border-gray-100 rounded-3xl p-5 min-h-[160px]">
                                    <TextInput
                                        multiline
                                        value={data.enhancedDescription}
                                        onChangeText={(v) => setData({ ...data, enhancedDescription: v })}
                                        className="text-sm text-gray-800 leading-5"
                                        textAlignVertical="top"
                                        placeholder="Review the AI enhanced description..."
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={handleSubmit}
                                disabled={clicked || isFormLoading || !data.title}
                                className={`rounded-2xl py-4 items-center justify-center flex-row shadow-sm ${clicked || isFormLoading || !data.title
                                    ? 'bg-gray-100 border border-gray-200'
                                    : 'bg-black shadow-lg shadow-purple-500/20'
                                    }`}
                            >
                                {clicked ? (
                                    <ActivityIndicator color="#A855F7" />
                                ) : (
                                    <>
                                        <View className={`mr-2 ${clicked || isFormLoading || !data.title ? 'opacity-50' : ''}`}>
                                            <Ionicons name="sparkles" size={18} color={clicked || isFormLoading || !data.title ? "#9CA3AF" : "#A855F7"} />
                                        </View>
                                        <Text className={`font-bold text-base ${clicked || isFormLoading || !data.title ? 'text-gray-400' : 'text-white'
                                            }`}>
                                            Post Ad Now
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </>
                    )}
                </ScrollView>
            </LinearGradient>
        </SafeAreaView >
    );
};

export default PostAdDetails;
