const K_TASKS = 'deadlineTracker.v2.tasks';
const K_TAGS = 'deadlineTracker.v2.tags';
const K_SORT = 'deadlineTracker.sortMode';
const K_VIEW = 'deadlineTracker.viewMode';
const K_V1 = 'deadlineTracker.v1';

export const storageKeys = { K_TASKS, K_TAGS, K_SORT, K_VIEW };

export function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore for MVP
  }
}

export function migrateIfNeeded() {
  // If v2 keys already exist, do nothing
  const hasV2 = localStorage.getItem(K_TASKS) || localStorage.getItem(K_TAGS);
  if (hasV2) return;

  const v1 = loadJson(K_V1, null);
  if (!v1 || !Array.isArray(v1)) return;

  // Build default tags Small/Big (and Medium optional)
  const tags = [
    { id: 't_small', name: 'маленькое', priority: 0 },
    { id: 't_medium', name: 'среднее', priority: 1 },
    { id: 't_big', name: 'большое', priority: 2 },
  ];

  const sizeToTag = { small: 't_small', big: 't_big' };
  const tasks = v1.map((old) => ({
    id: old.id,
    text: old.text,
    dueDate: old.dueDate,
    tagId: sizeToTag[old.size] || 't_medium',
    status: 'active',
    completedAt: null,
    createdAt: old.createdAt || new Date().toISOString(),
    updatedAt: old.updatedAt || new Date().toISOString(),
  }));

  saveJson(K_TAGS, tags);
  saveJson(K_TASKS, tasks);
  if (!localStorage.getItem(K_SORT)) localStorage.setItem(K_SORT, 'date');
  if (!localStorage.getItem(K_VIEW)) localStorage.setItem(K_VIEW, 'active');
  try { localStorage.removeItem(K_V1); } catch {}
}

export function loadState() {
  migrateIfNeeded();
  const tasks = loadJson(K_TASKS, []);
  const tags = loadJson(K_TAGS, []);
  const sortMode = localStorage.getItem(K_SORT) || 'date';
  const viewMode = localStorage.getItem(K_VIEW) || 'active';
  return { tasks, tags, sortMode, viewMode };
}

export function saveState(partial) {
  if ('tasks' in partial) saveJson(K_TASKS, partial.tasks);
  if ('tags' in partial) saveJson(K_TAGS, partial.tags);
  if ('sortMode' in partial) localStorage.setItem(K_SORT, partial.sortMode);
  if ('viewMode' in partial) localStorage.setItem(K_VIEW, partial.viewMode);
}
