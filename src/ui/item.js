import { formatDate, isOverdue } from '../date.js';

export function renderItem(task, tagsById, { onEdit, onComplete, onRestore }) {
  const el = document.createElement('div');
  el.className = 'item';

  const text = document.createElement('div');
  text.className = 'text';
  text.textContent = task.text;

  const due = document.createElement('span');
  due.className = 'badge due' + (isOverdue(task.dueDate) && task.status === 'active' ? ' overdue' : '');
  due.textContent = formatDate(task.dueDate);

  const tag = document.createElement('span');
  tag.className = 'badge tag';
  const tg = tagsById[task.tagId];
  tag.textContent = tg ? tg.name : '—';
  if (tg?.color) {
    tag.style.background = tg.color;
    tag.style.borderColor = tg.color;
    tag.style.color = '#fff';
  }

  const right = document.createElement('div');
  right.className = 'actions';
  const editBtn = document.createElement('button');
  editBtn.textContent = 'Редактировать';
  editBtn.ariaLabel = 'Редактировать';
  editBtn.addEventListener('click', () => onEdit(task));

  if (task.status === 'active') {
    const doneBtn = document.createElement('button');
    doneBtn.textContent = 'Готово';
    doneBtn.ariaLabel = 'Отметить как выполнено';
    doneBtn.addEventListener('click', () => onComplete(task));
    right.append(doneBtn, editBtn);
  } else {
    const restoreBtn = document.createElement('button');
    restoreBtn.textContent = 'Восстановить';
    restoreBtn.ariaLabel = 'Восстановить';
    restoreBtn.addEventListener('click', () => onRestore(task));
    const completedInfo = document.createElement('span');
    completedInfo.className = 'muted';
    completedInfo.textContent = task.completedAt ? `выполнено ${new Date(task.completedAt).toLocaleDateString('ru-RU')}` : '';
    right.append(restoreBtn, editBtn, completedInfo);
  }

  el.append(text, due, tag, right);
  return el;
}
