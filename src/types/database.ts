export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type BoardRole = 'admin' | 'editor' | 'viewer';
export type CardStatus = 'active' | 'done';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          storage_used: number;
          storage_quota: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          storage_used?: number;
          storage_quota?: number;
        };
        Update: {
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          storage_used?: number;
          storage_quota?: number;
        };
        Relationships: [];
      };
      boards: {
        Row: {
          id: string;
          title: string;
          background: string | null;
          owner_id: string;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          background?: string | null;
          owner_id: string;
        };
        Update: {
          title?: string;
          background?: string | null;
          archived_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'boards_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      board_members: {
        Row: {
          id: string;
          board_id: string;
          user_id: string;
          role: BoardRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          board_id: string;
          user_id: string;
          role: BoardRole;
        };
        Update: {
          role?: BoardRole;
        };
        Relationships: [
          {
            foreignKeyName: 'board_members_board_id_fkey';
            columns: ['board_id'];
            isOneToOne: false;
            referencedRelation: 'boards';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'board_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      board_favorites: {
        Row: {
          id: string;
          board_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          board_id: string;
          user_id: string;
        };
        Update: {
          id?: string;
          board_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'board_favorites_board_id_fkey';
            columns: ['board_id'];
            isOneToOne: false;
            referencedRelation: 'boards';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'board_favorites_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      columns: {
        Row: {
          id: string;
          board_id: string;
          title: string;
          position: number;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          board_id: string;
          title: string;
          position: number;
        };
        Update: {
          title?: string;
          position?: number;
          archived_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'columns_board_id_fkey';
            columns: ['board_id'];
            isOneToOne: false;
            referencedRelation: 'boards';
            referencedColumns: ['id'];
          },
        ];
      };
      cards: {
        Row: {
          id: string;
          column_id: string;
          board_id: string;
          title: string;
          description: string | null;
          status: CardStatus;
          position: number;
          assignee_id: string | null;
          due_date: string | null;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
          archived_with_column: boolean;
        };
        Insert: {
          id?: string;
          column_id: string;
          board_id: string;
          title: string;
          description?: string | null;
          status?: CardStatus;
          position: number;
          assignee_id?: string | null;
          due_date?: string | null;
        };
        Update: {
          column_id?: string;
          title?: string;
          description?: string | null;
          status?: CardStatus;
          position?: number;
          assignee_id?: string | null;
          due_date?: string | null;
          archived_at?: string | null;
          archived_with_column?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'cards_column_id_fkey';
            columns: ['column_id'];
            isOneToOne: false;
            referencedRelation: 'columns';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cards_board_id_fkey';
            columns: ['board_id'];
            isOneToOne: false;
            referencedRelation: 'boards';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cards_assignee_id_fkey';
            columns: ['assignee_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      labels: {
        Row: {
          id: string;
          board_id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          board_id: string;
          name: string;
          color: string;
        };
        Update: {
          name?: string;
          color?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'labels_board_id_fkey';
            columns: ['board_id'];
            isOneToOne: false;
            referencedRelation: 'boards';
            referencedColumns: ['id'];
          },
        ];
      };
      card_labels: {
        Row: {
          id: string;
          card_id: string;
          label_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          card_id: string;
          label_id: string;
        };
        Update: {
          id?: string;
          card_id?: string;
          label_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'card_labels_card_id_fkey';
            columns: ['card_id'];
            isOneToOne: false;
            referencedRelation: 'cards';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'card_labels_label_id_fkey';
            columns: ['label_id'];
            isOneToOne: false;
            referencedRelation: 'labels';
            referencedColumns: ['id'];
          },
        ];
      };
      checklists: {
        Row: {
          id: string;
          card_id: string;
          title: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          card_id: string;
          title: string;
          position: number;
        };
        Update: {
          title?: string;
          position?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'checklists_card_id_fkey';
            columns: ['card_id'];
            isOneToOne: false;
            referencedRelation: 'cards';
            referencedColumns: ['id'];
          },
        ];
      };
      checklist_items: {
        Row: {
          id: string;
          checklist_id: string;
          title: string;
          is_complete: boolean;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          checklist_id: string;
          title: string;
          is_complete?: boolean;
          position: number;
        };
        Update: {
          title?: string;
          is_complete?: boolean;
          position?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'checklist_items_checklist_id_fkey';
            columns: ['checklist_id'];
            isOneToOne: false;
            referencedRelation: 'checklists';
            referencedColumns: ['id'];
          },
        ];
      };
      attachments: {
        Row: {
          id: string;
          card_id: string;
          uploader_id: string;
          file_name: string;
          file_size: number;
          mime_type: string;
          storage_path: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          card_id: string;
          uploader_id: string;
          file_name: string;
          file_size: number;
          mime_type: string;
          storage_path: string;
        };
        Update: {
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'attachments_card_id_fkey';
            columns: ['card_id'];
            isOneToOne: false;
            referencedRelation: 'cards';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'attachments_uploader_id_fkey';
            columns: ['uploader_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      activity_log: {
        Row: {
          id: string;
          board_id: string;
          card_id: string | null;
          user_id: string;
          action: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          board_id: string;
          card_id?: string | null;
          user_id: string;
          action: string;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'activity_log_board_id_fkey';
            columns: ['board_id'];
            isOneToOne: false;
            referencedRelation: 'boards';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'activity_log_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          message: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          message: string;
          is_read?: boolean;
        };
        Update: {
          is_read?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      board_role: BoardRole;
      card_status: CardStatus;
    };
  };
}
