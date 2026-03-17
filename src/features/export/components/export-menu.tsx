import { useCallback, useRef } from 'react';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { exportBoardToJson, exportBoardToCsv } from '../api/export-board';
import { useImportBoardMutation } from '../api/use-import-board';
import styles from './export-menu.module.css';

interface ExportMenuProps {
  boardId: string;
}

export function ExportMenu({ boardId }: ExportMenuProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formatRef = useRef<'json' | 'csv'>('json');
  const importMutation = useImportBoardMutation();

  const handleJson = useCallback(() => {
    void exportBoardToJson(boardId);
  }, [boardId]);

  const handleCsv = useCallback(() => {
    void exportBoardToCsv(boardId);
  }, [boardId]);

  const handleImportJson = useCallback(() => {
    formatRef.current = 'json';
    if (fileInputRef.current) {
      fileInputRef.current.accept = '.json';
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }, []);

  const handleImportCsv = useCallback(() => {
    formatRef.current = 'csv';
    if (fileInputRef.current) {
      fileInputRef.current.accept = '.csv';
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      importMutation.mutate({ boardId, file, format: formatRef.current });
    },
    [boardId, importMutation],
  );

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className={styles.menuButton} aria-label="Import / Export">
          &#8645;
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Item onSelect={handleJson}>Export as JSON</DropdownMenu.Item>
          <DropdownMenu.Item onSelect={handleCsv}>Export as CSV</DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item onSelect={handleImportJson}>Import from JSON</DropdownMenu.Item>
          <DropdownMenu.Item onSelect={handleImportCsv}>Import from CSV</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </>
  );
}
