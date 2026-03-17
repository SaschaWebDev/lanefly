import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { addDemoActivity } from './demo-store';

export async function logActivity(
  boardId: string,
  cardId: string,
  userId: string,
  action: string,
): Promise<void> {
  if (isDemoMode) {
    addDemoActivity(boardId, cardId, action);
    return;
  }

  await supabase
    .from('activity_log')
    .insert({ board_id: boardId, card_id: cardId, user_id: userId, action });
}
