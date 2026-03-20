import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError, unwrapResult } from '@/lib/api-client';

interface DuplicateBoardInput {
  boardId: string;
  includeCards: boolean;
}

async function duplicateBoard({ boardId, includeCards }: DuplicateBoardInput): Promise<string> {
  if (isDemoMode) return boardId;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Fetch source board
  const { data: board, error: boardErr } = await supabase
    .from('boards')
    .select('title, background')
    .eq('id', boardId)
    .single();
  if (boardErr) handleSupabaseError(boardErr);

  // Create new board
  const { data: newBoard, error: newBoardErr } = await supabase
    .from('boards')
    .insert({
      title: `Copy of ${board.title}`,
      background: board.background,
      owner_id: user.id,
    })
    .select()
    .single();
  if (newBoardErr) handleSupabaseError(newBoardErr);

  // Add creator as admin
  const { error: memberErr } = await supabase
    .from('board_members')
    .insert({ board_id: newBoard.id, user_id: user.id, role: 'admin' });
  if (memberErr) handleSupabaseError(memberErr);

  // Copy lanes
  const { data: lanes, error: lanesErr } = await supabase
    .from('lanes')
    .select('*')
    .eq('board_id', boardId)
    .is('archived_at', null)
    .order('position');
  if (lanesErr) handleSupabaseError(lanesErr);

  const laneIdMap = new Map<string, string>();
  for (const lane of lanes ?? []) {
    const { data: newLane, error } = await supabase
      .from('lanes')
      .insert({ board_id: newBoard.id, title: lane.title, position: lane.position })
      .select()
      .single();
    if (error) handleSupabaseError(error);
    laneIdMap.set(lane.id, newLane.id);
  }

  // Copy columns
  const { data: columns, error: colsErr } = await supabase
    .from('columns')
    .select('*')
    .eq('board_id', boardId)
    .is('archived_at', null)
    .order('position');
  if (colsErr) handleSupabaseError(colsErr);

  const colIdMap = new Map<string, string>();
  for (const col of columns ?? []) {
    const newLaneId = col.lane_id ? laneIdMap.get(col.lane_id) ?? null : null;
    const { data: newCol, error } = await supabase
      .from('columns')
      .insert({ board_id: newBoard.id, lane_id: newLaneId, title: col.title, position: col.position })
      .select()
      .single();
    if (error) handleSupabaseError(error);
    colIdMap.set(col.id, newCol.id);
  }

  // Copy labels
  const { data: labels, error: labelsErr } = await supabase
    .from('labels')
    .select('*')
    .eq('board_id', boardId);
  if (labelsErr) handleSupabaseError(labelsErr);

  for (const label of labels ?? []) {
    const { error } = await supabase
      .from('labels')
      .insert({ board_id: newBoard.id, name: label.name, color: label.color });
    if (error) handleSupabaseError(error);
  }

  // Optionally copy cards
  if (includeCards) {
    const { data: cards, error: cardsErr } = await supabase
      .from('cards')
      .select('*')
      .eq('board_id', boardId)
      .is('archived_at', null)
      .order('position');
    if (cardsErr) handleSupabaseError(cardsErr);

    for (const card of cards ?? []) {
      const newColId = colIdMap.get(card.column_id);
      if (!newColId) continue;
      const { error } = await supabase
        .from('cards')
        .insert({
          board_id: newBoard.id,
          column_id: newColId,
          title: card.title,
          description: card.description,
          position: card.position,
        });
      if (error) handleSupabaseError(error);
    }
  }

  return newBoard.id;
}

export function useDuplicateBoardMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: duplicateBoard,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['boards'] });
    },
  });
}
