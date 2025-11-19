/**
 * Hybrid Compliance Engine
 * 
 * Combines deterministic rules engine with AI augmentation
 * for reliable, consistent, and intelligent compliance checking
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getFileContent } from './github';
import { prisma } from './prisma';
import { evaluateRules, type Platform as RulePlatform, type ComplianceRule } from './compliance-rules';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface ComplianceIssue {
  // Deterministic fields (from rules engine)
  ruleId: string;
  severity: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  solution: string;
  file?: string;
  
  // AI-augmented fields (optional)
  aiPinpointLocation?: {
    filePath: string;
    lineNumbers: number[];
  };
  aiSuggestedFix?: {
    explanation: string;
    codeSnippet: string;
  };
  aiContentValidation?: {
    isLegitimate: boolean;
    issues: string[];
    suggestions: string[];
  };
}

export interface AnalysisResult {
  issues: ComplianceIssue[];
  success: boolean;
}

/**
 * Main analysis function: Deterministic + AI Augmentation
 */
export async function analyzeRepositoryCompliance(
  owner: string,
  repo: string,
  checkType: 'APPLE_APP_STORE' | 'GOOGLE_PLAY_STORE' | 'CHROME_WEB_STORE' | 'MOBILE_PLATFORMS',
  branchName?: string
): Promise<AnalysisResult> {
  try {
    console.log(`[Hybrid Engine] Starting analysis for ${owner}/${repo}@${branchName || 'default'} (${checkType})`);
    
    // Step 1: Fetch repository files
    const files = await fetchRelevantFiles(owner, repo, branchName);
    console.log(`[Hybrid Engine] Fetched ${Object.keys(files).filter(k => files[k]).length} files`);
    
    // Step 2: Run deterministic rules engine
    console.log(`[Hybrid Engine] Running deterministic rules engine...`);
    const violations = evaluateRules(files, checkType as RulePlatform);
    console.log(`[Hybrid Engine] Found ${violations.length} deterministic violations`);
    
    // Step 3: Convert violations to issues
    const issues: ComplianceIssue[] = violations.map(rule => ({
      ruleId: rule.ruleId,
      severity: rule.severity,
      category: rule.category,
      description: rule.description,
      solution: rule.staticSolution,
      file: findRelevantFile(rule, files),
    }));
    
    // Step 4: AI Content Validation (validate file legitimacy)
    console.log(`[Hybrid Engine] Running AI content validation...`);
    const contentValidationIssues = await runContentValidation(files, checkType as RulePlatform);
    console.log(`[Hybrid Engine] Found ${contentValidationIssues.length} content validation issues`);
    
    // Merge content validation issues with deterministic issues
    const allIssues = [...issues, ...contentValidationIssues];
    
    // Step 5: AI Augmentation (async, non-blocking)
    console.log(`[Hybrid Engine] Starting AI augmentation for ${allIssues.length} issues...`);
    const augmentedIssues = await Promise.all(
      allIssues.map(async (issue) => {
        try {
          const augmentation = await augmentIssueWithAI(issue, files, checkType);
          return { ...issue, ...augmentation };
        } catch (error) {
          console.error(`[Hybrid Engine] AI augmentation failed for ${issue.ruleId}:`, error);
          return issue; // Return deterministic issue without augmentation
        }
      })
    );
    
    console.log(`[Hybrid Engine] Analysis complete: ${augmentedIssues.length} issues (${violations.length} deterministic + AI enhancements)`);
    
    return {
      issues: augmentedIssues,
      success: true,
    };
  } catch (error) {
    console.error('[Hybrid Engine] Unexpected error:', error);
    return {
      issues: [],
      success: false,
    };
  }
}

/**
 * Fetch relevant files from repository
 */
async function fetchRelevantFiles(
  owner: string,
  repo: string,
  branchName?: string
): Promise<{ [key: string]: string | null }> {
  const filesToCheck = [
    // Core documentation
    'README.md',
    'LICENSE',
    
    // Mobile app files
    'package.json',
    'app.json',
    'app.config.js',
    'AndroidManifest.xml',
    'Info.plist',
    'build.gradle',
    'app/build.gradle',
    
    // Chrome extension files
    'manifest.json',
    
    // Privacy and legal
    'privacy-policy.md',
    'PRIVACY.md',
    'terms-of-service.md',
    'TERMS.md',
    'COMMUNITY_GUIDELINES.md',
    
    // Security configs
    'network_security_config.xml',
    'res/xml/network_security_config.xml',
    'PrivacyInfo.xcprivacy',
    
    // Additional config files
    'strings.xml',
    'res/values/strings.xml',
  ];

  const files: { [key: string]: string | null } = {};

  for (const file of filesToCheck) {
    try {
      const content = await getFileContent(owner, repo, file, branchName);
      files[file] = content;
      if (content) {
        console.log(`[Hybrid Engine] ✓ Fetched ${file}`);
      }
    } catch (error) {
      files[file] = null;
    }
  }

  return files;
}

/**
 * Find the most relevant file for a rule
 */
