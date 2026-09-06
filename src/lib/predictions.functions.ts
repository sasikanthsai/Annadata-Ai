import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateGeminiContent } from "@/lib/gemini.server";
import { z } from "zod";

const PredictInput = z.object({
  imageBase64: z.string().min(100),
  mimeType: z.string().regex(/^image\/(jpeg|jpg|png|webp)$/),
  storagePath: z.string().min(1),
  language: z.enum(["en", "hi", "mr", "ta", "te"]).default("en"),
});

const HistoryInput = z.object({
  limit: z.number().int().min(1).max(50).optional(),
});

const LANG_NAMES = {
  en: "English",
  hi: "Hindi",
  mr: "Marathi",
  ta: "Tamil",
  te: "Telugu",
} as const;

export type DiseaseRecommendation = {
  slug: string;
  name: string;
  crop: string;
  scientific_name: string | null;
  symptoms: string[];
  causes: string[];
  treatment: string[];
  fertilizer: string | null;
  prevention: string[];
  severity: "low" | "medium" | "high";
};

export type ProgressPoint = {
  day: number;
  spread_percent: number;
  stage: string;
};

export type TreatmentStep = {
  day: number;
  action: string;
  product?: string;
  dosage?: string;
  note?: string;
};

export type ProgressPrediction = {
  five_day_spread_percent: number;
  risk_level: "low" | "medium" | "high";
  summary: string;
  timeline: ProgressPoint[];
};

export type TreatmentPlan = {
  expected_recovery_days: number;
  summary: string;
  steps: TreatmentStep[];
};

export type SeverityAnalysis = {
  infection_percent: number;
  level: "mild" | "medium" | "severe";
  affected_leaf_area_percent: number;
  recovery_probability_percent: number;
  recovery_window_hours: number;
  summary: string;
};

export type HealthFactor = {
  name: string;
  score: number;
  note: string;
};

export type CropHealthScore = {
  score: number;
  grade: "excellent" | "good" | "fair" | "poor" | "critical";
  summary: string;
  factors: HealthFactor[];
};

export type EconomicImpact = {
  yield_loss_percent: number;
  estimated_loss_note: string;
  treatment_cost_note: string;
};

export type DetectionType =
  | "plant_disease"
  | "fruit_disease"
  | "pest_insect"
  | "nutrient_deficiency"
  | "healthy";

export type PestInfo = {
  pest_name: string;
  scientific_name: string;
  category: string;
  life_cycle: string;
  damage_type: string;
  host_crops: string[];
  natural_enemies: string[];
};

export type PesticideDosage = {
  chemical_product: string;
  dosage_per_acre: number;
  dosage_unit: string;
  water_per_acre_liters: number;
  spray_frequency_days: number;
  reapplications: number;
  pre_harvest_interval_days: number;
  safety_notes: string;
  organic_alternative: string;
  step_by_step: string[];
};

export type PredictionResult = {
  id: string;
  language?: keyof typeof LANG_NAMES;
  detection_type: DetectionType;
  disease_name: string;
  disease_slug: string | null;
  crop: string | null;
  confidence: number;
  is_healthy: boolean;
  notes: string | null;
  image_url: string;
  recommendation: DiseaseRecommendation | null;
  progress_prediction: ProgressPrediction | null;
  treatment_plan: TreatmentPlan | null;
  severity_analysis: SeverityAnalysis | null;
  health_score: CropHealthScore | null;
  economic_impact: EconomicImpact | null;
  organic_alternatives: string[];
  pest_info: PestInfo | null;
  pesticide_dosage: PesticideDosage | null;
  created_at: string;
};

const RecommendationInput = z.object({
  slug: z.string(),
  name: z.string(),
  crop: z.string(),
  scientific_name: z.string().nullable(),
  symptoms: z.array(z.string()),
  causes: z.array(z.string()),
  treatment: z.array(z.string()),
  fertilizer: z.string().nullable(),
  prevention: z.array(z.string()),
  severity: z.enum(["low", "medium", "high"]),
});

const ProgressPredictionInput = z.object({
  five_day_spread_percent: z.number(),
  risk_level: z.enum(["low", "medium", "high"]),
  summary: z.string(),
  timeline: z.array(
    z.object({
      day: z.number(),
      spread_percent: z.number(),
      stage: z.string(),
    }),
  ),
});

