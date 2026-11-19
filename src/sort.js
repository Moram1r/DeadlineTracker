export function sortByDate(tasks) {
  return [...tasks].sort((a, b) =>
    a.dueDate === b.dueDate
      ? (a.createdAt || '').localeCompare(b.createdAt || '')
      : a.dueDate.localeCompare(b.dueDate)
  );
}

export function sortByTagAsc(tasks, tagsById) {
  const pr = (id) => (tagsById[id]?.priority ?? 1e9);
  return [...tasks].sort((a, b) => {
    const pa = pr(a.tagId);
    const pb = pr(b.tagId);
    if (pa !== pb) return pb - pa;
    if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    return (a.createdAt || '').localeCompare(b.createdAt || '');
  });
}

export function sortByTagDesc(tasks, tagsById) {
  const pr = (id) => (tagsById[id]?.priority ?? -1e9);
  return [...tasks].sort((a, b) => {
    const pa = pr(a.tagId);
    const pb = pr(b.tagId);
    if (pa !== pb) return pb - pa;
    if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    return (a.createdAt || '').localeCompare(b.createdAt || '');
  });
}
