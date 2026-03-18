import { API_BASE_URL } from "@/src/constants/env";
import { post } from "@/src/services/api";
import { getToken } from "@/src/services/storage/tokenStorage";
import { useCallback, useEffect, useRef, useState } from "react";
import Toast from "react-native-toast-message";
import { PostAdApi } from "../screens/postAd/Api";

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */

export const GENERATION_STEPS = {
  PREVIEW:    0,
  BASIC_FORM: 1,
  SPECS_FORM: 2,
  DONE:       3,
} as const;

export type GenerationStep = (typeof GENERATION_STEPS)[keyof typeof GENERATION_STEPS];

export interface Question {
  key?:      string;
  slug?:     string;
  field?:    string;
  question?: string;
  label?:    string;
  options?:  any[];
  dataType?: string;
  [key: string]: any;
}

interface CategoryInfo {
  id?:    string;
  _id?:   string;
  value?: string;
  name?:  string;
  label?: string;
}

export interface PostAdData {
  title:               string;
  enhancedDescription: string;
  categoryId?:         string;
  subcategoryId?:      string;
  divisionId?:         string;
  category?:           CategoryInfo;
  subcategory?:        CategoryInfo;
  division?:           any;
  price:               string | number;
  images?:             string[];
  specs?:              Record<string, any>;
  [key: string]:       any;
}

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */

/**
 * Word-boundary patterns for spec keys / question text that should be
 * filtered out of the "Helpful Details" section (handled elsewhere in the UI).
 */
const REDUNDANT_KEY_PATTERNS = [
  /\blocation\b/,
  /\bprice\b/,
  /\bcoordinates\b/,
  /\baddress\b/,
  /\bgps\b/,
];

/* ─────────────────────────────────────────────────────────────
   PURE UTILITIES  (exported so screens can import directly)
───────────────────────────────────────────────────────────── */

/** Normalises any string into a lowercase, whitespace-free, alphanum+underscore key. */
export const normalizeFieldKey = (field: any): string =>
  String(field || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9_]/g, "");

/**
 * Returns a stable, normalised key for a spec / question object.
 * Falls back to an optional `fallbackKey` before returning an empty string.
 */
export const getStableKey = (item: any, fallbackKey?: string): string => {
  if (!item) return "";
  const raw = item.key || item.slug || item.field || item.label || item.name || fallbackKey || "";
  return typeof raw === "string" ? normalizeFieldKey(raw) : "";
};

/* ─────────────────────────────────────────────────────────────
   PRIVATE UTILITIES
───────────────────────────────────────────────────────────── */

const normalizeBooleanValue = (val: any): any => {
  if (val === "Yes") return true;
  if (val === "No")  return false;
  return val;
};

/** Returns false for null / undefined / "" / "null". Everything else passes. */
const isValidSpecValue = (val: any): boolean => {
  if (val == null || val === "") return false;
  if (typeof val === "string" && val.toLowerCase() === "null") return false;
  return true;
};

/** A division is valid only if it carries a real id, not just any truthy value. */
const isDivisionValid = (division: any): boolean => {
  if (!division) return false;
  if (typeof division === "string") return division.trim().length > 0;
  return isValidSpecValue(division?.id || division?._id);
};

/** Extracts a consistent id string from any entity shape the API may return. */
const extractEntityId = (entity: any): string | undefined =>
  entity?.id || entity?._id || entity?.value || undefined;

/* ─────────────────────────────────────────────────────────────
   QUESTION EXTRACTION
───────────────────────────────────────────────────────────── */

const extractQuestions = (payload: any): Question[] => {
  if (!payload || typeof payload !== "object") return [];

  const questionsList: Question[] = [
    ...(Array.isArray(payload.questions)           ? payload.questions           : []),
    ...(Array.isArray(payload.dynamicQuestions)    ? payload.dynamicQuestions    : []),
    ...(Array.isArray(payload.additionalQuestions) ? payload.additionalQuestions : []),
  ];

  const seen = new Set<string>();

  return questionsList
    .filter((q) => {
      const text = String(q.question || q.label || q.field || "").toLowerCase().trim();
      const key  = getStableKey(q).toLowerCase();

      if (!text || seen.has(text)) return false;

      const isRedundant = REDUNDANT_KEY_PATTERNS.some(
        (pattern) => pattern.test(key) || pattern.test(text),
      );
      if (isRedundant) return false;

      seen.add(text);
      return true;
    })
    .map((q) => {
      const options = Array.isArray(q.options)
        ? q.options.filter((o: any) => o != null)
        : [];

      // Ensure boolean questions always have toggle options
      if (q.dataType === "boolean" && options.length === 0) {
        return { ...q, options: ["Yes", "No"] };
      }

      return { ...q, options };
    });
};

