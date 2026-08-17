import { Category } from '../types';

export function slugifyCategory(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getCategoryById(categories: Category[], id?: string) {
  if (!id) return undefined;
  return categories.find((category) => category.id === id);
}

export function getCategoryChildren(categories: Category[], parentId?: string) {
  return categories.filter((category) => (category.parentId || undefined) === parentId);
}

export function getCategoryAncestors(categories: Category[], category: Category) {
  const path: Category[] = [];
  const visited = new Set<string>();
  let current: Category | undefined = category;

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    path.unshift(current);
    current = current.parentId ? getCategoryById(categories, current.parentId) : undefined;
  }

  return path;
}

export function getCategoryPath(categories: Category[], category: Category) {
  return '/categoria/' + getCategoryAncestors(categories, category)
    .map((item) => slugifyCategory(item.name))
    .join('/');
}

export function resolveCategoryFromPath(categories: Category[], rawPath: string) {
  const segments = rawPath.split('/').filter(Boolean).map(decodeURIComponent);
  if (segments.length === 0) return undefined;

  let parentId: string | undefined;
  let current: Category | undefined;

  for (const segment of segments) {
    current = categories.find((category) =>
      (category.parentId || undefined) === parentId && slugifyCategory(category.name) === segment
    );
    if (!current) return undefined;
    parentId = current.id;
  }

  return current;
}

export function getDescendantIds(categories: Category[], categoryId: string) {
  const ids = new Set<string>([categoryId]);
  const queue = [categoryId];

  while (queue.length) {
    const parentId = queue.shift()!;
    categories
      .filter((category) => category.parentId === parentId)
      .forEach((child) => {
        if (!ids.has(child.id)) {
          ids.add(child.id);
          queue.push(child.id);
        }
      });
  }

  return ids;
}

export function getCategoryDepth(categories: Category[], category: Category) {
  return Math.max(0, getCategoryAncestors(categories, category).length - 1);
}

export function wouldCreateCategoryCycle(categories: Category[], categoryId: string, possibleParentId?: string) {
  if (!possibleParentId) return false;
  if (possibleParentId === categoryId) return true;
  return getDescendantIds(categories, categoryId).has(possibleParentId);
}
