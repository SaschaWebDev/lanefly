import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError, unwrapResult } from '@/lib/api-client';
import type { Checklist, ChecklistItem } from '@/types/common';

export interface ChecklistWithItems extends Checklist {
  items: ChecklistItem[];
}

async function fetchChecklists(cardId: string): Promise<ChecklistWithItems[]> {
  if (isDemoMode) return [];

  const { data, error } = await supabase
    .from('checklists')
    .select('*, checklist_items(*)')
    .eq('card_id', cardId)
    .order('position', { ascending: true });

  if (error) handleSupabaseError(error);

  return data.map((cl) => ({
    ...cl,
    items: [...cl.checklist_items].sort((a, b) => a.position - b.position),
  }));
}

export function useChecklistsQuery(cardId: string | undefined) {
  return useQuery({
    queryKey: ['checklists', cardId],
    queryFn: () => {
      if (!cardId) throw new Error('cardId required');
      return fetchChecklists(cardId);
    },
    enabled: !!cardId,
  });
}

interface CreateChecklistInput {
  cardId: string;
  boardId: string;
  title: string;
  position: number;
}

async function createChecklist({ cardId, title, position }: CreateChecklistInput) {
  if (isDemoMode) return;

  const { error } = await supabase
    .from('checklists')
    .insert({ card_id: cardId, title, position });

  if (error) handleSupabaseError(error);
}

export function useCreateChecklistMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createChecklist,
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: ['checklists', v.cardId] });
      void qc.invalidateQueries({ queryKey: ['columns', v.boardId] });
    },
  });
}

interface DeleteChecklistInput {
  checklistId: string;
  cardId: string;
  boardId: string;
}

async function deleteChecklist({ checklistId }: DeleteChecklistInput) {
  if (isDemoMode) return;

  const { error } = await supabase
    .from('checklists')
    .delete()
    .eq('id', checklistId);

  if (error) handleSupabaseError(error);
}

export function useDeleteChecklistMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteChecklist,
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: ['checklists', v.cardId] });
      void qc.invalidateQueries({ queryKey: ['columns', v.boardId] });
    },
  });
}

interface AddChecklistItemInput {
  checklistId: string;
  cardId: string;
  boardId: string;
  title: string;
  position: number;
}

async function addChecklistItem({ checklistId, title, position }: AddChecklistItemInput) {
  if (isDemoMode) return;

  const { error } = await supabase
    .from('checklist_items')
    .insert({ checklist_id: checklistId, title, position });

  if (error) handleSupabaseError(error);
}

export function useAddChecklistItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addChecklistItem,
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: ['checklists', v.cardId] });
      void qc.invalidateQueries({ queryKey: ['columns', v.boardId] });
    },
  });
}

interface ToggleChecklistItemInput {
  itemId: string;
  cardId: string;
  boardId: string;
  isComplete: boolean;
}

async function toggleChecklistItem({ itemId, isComplete }: ToggleChecklistItemInput) {
  if (isDemoMode) return;

  const { error } = await supabase
    .from('checklist_items')
    .update({ is_complete: isComplete })
    .eq('id', itemId);

  if (error) handleSupabaseError(error);
}

export function useToggleChecklistItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: toggleChecklistItem,
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: ['checklists', v.cardId] });
      void qc.invalidateQueries({ queryKey: ['columns', v.boardId] });
    },
  });
}

interface UpdateChecklistItemInput {
  itemId: string;
  cardId: string;
  boardId: string;
  title: string;
}

async function updateChecklistItem({ itemId, title }: UpdateChecklistItemInput) {
  if (isDemoMode) return;

  const { error } = await supabase
    .from('checklist_items')
    .update({ title })
    .eq('id', itemId);

  if (error) handleSupabaseError(error);
}

export function useUpdateChecklistItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateChecklistItem,
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: ['checklists', v.cardId] });
    },
  });
}

interface DeleteChecklistItemInput {
  itemId: string;
  cardId: string;
  boardId: string;
}

async function deleteChecklistItem({ itemId }: DeleteChecklistItemInput) {
  if (isDemoMode) return;

  const { error } = await supabase
    .from('checklist_items')
    .delete()
    .eq('id', itemId);

  if (error) handleSupabaseError(error);
}

export function useDeleteChecklistItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteChecklistItem,
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: ['checklists', v.cardId] });
      void qc.invalidateQueries({ queryKey: ['columns', v.boardId] });
    },
  });
}
