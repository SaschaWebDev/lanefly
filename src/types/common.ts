import type { Database } from './database';

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type InsertDto<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type UpdateDto<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type Profile = Tables<'profiles'>;
export type Board = Tables<'boards'>;
export type BoardMember = Tables<'board_members'>;
export type Lane = Tables<'lanes'>;
export type Column = Tables<'columns'>;
export type Card = Tables<'cards'>;
export type Label = Tables<'labels'>;
export type Checklist = Tables<'checklists'>;
export type ChecklistItem = Tables<'checklist_items'>;
export type Attachment = Tables<'attachments'>;
export type ActivityLog = Tables<'activity_log'>;
export type Notification = Tables<'notifications'>;