const TreatmentPlanInput = z.object({
  expected_recovery_days: z.number(),
  summary: z.string(),
  steps: z.array(
    z.object({
      day: z.number(),
      action: z.string(),
      product: z.string().optional(),
      dosage: z.string().optional(),
      note: z.string().optional(),
    }),
  ),
});

const SeverityAnalysisInput = z.object({
  infection_percent: z.number(),
  level: z.enum(["mild", "medium", "severe"]),
  affected_leaf_area_percent: z.number(),
  recovery_probability_percent: z.number(),
  recovery_window_hours: z.number(),
  summary: z.string(),
});

const HealthScoreInput = z.object({
  score: z.number(),
  grade: z.enum(["excellent", "good", "fair", "poor", "critical"]),
  summary: z.string(),
  factors: z.array(
    z.object({
      name: z.string(),
      score: z.number(),
      note: z.string(),
    }),
  ),
});

const EconomicImpactInput = z.object({
  yield_loss_percent: z.number(),
  estimated_loss_note: z.string(),
  treatment_cost_note: z.string(),
});

const PestInfoInput = z.object({
  pest_name: z.string(),
  scientific_name: z.string(),
  category: z.string(),
  life_cycle: z.string(),
  damage_type: z.string(),
  host_crops: z.array(z.string()),
  natural_enemies: z.array(z.string()),
});

const PesticideDosageInput = z.object({
  chemical_product: z.string(),
  dosage_per_acre: z.number(),
  dosage_unit: z.string(),
  water_per_acre_liters: z.number(),
  spray_frequency_days: z.number(),
  reapplications: z.number(),
  pre_harvest_interval_days: z.number(),
  safety_notes: z.string(),
  organic_alternative: z.string(),
  step_by_step: z.array(z.string()),
});

const PredictionResultInput = z.object({
  id: z.string(),
  language: z.enum(["en", "hi", "mr", "ta", "te"]).optional(),

  detection_type: z
    .enum([
      "plant_disease",
      "fruit_disease",
      "pest_insect",
      "nutrient_deficiency",
      "healthy",
    ])
    .default("plant_disease"),

  disease_name: z.string(),
  disease_slug: z.string().nullable(),
  crop: z.string().nullable(),
  confidence: z.number(),
  is_healthy: z.boolean(),
  notes: z.string().nullable(),
  image_url: z.string(),

  recommendation: RecommendationInput.nullable(),
  progress_prediction: ProgressPredictionInput.nullable(),
  treatment_plan: TreatmentPlanInput.nullable(),
  severity_analysis: SeverityAnalysisInput.nullable(),
  health_score: HealthScoreInput.nullable(),
  economic_impact: EconomicImpactInput.nullable(),

  organic_alternatives: z.array(z.string()),

  pest_info: PestInfoInput.nullable().default(null),
  pesticide_dosage: PesticideDosageInput.nullable().default(null),

  created_at: z.string(),
});

const TranslateInput = z.object({
  language: z.enum(["en", "hi", "mr", "ta", "te"]),
  result: PredictionResultInput,
});

type ParsedPrediction = {
  detection_type?: DetectionType;
  crop: string;
  is_healthy: boolean;
  disease_name: string;
  disease_slug: string;
  scientific_name: string;
  severity: "low" | "medium" | "high";
  confidence: number;
  notes: string;

  symptoms: string[];
  causes: string[];
  treatment: string[];
  prevention: string[];
  fertilizer: string;

  progress_prediction: ProgressPrediction;
  treatment_plan: TreatmentPlan;
  severity_analysis: SeverityAnalysis;
  health_score: CropHealthScore;
  economic_impact: EconomicImpact;

  organic_alternatives: string[];

  pest_info?: PestInfo;
  pesticide_dosage?: PesticideDosage;
};