/* ─────────────────────────────────────────────────────────────
   SPEC NORMALISATION
───────────────────────────────────────────────────────────── */

const normalizeSpecs = (specs: Record<string, any> | any[] = {}): Record<string, any> => {
  if (!specs || typeof specs !== "object") return {};

  // Array shape: [{ key/label, value }, ...]
  if (Array.isArray(specs)) {
    return Object.fromEntries(
      specs
        .filter((s: any) => s && isValidSpecValue(s.value))
        .map((s: any) => [getStableKey(s), normalizeBooleanValue(s.value)]),
    );
  }

  // Object shape: { key: spec | flatValue }
  const normalized: Record<string, any> = {};
  Object.entries(specs).forEach(([key, spec]) => {
    if (!spec) return;

    // Avoid re-normalising already-flat values from prev.specs
    const rawValue = typeof spec === "object" && spec !== null && "value" in spec
      ? spec.value
      : spec;

    const value = normalizeBooleanValue(rawValue);
    if (!isValidSpecValue(value)) return;

    const stableKey = typeof spec === "object" && spec !== null
      ? getStableKey(spec, key)
      : normalizeFieldKey(key);

    normalized[stableKey] = value;
  });

  return normalized;
};

/* ─────────────────────────────────────────────────────────────
   HOOK
───────────────────────────────────────────────────────────── */

