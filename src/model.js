import { todayLocal } from './date.js';

export function createId() {
  // ULID-like simple ID: timestamp + random
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  ).toUpperCase();
}

export function createTask({ text, dueDate, tagId }) {
  const nowIso = new Date().toISOString();
  return {
    id: createId(),
    text: String(text || '').trim(),
    dueDate: dueDate || todayLocal(),
    tagId: tagId || '',
    status: 'active',
    completedAt: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

export function validateTask(task) {
  const errors = {};
  if (!task.text || !task.text.trim()) errors.text = 'Введите текст задачи';
  if (!task.dueDate) errors.dueDate = 'Выберите дату';
  if (!task.tagId) errors.tagId = 'Выберите тег';
  if (task.text && task.text.length > 100) errors.text = 'Не более 100 символов';
  return { ok: Object.keys(errors).length === 0, errors };
}

export function createTag({ name, priority = 100, color }) {
  return {
    id: createId(),
    name: String(name || '').trim(),
    priority: Number.isFinite(priority) ? Math.trunc(priority) : 100,
    color: color || undefined,
  };
}

export function validateTag(tag, { existingNames = [] } = {}) {
  const errors = {};
  if (!tag.name || !tag.name.trim()) errors.name = 'Введите имя тега';
  if (!Number.isFinite(tag.priority)) errors.priority = 'Некорректный приоритет';
  const lower = tag.name?.trim().toLowerCase();
  if (lower && existingNames.map((n) => n.toLowerCase()).includes(lower)) {
    errors.name = 'Имя тега уже используется';
  }
  return { ok: Object.keys(errors).length === 0, errors };
}