function findRelevantFile(
  rule: ComplianceRule,
  files: { [key: string]: string | null }
): string | undefined {
  if (rule.requiredFiles) {
    for (const file of rule.requiredFiles) {
      if (files[file]) {
        return file;
      }
    }
  }
  
  const category = rule.category.toLowerCase();
  if (category.includes('privacy')) {
    return files['PRIVACY.md'] ? 'PRIVACY.md' : 'README.md';
  }
  if (category.includes('permission')) {
    return files['AndroidManifest.xml'] ? 'AndroidManifest.xml' : 'README.md';
  }
  if (category.includes('description')) {
    return files['README.md'] ? 'README.md' : 'package.json';
  }
  
  return 'README.md';
}

/**
 * AI Augmentation: Enhance deterministic issue with contextual intelligence
 */
interface AIAugmentation {
  aiPinpointLocation?: {
    filePath: string;
    lineNumbers: number[];
  };
  aiSuggestedFix?: {
    explanation: string;
    codeSnippet: string;
  };
  aiContentValidation?: {
    isLegitimate: boolean;
    issues: string[];
    suggestions: string[];
  };
}

async function augmentIssueWithAI(
  issue: ComplianceIssue,
  files: { [key: string]: string | null },
  checkType: string
): Promise<AIAugmentation> {
  try {
    const relevantFile = issue.file;
    if (!relevantFile || !files[relevantFile]) {
      return {};
    }

    const fileContent = files[relevantFile];
    if (!fileContent) {
      return {};
    }

    // Add line numbers
    const lines = fileContent.split('\n');
    const numberedContent = lines
      .map((line, idx) => `${idx + 1}: ${line}`)
      .slice(0, 200) // Increased to 200 lines for better content analysis
      .join('\n');

    console.log(`[AI Augmentation] Processing ${issue.ruleId} for ${relevantFile}...`);
    
    const model = genAI.getGenerativeModel({ model: 'gemini-3.0-pro' });

    // Enhanced prompt for both location finding and content validation
    const prompt = `You are a compliance expert for ${checkType} app store policies. A compliance violation has been detected:

Rule ID: ${issue.ruleId}
Category: ${issue.category}
Description: ${issue.description}
Platform: ${checkType}

File: ${relevantFile}
Content (with line numbers):
\`\`\`
${numberedContent}
\`\`\`

Tasks:
1. Validate if the file content is legitimate and compliant (not just placeholder/fake content)
2. Identify exact line numbers where this rule is violated or where a fix should be added
3. Provide specific, actionable code fixes

For content validation, check for:
- Placeholder text (e.g., "Lorem ipsum", "TODO", "Coming soon", "Your app name here")
- Generic/template content that hasn't been customized
- Missing required information for the compliance rule
- Fake or insufficient privacy policy content
- Incomplete or non-functional configuration

Respond ONLY with valid JSON:
{
  "isLegitimate": boolean,
  "contentIssues": ["list of specific content problems found"],
  "suggestions": ["list of specific improvements needed"],
  "lineNumbers": [array of line numbers where issues occur],
  "explanation": "brief explanation of the violation",
  "codeSnippet": "exact code to add/modify"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const augmentation = JSON.parse(jsonMatch[0]);
      console.log(`[AI Augmentation] ✓ Success for ${issue.ruleId} - Legitimate: ${augmentation.isLegitimate}`);
      return {
        aiPinpointLocation: {
          filePath: relevantFile,
          lineNumbers: augmentation.lineNumbers || [],
        },
        aiSuggestedFix: {
          explanation: augmentation.explanation || '',
          codeSnippet: augmentation.codeSnippet || '',
        },
        aiContentValidation: {
          isLegitimate: augmentation.isLegitimate || false,
          issues: augmentation.contentIssues || [],
          suggestions: augmentation.suggestions || [],
        },
      };
    }
    
    return {};
  } catch (error) {
    console.error(`[AI Augmentation] Error for ${issue.ruleId}:`, error);
    return {};
  }
}

/**
 * AI-powered content validation for specific file types
 */
async function validateFileContentWithAI(
  filePath: string,
  content: string,
  expectedType: 'privacy_policy' | 'manifest' | 'readme' | 'config',
  platform: string
): Promise<{
  isValid: boolean;
  issues: string[];
  suggestions: string[];
}> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.0-flash' });
    
    const validationPrompts = {
      privacy_policy: `Analyze this privacy policy for ${platform} compliance. Check for:
- Specific data collection practices (not generic templates)
- Clear explanation of data usage
- Contact information for privacy inquiries
- Compliance with platform-specific requirements
- Legitimate, non-placeholder content`,
      
      manifest: `Analyze this manifest file for ${platform} compliance. Check for:
- Proper permission declarations with justification
- Correct configuration values (not defaults/placeholders)
- Required fields are properly filled
- Security configurations are appropriate`,
      
      readme: `Analyze this README for ${platform} app store compliance. Check for:
- Clear app description (not template text)
- Proper feature documentation
- Contact/support information
- Privacy policy links
- Legitimate project information (not placeholder)`,
      
      config: `Analyze this configuration file for ${platform} compliance. Check for:
- Proper security settings
- Non-default/placeholder values
- Required configurations are present
- Best practices are followed`
    };

    const prompt = `${validationPrompts[expectedType]}

File: ${filePath}
Content:
\`\`\`
${content.slice(0, 3000)} // Limit content for API
\`\`\`

Respond ONLY with valid JSON:
{
  "isValid": boolean,
  "issues": ["specific problems found"],
  "suggestions": ["specific improvements needed"]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const validation = JSON.parse(jsonMatch[0]);
      return {
        isValid: validation.isValid || false,
        issues: validation.issues || [],
        suggestions: validation.suggestions || [],
      };
    }
    
    return { isValid: false, issues: ['Failed to parse AI response'], suggestions: [] };
  } catch (error) {
    console.error(`[Content Validation] Error validating ${filePath}:`, error);
    return { isValid: false, issues: ['AI validation failed'], suggestions: [] };
  }
}

/**
 * Create CheckRun record
 */
export async function createCheckRun(
  owner: string,
  repo: string,
  checkType: 'APPLE_APP_STORE' | 'GOOGLE_PLAY_STORE' | 'CHROME_WEB_STORE' | 'MOBILE_PLATFORMS',
  branchName: string = 'main'
): Promise<string> {
  const checkRun = await prisma.checkRun.create({
    data: {
      repositoryId: `${owner}/${repo}`,
      owner,
      repo,
      branchName,
      status: 'IN_PROGRESS',
      checkType,
    },
  });
  
  console.log(`[Hybrid Engine] Created CheckRun ${checkRun.id}`);
  return checkRun.id;
}

/**
 * Update CheckRun with results
 */
export async function updateCheckRunWithResults(
  checkRunId: string,
  result: AnalysisResult
): Promise<void> {
  await prisma.checkRun.update({
    where: { id: checkRunId },
    data: {
      status: result.success ? 'COMPLETED' : 'FAILED',
      issues: result.issues as any,
      completedAt: new Date(),
    },
  });
  
  console.log(`[Hybrid Engine] Updated CheckRun ${checkRunId}: ${result.issues.length} issues`);
}

/**
 * Run AI-powered content validation on all files
 */
async function runContentValidation(
  files: { [key: string]: string | null },
  platform: RulePlatform
): Promise<ComplianceIssue[]> {
  const validationIssues: ComplianceIssue[] = [];
  
  // Define file validation mappings
  const fileValidations = [
    { file: 'README.md', type: 'readme' as const, priority: 'high' as const },
    { file: 'PRIVACY.md', type: 'privacy_policy' as const, priority: 'high' as const },
    { file: 'privacy-policy.md', type: 'privacy_policy' as const, priority: 'high' as const },
    { file: 'manifest.json', type: 'manifest' as const, priority: 'high' as const },
    { file: 'AndroidManifest.xml', type: 'manifest' as const, priority: 'high' as const },
    { file: 'Info.plist', type: 'config' as const, priority: 'medium' as const },
    { file: 'package.json', type: 'config' as const, priority: 'medium' as const },
  ];
  
  for (const validation of fileValidations) {
    const content = files[validation.file];
    if (content) {
      try {
        console.log(`[Content Validation] Validating ${validation.file}...`);
        const result = await validateFileContentWithAI(
          validation.file,
          content,
          validation.type,
          platform
        );
        
        if (!result.isValid && result.issues.length > 0) {
          validationIssues.push({
            ruleId: `AI-CONTENT-${validation.file.replace(/[^A-Z0-9]/gi, '_').toUpperCase()}`,
            severity: validation.priority,
            category: 'Content Validation',
            description: `AI detected content issues in ${validation.file}: ${result.issues.join(', ')}`,
            solution: `Address the following content issues: ${result.suggestions.join('; ')}`,
            file: validation.file,
            aiContentValidation: {
              isLegitimate: result.isValid,
              issues: result.issues,
              suggestions: result.suggestions,
            },
          });
        }
      } catch (error) {
        console.error(`[Content Validation] Error validating ${validation.file}:`, error);
      }
    }
  }
  
  return validationIssues;
}

/**
 * Main entry point: Analyze and persist
 */
export async function analyzeAndPersistCompliance(
  owner: string,
  repo: string,
  checkType: 'APPLE_APP_STORE' | 'GOOGLE_PLAY_STORE' | 'CHROME_WEB_STORE' | 'MOBILE_PLATFORMS',
  branchName: string = 'main'
): Promise<string> {
  const checkRunId = await createCheckRun(owner, repo, checkType, branchName);
  
  try {
    const result = await analyzeRepositoryCompliance(owner, repo, checkType, branchName);
    await updateCheckRunWithResults(checkRunId, result);
    return checkRunId;
  } catch (error) {
    await prisma.checkRun.update({
      where: { id: checkRunId },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      },
    });
    throw error;
  }
}
