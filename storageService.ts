import { CProject, EditorSettings } from '../../shared/types.ts';
import { INITIAL_PROJECT } from '../data/defaultProject.ts';

const DB_NAME = 'CodeForgeC_DB';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';
const STORE_SETTINGS = 'settings';
const STORE_STATS = 'stats';

export interface UserStats {
  executionsCount: number;
  totalExecTimeMs: number;
  completedChallenges: string[];
  lastActive: number;
}

export interface IProjectRepository {
  getAllProjects(): Promise<CProject[]>;
  getProject(id: string): Promise<CProject | null>;
  saveProject(project: CProject): Promise<void>;
  deleteProject(id: string): Promise<void>;
  duplicateProject(id: string): Promise<CProject>;
}

class IndexedDBStorage implements IProjectRepository {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
          db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
          db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains(STORE_STATS)) {
          db.createObjectStore(STORE_STATS, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  public async getAllProjects(): Promise<CProject[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PROJECTS, 'readonly');
        const store = tx.objectStore(STORE_PROJECTS);
        const req = store.getAll();

        req.onsuccess = () => {
          const list = (req.result as CProject[]) || [];
          if (list.length === 0) {
            // Seed initial project
            this.saveProject(INITIAL_PROJECT).then(() => resolve([INITIAL_PROJECT]));
          } else {
            // Sort by most recently updated
            list.sort((a, b) => b.updatedAt - a.updatedAt);
            resolve(list);
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return this.fallbackGetAllProjects();
    }
  }

  public async getProject(id: string): Promise<CProject | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PROJECTS, 'readonly');
        const store = tx.objectStore(STORE_PROJECTS);
        const req = store.get(id);

        req.onsuccess = () => resolve((req.result as CProject) || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return this.fallbackGetProject(id);
    }
  }

  public async saveProject(project: CProject): Promise<void> {
    const updated = { ...project, updatedAt: Date.now() };
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PROJECTS, 'readwrite');
        const store = tx.objectStore(STORE_PROJECTS);
        const req = store.put(updated);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      this.fallbackSaveProject(updated);
    }
  }

  public async deleteProject(id: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PROJECTS, 'readwrite');
        const store = tx.objectStore(STORE_PROJECTS);
        const req = store.delete(id);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      this.fallbackDeleteProject(id);
    }
  }

  public async duplicateProject(id: string): Promise<CProject> {
    const original = await this.getProject(id);
    if (!original) throw new Error('Project not found to duplicate');

    const now = Date.now();
    const newProject: CProject = {
      ...original,
      id: `proj-${now}-${Math.random().toString(36).substring(2, 7)}`,
      name: `${original.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
      files: original.files.map((f) => ({
        ...f,
        id: `file-${now}-${Math.random().toString(36).substring(2, 7)}`,
        updatedAt: now,
      })),
    };

    if (newProject.files.length > 0) {
      newProject.activeFileId = newProject.files[0].id;
      newProject.openFileIds = [newProject.files[0].id];
    }

    await this.saveProject(newProject);
    return newProject;
  }

  // --- LocalStorage Fallback Implementations ---
  private fallbackGetAllProjects(): CProject[] {
    try {
      const raw = localStorage.getItem('codeforge_c_projects');
      if (!raw) {
        localStorage.setItem('codeforge_c_projects', JSON.stringify([INITIAL_PROJECT]));
        return [INITIAL_PROJECT];
      }
      return JSON.parse(raw);
    } catch {
      return [INITIAL_PROJECT];
    }
  }

  private fallbackGetProject(id: string): CProject | null {
    const list = this.fallbackGetAllProjects();
    return list.find((p) => p.id === id) || null;
  }

  private fallbackSaveProject(project: CProject): void {
    try {
      const list = this.fallbackGetAllProjects();
      const idx = list.findIndex((p) => p.id === project.id);
      if (idx >= 0) {
        list[idx] = project;
      } else {
        list.push(project);
      }
      localStorage.setItem('codeforge_c_projects', JSON.stringify(list));
    } catch (e) {
      console.error('LocalStorage write failed:', e);
    }
  }

  private fallbackDeleteProject(id: string): void {
    try {
      let list = this.fallbackGetAllProjects();
      list = list.filter((p) => p.id !== id);
      localStorage.setItem('codeforge_c_projects', JSON.stringify(list));
    } catch (e) {
      console.error('LocalStorage delete failed:', e);
    }
  }
}

export const projectStorage = new IndexedDBStorage();

export async function loadProjects(): Promise<CProject[]> {
  return projectStorage.getAllProjects();
}

export async function saveProject(project: CProject): Promise<void> {
  return projectStorage.saveProject(project);
}

export async function deleteProject(id: string): Promise<void> {
  return projectStorage.deleteProject(id);
}

export function loadProfile() {
  try {
    const raw = localStorage.getItem('codeforge_profile');
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    username: 'Systems C Programmer',
    stats: {
      totalRuns: 0,
      challengesSolved: [],
      lessonsCompleted: [],
    },
  };
}

export function saveProfile(profile: any): void {
  try {
    localStorage.setItem('codeforge_profile', JSON.stringify(profile));
  } catch {}
}

export function recordRunExecution(): void {
  const profile = loadProfile();
  profile.stats.totalRuns = (profile.stats.totalRuns || 0) + 1;
  saveProfile(profile);
}


export const DEFAULT_SETTINGS: EditorSettings = {
  fontSize: 14,
  tabSize: 4,
  theme: 'vs-dark',
  minimap: true,
  wordWrap: 'on',
  cursorBlinking: 'smooth',
  autoSave: true,
  autoSaveDelay: 1000,
  lineNumbers: 'on',
  cStandard: 'c17',
};

export function loadSettings(): EditorSettings {
  try {
    const raw = localStorage.getItem('codeforge_settings');
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // fallback
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: EditorSettings): void {
  try {
    localStorage.setItem('codeforge_settings', JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function loadUserStats(): UserStats {
  try {
    const raw = localStorage.getItem('codeforge_stats');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return {
    executionsCount: 0,
    totalExecTimeMs: 0,
    completedChallenges: [],
    lastActive: Date.now(),
  };
}

export function recordExecutionStat(execTimeMs: number): UserStats {
  const stats = loadUserStats();
  stats.executionsCount += 1;
  stats.totalExecTimeMs += execTimeMs;
  stats.lastActive = Date.now();
  try {
    localStorage.setItem('codeforge_stats', JSON.stringify(stats));
  } catch {
    // ignore
  }
  return stats;
}

export function recordChallengeCompleted(challengeId: string): UserStats {
  const stats = loadUserStats();
  if (!stats.completedChallenges.includes(challengeId)) {
    stats.completedChallenges.push(challengeId);
  }
  stats.lastActive = Date.now();
  try {
    localStorage.setItem('codeforge_stats', JSON.stringify(stats));
  } catch {
    // ignore
  }
  return stats;
}
