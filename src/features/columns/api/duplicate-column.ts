import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError } from '@/lib/api-client';
import { generateCopyName } from '@/lib/copy-name';
import type { ColumnWithCards } from '../types';

interface DuplicateColumnInput {
  boardId: string;
  column: ColumnWithCards;
  siblingColumnTitles: string[];
  newPosition: number;
}

async function duplicateColumn({ boardId, column, siblingColumnTitles, newPosition }: DuplicateColumnInput) {
  if (isDemoMode) return;

  const title = generateCopyName(column.title, siblingColumnTitles);

  // Create new column
  const { data: newCol, error: colErr } = await supabase
    .from('columns')
    .insert({
      board_id: boardId,
      lane_id: column.lane_id,
      title,
      position: newPosition,
    })
    .select()
    .single();
  if (colErr) handleSupabaseError(colErr);

  // Copy cards and track old→new ID mapping
  const cardIdMap = new Map<string, string>();
  for (const card of column.cards) {
    const { data: newCard, error: cardErr } = await supabase
      .from('cards')
      .insert({
        board_id: boardId,
        column_id: newCol.id,
        title: card.title,
        description: card.description,
        status: card.status,
        position: card.position,
        assignee_id: card.assignee_id,
        due_date: card.due_date,
      })
      .select()
      .single();
    if (cardErr) handleSupabaseError(cardErr);
    cardIdMap.set(card.id, newCard.id);
  }

  // Copy card_labels for each card
  for (const [oldCardId, newCardId] of cardIdMap) {
    const { data: labels, error: labelsErr } = await supabase
      .from('card_labels')
      .select('label_id')
      .eq('card_id', oldCardId);
    if (labelsErr) handleSupabaseError(labelsErr);

    for (const label of labels ?? []) {
      const { error } = await supabase
        .from('card_labels')
        .insert({ card_id: newCardId, label_id: label.label_id });
      if (error) handleSupabaseError(error);
    }
  }

  // Copy checklists and their items for each card
  for (const [oldCardId, newCardId] of cardIdMap) {
    const { data: checklists, error: clErr } = await supabase
      .from('checklists')
      .select('*, checklist_items(*)')
      .eq('card_id', oldCardId)
      .order('position');
    if (clErr) handleSupabaseError(clErr);

    for (const checklist of checklists ?? []) {
      const { data: newChecklist, error: newClErr } = await supabase
        .from('checklists')
        .insert({ card_id: newCardId, title: checklist.title, position: checklist.position })
        .select()
        .single();
      if (newClErr) handleSupabaseError(newClErr);

      const items = (checklist.checklist_items ?? []) as Array<{
        title: string;
        position: number;
        is_complete: boolean;
      }>;
      for (const item of items) {
        const { error } = await supabase
          .from('checklist_items')
          .insert({
            checklist_id: newChecklist.id,
            title: item.title,
            position: item.position,
            is_complete: item.is_complete,
          });
        if (error) handleSupabaseError(error);
      }
    }
  }
}

export function useDuplicateColumnMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: duplicateColumn,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['columns', variables.boardId] });
    },
  });
}
