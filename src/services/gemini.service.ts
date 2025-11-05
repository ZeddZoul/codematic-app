import { promises as fs } from "fs";
// The @google/genai package API may differ between versions. Use a runtime require
// and provide safe fallbacks for local development so TypeScript compilation
// doesn't fail if the package surface changes.

// --- Gemini API Initialization ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error(
    "GEMINI_API_KEY environment variable is not set. The application cannot start."
  );
}

// Try to load the library dynamically and extract the pieces we need. If the
// package is unavailable or has a mismatched surface, fall back to lightweight
// placeholders that will raise a clear runtime error when used.
let genAI: any;
let HarmCategory: any = {
  HARM_CATEGORY_HARASSMENT: "HARM_CATEGORY_HARASSMENT",
  HARM_CATEGORY_HATE_SPEECH: "HARM_CATEGORY_HATE_SPEECH",
  HARM_CATEGORY_SEXUALLY_EXPLICIT: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
  HARM_CATEGORY_DANGEROUS_CONTENT: "HARM_CATEGORY_DANGEROUS_CONTENT",
};
let HarmBlockThreshold: any = {
  BLOCK_ONLY_HIGH: "BLOCK_ONLY_HIGH",
  BLOCK_NONE: "BLOCK_NONE",
};
let FunctionDeclarationSchemaType: any = {
  OBJECT: "object",
  STRING: "string",
  NUMBER: "number",
  ARRAY: "array",
};

// Allow mock mode for local development and CI when the GenAI SDK or credentials
// are not available. Set USE_GEMINI_MOCK=true to force mock mode.
const USE_MOCK =
  process.env.USE_GEMINI_MOCK === "true" ||
  process.env.NODE_ENV !== "production";

if (USE_MOCK) {
  console.log(
    "Gemini service running in MOCK mode (USE_GEMINI_MOCK=true or non-production)."
  );
  genAI = {
    getGenerativeModel: () => ({
      generateContent: async (_prompt: string) => {
        const sample = {
          app_status: "LOW_RISK",
          risk_score: 10,
          issues: [
            {
              guideline_id: "G-001",
              severity: "LOW",
              file_path: "src/utils/crypto.ts",
              line_number: 12,
              violation_summary: "Use of weak key derivation parameters.",
              actionable_fix:
                "Use scrypt with higher N/r/p values or Argon2 for better KDF strength.",
            },
          ],
        };

        return {
          response: {
            text: () => JSON.stringify(sample),
          },
        };
      },
    }),
  };
} else {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const genaiPkg = require("@google/genai");
    const GoogleGenerativeAI =
      genaiPkg.GoogleGenerativeAI ||
      genaiPkg.GoogleGenerativeAIClient ||
      genaiPkg.default?.GoogleGenerativeAI ||
      genaiPkg.default;
    if (!GoogleGenerativeAI)
      throw new Error(
        "Could not find a GoogleGenerativeAI constructor in @google/genai"
      );
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    // Override enums if the package provides them
    if (genaiPkg.HarmCategory) HarmCategory = genaiPkg.HarmCategory;
    if (genaiPkg.HarmBlockThreshold)
      HarmBlockThreshold = genaiPkg.HarmBlockThreshold;
    if (genaiPkg.FunctionDeclarationSchemaType)
      FunctionDeclarationSchemaType = genaiPkg.FunctionDeclarationSchemaType;
  } catch (err) {
    console.warn(
      "@google/genai not available or incompatible. Gemini calls will fail at runtime.",
      err
    );
    genAI = {
      getGenerativeModel: () => ({
        generateContent: async () => {
          throw new Error("@google/genai not available");
        },
      }),
    };
  }
}
import {
  fetchComplianceRules,
  ComplianceRule,
  ComplianceReport,
} from "./firestore.service";

const generationConfig: any = {
  responseMimeType: "application/json",
  temperature: 0.2, // Lower temperature for more deterministic, fact-based output
  topP: 0.8,
  topK: 40,
};

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
];

