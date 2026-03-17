import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/toast';
import { importBoardFromJson, importBoardFromCsv } from './import-board';

interface ImportInput {
  boardId: string;
  file: File;
  format: 'json' | 'csv';
}

export function useImportBoardMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ boardId, file, format }: ImportInput) => {
      if (format === 'json') return importBoardFromJson(boardId, file);
      return importBoardFromCsv(boardId, file);
    },
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['columns', variables.boardId] });
      toast(`Imported ${data.columns} columns and ${data.cards} cards`, 'success');
    },
    onError: (error: Error) => {
      toast(error.message, 'error');
    },
  });
}
