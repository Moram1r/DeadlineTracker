# Техническая спецификация: Отслеживатель дедлайнов (MVP v2)

## Обзор
Клиентское офлайн‑приложение (HTML/CSS/JS без бэкенда). Данные — в LocalStorage. Функции: задачи с датой и тегом, настраиваемые теги с приоритетом, сортировка по дате/тегу, статусы (active/completed) с восстановлением, редактирование задач, управление тегами, миграция v1→v2.

## Архитектура
- Платформа: веб, одна страница, без сборки (или опционально простая сборка).
- Модули ES (type="module").
- Рендер на чистом JS (DOM API) или минимальные помощники, без фреймворков.
- Состояние хранится в памяти и синхронизируется с LocalStorage.

### Структура файлов (предложение)
```
/index.html
/styles.css
/src/app.js            // инициализация, навигация представлений, события UI
/src/state.js          // in-memory state, селекторы, мутации
/src/storage.js        // LocalStorage API, миграции, валидация схемы
/src/model.js          // фабрики и валидации Task/Tag
/src/sort.js           // функции сортировки
/src/date.js           // утилиты дат (форматы, сравнения, просроченность)
/src/tags.js           // операции с тегами (CRUD, проверки использования)
/src/ui/add-form.js    // рендер и логика формы добавления
/src/ui/list.js        // рендер списка задач
/src/ui/item.js        // рендер карточки задачи и действия
/src/ui/edit-dialog.js // модалка редактирования задачи
/src/ui/tags-dialog.js // модалка управления тегами
/src/ui/toast.js       // уведомления (опционально)
```

## Данные и модель
Типы:
```
Task {
  id: string,
  text: string,           // 1..200
  dueDate: string,        // YYYY-MM-DD (локальная дата)
  tagId: string,
  status: 'active'|'completed',
  completedAt: string|null, // ISO UTC
  createdAt: string,      // ISO UTC
  updatedAt: string       // ISO UTC
}

Tag {
  id: string,
  name: string,           // уникально (рекоменд. case-insensitive)
  priority: number,       // чем меньше — тем раньше в сортировке
  color?: string          // CSS цвет бейджа (опц.)
}
```

LocalStorage ключи:
- deadlineTracker.v2.tasks: Task[]
- deadlineTracker.v2.tags: Tag[]
- deadlineTracker.sortMode: 'date'|'tagAsc'|'tagDesc'
- deadlineTracker.viewMode: 'active'|'completed'

Версионирование схемы: storage.js содержит currentSchemaVersion='v2'; миграция из 'v1' выполняется один раз и помечает завершение.

## State и синхронизация
In-memory shape (state.js):
```
state = {
  tasks: Task[],
  tags: Tag[],
  sortMode: 'date'|'tag',
  viewMode: 'active'|'completed'
}
```
- Инициализация: load() из storage → validate → миграции → set state → render.
- Сохранение: после мутаций — debounce 50–100мс запись в LocalStorage.
- Инвалидация/рендер: app.js перерендеривает список по текущему представлению и сортировке.

## API модулей (псевдосигнатуры)
storage.js
- loadState(): {tasks:Task[], tags:Tag[], sortMode, viewMode}
- saveState(partial): void
- migrateIfNeeded(): void // включает миграцию v1→v2

model.js
- createTask({text, dueDate, tagId}): Task
- validateTask(task): {ok:boolean, errors:Record<string,string>}
- createTag({name, priority, color?}): Tag
- validateTag(tag): {ok:boolean, errors:...}

state.js
- getTasks(filter?): Task[]
- getTags(): Tag[]
- addTask(task): void
- updateTask(id, patch): void
- completeTask(id): void // status→completed, completedAt=now
- restoreTask(id): void  // status→active, completedAt=null
- addTag(tag): void
- updateTag(id, patch): void
- removeTag(id): void // бросает ошибку, если используется
- setSortMode(mode): void
- setViewMode(mode): void

sort.js
- sortByDate(tasks): Task[]
- sortByTagAsc(tasks, tagsById): Task[]
- sortByTagDesc(tasks, tagsById): Task[]

date.js
- isOverdue(dueDate, nowLocalDate): boolean
- formatDate(dueDate, locale='ru-RU'): string
- todayLocal(): string // YYYY-MM-DD

tags.js
- isTagUsed(tagId): boolean
- getTagById(id): Tag | undefined
- requireUnused(tagId): void // throws if used

ui/*
- Рендер функций принимает контейнер и зависимости (state/actions).

## Миграция v1→v2
Условие: есть deadlineTracker.v1 и нет deadlineTracker.v2.*
Шаги:
1) Прочитать v1 массив задач {id,text,dueDate,size,createdAt,updatedAt}.
2) Сформировать теги: Small(priority 0), Big(1). Опционально Medium(1) → затем Big(2).
3) Сопоставить size→tagId.
4) Для каждой задачи: status='active', completedAt=null, tagId по маппингу.
5) Сохранить в v2 ключи; удалить v1 ключ.
6) Установить sortMode='date', viewMode='active', если отсутствуют.

## Даты и таймзоны
- dueDate хранится как YYYY-MM-DD без времени (локальная дата пользователя).
- createdAt/updatedAt/completedAt — ISO UTC (new Date().toISOString()).
- Просроченность: сравнивать dueDate с todayLocal() (локальная дата в формате YYYY-MM-DD, без времени).

## Сортировка (детали)
- По дате: dueDate ASC → createdAt ASC (строковое сравнение ISO подходит).
- По тегу (возраст.): tag.priority ASC → dueDate ASC → createdAt ASC.
- По тегу (убыв.): tag.priority DESC → dueDate ASC → createdAt ASC.
- Для стабильности избегать in-place sort исходного массива — сортировать копию.

## Обработка ошибок
- LocalStorage недоступен/переполнен: показать уведомление, работать в in-memory до перезагрузки; попытаться сохранить позже.
- Валидационные ошибки: подсказки под полями, блокировка кнопок отправки.
- Удаление тега, если используется: диалог с сообщением N задач используют тег — отмена.

## Безопасность
- Не использовать innerHTML c пользовательскими данными; рендерить через textContent.
- Ограничивать длину текста (≤200), обрезать пробелы.
- Нет внешних запросов/куки.

## Доступность (технически)
- Фокус-стили для интерактивов, видимые outline.
- ARIA: role="list"/"listitem" для списка; role="dialog" с aria-modal для модалок; aria-live для тостов.
- Управление с клавиатуры: Tab/Shift+Tab, Enter для отправки, Esc — закрыть модалку.

## Производительность
- До ~1000 задач: операции O(n log n) на сортировку, ререндер диффом (перерисовывать список целиком допустимо на MVP).
- Debounce ввод и сохранение.

## Тестирование
- Юнит: сортировки, валидации, миграции, операции со статусами.
- Интеграция: add→complete→restore, edit, управление тегами, запрет удаления используемого тега.
- Ручные: локализация дат, мобильная верстка, доступность клавиатурой.

## Сборка и инструменты (опционально)
- Без сборки: ES Modules прямо в браузере.
- Линтинг: ESLint + Prettier (рекомендовано).
- Тесты: Vitest/Jest (если вводится сборка), иначе простые браузерные тесты.

## Логи и телеметрия
- В консоль — только для разработки; в проде тихо.
