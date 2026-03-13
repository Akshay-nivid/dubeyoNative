import { API_BASE_URL } from "@/src/constants/env";
import { post } from "@/src/services/api";
import { getToken } from "@/src/services/storage/tokenStorage";
import { useCallback, useEffect, useRef, useState } from "react";
import Toast from "react-native-toast-message";
import { PostAdApi } from "../screens/postAd/Api";

/* ---------------- TYPES & INTERFACES ---------------- */

export const GENERATION_STEPS = {
  PREVIEW: 0,
  BASIC_FORM: 1,
  SPECS_FORM: 2,
  DONE: 3,
} as const;

export type GenerationStep =
  (typeof GENERATION_STEPS)[keyof typeof GENERATION_STEPS];

interface Question {
  key?: string;
  slug?: string;
  field?: string;
  question?: string;
  label?: string;
  options?: any[];
  [key: string]: any;
}

interface CategoryInfo {
  id?: string;
  _id?: string;
  value?: string;
  name?: string;
  label?: string;
}

interface PostAdData {
  title: string;
  enhancedDescription: string;
  categoryId?: string;
  subcategoryId?: string;
  divisionId?: string;
  category?: CategoryInfo;
  subcategory?: CategoryInfo;
  division?: any;
  price: string | number;
  images?: string[];
  specs?: Record<string, any>;
  [key: string]: any;
}

/* ---------------- CONSTANTS ---------------- */

const REDUNDANT_KEYS = ["location", "price", "coordinates", "address", "gps"];

/* ---------------- HELPERS ---------------- */

const normalizeFieldKey = (field: string) =>
  field
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z]/g, "");

const getStableKey = (item: any): string => {
  return (
    item?.key ||
    item?.slug ||
    normalizeFieldKey(item?.field || item?.label || "")
  );
};

const extractQuestions = (payload: any): Question[] => {
  if (!payload || typeof payload !== "object") return [];
  const questionsList: Question[] = [
    ...(Array.isArray(payload.questions) ? payload.questions : []),
    ...(Array.isArray(payload.dynamicQuestions)
      ? payload.dynamicQuestions
      : []),
    ...(Array.isArray(payload.additionalQuestions)
      ? payload.additionalQuestions
      : []),
  ];

  const seen = new Set<string>();

  return questionsList
    .filter((q) => {
      const text = (q.question || q.label || q.field || "").toLowerCase();
      const key = getStableKey(q).toLowerCase();

      if (!text || seen.has(text)) return false;

      const isRedundant = REDUNDANT_KEYS.some(
        (rk) => key.includes(rk) || text.includes(rk),
      );
      if (isRedundant) return false;

      seen.add(text);
      return true;
    })
    .map((q) => ({
      ...q,
      options: Array.isArray(q.options)
        ? q.options.filter((o: any) => o != null)
        : [],
    }));
};

const isValidSpecValue = (val: any) => {
  if (val == null || val === "") return false;
  if (typeof val === "string" && val.toLowerCase() === "null") return false;
  return true;
};

const normalizeSpecs = (
  specs: Record<string, any> | any[] = {},
): Record<string, any> => {
  if (!specs || typeof specs !== "object") return {};

  if (Array.isArray(specs)) {
    return Object.fromEntries(
      specs
        .filter((s: any) => s && isValidSpecValue(s.value))
        .map((s: any) => [getStableKey(s), s.value]),
    );
  }

  // Use a fresh object to avoid mutation risk
  const normalized: Record<string, any> = {};
  Object.entries(specs).forEach(([key, spec]) => {
    if (!spec) return;
    const value =
      typeof spec === "object" && "value" in spec ? spec.value : spec;
    if (isValidSpecValue(value)) {
      const stableKey =
        typeof spec === "object" ? getStableKey({ ...spec, key }) : key;
      normalized[stableKey] = value;
    }
  });
  return normalized;
};

/* ---------------- HOOK ---------------- */

