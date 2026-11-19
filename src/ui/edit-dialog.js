import { state, updateTask, completeTask, restoreTask } from '../state.js';
import { todayLocal } from '../date.js';

export function openEditDialog(task, deps = {}) {
  const dialog = document.getElementById('editDialog');
  dialog.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.className = 'modal';

  const title = document.createElement('h3');
  title.textContent = 'Редактировать задачу';

  const textField = document.createElement('label');
  textField.className = 'field';
  textField.innerHTML = '<span>Задача</span>';
  const textInput = document.createElement('input');
  textInput.type = 'text';
  textInput.maxLength = 200;
  textInput.value = task.text;
  textField.appendChild(textInput);

  const dateField = document.createElement('label');
  dateField.className = 'field';
  dateField.innerHTML = '<span>Дедлайн</span>';
  const dateInput = document.createElement('input');
  dateInput.type = 'date';
  dateInput.value = task.dueDate || todayLocal();
  dateField.appendChild(dateInput);

  const tagField = document.createElement('label');
  tagField.className = 'field';
  tagField.innerHTML = '<span>Тег</span>';
  const tagSelect = document.createElement('select');
  for (const tag of state.tags) {
    const opt = document.createElement('option');
    opt.value = tag.id;
    opt.textContent = tag.name;
    if (tag.id === task.tagId) opt.selected = true;
    tagSelect.appendChild(opt);
  }
  tagField.appendChild(tagSelect);

  const footer = document.createElement('div');
  footer.className = 'footer';
  const cancel = document.createElement('button');
  cancel.textContent = 'Отмена';
  const save = document.createElement('button');
  save.className = 'primary';
  save.textContent = 'Сохранить';

  footer.append(cancel, save);
  wrap.append(title, textField, dateField, tagField, footer);
  dialog.appendChild(wrap);

  cancel.addEventListener('click', () => dialog.close());
  save.addEventListener('click', () => {
    updateTask(task.id, { text: textInput.value.trim(), dueDate: dateInput.value, tagId: tagSelect.value });
    dialog.close();
    deps.onSave && deps.onSave();
  });

  dialog.addEventListener('close', () => (dialog.innerHTML = ''));
  dialog.showModal();
}
