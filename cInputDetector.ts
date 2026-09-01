/**
 * Detects whether C/C++ source code uses standard input functions.
 */
export interface InputFunctionDetection {
  hasInput: boolean;
  functions: string[];
  summary: string;
}

export function detectInputFunctions(code: string): InputFunctionDetection {
  if (!code || typeof code !== 'string') {
    return { hasInput: false, functions: [], summary: '' };
  }

  // Remove comments and string literals to avoid false positives
  const strippedCode = code
    .replace(/\/\*[\s\S]*?\*\//g, '') // block comments
    .replace(/\/\/.*/g, '') // line comments
    .replace(/"(?:[^"\\]|\\.)*"/g, '""'); // string literals

  const detected: string[] = [];

  if (/\bscanf\s*\(/.test(strippedCode)) detected.push('scanf');
  if (/\bfgets\s*\(/.test(strippedCode)) detected.push('fgets');
  if (/\bgetchar\s*\(/.test(strippedCode)) detected.push('getchar');
  if (/\bgetc\s*\(/.test(strippedCode)) detected.push('getc');
  if (/\bfgetc\s*\(/.test(strippedCode)) detected.push('fgetc');
  if (/\bgetline\s*\(/.test(strippedCode)) detected.push('getline');
  if (/\bgets\s*\(/.test(strippedCode)) detected.push('gets');
  if (/\bscanf_s\s*\(/.test(strippedCode)) detected.push('scanf_s');
  if (/\bfscanf\s*\(\s*stdin\s*,/.test(strippedCode)) detected.push('fscanf(stdin)');
  if (/\bread\s*\(\s*0\s*,/.test(strippedCode)) detected.push('read(0, ...)');
  if (/\bcin\s*>>/.test(strippedCode)) detected.push('cin');

  return {
    hasInput: detected.length > 0,
    functions: detected,
    summary: detected.join(', '),
  };
}
