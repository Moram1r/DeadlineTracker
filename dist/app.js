// Simple self-contained bundle to work over file:// without modules.
(() => {
  // date.js
  function todayLocal() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  function formatDate(yyyyMMdd, locale = 'ru-RU') {
    if (!yyyyMMdd) return '';
    const [y, m, d] = yyyyMMdd.split('-').map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1);
    if (Number.isNaN(dt.getTime())) return yyyyMMdd;
    return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(dt);
  }
  function isOverdue(yyyyMMdd, today = todayLocal()) {
    if (!yyyyMMdd) return false;
    return yyyyMMdd < today;
  }

  // model.js
  function createId() {
    return (Date.now().toString(36) + Math.random().toString(36).slice(2, 10)).toUpperCase();
  }
  function createTask({ text, dueDate, tagId }) {
    const nowIso = new Date().toISOString();
    return { id: createId(), text: String(text || '').trim(), dueDate: dueDate || todayLocal(), tagId: tagId || '', status: 'active', completedAt: null, createdAt: nowIso, updatedAt: nowIso };
  }
  function validateTask(task) {
    const errors = {};
    if (!task.text || !task.text.trim()) errors.text = 'Введите текст задачи';
    if (!task.dueDate) errors.dueDate = 'Выберите дату';
    if (!task.tagId) errors.tagId = 'Выберите тег';
    if (task.text && task.text.length > 200) errors.text = 'Не более 200 символов';
    return { ok: Object.keys(errors).length === 0, errors };
  }
  function createTag({ name, priority = 100, color }) {
    return { id: createId(), name: String(name || '').trim(), priority: Number.isFinite(priority) ? Math.trunc(priority) : 100, color: color || undefined };
  }
  function validateTag(tag, { existingNames = [] } = {}) {
    const errors = {};
    if (!tag.name || !tag.name.trim()) errors.name = 'Введите имя тега';
    if (!Number.isFinite(tag.priority)) errors.priority = 'Некорректный приоритет';
    const lower = tag.name?.trim().toLowerCase();
    if (lower && existingNames.map((n) => n.toLowerCase()).includes(lower)) errors.name = 'Имя тега уже используется';
    return { ok: Object.keys(errors).length === 0, errors };
  }

  // storage.js
  const K_TASKS = 'deadlineTracker.v2.tasks';
  const K_TAGS = 'deadlineTracker.v2.tags';
  const K_SORT = 'deadlineTracker.sortMode';
  const K_VIEW = 'deadlineTracker.viewMode';
  const K_V1 = 'deadlineTracker.v1';
  function loadJson(key, fallback) { try { const raw = localStorage.getItem(key); if (!raw) return fallback; return JSON.parse(raw); } catch { return fallback; } }
  function saveJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
  function migrateIfNeeded() {
    const hasV2 = localStorage.getItem(K_TASKS) || localStorage.getItem(K_TAGS);
    if (hasV2) return;
    const v1 = loadJson(K_V1, null);
    if (!v1 || !Array.isArray(v1)) return;
    const tags = [ { id: 't_small', name: 'маленькое', priority: 0 }, { id: 't_medium', name: 'среднее', priority: 1 }, { id: 't_big', name: 'большое', priority: 2 } ];
    const sizeToTag = { small: 't_small', big: 't_big' };
    const tasks = v1.map((old) => ({ id: old.id, text: old.text, dueDate: old.dueDate, tagId: sizeToTag[old.size] || 't_medium', status: 'active', completedAt: null, createdAt: old.createdAt || new Date().toISOString(), updatedAt: old.updatedAt || new Date().toISOString() }));
    saveJson(K_TAGS, tags); saveJson(K_TASKS, tasks);
    if (!localStorage.getItem(K_SORT)) localStorage.setItem(K_SORT, 'date');
    if (!localStorage.getItem(K_VIEW)) localStorage.setItem(K_VIEW, 'active');
    try { localStorage.removeItem(K_V1); } catch {}
  }
  function loadState() { migrateIfNeeded(); const tasks = loadJson(K_TASKS, []); const tags = loadJson(K_TAGS, []); const sortMode = localStorage.getItem(K_SORT) || 'date'; const viewMode = localStorage.getItem(K_VIEW) || 'active'; return { tasks, tags, sortMode, viewMode }; }
  function saveState(state) { saveJson(K_TASKS, state.tasks); saveJson(K_TAGS, state.tags); localStorage.setItem(K_SORT, state.sortMode); localStorage.setItem(K_VIEW, state.viewMode); }

  // state.js
  const state = { tasks: [], tags: [], sortMode: 'date', viewMode: 'active' };
  function initState() { const loaded = loadState(); Object.assign(state, loaded); }
  let _saveTimer = null;
  function persist() { clearTimeout(_saveTimer); _saveTimer = setTimeout(() => saveState(state), 80); }
  function setSortMode(mode) { state.sortMode = mode; persist(); }
  function setViewMode(mode) { state.viewMode = mode; persist(); }
  function addTask(task) { state.tasks.push(task); persist(); }
  function updateTask(id, patch) { const idx = state.tasks.findIndex((t) => t.id === id); if (idx === -1) return; state.tasks[idx] = { ...state.tasks[idx], ...patch, updatedAt: new Date().toISOString() }; persist(); }
  function completeTask(id) { updateTask(id, { status: 'completed', completedAt: new Date().toISOString() }); }
  function restoreTask(id) { updateTask(id, { status: 'active', completedAt: null }); }
  function addTag(tag) { state.tags.push(tag); persist(); }
  function updateTag(id, patch) { const idx = state.tags.findIndex((t) => t.id === id); if (idx === -1) return; state.tags[idx] = { ...state.tags[idx], ...patch }; persist(); }
  function removeTag(id) { const used = state.tasks.some((t) => t.tagId === id); if (used) throw new Error('Тег используется задачами'); state.tags = state.tags.filter((t) => t.id !== id); persist(); }
  function ensureDefaultTags() { if (state.tags && state.tags.length > 0) return; const defaults = [ createTag({ name: 'маленькое', priority: 0, color: '#10b981' }), createTag({ name: 'среднее', priority: 1, color: '#f59e0b' }), createTag({ name: 'большое', priority: 2, color: '#ef4444' }) ]; state.tags = defaults; persist(); }

  // sort.js
  function sortByDate(tasks) { return [...tasks].sort((a, b) => a.dueDate === b.dueDate ? (a.createdAt || '').localeCompare(b.createdAt || '') : a.dueDate.localeCompare(b.dueDate)); }
  function sortByTagAsc(tasks, tagsById) { const pr = (id) => (tagsById[id]?.priority ?? 1e9); return [...tasks].sort((a, b) => { const pa = pr(a.tagId); const pb = pr(b.tagId); if (pa !== pb) return pa - pb; if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate); return (a.createdAt || '').localeCompare(b.createdAt || ''); }); }
  function sortByTagDesc(tasks, tagsById) { const pr = (id) => (tagsById[id]?.priority ?? -1e9); return [...tasks].sort((a, b) => { const pa = pr(a.tagId); const pb = pr(b.tagId); if (pa !== pb) return pb - pa; if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate); return (a.createdAt || '').localeCompare(b.createdAt || ''); }); }

  // ui/add-form.js
  function renderAddForm(container, deps = {}) {
    container.innerHTML = '';
    const form = document.createElement('form'); form.className = 'card'; form.setAttribute('novalidate', '');
    const row = document.createElement('div'); row.className = 'row';
    const textField = document.createElement('label'); textField.className = 'field grow'; textField.innerHTML = '<span>Задача</span>';
    const textInput = document.createElement('input'); textInput.type = 'text'; textInput.maxLength = 200; textInput.placeholder = 'Что нужно сделать?'; textField.appendChild(textInput);
    const textHint = document.createElement('div'); textHint.className = 'hint'; textHint.textContent = 'До 200 символов'; textField.appendChild(textHint);
    const dateField = document.createElement('label'); dateField.className = 'field'; dateField.innerHTML = '<span>Дедлайн</span>';
    const dateInput = document.createElement('input'); dateInput.type = 'date'; dateInput.value = todayLocal(); dateField.appendChild(dateInput);
    const tagField = document.createElement('label'); tagField.className = 'field'; tagField.innerHTML = '<span>Тег</span>';
    const tagSelect = document.createElement('select'); tagField.appendChild(tagSelect);
    const submit = document.createElement('button'); submit.type = 'submit'; submit.className = 'primary'; submit.textContent = 'Добавить'; submit.setAttribute('aria-label', 'Добавить задачу');
    row.append(textField, dateField, tagField, submit); form.appendChild(row);
    function refillTags() {
      tagSelect.innerHTML = '';
      if (state.tags.length === 0) {
        submit.disabled = true; tagSelect.disabled = true;
        const info = form.querySelector('.no-tags-info') || document.createElement('div');
        info.className = 'hint no-tags-info'; info.style.marginTop = '8px';
        info.textContent = 'Настройте теги через кнопку «Теги» вверху.';
        if (!info.parentElement) form.appendChild(info);
      } else {
        tagSelect.disabled = false;
        for (const tg of state.tags) { const opt = document.createElement('option'); opt.value = tg.id; opt.textContent = tg.name; tagSelect.appendChild(opt); }
        submit.disabled = false; const info = form.querySelector('.no-tags-info'); if (info) info.remove();
      }
    }
    refillTags();
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const task = createTask({ text: textInput.value, dueDate: dateInput.value, tagId: tagSelect.value });
      const v = validateTask(task);
      if (!v.ok) { alert(Object.values(v.errors).join('\n')); return; }
      addTask(task); textInput.value = ''; dateInput.value = todayLocal(); tagSelect.selectedIndex = 0; if (deps.onAdd) deps.onAdd(task);
    });
    container.appendChild(form);
  }

  // ui/item.js
  function renderItem(task, tagsById, { onEdit, onComplete, onRestore }) {
    const el = document.createElement('div'); el.className = 'item';
    const text = document.createElement('div'); text.className = 'text'; text.textContent = task.text;
    const due = document.createElement('span'); due.className = 'badge due' + (isOverdue(task.dueDate) && task.status === 'active' ? ' overdue' : ''); due.textContent = formatDate(task.dueDate);
    const tag = document.createElement('span'); tag.className = 'badge tag'; const tg = tagsById[task.tagId]; tag.textContent = tg ? tg.name : '—'; if (tg?.color) { tag.style.background = tg.color; tag.style.borderColor = tg.color; tag.style.color = '#fff'; }
    const right = document.createElement('div'); right.className = 'actions';
    const editBtn = document.createElement('button'); editBtn.textContent = 'Редактировать'; editBtn.ariaLabel = 'Редактировать'; editBtn.addEventListener('click', () => onEdit(task));
    if (task.status === 'active') { const doneBtn = document.createElement('button'); doneBtn.textContent = 'Готово'; doneBtn.ariaLabel = 'Отметить как выполнено'; doneBtn.addEventListener('click', () => onComplete(task)); right.append(doneBtn, editBtn); }
    else { const restoreBtn = document.createElement('button'); restoreBtn.textContent = 'Восстановить'; restoreBtn.ariaLabel = 'Восстановить'; restoreBtn.addEventListener('click', () => onRestore(task)); const completedInfo = document.createElement('span'); completedInfo.className = 'muted'; completedInfo.textContent = task.completedAt ? `выполнено ${new Date(task.completedAt).toLocaleDateString('ru-RU')}` : ''; right.append(restoreBtn, editBtn, completedInfo); }
    el.append(text, due, tag, right); return el;
  }

  // ui/list.js
  function renderList(container, { tasks, tags, sortMode, viewMode, onEdit, onComplete, onRestore }) {
    container.innerHTML = '';
    const list = document.createElement('div'); list.className = 'list';
    const tagsById = Object.fromEntries(tags.map((t) => [t.id, t]));
    const filtered = tasks.filter((t) => t.status === viewMode);
    let sorted; if (sortMode === 'date') sorted = sortByDate(filtered); else if (sortMode === 'tagAsc') sorted = sortByTagAsc(filtered, tagsById); else if (sortMode === 'tagDesc') sorted = sortByTagDesc(filtered, tagsById); else sorted = sortByDate(filtered);
    if (sorted.length === 0) { const empty = document.createElement('div'); empty.className = 'card muted'; empty.textContent = viewMode === 'active' ? 'Нет активных задач. Добавьте первую.' : 'Нет завершенных задач.'; container.appendChild(empty); return; }
    for (const task of sorted) { const item = renderItem(task, tagsById, { onEdit, onComplete, onRestore }); list.appendChild(item); }
    container.appendChild(list);
  }

  // ui/edit-dialog.js
  function openEditDialog(task, deps = {}) {
    const dialog = document.getElementById('editDialog');
    if (!dialog) return;
    dialog.innerHTML = '';
    const wrap = document.createElement('div'); wrap.className = 'modal';
    const title = document.createElement('h3'); title.textContent = 'Редактировать задачу';
    const textField = document.createElement('label'); textField.className = 'field'; textField.innerHTML = '<span>Задача</span>';
    const textInput = document.createElement('input'); textInput.type = 'text'; textInput.maxLength = 200; textInput.value = task.text; textField.appendChild(textInput);
    const dateField = document.createElement('label'); dateField.className = 'field'; dateField.innerHTML = '<span>Дедлайн</span>';
    const dateInput = document.createElement('input'); dateInput.type = 'date'; dateInput.value = task.dueDate || todayLocal(); dateField.appendChild(dateInput);
    const tagField = document.createElement('label'); tagField.className = 'field'; tagField.innerHTML = '<span>Тег</span>';
    const tagSelect = document.createElement('select');
    for (const tg of state.tags) { const opt = document.createElement('option'); opt.value = tg.id; opt.textContent = tg.name; if (tg.id === task.tagId) opt.selected = true; tagSelect.appendChild(opt); }
    tagField.appendChild(tagSelect);
    const footer = document.createElement('div'); footer.className = 'footer';
    const cancel = document.createElement('button'); cancel.textContent = 'Отмена';
    const save = document.createElement('button'); save.className = 'primary'; save.textContent = 'Сохранить';
    footer.append(cancel, save);
    wrap.append(title, textField, dateField, tagField, footer); dialog.appendChild(wrap);
    cancel.addEventListener('click', () => dialog.close());
    save.addEventListener('click', () => { updateTask(task.id, { text: textInput.value.trim(), dueDate: dateInput.value, tagId: tagSelect.value }); dialog.close(); deps.onSave && deps.onSave(); });
    dialog.addEventListener('close', () => (dialog.innerHTML = ''));
    if (dialog.showModal) dialog.showModal(); else dialog.open = true; // fallback
  }

  // ui/tags-dialog.js
  function openTagsDialog(deps = {}) {
    const dialog = document.getElementById('tagsDialog');
    if (!dialog) return;
    dialog.innerHTML = '';
    const wrap = document.createElement('div'); wrap.className = 'modal';
    const title = document.createElement('h3'); title.textContent = 'Управление тегами';
    const list = document.createElement('div'); list.style.display = 'flex'; list.style.flexDirection = 'column'; list.style.gap = '8px';
    function renderList() {
      list.innerHTML = '';
      if (state.tags.length === 0) { const empty = document.createElement('div'); empty.className = 'muted'; empty.textContent = 'Тегов пока нет. Создайте первый тег.'; list.appendChild(empty); return; }
      for (const tag of state.tags) {
        const row = document.createElement('div'); row.className = 'row card';
        const name = document.createElement('input'); name.type = 'text'; name.value = tag.name;
        const pr = document.createElement('input'); pr.type = 'number'; pr.value = String(tag.priority); pr.style.width = '120px';
        const color = document.createElement('input'); color.type = 'color'; color.value = tag.color || '#6b7280';
        const save = document.createElement('button'); save.textContent = 'Сохранить';
        const del = document.createElement('button'); del.textContent = 'Удалить'; del.className = 'secondary';
        save.addEventListener('click', () => {
          const newTag = { ...tag, name: name.value.trim(), priority: parseInt(pr.value, 10) || 0, color: color.value };
          const check = validateTag(newTag, { existingNames: state.tags.filter(t=>t.id!==tag.id).map(t=>t.name) });
          if (!check.ok) { alert(Object.values(check.errors).join('\n')); return; }
          updateTag(tag.id, newTag); deps.onChange && deps.onChange();
        });
        del.addEventListener('click', () => { try { removeTag(tag.id); renderList(); deps.onChange && deps.onChange(); } catch (e) { alert('Тег используется задачами'); } });
        row.append(name, pr, color, save, del); list.appendChild(row);
      }
    }
    const addRow = document.createElement('div'); addRow.className = 'row card';
    const newName = document.createElement('input'); newName.type = 'text'; newName.placeholder = 'Имя тега';
    const newPr = document.createElement('input'); newPr.type = 'number'; newPr.placeholder = 'Приоритет'; newPr.style.width = '120px';
    const newColor = document.createElement('input'); newColor.type = 'color'; newColor.value = '#6b7280';
    const addBtn = document.createElement('button'); addBtn.className = 'primary'; addBtn.textContent = 'Добавить тег';
    addBtn.addEventListener('click', () => {
      const tag = createTag({ name: newName.value.trim(), priority: parseInt(newPr.value, 10) || 100, color: newColor.value });
      const check = validateTag(tag, { existingNames: state.tags.map(t=>t.name) });
      if (!check.ok) { alert(Object.values(check.errors).join('\n')); return; }
      addTag(tag); newName.value = ''; newPr.value = ''; renderList(); deps.onChange && deps.onChange();
    });
    addRow.append(newName, newPr, newColor, addBtn);
    const footer = document.createElement('div'); footer.className = 'footer';
    const close = document.createElement('button'); close.textContent = 'Закрыть'; footer.append(close);
    wrap.append(title, list, addRow, footer); dialog.appendChild(wrap);
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => (dialog.innerHTML = ''));
    renderList(); if (dialog.showModal) dialog.showModal(); else dialog.open = true;
  }

  // ui/toast.js
  function showToast(message, timeout = 2000) {
    const cont = document.getElementById('toastContainer'); if (!cont) return;
    const el = document.createElement('div'); el.className = 'toast'; el.textContent = message; cont.appendChild(el);
    setTimeout(() => { el.remove(); }, timeout);
  }

  // app.js
  function qs(id) { return document.getElementById(id); }
  function setTabSelected(view) { const a = qs('tabActive'); const c = qs('tabCompleted'); if (!a || !c) return; a.setAttribute('aria-selected', String(view === 'active')); c.setAttribute('aria-selected', String(view === 'completed')); }
  function render() {
    const sortSelect = qs('sortSelect'); if (sortSelect) sortSelect.value = state.sortMode;
    setTabSelected(state.viewMode);
    const addFormContainer = qs('addFormContainer'); const listContainer = qs('listContainer');
    if (state.viewMode === 'active') { renderAddForm(addFormContainer, { onAdd: () => { render(); showToast('Добавлено'); } }); }
    else { addFormContainer.innerHTML = ''; }
    renderList(listContainer, { tasks: state.tasks, tags: state.tags, sortMode: state.sortMode, viewMode: state.viewMode, onEdit: (task) => openEditDialog(task, { onSave: () => { render(); showToast('Сохранено'); } }), onComplete: (task) => { completeTask(task.id); render(); showToast('Отмечено как выполнено'); }, onRestore: (task) => { restoreTask(task.id); render(); showToast('Восстановлено'); } });
  }
  function bindEvents() {
    const sortSelect = qs('sortSelect'); if (sortSelect) { sortSelect.addEventListener('change', (e) => { setSortMode(e.target.value); render(); }); }
    const tabs = qs('viewTabs'); if (tabs) { tabs.addEventListener('click', (e) => { const target = e.target && e.target.closest ? e.target.closest('button[data-view]') : null; if (!target) return; const view = target.getAttribute('data-view'); setViewMode(view); render(); }); }
    const manageTagsBtn = qs('manageTagsBtn'); if (manageTagsBtn) { manageTagsBtn.addEventListener('click', () => { openTagsDialog({ onChange: () => render() }); }); }
  }
  initState(); ensureDefaultTags(); bindEvents(); render();
})();
