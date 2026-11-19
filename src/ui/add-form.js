import { createTask, validateTask } from '../model.js';
import { state, addTask } from '../state.js';
import { todayLocal } from '../date.js';

export function renderAddForm(container, deps = {}) {
  container.innerHTML = '';

  const form = document.createElement('form');
  form.className = 'card';
  form.setAttribute('novalidate', '');

  const row = document.createElement('div');
  row.className = 'row';

  const textField = document.createElement('label');
  textField.className = 'field grow';
  textField.innerHTML = '<span>Задача</span>';
  const textInput = document.createElement('input');
  textInput.type = 'text';
  textInput.maxLength = 200;
  textInput.placeholder = 'Что нужно сделать?';
  textField.appendChild(textInput);
  const textHint = document.createElement('div');
  textHint.className = 'hint';
  textHint.textContent = 'До 200 символов';
  textField.appendChild(textHint);

  const dateField = document.createElement('label');
  dateField.className = 'field';
  dateField.innerHTML = '<span>Дедлайн</span>';
  const dateInput = document.createElement('input');
  dateInput.type = 'date';
  dateInput.value = todayLocal();
  dateField.appendChild(dateInput);

  const tagField = document.createElement('label');
  tagField.className = 'field';
  tagField.innerHTML = '<span>Тег</span>';
  const tagSelect = document.createElement('select');
  tagField.appendChild(tagSelect);

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'primary';
  submit.textContent = 'Добавить';
  submit.setAttribute('aria-label', 'Добавить задачу');

  row.append(textField, dateField, tagField, submit);
  form.appendChild(row);

  function refillTags() {
    tagSelect.innerHTML = '';
    if (state.tags.length === 0) {
      // Автосоздание дефолтных тегов для первого запуска — UI не блокируем
      // (ensureDefaultTags уже вызывается на старте, этот блок — запасной)
      submit.disabled = true;
      tagSelect.disabled = true;
      const info = form.querySelector('.no-tags-info') || document.createElement('div');
      info.className = 'hint no-tags-info';
      info.style.marginTop = '8px';
      info.textContent = 'Настройте теги через кнопку «Теги» вверху.';
      if (!info.parentElement) form.appendChild(info);
    } else {
      tagSelect.disabled = false;
      for (const tag of state.tags) {
        const opt = document.createElement('option');
        opt.value = tag.id;
        opt.textContent = tag.name;
        tagSelect.appendChild(opt);
      }
      submit.disabled = false;
      const info = form.querySelector('.no-tags-info');
      if (info) info.remove();
    }
  }

  refillTags();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const task = createTask({ text: textInput.value, dueDate: dateInput.value, tagId: tagSelect.value });
    const v = validateTask(task);
    if (!v.ok) {
      // Simple inline errors
      alert(Object.values(v.errors).join('\n'));
      return;
    }
    addTask(task);
    textInput.value = '';
    dateInput.value = todayLocal();
    tagSelect.selectedIndex = 0;
    if (deps.onAdd) deps.onAdd(task);
  });

  container.appendChild(form);
}
