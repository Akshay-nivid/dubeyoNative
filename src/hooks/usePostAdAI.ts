import { API_BASE_URL } from "@/src/constants/env";
import { post } from "@/src/services/api";
import { getToken } from "@/src/services/storage/tokenStorage";
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
  const [generationStep, setGenerationStep] = useState(
    GENERATION_STEPS.PREVIEW,
  );
  const [isFormLoading, setIsFormLoading] = useState(true);
  const [data, setData] = useState<any>({});
  const [questions, setQuestions] = useState<any[]>([]);
  const [specMetadata, setSpecMetadata] = useState<Record<string, any>>({});
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
      ...(payload.additionalQuestions || []),
    ];

    // Deduplicate and filter redundant questions
    const seen = new Set();
    const REDUNDANT_KEYS = ["location", "price", "coordinates", "address", "gps"];

    return questionsList
      .filter((q) => {
        const text = (q.question || q.label || q.field || "").toLowerCase();
        const key = (q.key || q.slug || q.field || "").toLowerCase();

        if (!text || seen.has(text)) return false;

        // Skip if it asks about location or price which are separate UI sections
        const isRedundant =
          REDUNDANT_KEYS.some((rk) => key.includes(rk) || text.includes(rk));
        if (isRedundant) return false;

        seen.add(text);
        return true;
      })
      .map((q) => ({
        ...q,
        options: (q.options || []).filter((o: any) => o !== null && o !== undefined),
      }));
  };

  const normalizeSpecs = (specs: Record<string, any> | any[] = {}) => {
    if (!specs || typeof specs !== "object") return {};

    const isValid = (val: any) => {
      if (val === null || val === undefined || val === "") return false;
      if (typeof val === "string" && val.toLowerCase() === "null") return false;
      return true;
    };

    if (Array.isArray(specs)) {
      return Object.fromEntries(
        specs
          .filter((s: any) => isValid(s.value))
          .map((s: any) => [s.key || s.name || s.field || s.label, s.value]),
      );
    }

    return Object.fromEntries(
      Object.entries(specs)
        .filter(([_, spec]) => {
          if (!spec) return false;
          if (typeof spec === "object" && "value" in spec) {
            return isValid((spec as any).value);
          }
          return isValid(spec);
        })
        .map(([key, spec]) => {
          const value =
            spec && typeof spec === "object" && "value" in spec
              ? (spec as any).value
              : spec;
          const label =
            spec && typeof spec === "object" && "label" in spec
              ? (spec as any).label
              : key;
          return [label, value];
        }),
    );
  };

  const fetchPreview = async (desc: string, imgs: string[]) => {
    try {
      setIsFormLoading(true);
      setGenerationStep(GENERATION_STEPS.PREVIEW);

      // --- Step 1: Upload Images ---
      const uploadedImageKeys: string[] = [];
      const imageUploadPromises = imgs.map(async (uri) => {
        try {
          const formData = new FormData();
          let fileName = uri.split("/").pop() || "image.jpg";
          let ext = "jpg";

          if (fileName.includes(".")) {
            ext = fileName.split(".").pop()?.toLowerCase() || "jpg";
          } else {
            fileName = `${fileName}.jpg`;
          }

          if (!["jpg", "jpeg", "png", "webp"].includes(ext)) {
            ext = "jpg";
            fileName = `${fileName.split(".")[0]}.jpg`;
          }

          const safeType = ext === "jpg" ? "jpeg" : ext;

          // React Native FormData URI normalization for iOS/Android
          const normalizedUri = uri;

          formData.append("image", {
            uri: normalizedUri,
            name: fileName,
            type: `image/${safeType}`,
          } as any);

          const token = await getToken();
          const targetUrl = `${API_BASE_URL}${PostAdApi.uploadImage}`;

          console.log("Uploading:", {
            uri: normalizedUri,
            name: fileName,
            type: `image/${safeType}`,
          });

          const res = await fetch(targetUrl, {
            method: "POST",
            body: formData,
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await res.json();
          if (data?.data) {
            uploadedImageKeys.push(data.data);
          } else {
            console.warn("Upload failed response:", data);
          }
        } catch (uploadErr) {
          console.warn("Failed to upload an image", uploadErr);
        }
      });

      await Promise.all(imageUploadPromises);

      if (uploadedImageKeys.length === 0 && imgs.length > 0) {
        Toast.show({
          type: "error",
          text1: "Upload failed",
          text2: "Failed to upload images.",
        });
        setIsFormLoading(false);
        return;
      }

      setImageKeys(uploadedImageKeys);

      // --- Step 2: First Preview AI ---
      const res = await post(PostAdApi.previewProduct, {
        description: desc,
        images: uploadedImageKeys.length > 0 ? uploadedImageKeys : imgs,
      });

      if (!res?.data) {
        Toast.show({
          type: "error",
          text1: "Preview failed",
          text2: "Failed to generate preview",
        });
        setIsFormLoading(false);
        return;
      }

      const basic = res.data;

      const uiData = {
        ...basic,
        title: basic.title || "",
        enhancedDescription:
          basic.details ||
          basic.enhanced_description ||
          basic.description ||
          "",
        categoryId:
          basic?.category?.id || basic?.category?._id || basic?.category?.value,
        subcategoryId:
          basic?.subcategory?.id ||
          basic?.subcategory?._id ||
          basic?.subcategory?.value,
        category: basic.category,
        subcategory: basic.subcategory,
        price: basic.price || "",
      };

      setData(uiData);
      setGenerationStep(GENERATION_STEPS.BASIC_FORM);

      await fetchIntermediate({
        ...basic,
        images: uploadedImageKeys.length > 0 ? uploadedImageKeys : imgs,
      });
    } catch (err) {
      console.error("Preview failed:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "AI Analysis failed",
      });
      setIsFormLoading(false);
    }
  };

  const fetchIntermediate = async (basic: any) => {
    try {
      const res = await post(PostAdApi.intermediatePreview, {
        subcategoryId: basic?.subcategory?.id || basic?.subcategory?._id,
        details: basic?.details || basic?.enhanced_description,
        images: basic.images || [],
      });

      if (!res?.data) {
        console.warn("Intermediate API returned no data");
      }

      const intermediate = res.data || {};

      // Store full specs metadata for question rendering
      if (intermediate.specs && Array.isArray(intermediate.specs)) {
        const metadata: Record<string, any> = {};
        intermediate.specs.forEach((spec: any) => {
          metadata[spec.key] = spec;
        });
        setSpecMetadata(metadata);
      }

      let extractedSpecs: Record<string, any> = {};
      if (intermediate.specs && Array.isArray(intermediate.specs)) {
        intermediate.specs.forEach((spec: any) => {
          extractedSpecs[spec.key] = spec;
        });
      }

      Object.entries(intermediate).forEach(([key, value]) => {
        if (
          key === "slug" ||
          key === "images" ||
          key === "questions" ||
          key === "specs" ||
          key === "specifications" ||
          key === "category" ||
          key === "subcategory" ||
          key === "division"
        )
          return;
        if (value && typeof value === "object" && "value" in value) {
          const specObj = value as any;
          if (
            specObj.value !== null &&
            specObj.value !== undefined &&
            specObj.value !== ""
          ) {
            extractedSpecs[key] = specObj;
          }
        }
      });

      setData((prev: any) => {
        const merged = {
          ...prev,
          ...intermediate,
          title: intermediate.title || prev.title,
          enhancedDescription:
            intermediate.enhanced_description || prev.enhancedDescription,
          categoryId:
            intermediate?.category?.id ||
            intermediate?.category?._id ||
            intermediate?.category?.value ||
            prev.categoryId,
          subcategoryId:
            intermediate?.subcategory?.id ||
            intermediate?.subcategory?._id ||
            intermediate?.subcategory?.value ||
            prev.subcategoryId,
          category: intermediate.category || prev.category,
          subcategory: intermediate.subcategory || prev.subcategory,
          divisionId:
            intermediate?.division?.id ||
            intermediate?.division?._id ||
            prev.divisionId,
          division: intermediate.division || prev.division,
          specs: normalizeSpecs(
            Object.keys(extractedSpecs).length > 0
              ? extractedSpecs
              : prev.specs || {},
          ),
          price: intermediate.price || prev.price,
        };
        return merged;
      });

      setGenerationStep(GENERATION_STEPS.SPECS_FORM);

      // Extract labels directly from response to avoid stale state in fetchFinal
      const catLabel = intermediate.category?.name || intermediate.category?.label || basic.category?.name || basic.category?.label || "";
      const subCatLabel = intermediate.subcategory?.name || intermediate.subcategory?.label || basic.subcategory?.name || basic.subcategory?.label || "";

      await fetchFinal({
        details: basic.details || basic.enhanced_description,
        subcategoryId: intermediate.subcategoryId || basic.subcategoryId || intermediate?.subcategory?.id || basic?.subcategory?._id,
        intermediate,
        images: basic.images || [],
        categoryLabel: catLabel,
        subcategoryLabel: subCatLabel,
      });
    } catch (err) {
      console.error("Intermediate AI failed:", err);
      setIsFormLoading(false);
      setGenerationStep(GENERATION_STEPS.DONE);
      Toast.show({
        type: "info",
        text1: "AI Partial Completion",
        text2: "Please review and fill remaining details.",
      });
    }
  };

  const fetchFinal = async ({
    details,
    intermediate,
    images,
    subcategoryId,
    categoryLabel,
    subcategoryLabel,
  }: any) => {
    try {
      // Use passed labels instead of stale state
      const contextPrefix = `ITEM: ${categoryLabel}${subcategoryLabel ? ` > ${subcategoryLabel}` : ""}\n\n`;
      const contextualDetails = contextPrefix + details;

      // Filter for missing specs and provide context (key, name, dataType, options) for the AI
      const missingSpecs = (intermediate?.specs || [])
        .filter((s: any) => {
          if (s.value === null || s.value === undefined) return true;
          if (typeof s.value === "string" && s.value.toLowerCase() === "null") return true;
          return false;
        })
        .map((s: any) => s.key);

      const res = await post(PostAdApi.finalPreview, {
        details: contextualDetails,
        specs: missingSpecs,
        location: null,
        subcategoryId,
        images,
      });

      const finalPayload = res.data ?? res;

      const questionsData = extractQuestions(finalPayload).filter((q:any) => missingSpecs.includes(q.key));
      if (questionsData && questionsData.length > 0) {
        setQuestions(questionsData);
      }

      // No need to extract specs again as they were set in intermediate

      setData((prev: any) => {
        const merged = {
          ...prev,
          ...finalPayload,
          title: finalPayload.title || prev.title,
          enhancedDescription:
            finalPayload.enhanced_description || prev.enhancedDescription,
          categoryId:
            finalPayload?.category?.id ||
            finalPayload?.category?._id ||
            finalPayload?.category?.value ||
            prev.categoryId,
          subcategoryId:
            finalPayload?.subcategory?.id ||
            finalPayload?.subcategory?._id ||
            finalPayload?.subcategory?.value ||
            prev.subcategoryId,
          category: finalPayload.category || prev.category,
          subcategory: finalPayload.subcategory || prev.subcategory,
          divisionId:
            finalPayload?.division?.id ||
            finalPayload?.division?._id ||
            prev.divisionId,
          division: finalPayload.division || prev.division,
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
    specMetadata,
    imageKeys,
    fetchPreview,
    normalizeFieldKey,
  };
};