export const usePostAdAI = () => {
  const [generationStep, setGenerationStep] = useState<GenerationStep>(
    GENERATION_STEPS.PREVIEW,
  );
  const [isFormLoading, setIsFormLoading] = useState(true);
  const [data, setData] = useState<PostAdData>({
    title: "",
    enhancedDescription: "",
    price: "",
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [specMetadata, setSpecMetadata] = useState<Record<string, any>>({});
  const [imageKeys, setImageKeys] = useState<string[]>([]);

  // Refs for request cancellation and race condition protection
  const abortControllerRef = useRef<AbortController | null>(null);
  const generationIdRef = useRef<number>(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const createAbortSignal = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current.signal;
  };

  const uploadImages = useCallback(
    async (uris: string[], signal?: AbortSignal): Promise<string[]> => {
      const uploadedKeys: string[] = [];
      const token = await getToken();
      const targetUrl = `${API_BASE_URL}${PostAdApi.uploadImage}`;

      const uploadPromises = uris.map(async (uri) => {
        if (signal?.aborted) return;
        try {
          const formData = new FormData();
          let fileName = uri.split("/").pop() || "image.jpg";
          let ext = fileName.includes(".")
            ? fileName.split(".").pop()?.toLowerCase() || "jpg"
            : "jpg";

          if (!["jpg", "jpeg", "png", "webp"].includes(ext)) {
            ext = "jpg";
            fileName = `${fileName.split(".")[0]}.jpg`;
          }

          formData.append("image", {
            uri,
            name: fileName,
            type: `image/${ext === "jpg" ? "jpeg" : ext}`,
          } as any);

          const res = await fetch(targetUrl, {
            method: "POST",
            body: formData,
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            signal,
          });

          const result = await res.json();
          if (result?.data) {
            uploadedKeys.push(result.data);
          } else {
            console.warn("Upload failed response:", result);
          }
        } catch (err) {
          if ((err as any).name !== "AbortError") {
            console.warn("Failed to upload an image", uri, err);
          }
        }
      });

      await Promise.all(uploadPromises);
      return uploadedKeys;
    },
    [],
  );

  const fetchFinal = useCallback(
    async ({
      details,
      intermediate,
      images,
      subcategoryId,
      categoryLabel,
      subcategoryLabel,
      currentGenerationId,
      signal,
    }: any) => {
      if (currentGenerationId !== generationIdRef.current || signal?.aborted)
        return;

      try {
        const contextPrefix = `ITEM: ${categoryLabel}${subcategoryLabel ? ` > ${subcategoryLabel}` : ""}\n\n`;
        const contextualDetails = contextPrefix + details;

        const missingSpecs = (
          Array.isArray(intermediate?.specs) ? intermediate.specs : []
        )
          .filter((s: any) => !isValidSpecValue(s.value))
          .map((s: any) => getStableKey(s));

        const res = await post(
          PostAdApi.finalPreview,
          {
            details: contextualDetails,
            specs: missingSpecs,
            location: null,
            subcategoryId,
            images,
          },
          { signal },
        );

        if (currentGenerationId !== generationIdRef.current) return;

        const finalPayload = res?.data ?? res ?? {};

        const intermediateSpecs = Array.isArray(intermediate?.specs)
          ? intermediate.specs
          : [];
        let questionsData = extractQuestions(finalPayload).filter((q) =>
          missingSpecs.includes(getStableKey(q)),
        );

        if (questionsData.length === 0) {
          const unresolvedKeys =
            Array.isArray(finalPayload.specs) &&
            finalPayload.specs.every((s: any) => typeof s === "string")
              ? finalPayload.specs
              : missingSpecs;

          questionsData = unresolvedKeys.map((key: string) => {
            const matchedSpec = intermediateSpecs.find(
              (s: any) => getStableKey(s) === key,
            );
            if (matchedSpec) {
              return {
                ...matchedSpec,
                label: matchedSpec.name || key,
                question: matchedSpec.name || key,
                field: matchedSpec.key || key,
                options: Array.isArray(matchedSpec.options)
                  ? matchedSpec.options
                  : [],
              };
            }
            return { key, field: key, label: key, question: key };
          });
        }

        // Ensure options are populated from the intermediate response for any question
        questionsData = questionsData.map((q) => {
          const matchedSpec = intermediateSpecs.find(
            (s: any) => getStableKey(s) === getStableKey(q),
          );
          if (
            matchedSpec &&
            Array.isArray(matchedSpec.options) &&
            matchedSpec.options.length > 0
          ) {
            return {
              ...q,
              options: matchedSpec.options,
              dataType: matchedSpec.dataType || q.dataType,
            };
          }
          return q;
        });

        if (questionsData.length > 0) {
          setQuestions(questionsData);

          // Update specMetadata with metadata from questions
          const metadataUpdate: Record<string, any> = {};
          questionsData.forEach((q) => {
            metadataUpdate[getStableKey(q)] = q;
          });
          setSpecMetadata((prev) => ({ ...prev, ...metadataUpdate }));
        }

        // Prevent finalPayload.specs from overwriting data.specs if it's just an array of strings
        if (
          Array.isArray(finalPayload.specs) &&
          finalPayload.specs.every((s: any) => typeof s === "string")
        ) {
          delete finalPayload.specs;
        }

        setData((prev) => ({
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
        }));

        setIsFormLoading(false);
        setGenerationStep(GENERATION_STEPS.DONE);
      } catch (err) {
        if ((err as any).name !== "AbortError") {
          console.error("Final AI generation error:", err);
          setIsFormLoading(false);
          setGenerationStep(GENERATION_STEPS.DONE);
        }
      }
    },
    [],
  );

  const fetchIntermediate = useCallback(
    async (basic: any, currentGenerationId: number, signal: AbortSignal) => {
      if (currentGenerationId !== generationIdRef.current || signal.aborted)
        return;

      try {
        const res = await post(
          PostAdApi.intermediatePreview,
          {
            subcategoryId:
              basic?.subcategory?.id ||
              basic?.subcategory?._id ||
              basic?.subcategoryId,
            details:
              basic?.details ||
              basic?.enhanced_description ||
              basic?.description,
            images: basic.images || [],
          },
          { signal },
        );

        if (currentGenerationId !== generationIdRef.current) return;

        const intermediate = res?.data || {};
        const metadata: Record<string, any> = {};
        const extractedSpecs: Record<string, any> = {};

        if (Array.isArray(intermediate.specs)) {
          intermediate.specs.forEach((spec: any) => {
            const key = getStableKey(spec);
            metadata[key] = spec;
            extractedSpecs[key] = spec;
          });
        }

        // Add extra spec fields if any
        Object.entries(intermediate).forEach(([key, value]) => {
          const skipKeys = [
            "slug",
            "images",
            "questions",
            "specs",
            "specifications",
            "category",
            "subcategory",
            "division",
            "title",
            "description",
            "details",
            "enhanced_description",
          ];
          if (skipKeys.includes(key)) return;

          if (value && typeof value === "object" && "value" in (value as any)) {
            const specObj = value as any;
            if (isValidSpecValue(specObj.value)) {
              const stableKey = getStableKey({ ...specObj, key });
              metadata[stableKey] = specObj;
              extractedSpecs[stableKey] = specObj;
            }
          }
        });

        setSpecMetadata((prev) => ({ ...prev, ...metadata }));

        setData((prev) => ({
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
        }));

        setGenerationStep(GENERATION_STEPS.SPECS_FORM);

        const catLabel =
          intermediate.category?.name ||
          intermediate.category?.label ||
          basic.category?.name ||
          basic.category?.label ||
          "";
        const subCatLabel =
          intermediate.subcategory?.name ||
          intermediate.subcategory?.label ||
          basic.subcategory?.name ||
          basic.subcategory?.label ||
          "";

        await fetchFinal({
          details:
            basic.details || basic.enhanced_description || basic.description,
          subcategoryId:
            intermediate.subcategoryId ||
            basic.subcategoryId ||
            intermediate?.subcategory?.id ||
            basic?.subcategory?._id,
          intermediate,
          images: basic.images || [],
          categoryLabel: catLabel,
          subcategoryLabel: subCatLabel,
          currentGenerationId,
          signal,
        });
      } catch (err) {
        if ((err as any).name !== "AbortError") {
          console.error("Intermediate AI failed:", err);
          setIsFormLoading(false);
          setGenerationStep(GENERATION_STEPS.DONE);
          Toast.show({
            type: "info",
            text1: "AI Partial Completion",
            text2: "Please review and fill remaining details.",
          });
        }
      }
    },
    [fetchFinal],
  );

  const fetchPreview = useCallback(
    async (description: string, images: string[]) => {
      const currentGenerationId = ++generationIdRef.current;
      const signal = createAbortSignal();

      try {
        setIsFormLoading(true);
        setGenerationStep(GENERATION_STEPS.PREVIEW);

        const uploadedImageKeys = await uploadImages(images, signal);

        if (signal.aborted || currentGenerationId !== generationIdRef.current)
          return;

        if (uploadedImageKeys.length === 0 && images.length > 0) {
          Toast.show({
            type: "error",
            text1: "Upload failed",
            text2: "Failed to upload images.",
          });
          setIsFormLoading(false);
          return;
        }

        setImageKeys(uploadedImageKeys);

        const res = await post(
          PostAdApi.previewProduct,
          {
            description,
            images: uploadedImageKeys.length > 0 ? uploadedImageKeys : images,
          },
          { signal },
        );

        if (currentGenerationId !== generationIdRef.current) return;

        if (!res?.data) {
          throw new Error("No data returned from preview API");
        }

        const basic = res.data;
        const uiData: PostAdData = {
          ...basic,
          title: basic.title || "",
          enhancedDescription:
            basic.details ||
            basic.enhanced_description ||
            basic.description ||
            "",
          categoryId:
            basic?.category?.id ||
            basic?.category?._id ||
            basic?.category?.value,
          subcategoryId:
            basic?.subcategory?.id ||
            basic?.subcategory?._id ||
            basic?.subcategory?.value,
          price: basic.price || "",
        };

        setData(uiData);
        setGenerationStep(GENERATION_STEPS.BASIC_FORM);

        await fetchIntermediate(
          {
            ...basic,
            images: uploadedImageKeys.length > 0 ? uploadedImageKeys : images,
          },
          currentGenerationId,
          signal,
        );
      } catch (err) {
        if ((err as any).name !== "AbortError") {
          console.error("Preview failed:", err);
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "AI Analysis failed",
          });
          setIsFormLoading(false);
        }
      }
    },
    [uploadImages, fetchIntermediate],
  );

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
