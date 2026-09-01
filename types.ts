export interface CProjectFile {
  id: string;
  name: string;
  content: string;
  path: string; // e.g. "main.c" or "src/utils.c"
  isFolder?: boolean;
  parentId?: string | null;
  updatedAt: number;
}

export type ProjectFile = CProjectFile;

export interface CProject {
  id: string;
  name: string;
  description?: string;
  files: CProjectFile[];
  activeFileId: string;
  openFileIds: string[];
  createdAt: number;
  updatedAt: number;
  stdin?: string;
  cStandard?: 'c11' | 'c17' | 'c23';
}

export type Project = CProject;

export interface CompileRunRequest {
  code?: string;
  stdin?: string;
  compilerOptions?: string[];
  compilerFlags?: string[];
  standard?: 'c11' | 'c17' | 'c23';
  files?: Array<{ name: string; content: string }>; // For multi-file projects
  activeFileName?: string;
  entryFile?: string;
}

export interface CHeaderInfo {
  name: string;
  category: 'standard' | 'posix' | 'system';
  description: string;
  commonFunctions: string[];
  available: boolean;
}

export interface CompilerEnvironmentInfo {
  compiler: string;
  version: string;
  fullVersion: string;
  defaultStandard: 'c17';
  supportedStandards: Array<'c11' | 'c17' | 'c23'>;
  availableHeaders: CHeaderInfo[];
  linkerFlags: string[];
}

export interface UserProfile {
  username: string;
  stats: {
    totalRuns: number;
    challengesSolved: string[];
    lessonsCompleted: string[];
  };
}


export interface ProblemItem {
  type: 'error' | 'warning' | 'info' | 'runtime';
  message: string;
  file?: string;
  line?: number;
  column?: number;
  raw: string;
}

export interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  compileError: string;
  runtimeError: string;
  executionTime: number; // in milliseconds
  exitCode?: number | null;
  signal?: string | null;
  memoryUsageKb?: number;
  problems?: ProblemItem[];
  compilerCommand?: string;
}

export interface AIAnalysisRequest {
  action: 'explain' | 'debug' | 'optimize' | 'testgen' | 'chat' | 'error_help';
  code: string;
  stdin?: string;
  stdout?: string;
  stderr?: string;
  error?: string;
  userMessage?: string;
  chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  selectedSnippet?: string;
}

export interface AIAnalysisResponse {
  markdown: string;
  suggestedFix?: string;
  explanation?: string;
  tips?: string[];
  testCases?: Array<{ name: string; input: string; expectedOutput?: string }>;
}

export interface LearnLesson {
  id: string;
  title: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  summary: string;
  content: string;
  codeSnippet: string;
  hints: string[];
}

export interface CodingChallenge {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  description: string;
  starterCode: string;
  hints: string[];
  testCases: Array<{
    id: string;
    input: string;
    expectedOutput: string;
    description: string;
    hidden?: boolean;
  }>;
}

export interface EditorSettings {
  fontSize: number;
  tabSize: number;
  theme: 'vs-dark' | 'vs-light';
  minimap: boolean;
  wordWrap: 'on' | 'off';
  cursorBlinking: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid';
  autoSave: boolean;
  autoSaveDelay: number;
  lineNumbers: 'on' | 'off' | 'relative';
  cStandard: 'c11' | 'c17' | 'c23';
}
