import type { Card } from '@/types/common';
import type { CardSortAction } from '../types';

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

export function sortCards(cards: Card[], action: CardSortAction): Card[] {
  const sorted = [...cards];

  switch (action) {
    case 'name-asc':
      sorted.sort((a, b) => collator.compare(a.title, b.title));
      break;
    case 'created-newest':
      sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
      break;
    case 'created-oldest':
      sorted.sort((a, b) => a.created_at.localeCompare(b.created_at));
      break;
  }

  return sorted;
}