// Define the precise JSON schema we expect from the Gemini API
const responseSchema = {
  type: FunctionDeclarationSchemaType.OBJECT,
  properties: {
    app_status: {
      type: FunctionDeclarationSchemaType.STRING,
      enum: ["HIGH_RISK", "MEDIUM_RISK", "LOW_RISK", "UNKNOWN"],
    },
    risk_score: { type: FunctionDeclarationSchemaType.NUMBER },
    issues: {
      type: FunctionDeclarationSchemaType.ARRAY,
      items: {
        type: FunctionDeclarationSchemaType.OBJECT,
        properties: {
          guideline_id: { type: FunctionDeclarationSchemaType.STRING },
          severity: {
            type: FunctionDeclarationSchemaType.STRING,
            enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
          },
          file_path: { type: FunctionDeclarationSchemaType.STRING },
          line_number: { type: FunctionDeclarationSchemaType.NUMBER },
          violation_summary: { type: FunctionDeclarationSchemaType.STRING },
          actionable_fix: { type: FunctionDeclarationSchemaType.STRING },
        },
        required: [
          "guideline_id",
          "severity",
          "file_path",
          "violation_summary",
          "actionable_fix",
        ],
      },
    },
  },
  required: ["app_status", "risk_score", "issues"],
};

/**
 * Constructs the detailed prompt for the Gemini API.
 * @param {ComplianceRule[]} rules The compliance rules from Firestore.
 * @param {Map<string, string>} fileContents A map of file paths to their contents.
 * @returns {string} The fully constructed prompt.
 */
const constructPrompt = (
  rules: ComplianceRule[],
  fileContents: Map<string, string>
): string => {
  let prompt = `
        **Role**: You are an expert mobile application compliance auditor.
        **Task**: Analyze the following source code files against a set of compliance guidelines and produce a detailed report in JSON format.
        **Output Format**: Your response MUST be a single, valid JSON object that adheres to the provided schema. Do not include any explanatory text or markdown formatting outside of the JSON object itself.

        **Compliance Guidelines to Enforce**:
        ${rules
          .map(
            (rule) => `
        - **Guideline ID**: ${rule.guideline_id}
          **Name**: ${rule.name}
          **Rule**: ${rule.rule_text}
          **Files to check**: ${rule.target_files.join(", ")}
        `
          )
          .join("")}

        **Source Code Files for Analysis**:
    `;

  for (const [filePath, content] of fileContents.entries()) {
    prompt += `
        ---
        **File Path**: ${filePath}
        **Content**:
        \`\`\`
        ${content}
        \`\`\`
        ---
        `;
  }

  return prompt;
};

/**
 * Performs a compliance analysis using the Gemini API with retry logic.
 * @param {string[]} criticalFilePaths Paths to the critical files for analysis.
 * @returns {Promise<ComplianceReport>} The structured compliance report from the Gemini API.
 */
export const performComplianceAnalysis = async (
  criticalFilePaths: string[]
): Promise<ComplianceReport> => {
  const MAX_RETRIES = 3;
  let attempt = 0;

  const rules = await fetchComplianceRules();
  if (rules.length === 0) {
    // If there are no rules, we can't perform an analysis.
    return {
      app_status: "UNKNOWN",
      risk_score: -1,
      issues: [
        {
          guideline_id: "N/A",
          severity: "LOW",
          file_path: "N/A",
          violation_summary:
            "No compliance rules were found in the database. Cannot perform analysis.",
          actionable_fix:
            "Configure compliance rules in the Firestore collection: /global/minosguard/compliance_rules",
        },
      ],
    };
  }

  const fileContents = new Map<string, string>();
  for (const filePath of criticalFilePaths) {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      fileContents.set(filePath, content);
    } catch (error) {
      console.warn(`Could not read file ${filePath}:`, error);
    }
  }

  if (fileContents.size === 0) {
    return {
      app_status: "LOW_RISK",
      risk_score: 100,
      issues: [],
    };
  }

  const prompt = constructPrompt(rules, fileContents);

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash-latest",
    generationConfig: { ...generationConfig, responseSchema },
    safetySettings,
  });

  while (attempt < MAX_RETRIES) {
    try {
      console.log(`Gemini API Call - Attempt ${attempt + 1}`);
      const result = await model.generateContent(prompt);
      const response = result.response;
      const jsonText = response.text();

      // The Gemini API with a response schema should return valid JSON, but we parse it to be safe.
      return JSON.parse(jsonText) as ComplianceReport;
    } catch (error) {
      console.error(`Gemini API error on attempt ${attempt + 1}:`, error);
      attempt++;
      if (attempt >= MAX_RETRIES) {
        throw new Error("Gemini API call failed after multiple retries.");
      }
      // Exponential backoff: 2s, 4s, 8s
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`Retrying in ${delay}ms...`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }

  // This should be unreachable, but it satisfies TypeScript's need for a return path.
  throw new Error("Failed to get a response from Gemini API.");
};
