import { CProject, CProjectFile } from '../../shared/types.ts';

export function downloadFile(file: CProjectFile): void {
  const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name || 'code.c';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportProjectAsJSON(project: CProject): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
  const a = document.createElement('a');
  a.href = dataStr;
  const safeName = project.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  a.download = `${safeName || 'c_project'}_codeforge.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function generateShareUrl(code: string, stdin?: string): string {
  const payload = { c: code, s: stdin || '' };
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  const url = new URL(window.location.href);
  url.searchParams.set('snippet', b64);
  return url.toString();
}

export function readSharedSnippetFromUrl(): { code: string; stdin?: string } | null {
  try {
    const url = new URL(window.location.href);
    const snippet = url.searchParams.get('snippet');
    if (!snippet) return null;
    const json = decodeURIComponent(escape(atob(snippet)));
    const parsed = JSON.parse(json);
    return {
      code: parsed.c || '',
      stdin: parsed.s || '',
    };
  } catch {
    return null;
  }
}
