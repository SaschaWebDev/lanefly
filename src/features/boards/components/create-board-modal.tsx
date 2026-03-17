import { useState, type FormEvent } from 'react';
import clsx from 'clsx';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCreateBoardMutation } from '../api/create-board';
import styles from './create-board-modal.module.css';

const BACKGROUND_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#ef4444',
  '#f59e0b',
  '#22c55e',
  '#06b6d4',
  '#6366f1',
  '#334155',
];

interface CreateBoardModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
}

export function CreateBoardModal({
  open,
  onClose,
  userId,
}: CreateBoardModalProps) {
  const [title, setTitle] = useState('');
  const [background, setBackground] = useState(BACKGROUND_COLORS[0]!);
  const mutation = useCreateBoardMutation();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    mutation.mutate(
      { title: title.trim(), background, ownerId: userId },
      {
        onSuccess: () => {
          setTitle('');
          setBackground(BACKGROUND_COLORS[0]!);
          onClose();
        },
      },
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Board"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={(e) => handleSubmit(e)}
            loading={mutation.isPending}
            disabled={!title.trim()}
          >
            Create
          </Button>
        </>
      }
    >
      <form
        className={styles.form}
        onSubmit={handleSubmit}
      >
        <Input
          label="Board title"
          placeholder="My awesome project"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          required
        />
        <div className={styles.colorSection}>
          <label className={styles.colorLabel}>Background</label>
          <div className={styles.colorGrid}>
            {BACKGROUND_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={clsx(
                  styles.colorSwatch,
                  background === color && styles.selected,
                )}
                style={{ backgroundColor: color }}
                onClick={() => setBackground(color)}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
}
