import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface CardSelectionContextValue {
  selectedIds: Set<string>;
  isSelected: (cardId: string) => boolean;
  toggle: (cardId: string, extend: boolean) => void;
  selectRange: (cardId: string) => void;
  clearSelection: () => void;
  selectionCount: number;
}

const CardSelectionContext = createContext<CardSelectionContextValue | null>(null);

export function useCardSelection(): CardSelectionContextValue | null {
  return useContext(CardSelectionContext);
}

export function CardSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const isSelected = useCallback(
    (cardId: string) => selectedIds.has(cardId),
    [selectedIds],
  );

  const toggle = useCallback((cardId: string, extend: boolean) => {
    setSelectedIds((prev) => {
      const next = extend ? new Set(prev) : new Set<string>();
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  }, []);

  const selectRange = useCallback((cardId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.add(cardId);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  return (
    <CardSelectionContext.Provider
      value={{
        selectedIds,
        isSelected,
        toggle,
        selectRange,
        clearSelection,
        selectionCount: selectedIds.size,
      }}
    >
      {children}
    </CardSelectionContext.Provider>
  );
}
