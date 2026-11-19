import { saveState, loadState } from './storage.js';
import { createTag } from './model.js';

export const state = {
  tasks: [],
  tags: [],
  sortMode: 'date',
  viewMode: 'active',
};

export function initState() {
  const loaded = loadState();
  Object.assign(state, loaded);
}

let _saveTimer = null;
function persist() {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => saveState(state), 80);
}

export function setSortMode(mode) {
  state.sortMode = mode;
  persist();
}

export function setViewMode(mode) {
  state.viewMode = mode;
  persist();
}

export function addTask(task) {
  state.tasks.push(task);
  persist();
}

export function updateTask(id, patch) {
  const idx = state.tasks.findIndex((t) => t.id === id);
  if (idx === -1) return;
  state.tasks[idx] = { ...state.tasks[idx], ...patch, updatedAt: new Date().toISOString() };
  persist();
}

export function completeTask(id) {
  updateTask(id, { status: 'completed', completedAt: new Date().toISOString() });
}

export function restoreTask(id) {
  updateTask(id, { status: 'active', completedAt: null });
}

export function addTag(tag) {
  state.tags.push(tag);
  persist();
}

export function updateTag(id, patch) {
  const idx = state.tags.findIndex((t) => t.id === id);
  if (idx === -1) return;
  state.tags[idx] = { ...state.tags[idx], ...patch };
  persist();
}

export function removeTag(id) {
  // Guarded removal: only if unused
  const used = state.tasks.some((t) => t.tagId === id);
  if (used) throw new Error('Тег используется задачами');
  state.tags = state.tags.filter((t) => t.id !== id);
  persist();
}

export function ensureDefaultTags() {
  if (state.tags && state.tags.length > 0) return;
  // Seed three basic tags
  const defaults = [
    createTag({ name: 'маленькое', priority: 0, color: '#10b981' }),
    createTag({ name: 'среднее', priority: 1, color: '#f59e0b' }),
    createTag({ name: 'большое', priority: 2, color: '#ef4444' }),
  ];
  state.tags = defaults;
  persist();
}