export const usePostAdAI = () => {
  const [generationStep, setGenerationStep] = useState<GenerationStep>(GENERATION_STEPS.PREVIEW);
  const [isFormLoading, setIsFormLoading]   = useState(true);
  const [data, setData]                     = useState<PostAdData>({ title: "", enhancedDescription: "", price: "" });
  const [questions, setQuestions]           = useState<Question[]>([]);
  const [specMetadata, setSpecMetadata]     = useState<Record<string, any>>({});
  const [imageKeys, setImageKeys]           = useState<string[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const generationIdRef    = useRef<number>(0);

  // Abort any in-flight request when the hook unmounts
  useEffect(() => () => { abortControllerRef.current?.abort(); }, []);

  const createAbortSignal = (): AbortSignal => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current.signal;
  };

  /* ── Image Upload ─────────────────────────────────────────── */

  const uploadImages = useCallback(async (uris: string[], signal?: AbortSignal): Promise<string[]> => {
    const uploadedKeys: string[] = [];
    const token     = await getToken();
    const targetUrl = `${API_BASE_URL}${PostAdApi.uploadImage}`;

    await Promise.all(
      uris.map(async (uri) => {
        if (signal?.aborted) return;

        try {
          const formData = new FormData();
          let fileName   = uri.split("/").pop() || "image.jpg";
          let ext        = fileName.includes(".") ? fileName.split(".").pop()?.toLowerCase() || "jpg" : "jpg";

          if (!["jpg", "jpeg", "png", "webp"].includes(ext)) {
            ext      = "jpg";
            fileName = `${fileName.split(".")[0]}.jpg`;
          }

          formData.append("image", { uri, name: fileName, type: `image/${ext === "jpg" ? "jpeg" : ext}` } as any);

          const res    = await fetch(targetUrl, { method: "POST", body: formData, headers: { Accept: "application/json", Authorization: `Bearer ${token}` }, signal });
          const result = await res.json();

          if (signal?.aborted) return;

          if (result?.data) {
            uploadedKeys.push(result.data);
          } else {
            console.warn("Upload failed for:", uri, result);
          }
        } catch (err) {
          if ((err as any).name !== "AbortError") {
            console.warn("Image upload error:", uri, err);
          }
        }
      }),
    );

    // Discard results if aborted to prevent stale keys leaking into the next generation
    if (signal?.aborted) return [];
    return uploadedKeys;
  }, []);

  /* ── Final Preview (3rd API) ──────────────────────────────── */

  const fetchFinal = useCallback(async ({
    details,
    intermediate,
    images,
    subcategoryId,
    categoryLabel,
    subcategoryLabel,
    currentGenerationId,
    signal,
  }: any) => {
    if (currentGenerationId !== generationIdRef.current || signal?.aborted) return;

    try {
      const contextPrefix    = `ITEM: ${categoryLabel}${subcategoryLabel ? ` > ${subcategoryLabel}` : ""}\n\n`;
      const contextualDetails = contextPrefix + details;

      const rawSpecs = Array.isArray(intermediate?.specs) ? intermediate.specs : [];

      // Collect spec keys that still have no value (to ask the user about)
      const missingSpecKeys: string[] = rawSpecs
        .filter((s: any) => !isValidSpecValue(s.value))
        .map((s: any)    => getStableKey(s))
        .filter(Boolean);

      if (!isDivisionValid(intermediate?.division) && !missingSpecKeys.includes("division")) {
        missingSpecKeys.push("division");
      }

      const res = await post(
        PostAdApi.finalPreview,
        { details: contextualDetails, specs: missingSpecKeys, location: null, subcategoryId, images },
        { signal },
      );

      if (currentGenerationId !== generationIdRef.current) return;

      const finalPayload = res?.data ?? res ?? {};

      // ── Build questions list ──────────────────────────────
      let questionsData = extractQuestions(finalPayload);

      const existingKeys = new Set(questionsData.map((q) => getStableKey(q)));

      // Add placeholder questions for missing specs the API didn't cover
      const additionalFromMissing: Question[] = missingSpecKeys
        .filter((key) => !existingKeys.has(key))
        .map((key) => {
          const matchedSpec = rawSpecs.find((s: any) => getStableKey(s) === key);
          const label       = matchedSpec?.name || matchedSpec?.label || key;
          return {
            ...(matchedSpec || {}),
            key,
            field:    key,
            label,
            question: `Please specify the ${label.toLowerCase()}`,
            options:  Array.isArray(matchedSpec?.options) ? matchedSpec.options : [],
            dataType: matchedSpec?.dataType,
          };
        });

      questionsData = [...questionsData, ...additionalFromMissing];

      // Back-fill options + dataType from intermediate spec metadata
      questionsData = questionsData.map((q) => {
        const matchedSpec = rawSpecs.find((s: any) => getStableKey(s) === getStableKey(q));
        if (!matchedSpec) return q;
        return {
          ...q,
          options:  Array.isArray(matchedSpec.options) && matchedSpec.options.length > 0 ? matchedSpec.options : q.options,
          dataType: matchedSpec.dataType || q.dataType,
        };
      });

      if (questionsData.length > 0) {
        setQuestions(questionsData);

        const metadataUpdate: Record<string, any> = {};
        questionsData.forEach((q) => {
          const key = getStableKey(q);
          if (key) metadataUpdate[key] = { ...q, dataType: q.dataType || specMetadata[key]?.dataType };
        });
        setSpecMetadata((prev) => ({ ...prev, ...metadataUpdate }));
      }

      // ── Merge final data into state ───────────────────────
      // Destructure to avoid mutating finalPayload
      const { specs: rawFinalSpecs, ...safePayload } = finalPayload;

      // Discard specs if the API only returned a string[] of missing key names
      const finalSpecs = Array.isArray(rawFinalSpecs) && rawFinalSpecs.every((s: any) => typeof s === "string")
        ? undefined
        : normalizeSpecs(rawFinalSpecs);

      setData((prev) => ({
        ...prev,
        ...safePayload,
        title:               safePayload.title               || prev.title,
        enhancedDescription: safePayload.enhanced_description || prev.enhancedDescription,
        categoryId:          extractEntityId(safePayload.category)   || prev.categoryId,
        subcategoryId:       extractEntityId(safePayload.subcategory) || prev.subcategoryId,
        category:            safePayload.category   || prev.category,
        subcategory:         safePayload.subcategory || prev.subcategory,
        divisionId:          extractEntityId(safePayload.division) || prev.divisionId,
        division:            safePayload.division || prev.division,
        specs:               { ...(prev.specs || {}), ...(finalSpecs || {}) },
        price:               safePayload.price || prev.price,
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
  }, []);

  /* ── Intermediate Preview (2nd API) ──────────────────────── */

  const fetchIntermediate = useCallback(async (
    basic: any,
    currentGenerationId: number,
    signal: AbortSignal,
  ) => {
    if (currentGenerationId !== generationIdRef.current || signal.aborted) return;

    try {
      const subcategoryId = extractEntityId(basic?.subcategory) || basic?.subcategoryId;

      const res = await post(
        PostAdApi.intermediatePreview,
        {
          subcategoryId,
          details: basic?.details || basic?.enhanced_description || basic?.description,
          images:  basic.images || [],
        },
        { signal },
      );

      if (currentGenerationId !== generationIdRef.current) return;

      const intermediate                        = res?.data || {};
      const metadata:      Record<string, any>  = {};
      const extractedSpecs: Record<string, any> = {};

      if (Array.isArray(intermediate.specs)) {
        intermediate.specs.forEach((spec: any) => {
          const key = getStableKey(spec);
          if (!key) return;
          metadata[key]      = spec;
          extractedSpecs[key] = spec;
        });
      }

      // Capture any extra top-level spec-shaped fields the AI may have returned
      const SKIP_KEYS = new Set([
        "slug", "images", "questions", "specs", "specifications",
        "category", "subcategory", "division", "title",
        "description", "details", "enhanced_description",
      ]);

      Object.entries(intermediate).forEach(([key, value]) => {
        if (SKIP_KEYS.has(key)) return;
        if (value && typeof value === "object" && "value" in (value as any) && isValidSpecValue((value as any).value)) {
          const stableKey = getStableKey(value as any, key);
          if (stableKey) {
            metadata[stableKey]       = value;
            extractedSpecs[stableKey] = value;
          }
        }
      });

      setSpecMetadata((prev) => ({ ...prev, ...metadata }));

      setData((prev) => ({
        ...prev,
        ...intermediate,
        title:               intermediate.title               || prev.title,
        enhancedDescription: intermediate.enhanced_description || prev.enhancedDescription,
        categoryId:          extractEntityId(intermediate.category)   || prev.categoryId,
        subcategoryId:       extractEntityId(intermediate.subcategory) || prev.subcategoryId,
        category:            intermediate.category   || prev.category,
        subcategory:         intermediate.subcategory || prev.subcategory,
        divisionId:          extractEntityId(intermediate.division) || prev.divisionId,
        division:            intermediate.division || prev.division,
        specs:               Object.keys(extractedSpecs).length > 0 ? normalizeSpecs(extractedSpecs) : prev.specs || {},
        price:               intermediate.price || prev.price,
      }));

      setGenerationStep(GENERATION_STEPS.SPECS_FORM);

      const catLabel    = intermediate.category?.name    || intermediate.category?.label    || basic.category?.name    || basic.category?.label    || "";
      const subCatLabel = intermediate.subcategory?.name || intermediate.subcategory?.label || basic.subcategory?.name || basic.subcategory?.label || "";

      const finalSubcategoryId =
        extractEntityId(intermediate.subcategory) ||
        extractEntityId(basic.subcategory)         ||
        basic.subcategoryId;

      await fetchFinal({
        details:            basic.details || basic.enhanced_description || basic.description,
        subcategoryId:      finalSubcategoryId,
        intermediate,
        images:             basic.images || [],
        categoryLabel:      catLabel,
        subcategoryLabel:   subCatLabel,
        currentGenerationId,
        signal,
      });
    } catch (err) {
      if ((err as any).name !== "AbortError") {
        console.error("Intermediate AI failed:", err);
        setIsFormLoading(false);
        setGenerationStep(GENERATION_STEPS.DONE);
        Toast.show({ type: "info", text1: "AI Partial Completion", text2: "Please review and fill remaining details." });
      }
    }
  }, [fetchFinal]);

  /* ── First Preview (1st API) ──────────────────────────────── */

  const fetchPreview = useCallback(async (description: string, images: string[]) => {
    const currentGenerationId = ++generationIdRef.current;
    const signal              = createAbortSignal();

    try {
      setIsFormLoading(true);
      setGenerationStep(GENERATION_STEPS.PREVIEW);

      const uploadedImageKeys = await uploadImages(images, signal);

      if (signal.aborted || currentGenerationId !== generationIdRef.current) return;

      if (uploadedImageKeys.length === 0 && images.length > 0) {
        Toast.show({ type: "error", text1: "Upload failed", text2: "Failed to upload images." });
        setIsFormLoading(false);
        return;
      }

      if (uploadedImageKeys.length > 0 && uploadedImageKeys.length < images.length) {
        Toast.show({
          type:  "info",
          text1: "Some images failed to upload",
          text2: `${uploadedImageKeys.length} of ${images.length} uploaded. You can add more later.`,
        });
      }

      setImageKeys(uploadedImageKeys);

      const res = await post(
        PostAdApi.previewProduct,
        { description, images: uploadedImageKeys.length > 0 ? uploadedImageKeys : images },
        { signal },
      );

      if (currentGenerationId !== generationIdRef.current) return;
      if (!res?.data) throw new Error("No data returned from preview API");

      const basic = res.data;

      setData({
        ...basic,
        title:               basic.title || "",
        enhancedDescription: basic.details || basic.enhanced_description || basic.description || "",
        categoryId:          extractEntityId(basic.category),
        subcategoryId:       extractEntityId(basic.subcategory),
        price:               basic.price || "",
      });

      setGenerationStep(GENERATION_STEPS.BASIC_FORM);

      await fetchIntermediate(
        { ...basic, images: uploadedImageKeys.length > 0 ? uploadedImageKeys : images },
        currentGenerationId,
        signal,
      );
    } catch (err) {
      if ((err as any).name !== "AbortError") {
        console.error("Preview failed:", err);
        Toast.show({ type: "error", text1: "Error", text2: "AI Analysis failed" });
        setIsFormLoading(false);
      }
    }
  }, [uploadImages, fetchIntermediate]);

  /* ── Public API ───────────────────────────────────────────── */

  return {
    generationStep,
    isFormLoading,
    data,
    setData,
    questions,
    specMetadata,
    imageKeys,
    fetchPreview,
    // normalizeFieldKey is a named export — import it directly where needed:
    // import { normalizeFieldKey } from './usePostAdAI'
  };
};