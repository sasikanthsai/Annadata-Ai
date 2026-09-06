type GeminiPart =
  | {
      text: string;
    }
  | {
      inlineData: {
        mimeType: string;
        data: string;
      };
    };

type GeminiContent = {
  role?: "user" | "model";
  parts: GeminiPart[];
};

type GeminiTool = {
  functionDeclarations: Array<Record<string, unknown>>;
};

type GeminiOptions = {
  contents: GeminiContent[];
  systemInstruction?: string;
  responseMimeType?: "text/plain" | "application/json";
  temperature?: number;
  maxOutputTokens?: number;
  tools?: GeminiTool[];
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
  }>;
  error?: {
    message?: string;
    status?: string;
  };
};

const GEMINI_MODEL = "gemini-3.6-flash";

export async function generateGeminiContent(
  options: GeminiOptions,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("AI service not configured.");
  }

  const generationConfig: Record<string, unknown> = {};

  if (options.responseMimeType) {
    generationConfig.responseMimeType = options.responseMimeType;
  }

  if (options.maxOutputTokens !== undefined) {
    generationConfig.maxOutputTokens = options.maxOutputTokens;
  }

  const body: Record<string, unknown> = {
    contents: options.contents,
    generationConfig,
  };

  if (options.systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: options.systemInstruction }],
    };
  }

  if (options.tools?.length) {
    body.tools = options.tools;
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(body),
    },
  );

  if (response.status === 429) {
    throw new Error("AI rate limit exceeded. Try again shortly.");
  }

  if (response.status === 401 || response.status === 403) {
    throw new Error("Gemini API authentication failed.");
  }

  if (!response.ok) {
    try {
      const errorJson = (await response.json()) as GeminiResponse;

      if (errorJson.error?.message) {
        console.error("[Gemini]", errorJson.error.message);
      }
    } catch {
      // Ignore JSON parsing errors.
    }

    throw new Error("Gemini AI service unavailable.");
  }

  const json = (await response.json()) as GeminiResponse;

  const text =
    json.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim() ?? "";

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return text;
}