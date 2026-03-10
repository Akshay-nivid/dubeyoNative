import { post } from "@/src/services/api";
import { useState } from "react";
import Toast from "react-native-toast-message";
import { PostAdApi } from "../screens/postAd/Api";

export const GENERATION_STEPS = {
    PREVIEW: 0,
    BASIC_FORM: 1,
    SPECS_FORM: 2,
    DONE: 3,
};

export const usePostAdAI = () => {
    const [generationStep, setGenerationStep] = useState(GENERATION_STEPS.PREVIEW);
    const [isFormLoading, setIsFormLoading] = useState(true);
    const [data, setData] = useState<any>({});
    const [questions, setQuestions] = useState<any[]>([]);
    const [imageKeys, setImageKeys] = useState<string[]>([]);

    const normalizeFieldKey = (field: string) =>
        field
            .toLowerCase()
            .replace(/\s+/g, "")
            .replace(/[^a-z]/g, "");

    /* ---------------- DATA EXTRACTION HELPERS ---------------- */
    const extractQuestions = (payload: any) => {
        if (!payload) return [];
        const questionsList = [
            ...(payload.questions || []),
            ...(payload.dynamicQuestions || []),
            ...(payload.additionalQuestions || [])
        ];

        // Deduplicate by question text
        const seen = new Set();
        return questionsList.filter(q => {
            const text = q.question || q.label || q.field;
            if (!text || seen.has(text)) return false;
            seen.add(text);
            return true;
        });
    };

    const normalizeSpecs = (specs: Record<string, any> | any[] = {}) => {
        if (!specs || typeof specs !== 'object') return {};

        const isValid = (val: any) => {
            if (val === null || val === undefined || val === '') return false;
            if (typeof val === 'string' && val.toLowerCase() === 'null') return false;
            return true;
        };

        if (Array.isArray(specs)) {
            return Object.fromEntries(
                specs
                    .filter((s: any) => isValid(s.value))
                    .map((s: any) => [s.key || s.name || s.field || s.label, s.value])
            );
        }

        return Object.fromEntries(
            Object.entries(specs)
                .filter(([_, spec]) => {
                    if (!spec) return false;
                    if (typeof spec === 'object' && 'value' in spec) {
                        return isValid((spec as any).value);
                    }
                    return isValid(spec);
                })
                .map(([key, spec]) => {
                    const value = spec && typeof spec === 'object' && 'value' in spec
                        ? (spec as any).value
                        : spec;
                    const label = spec && typeof spec === 'object' && 'label' in spec
                        ? (spec as any).label
                        : key;
                    return [label, value];
                })
        );
    };

    const fetchPreview = async (desc: string, imgs: string[]) => {
        try {
            setIsFormLoading(true);
            setGenerationStep(GENERATION_STEPS.PREVIEW);

            const formData = new FormData();
            formData.append("level", "basic");
            formData.append("description", desc);

            imgs.forEach((uri) => {
                const fileName = uri.split('/').pop() || "image.jpg";
                const ext = fileName.split('.').pop()?.toLowerCase();
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
    };

    const fetchIntermediate = async (basic: any) => {
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

            const questionsData = extractQuestions(intermediate);
            if (questionsData.length > 0) {
                setQuestions(questionsData); // Matches old code's replacement behavior
            }

            let extractedSpecs: Record<string, any> = intermediate.specs || intermediate.specifications || {};
            Object.entries(intermediate).forEach(([key, value]) => {
                if (key === 'slug' || key === 'images' || key === 'questions' || key === 'specs' || key === 'specifications' || key === 'category' || key === 'subcategory' || key === 'division') return;
                if (value && typeof value === 'object' && 'value' in value) {
                    const specObj = value as any;
                    if (specObj.value !== null && specObj.value !== undefined && specObj.value !== '') {
                        extractedSpecs[key] = specObj;
                    }
                }
            });

            setData((prev: any) => {
                const merged = {
                    ...prev,
                    ...intermediate,
                    title: intermediate.title || prev.title,
                    enhancedDescription: intermediate.enhanced_description || prev.enhancedDescription,
                    categoryId: intermediate?.category?.id || intermediate?.category?._id || intermediate?.category?.value || prev.categoryId,
                    subcategoryId: intermediate?.subcategory?.id || intermediate?.subcategory?._id || intermediate?.subcategory?.value || prev.subcategoryId,
                    category: intermediate.category || prev.category,
                    subcategory: intermediate.subcategory || prev.subcategory,
                    divisionId: intermediate?.division?.id || intermediate?.division?._id || prev.divisionId,
                    division: intermediate.division || prev.division,
                    specs: normalizeSpecs(Object.keys(extractedSpecs).length > 0 ? extractedSpecs : (prev.specs || {})),
                    price: intermediate.price || prev.price,
                };
                return merged;
            });

            setGenerationStep(GENERATION_STEPS.SPECS_FORM);

            await fetchFinal({
                description: basic.enhanced_description,
                intermediate,
                images: basic.images
            });
        } catch (err) {
            console.error("Intermediate AI failed:", err);
            setIsFormLoading(false);
            setGenerationStep(GENERATION_STEPS.DONE);
            Toast.show({ type: 'info', text1: 'AI Partial Completion', text2: 'Please review and fill remaining details.' });
        }
    };

    const fetchFinal = async ({ description, intermediate, images }: any) => {
        try {
            const res = await post(PostAdApi.previewProduct, {
                level: "final",
                description,
                partialListing: {
                    ...intermediate,
                    images: images || imageKeys,
                },
            });

            const finalPayload = res.data ?? res;

            const questionsData = extractQuestions(finalPayload);
            if (questionsData && questionsData.length > 0) {
                setQuestions(questionsData); // Matches old code's replacement behavior
            }

            let extractedSpecs: Record<string, any> = finalPayload.specs || finalPayload.specifications || {};
            Object.entries(finalPayload).forEach(([key, value]) => {
                if (key === 'slug' || key === 'images' || key === 'questions' || key === 'specs' || key === 'specifications' || key === 'category' || key === 'subcategory' || key === 'division') return;
                if (value && typeof value === 'object' && 'value' in value) {
                    const specObj = value as any;
                    if (specObj.value !== null && specObj.value !== undefined && specObj.value !== '') {
                        extractedSpecs[key] = specObj;
                    }
                }
            });

            setData((prev: any) => {
                const merged = {
                    ...prev,
                    ...finalPayload,
                    title: finalPayload.title || prev.title,
                    enhancedDescription: finalPayload.enhanced_description || prev.enhancedDescription,
                    categoryId: finalPayload?.category?.id || finalPayload?.category?._id || finalPayload?.category?.value || prev.categoryId,
                    subcategoryId: finalPayload?.subcategory?.id || finalPayload?.subcategory?._id || finalPayload?.subcategory?.value || prev.subcategoryId,
                    category: finalPayload.category || prev.category,
                    subcategory: finalPayload.subcategory || prev.subcategory,
                    divisionId: finalPayload?.division?.id || finalPayload?.division?._id || prev.divisionId,
                    division: finalPayload.division || prev.division,
                    specs: normalizeSpecs(Object.keys(extractedSpecs).length > 0 ? extractedSpecs : (prev.specs || {})),
                    price: finalPayload.price || prev.price,
                };
                return merged;
            });
            setIsFormLoading(false);
            setGenerationStep(GENERATION_STEPS.DONE);
        } catch (err) {
            console.error("Final AI generation error:", err);
            setIsFormLoading(false);
            setGenerationStep(GENERATION_STEPS.DONE);
        }
    };

    return {
        generationStep,
        isFormLoading,
        data,
        setData,
        questions,
        imageKeys,
        fetchPreview,
        normalizeFieldKey
    };
};
