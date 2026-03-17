import { useQuery } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { unwrapResult } from '@/lib/api-client';
import type { CardDetail } from '../types';

async function fetchCard(cardId: string): Promise<CardDetail> {
  if (isDemoMode) {
    // In demo mode, card details come from the columns query cache
    // Return a minimal detail object
    return {
      id: cardId,
      column_id: '',
      board_id: '',
      title: '',
      description: null,
      status: 'active',
      position: 0,
      assignee_id: null,
      due_date: null,
      created_at: '',
      updated_at: '',
      archived_at: null,
      archived_with_column: false,
      labels: [],
      checklist_count: 0,
      checklist_done_count: 0,
      attachment_count: 0,
    };
  }

  const { data, error } = await supabase
    .from('cards')
    .select(`
      id, column_id, board_id, title, description, status, position,
      assignee_id, due_date, created_at, updated_at, archived_at, archived_with_column,
      card_labels(label_id, labels(id, name, color)),
      checklists(id, checklist_items(is_complete)),
      attachments(id)
    `)
    .eq('id', cardId)
    .single();

  const card = unwrapResult(data, error);

  const labels = card.card_labels.map((cl) => ({
    id: cl.labels.id,
    name: cl.labels.name,
    color: cl.labels.color,
  }));

  let checklistCount = 0;
  let checklistDoneCount = 0;
  for (const checklist of card.checklists) {
    for (const item of checklist.checklist_items) {
      checklistCount++;
      if (item.is_complete) checklistDoneCount++;
    }
  }

  return {
    id: card.id,
    column_id: card.column_id,
    board_id: card.board_id,
    title: card.title,
    description: card.description,
    status: card.status,
    position: card.position,
    assignee_id: card.assignee_id,
    due_date: card.due_date,
    created_at: card.created_at,
    updated_at: card.updated_at,
    archived_at: card.archived_at,
    archived_with_column: card.archived_with_column,
    labels,
    checklist_count: checklistCount,
    checklist_done_count: checklistDoneCount,
    attachment_count: card.attachments.length,
  };
}

export function useCardQuery(cardId: string | undefined) {
  return useQuery({
    queryKey: ['card', cardId],
    queryFn: () => {
      if (!cardId) throw new Error('cardId is required');
      return fetchCard(cardId);
    },
    enabled: !!cardId,
  });
}
