import { sortByDate, sortByTagAsc, sortByTagDesc } from '../sort.js';
import { renderItem } from './item.js';

export function renderList(container, { tasks, tags, sortMode, viewMode, onEdit, onComplete, onRestore }) {
  container.innerHTML = '';
  const list = document.createElement('div');
  list.className = 'list';

  const tagsById = Object.fromEntries(tags.map((t) => [t.id, t]));
  const filtered = tasks.filter((t) => t.status === viewMode);
  let sorted;
  if (sortMode === 'date') sorted = sortByDate(filtered);
  else if (sortMode === 'tagAsc') sorted = sortByTagAsc(filtered, tagsById);
  else if (sortMode === 'tagDesc') sorted = sortByTagDesc(filtered, tagsById);
  else sorted = sortByDate(filtered);

  if (sorted.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'card muted';
    empty.textContent = viewMode === 'active' ? 'Нет активных задач. Добавьте первую.' : 'Нет завершенных задач.';
    container.appendChild(empty);
    return;
  }

  for (const task of sorted) {
    const item = renderItem(task, tagsById, { onEdit, onComplete, onRestore });
    list.appendChild(item);
  }
  container.appendChild(list);
}