export const predictDisease = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => PredictInput.parse(data))
  .handler(async ({ data, context }): Promise<PredictionResult> => {
    const { supabase, userId } = context;

    const outputLanguage = LANG_NAMES[data.language];

    const imageData = data.imageBase64.includes(",")
      ? data.imageBase64.split(",")[1]
      : data.imageBase64;

    const aiRaw = await generateGeminiContent({
      systemInstruction: `
You are a world-class plant pathologist and agronomist with deep knowledge of PlantVillage and global crop diseases.

Analyze the supplied crop image carefully.

You MUST return ONLY valid JSON.

Identify the most specific and probable:
- plant disease
- fruit disease
- pest/insect
- nutrient deficiency
- or healthy condition

Never return "Unknown".
Never return a generic label such as "Leaf disease".

If several diagnoses are possible, choose the single most probable diagnosis and reduce confidence appropriately.

Only set is_healthy=true when the plant or fruit is clearly healthy.

If the image is clearly not a plant, use:
crop = "Unknown"
disease_name = "Not a plant photo"
is_healthy = false

Return every required field.

Write every farmer-facing string in ${outputLanguage}.

Scientific names, chemical names, product names, NPK ratios, numbers and measurement units should remain readable.

Do not invent visual symptoms that cannot reasonably be inferred from the image.

For pesticide recommendations:
- Give practical information.
- Include safety precautions.
- Respect the pre-harvest interval when known.
- Do not claim certainty where the image is ambiguous.

Return JSON matching this structure:

{
  "detection_type": "plant_disease | fruit_disease | pest_insect | nutrient_deficiency | healthy",
  "crop": "string",
  "is_healthy": true,
  "disease_name": "string",
  "disease_slug": "string or empty string",
  "scientific_name": "string or empty string",
  "severity": "low | medium | high",
  "confidence": 0,
  "notes": "string",
  "symptoms": ["string"],
  "causes": ["string"],
  "treatment": ["string"],
  "prevention": ["string"],
  "fertilizer": "string",
  "progress_prediction": {
    "five_day_spread_percent": 0,
    "risk_level": "low | medium | high",
    "summary": "string",
    "timeline": [
      {
        "day": 1,
        "spread_percent": 0,
        "stage": "string"
      },
      {
        "day": 3,
        "spread_percent": 0,
        "stage": "string"
      },
      {
        "day": 5,
        "spread_percent": 0,
        "stage": "string"
      },
      {
        "day": 7,
        "spread_percent": 0,
        "stage": "string"
      }
    ]
  },
  "treatment_plan": {
    "expected_recovery_days": 0,
    "summary": "string",
    "steps": [
      {
        "day": 1,
        "action": "string",
        "product": "string",
        "dosage": "string",
        "note": "string"
      }
    ]
  },
  "severity_analysis": {
    "infection_percent": 0,
    "level": "mild | medium | severe",
    "affected_leaf_area_percent": 0,
    "recovery_probability_percent": 0,
    "recovery_window_hours": 0,
    "summary": "string"
  },
  "health_score": {
    "score": 0,
    "grade": "excellent | good | fair | poor | critical",
    "summary": "string",
    "factors": [
      {
        "name": "string",
        "score": 0,
        "note": "string"
      }
    ]
  },
  "economic_impact": {
    "yield_loss_percent": 0,
    "estimated_loss_note": "string",
    "treatment_cost_note": "string"
  },
  "organic_alternatives": ["string"],
  "pest_info": {
    "pest_name": "string",
    "scientific_name": "string",
    "category": "string",
    "life_cycle": "string",
    "damage_type": "string",
    "host_crops": ["string"],
    "natural_enemies": ["string"]
  },
  "pesticide_dosage": {
    "chemical_product": "string",
    "dosage_per_acre": 0,
    "dosage_unit": "string",
    "water_per_acre_liters": 0,
    "spray_frequency_days": 0,
    "reapplications": 0,
    "pre_harvest_interval_days": 0,
    "safety_notes": "string",
    "organic_alternative": "string",
    "step_by_step": ["string"]
  }
}

For non-pest diagnoses, still return pest_info with empty strings and empty arrays.

For healthy plants:
- treatment can be []
- causes can be []
- prevention can contain good farming practices
- progress_prediction can contain zero/low spread
- treatment_plan can contain monitoring advice
- pesticide_dosage should contain empty/default values
- health_score should reflect the healthy condition

Keep confidence between 0 and 100.
Keep percentage values between 0 and 100.
`.trim(),

      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
Diagnose this crop photo.

Be specific.
Identify the most probable disease, pest, nutrient deficiency, fruit disease, or healthy condition.

Return all farmer-facing analysis in ${outputLanguage}.

Return ONLY valid JSON.
              `.trim(),
            },
            {
              inlineData: {
                mimeType: data.mimeType,
                data: imageData,
              },
            },
          ],
        },
      ],

      responseMimeType: "application/json",
      temperature: 0.2,
      maxOutputTokens: 6000,
    });

    if (!aiRaw.trim()) {
      throw new Error("AI did not return a diagnosis.");
    }

    let parsed: ParsedPrediction;

    try {
      parsed = JSON.parse(aiRaw) as ParsedPrediction;
    } catch (error) {
      console.error("Gemini diagnosis JSON parse error:", error);
      console.error("Gemini response:", aiRaw);

      throw new Error("Could not parse AI diagnosis.");
    }

    if (!parsed.disease_name?.trim()) {
      throw new Error("AI returned an invalid diagnosis.");
    }

    // Safety fallback if the model accidentally returns Unknown.
    if (/^unknown/i.test(parsed.disease_name.trim())) {
      parsed.disease_name = parsed.is_healthy
        ? "Healthy"
        : "Unspecified crop disorder";
    }

    // Keep confidence inside the expected range.
    parsed.confidence = Math.max(
      0,
      Math.min(100, Number(parsed.confidence) || 0),
    );

    const { data: signed } = await supabase.storage
      .from("crop-images")
      .createSignedUrl(data.storagePath, 60 * 60 * 24 * 365);

    const imageUrl = signed?.signedUrl ?? "";

    // Prefer curated database recommendation when available.
    let recommendation: DiseaseRecommendation | null = null;

    if (!parsed.is_healthy) {
      if (data.language === "en" && parsed.disease_slug) {
        const { data: dis } = await supabase
          .from("diseases")
          .select(
            "slug,name,crop,scientific_name,symptoms,causes,treatment,fertilizer,prevention,severity",
          )
          .eq("slug", parsed.disease_slug)
          .maybeSingle();

        if (dis) {
          recommendation = dis as DiseaseRecommendation;
        }
      }

      // Otherwise use Gemini-generated recommendation.
      if (!recommendation) {
        recommendation = {
          slug: parsed.disease_slug || "ai-generated",
          name: parsed.disease_name,
          crop: parsed.crop,
          scientific_name: parsed.scientific_name || null,
          symptoms: parsed.symptoms ?? [],
          causes: parsed.causes ?? [],
          treatment: parsed.treatment ?? [],
          fertilizer: parsed.fertilizer || null,
          prevention: parsed.prevention ?? [],
          severity: parsed.severity ?? "medium",
        };
      }
    }

    // Save prediction in Supabase.
    const { data: row, error } = await supabase
      .from("predictions")
      .insert({
        user_id: userId,
        image_url: data.storagePath,
        crop: parsed.crop,
        disease_slug: parsed.disease_slug || null,
        disease_name: parsed.disease_name,
        confidence: parsed.confidence,
        is_healthy: parsed.is_healthy,
        notes: parsed.notes,
        raw_response: parsed,
      })
      .select("id, created_at")
      .single();

    if (error) {
      console.error("Prediction save error:", error);
      throw new Error("Failed to save prediction.");
    }

    const isPest = parsed.detection_type === "pest_insect";

    return {
      id: row.id,
      language: data.language,

      detection_type:
        parsed.detection_type ??
        (parsed.is_healthy ? "healthy" : "plant_disease"),

      disease_name: parsed.disease_name,
      disease_slug: parsed.disease_slug || null,
      crop: parsed.crop,
      confidence: parsed.confidence,
      is_healthy: parsed.is_healthy,
      notes: parsed.notes,
      image_url: imageUrl,

      recommendation,

      progress_prediction: parsed.is_healthy
        ? null
        : (parsed.progress_prediction ?? null),

      treatment_plan: parsed.is_healthy
        ? null
        : (parsed.treatment_plan ?? null),

      severity_analysis: parsed.is_healthy
        ? null
        : (parsed.severity_analysis ?? null),

      health_score: parsed.health_score ?? null,

      economic_impact: parsed.is_healthy
        ? null
        : (parsed.economic_impact ?? null),

      organic_alternatives: parsed.organic_alternatives ?? [],

      pest_info:
        isPest && parsed.pest_info?.pest_name
          ? parsed.pest_info
          : null,

      pesticide_dosage:
        parsed.is_healthy
          ? null
          : parsed.pesticide_dosage?.chemical_product
            ? parsed.pesticide_dosage
            : null,

      created_at: row.created_at,
    };
  });

export const translatePredictionResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => TranslateInput.parse(data))
  .handler(async ({ data }): Promise<PredictionResult> => {
    if (data.result.language === data.language) {
      return data.result as PredictionResult;
    }

    const outputLanguage = LANG_NAMES[data.language];

    const aiRaw = await generateGeminiContent({
      systemInstruction: `
You are a professional agricultural translator.

Translate the supplied crop diagnosis result into ${outputLanguage}.

Return ONLY valid JSON.

Translate farmer-facing text including:
- crop
- disease_name
- notes
- recommendation name
- recommendation crop
- symptoms
- causes
- treatment
- fertilizer
- prevention
- progress prediction summary
- timeline stage
- treatment plan summary
- treatment actions
- treatment notes
- severity analysis summary
- health score summary
- health factor names
- health factor notes
- economic impact notes
- organic alternatives
- pest information
- pesticide safety notes
- pesticide organic alternative
- pesticide step-by-step instructions

DO NOT change:
- id
- image_url
- confidence
- boolean values
- detection_type
- enum values
- severity
- risk_level
- severity level
- health grade
- day numbers
- percentages
- dates
- disease_slug
- scientific names
- chemical names
- product names
- NPK ratios
- numeric dosages
- units such as ml, g, kg, L
- created_at

Preserve the exact JSON structure.

Return ONLY the translated JSON object.
`.trim(),

      contents: [
        {
          role: "user",
          parts: [
            {
              text: JSON.stringify(data.result),
            },
          ],
        },
      ],

      responseMimeType: "application/json",
      temperature: 0.1,
      maxOutputTokens: 6000,
    });

    if (!aiRaw.trim()) {
      throw new Error("Translation was empty.");
    }

    try {
      const raw = JSON.parse(aiRaw);

      const translated = PredictionResultInput.parse(
        raw.result ?? raw,
      );

      return {
        ...translated,
        language: data.language,
      } as PredictionResult;
    } catch (error) {
      console.error("Translation parse error:", error);
      console.error("Gemini translation response:", aiRaw);

      throw new Error("Could not read translated diagnosis.");
    }
  });

export const listPredictions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => HistoryInput.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const limit = data.limit ?? 20;

    const { data: rows, error } = await supabase
      .from("predictions")
      .select(
        "id, created_at, crop, disease_name, disease_slug, confidence, is_healthy, notes, image_url",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    const enriched = await Promise.all(
      (rows ?? []).map(async (r) => {
        const { data: signed } = await supabase.storage
          .from("crop-images")
          .createSignedUrl(r.image_url, 60 * 60 * 6);

        return {
          ...r,
          image_url: signed?.signedUrl ?? "",
        };
      }),
    );

    return enriched;
  });

export const deletePrediction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Get the storage path first.
    const { data: row } = await supabase
      .from("predictions")
      .select("image_url")
      .eq("id", data.id)
      .eq("user_id", userId)
      .maybeSingle();

    const { error } = await supabase
      .from("predictions")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }

    if (row?.image_url) {
      await supabase.storage
        .from("crop-images")
        .remove([row.image_url]);
    }

    return {
      ok: true,
    };
  });

export const clearAllPredictions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: rows } = await supabase
      .from("predictions")
      .select("image_url")
      .eq("user_id", userId);

    const { error } = await supabase
      .from("predictions")
      .delete()
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }

    const paths = (rows ?? [])
      .map((r) => r.image_url)
      .filter((p): p is string => !!p);

    if (paths.length) {
      await supabase.storage
        .from("crop-images")
        .remove(paths);
    }

    return {
      ok: true,
      deleted: paths.length,
    };
  });