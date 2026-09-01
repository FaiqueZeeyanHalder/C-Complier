import {
  CompileRunRequest,
  ExecutionResult,
  AIAnalysisRequest,
  AIAnalysisResponse,
  LearnLesson,
  CodingChallenge,
  CompilerEnvironmentInfo,
} from '../../shared/types.ts';

export async function checkServerHealth(): Promise<{ status: string; compiler: string; gccVersion: string }> {
  const res = await fetch('/api/health');
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function getCompilerInfo(): Promise<CompilerEnvironmentInfo> {
  const res = await fetch('/api/compiler');
  if (!res.ok) throw new Error(`Failed to load compiler information: ${res.statusText}`);
  return res.json();
}

export async function compileCode(req: CompileRunRequest): Promise<ExecutionResult> {
  const res = await fetch('/api/compile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Server returned error (${res.status}): ${text}`);
    }
  }
  return res.json();
}

export async function runCode(req: CompileRunRequest): Promise<ExecutionResult> {
  const res = await fetch('/api/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Execution request failed (${res.status}): ${text}`);
    }
  }
  return res.json();
}

export async function requestAIAnalysis(req: AIAnalysisRequest): Promise<AIAnalysisResponse> {
  const res = await fetch('/api/ai/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.markdown || data.error || `AI Request Failed (${res.status})`);
  }
  return res.json();
}

export async function getLessons(): Promise<LearnLesson[]> {
  const res = await fetch('/api/lessons');
  if (!res.ok) throw new Error('Failed to load lessons');
  return res.json();
}

export async function getChallenges(): Promise<CodingChallenge[]> {
  const res = await fetch('/api/challenges');
  if (!res.ok) throw new Error('Failed to load challenges');
  return res.json();
}

export async function runChallengeTests(
  challengeId: string,
  code: string
): Promise<{
  passed: boolean;
  totalPassed: number;
  totalTests: number;
  compileError?: string;
  results: Array<{
    id: string;
    description: string;
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
    error?: string;
    executionTime?: number;
  }>;
}> {
  const res = await fetch('/api/challenges/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengeId, code }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Challenge evaluation failed (${res.status}): ${text}`);
  }
  return res.json();
}
