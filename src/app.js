import { initState, state, setSortMode, setViewMode, completeTask, restoreTask, ensureDefaultTags } from './state.js';
import { renderAddForm } from './ui/add-form.js';
import { renderList } from './ui/list.js';
import { openEditDialog } from './ui/edit-dialog.js';
import { openTagsDialog } from './ui/tags-dialog.js';
import { showToast } from './ui/toast.js';

function qs(id) { return document.getElementById(id); }

function setTabSelected(view) {
  const a = qs('tabActive');
  const c = qs('tabCompleted');
  if (!a || !c) return;
  a.setAttribute('aria-selected', String(view === 'active'));
  c.setAttribute('aria-selected', String(view === 'completed'));
}

function render() {
  const sortSelect = qs('sortSelect');
  if (sortSelect) sortSelect.value = state.sortMode;
  setTabSelected(state.viewMode);

  const addFormContainer = qs('addFormContainer');
  const listContainer = qs('listContainer');

  if (state.viewMode === 'active') {
    renderAddForm(addFormContainer, { onAdd: () => { render(); showToast('Добавлено'); } });
  } else {
    addFormContainer.innerHTML = '';
  }

  renderList(listContainer, {
    tasks: state.tasks,
    tags: state.tags,
    sortMode: state.sortMode,
    viewMode: state.viewMode,
    onEdit: (task) => openEditDialog(task, { onSave: () => { render(); showToast('Сохранено'); } }),
    onComplete: (task) => { completeTask(task.id); render(); showToast('Отмечено как выполнено'); },
    onRestore: (task) => { restoreTask(task.id); render(); showToast('Восстановлено'); },
  });
}

function bindEvents() {
  const sortSelect = qs('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
    setSortMode(e.target.value);
    render();
  });
  }

  const tabs = qs('viewTabs');
  if (tabs) {
    tabs.addEventListener('click', (e) => {
      const target = e.target && e.target.closest ? e.target.closest('button[data-view]') : null;
      if (!target) return;
      const view = target.getAttribute('data-view');
      setViewMode(view);
      render();
    });
  }

  const manageTagsBtn = qs('manageTagsBtn');
  if (manageTagsBtn) {
    manageTagsBtn.addEventListener('click', () => {
      openTagsDialog({ onChange: () => render() });
    });
  }
}

// Bootstrap
initState(;
ensureDefaultTags();
bindEvents();
render();
