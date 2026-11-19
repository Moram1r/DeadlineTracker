import { state, addTag, updateTag, removeTag } from '../state.js';
import { createTag, validateTag } from '../model.js';

export function openTagsDialog(deps = {}) {
  const dialog = document.getElementById('tagsDialog');
  dialog.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.className = 'modal';

  const title = document.createElement('h3');
  title.textContent = 'Управление тегами';

  const list = document.createElement('div');
  list.style.display = 'flex';
  list.style.flexDirection = 'column';
  list.style.gap = '8px';

  function renderList() {
    list.innerHTML = '';
    if (state.tags.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'muted';
      empty.textContent = 'Тегов пока нет. Создайте первый тег.';
      list.appendChild(empty);
      return;
    }
    for (const tag of state.tags) {
      const row = document.createElement('div');
      row.className = 'row card';
      const name = document.createElement('input');
      name.type = 'text';
      name.value = tag.name;
      const pr = document.createElement('input');
      pr.type = 'number';
      pr.value = String(tag.priority);
      pr.style.width = '120px';
      const color = document.createElement('input');
      color.type = 'color';
      color.value = tag.color || '#6b7280';
      const save = document.createElement('button');
      save.textContent = 'Сохранить';
      const del = document.createElement('button');
      del.textContent = 'Удалить';
      del.className = 'secondary';
      save.addEventListener('click', () => {
        const newTag = { ...tag, name: name.value.trim(), priority: parseInt(pr.value, 10) || 0, color: color.value };
        const check = validateTag(newTag, { existingNames: state.tags.filter(t=>t.id!==tag.id).map(t=>t.name) });
        if (!check.ok) { alert(Object.values(check.errors).join('\n')); return; }
        updateTag(tag.id, newTag);
        deps.onChange && deps.onChange();
      });
      del.addEventListener('click', () => {
        try {
          removeTag(tag.id);
          renderList();
          deps.onChange && deps.onChange();
        } catch (e) {
          alert('Тег используется задачами');
        }
      });
      row.append(name, pr, color, save, del);
      list.appendChild(row);
    }
  }

  const addRow = document.createElement('div');
  addRow.className = 'row card';
  const newName = document.createElement('input');
  newName.type = 'text';
  newName.placeholder = 'Имя тега';
  const newPr = document.createElement('input');
  newPr.type = 'number';
  newPr.placeholder = 'Приоритет';
  newPr.style.width = '120px';
  const newColor = document.createElement('input');
  newColor.type = 'color';
  newColor.value = '#6b7280';
  const addBtn = document.createElement('button');
  addBtn.className = 'primary';
  addBtn.textContent = 'Добавить тег';
  addBtn.addEventListener('click', () => {
    const tag = createTag({ name: newName.value.trim(), priority: parseInt(newPr.value, 10) || 100, color: newColor.value });
    const check = validateTag(tag, { existingNames: state.tags.map(t=>t.name) });
    if (!check.ok) { alert(Object.values(check.errors).join('\n')); return; }
    addTag(tag);
    newName.value = '';
    newPr.value = '';
    // не сбрасываем цвет — удобно добавлять серию схожих
    renderList();
    deps.onChange && deps.onChange();
  });
  addRow.append(newName, newPr, newColor, addBtn);

  const footer = document.createElement('div');
  footer.className = 'footer';
  const close = document.createElement('button');
  close.textContent = 'Закрыть';
  footer.append(close);

  wrap.append(title, list, addRow, footer);
  dialog.appendChild(wrap);

  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => (dialog.innerHTML = ''));

  renderList();
  dialog.showModal();
}
