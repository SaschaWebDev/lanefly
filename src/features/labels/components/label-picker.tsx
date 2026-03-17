import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useLabelsQuery } from '../api/get-labels';
import { useCreateLabelMutation } from '../api/create-label';
import { useToggleCardLabelMutation } from '../api/toggle-card-label';
import styles from './label-picker.module.css';

interface LabelPickerProps {
  boardId: string;
  cardId: string;
  activeLabelIds: string[];
}

export function LabelPicker({ boardId, cardId, activeLabelIds }: LabelPickerProps) {
  const { data: labels } = useLabelsQuery(boardId);
  const createLabel = useCreateLabelMutation();
  const toggleLabel = useToggleCardLabelMutation();
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');
  const [showCreate, setShowCreate] = useState(false);

  const handleToggle = useCallback(
    (labelId: string) => {
      const isActive = activeLabelIds.includes(labelId);
      toggleLabel.mutate({ cardId, labelId, boardId, isActive });
    },
    [cardId, boardId, activeLabelIds, toggleLabel],
  );

  const handleCreate = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = newName.trim();
      if (!trimmed) return;
      createLabel.mutate({ boardId, name: trimmed, color: newColor });
      setNewName('');
      setShowCreate(false);
    },
    [boardId, newName, newColor, createLabel],
  );

  return (
    <div className={styles.picker}>
      <div className={styles.list}>
        {labels?.map((label) => (
          <label key={label.id} className={styles.labelRow}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={activeLabelIds.includes(label.id)}
              onChange={() => handleToggle(label.id)}
            />
            <span className={styles.colorDot} style={{ backgroundColor: label.color }} />
            <span className={styles.labelName}>{label.name}</span>
          </label>
        ))}
      </div>

      {showCreate ? (
        <form className={styles.createForm} onSubmit={handleCreate}>
          <input
            className={styles.createInput}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Label name"
            autoFocus
          />
          <input
            type="color"
            className={styles.colorInput}
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
          />
          <Button size="sm" type="submit">Add</Button>
        </form>
      ) : (
        <Button size="sm" variant="ghost" onClick={() => setShowCreate(true)}>
          + Create label
        </Button>
      )}
    </div>
  );
}
