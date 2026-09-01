import { GoogleGenAI } from '@google/genai';
import { AIAnalysisRequest, AIAnalysisResponse } from '../../shared/types.ts';

let aiClient: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured on the server. Please check the Secrets settings.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export class AIService {
  public async analyze(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    const ai = getAI();
    const model = 'gemini-3.7-flash';

    let systemInstruction = `You are "ForgeAI", an elite C programming instructor, compiler engineer, and systems programming tutor integrated inside CodeForge C IDE.
You specialize in standard C (C99, C11, C17), pointer arithmetic, memory management (malloc/free, stack vs heap, buffer overflows, valgrind), GCC diagnostics, POSIX systems, and algorithm complexity.

Format your responses with clean Markdown, syntax-highlighted \`\`\`c code blocks, clear bullet points, and concise explanations. Always emphasize memory safety, NULL pointer checks, and standard idioms.`;

    let prompt = '';

    switch (request.action) {
      case 'explain':
        prompt = `Explain this C code thoroughly for a learner:
\`\`\`c
${request.code}
\`\`\`
${request.selectedSnippet ? `\nSpecifically focus on this highlighted section:\n\`\`\`c\n${request.selectedSnippet}\n\`\`\`` : ''}

Please include:
1. High-level Summary: What this program achieves.
2. Step-by-Step Flow: Walkthrough of main execution and functions.
3. Memory & Pointers: Explain variables, pointer allocations, and stack/heap usage.
4. Time & Space Complexity (Big-O notation).`;
        break;

      case 'debug':
        prompt = `Help me debug and fix this C program.
Current Source Code:
\`\`\`c
${request.code}
\`\`\`

${request.error ? `Compiler / Runtime Error:\n${request.error}\n` : ''}
${request.stdin ? `Standard Input given:\n${request.stdin}\n` : ''}
${request.stdout ? `Standard Output produced:\n${request.stdout}\n` : ''}
${request.stderr ? `Standard Error produced:\n${request.stderr}\n` : ''}
${request.userMessage ? `User query:\n${request.userMessage}\n` : ''}

Please provide:
1. Root Cause Analysis: Exactly why the issue/error occurs (e.g. uninitialized pointer, off-by-one, format string mismatch, missing header).
2. Corrected Complete C Code in a single \`\`\`c code block.
3. Key Takeaways & Best Practice Tip to avoid this in C.`;
        break;

      case 'optimize':
        prompt = `Analyze this C code for performance, safety, and modern C best practices:
\`\`\`c
${request.code}
\`\`\`

Please provide:
1. Memory Safety & Security: Check for potential buffer overflows, memory leaks, dangling pointers, unchecked malloc returns.
2. Performance Optimizations: Cache locality, loop unrolling, avoiding redundant computations, data structure efficiency.
3. Idiomatic C Refactoring: Suggest improved code in \`\`\`c block with explanations.`;
        break;

      case 'testgen':
        prompt = `Generate a comprehensive suite of test cases (inputs and expected behaviors) for this C program:
\`\`\`c
${request.code}
\`\`\`

Provide:
1. Standard nominal cases
2. Edge cases (zero, negative, maximum bounds, empty strings, unusual characters)
3. Stress / Extreme cases
4. Exact stdin values to paste into the IDE Input tab to test.`;
        break;

      case 'error_help':
        prompt = `Explain the following GCC / Runtime error in simple, actionable terms for a C programmer:
Error:
${request.error}

Source context:
\`\`\`c
${request.code}
\`\`\`

Explain:
1. What the error message means in plain English.
2. The exact line and cause.
3. How to fix it with code snippet.`;
        break;

      case 'chat':
      default:
        prompt = `User query about C programming:
${request.userMessage || 'How does memory management work in C?'}

${request.code ? `Current code in IDE:\n\`\`\`c\n${request.code}\n\`\`\`\n` : ''}
${request.stdin ? `Current stdin:\n${request.stdin}\n` : ''}
${request.stdout ? `Current stdout:\n${request.stdout}\n` : ''}
${request.error ? `Current errors:\n${request.error}\n` : ''}`;
        break;
    }

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.4,
      },
    });

    const markdown = response.text || 'No response generated from AI.';

    // Extract code block if suggestedFix is present
    let suggestedFix: string | undefined;
    const cBlockMatch = markdown.match(/```c([\s\S]*?)```/);
    if (cBlockMatch && cBlockMatch[1]) {
      suggestedFix = cBlockMatch[1].trim();
    }

    return {
      markdown,
      suggestedFix,
      explanation: markdown,
    };
  }
}
