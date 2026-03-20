import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  useChecklistsQuery,
  useCreateChecklistMutation,
  useDeleteChecklistMutation,
  useAddChecklistItemMutation,
  useToggleChecklistItemMutation,
  useUpdateChecklistItemMutation,
  useDeleteChecklistItemMutation,
} from '../api/checklist';
import styles from './checklist.module.css';

interface ChecklistSectionProps {
  cardId: string;
  boardId: string;
  canEdit: boolean;
}

export function ChecklistSection({ cardId, boardId, canEdit }: ChecklistSectionProps) {
  const { data: checklists } = useChecklistsQuery(cardId);
  const createChecklist = useCreateChecklistMutation();
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const handleCreate = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = newTitle.trim();
      if (!trimmed) return;
      const position = (checklists?.length ?? 0) * 1024 + 1024;
      createChecklist.mutate({ cardId, boardId, title: trimmed, position });
      setNewTitle('');
      setShowNewForm(false);
    },
    [newTitle, cardId, boardId, checklists, createChecklist],
  );

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Checklists</h3>
        {canEdit && !showNewForm && (
          <Button size="sm" variant="ghost" onClick={() => setShowNewForm(true)}>
            + Add
          </Button>
        )}
      </div>

      {showNewForm && (
        <form className={styles.newForm} onSubmit={handleCreate}>
          <input
            className={styles.newInput}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Checklist title"
            autoFocus
          />
          <div className={styles.newActions}>
            <Button size="sm" type="submit">Add</Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowNewForm(false); setNewTitle(''); }}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {checklists?.map((cl) => (
        <ChecklistGroup
          key={cl.id}
          checklist={cl}
          cardId={cardId}
          boardId={boardId}
          canEdit={canEdit}
        />
      ))}
    </div>
  );
}

interface ChecklistGroupProps {
  checklist: {
    id: string;
    title: string;
    items: Array<{
      id: string;
      title: string;
      is_complete: boolean;
      position: number;
    }>;
  };
  cardId: string;
  boardId: string;
  canEdit: boolean;
}

function ChecklistGroup({ checklist, cardId, boardId, canEdit }: ChecklistGroupProps) {
  const deleteChecklist = useDeleteChecklistMutation();
  const addItem = useAddChecklistItemMutation();
  const toggleItem = useToggleChecklistItemMutation();
  const updateItem = useUpdateChecklistItemMutation();
  const deleteItem = useDeleteChecklistItemMutation();
  const [newItemText, setNewItemText] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const doneCount = checklist.items.filter((i) => i.is_complete).length;
  const totalCount = checklist.items.length;
  const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

  const handleAddItem = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = newItemText.trim();
      if (!trimmed) return;
      const position = totalCount * 1024 + 1024;
      addItem.mutate({
        checklistId: checklist.id,
        cardId,
        boardId,
        title: trimmed,
        position,
      });
      setNewItemText('');
    },
    [newItemText, totalCount, checklist.id, cardId, boardId, addItem],
  );

  const handleEditSave = useCallback(
    (itemId: string) => {
      const trimmed = editText.trim();
      if (trimmed) {
        updateItem.mutate({ itemId, cardId, boardId, title: trimmed });
      }
      setEditingItemId(null);
    },
    [editText, cardId, boardId, updateItem],
  );

  return (
    <div className={styles.group}>
      <div className={styles.groupHeader}>
        <span className={styles.groupTitle}>{checklist.title}</span>
        <span className={styles.count}>{doneCount}/{totalCount}</span>
        {canEdit && (
          <button
            className={styles.deleteBtn}
            onClick={() => deleteChecklist.mutate({ checklistId: checklist.id, cardId, boardId })}
            aria-label="Delete checklist"
          >
            &#x2715;
          </button>
        )}
      </div>

      {totalCount > 0 && (
        <div className={styles.progressBar}>
          <div
            className={progress === 100 ? styles.progressFillDone : styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className={styles.items}>
        {checklist.items.map((item) => (
          <div key={item.id} className={styles.item}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={item.is_complete}
              onChange={() =>
                canEdit && toggleItem.mutate({
                  itemId: item.id,
                  cardId,
                  boardId,
                  isComplete: !item.is_complete,
                })
              }
              disabled={!canEdit}
            />
            {editingItemId === item.id ? (
              <input
                className={styles.editItemInput}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={() => handleEditSave(item.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEditSave(item.id);
                  if (e.key === 'Escape') setEditingItemId(null);
                }}
                autoFocus
              />
            ) : (
              <span
                className={item.is_complete ? styles.itemTextDone : styles.itemText}
                onClick={() => {
                  if (!canEdit) return;
                  setEditingItemId(item.id);
                  setEditText(item.title);
                }}
              >
                {item.title}
              </span>
            )}
            {canEdit && editingItemId !== item.id && (
              <button
                className={styles.itemDelete}
                onClick={() => deleteItem.mutate({ itemId: item.id, cardId, boardId })}
                aria-label="Delete item"
              >
                &#x2715;
              </button>
            )}
          </div>
        ))}
      </div>

      {canEdit && (
        showAddItem ? (
          <form className={styles.addItemForm} onSubmit={handleAddItem}>
            <input
              className={styles.addItemInput}
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="Add an item..."
              autoFocus
            />
            <Button size="sm" type="submit">Add</Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowAddItem(false); setNewItemText(''); }}>
              Cancel
            </Button>
          </form>
        ) : (
          <button className={styles.addItemBtn} onClick={() => setShowAddItem(true)}>
            + Add item
          </button>
        )
      )}
    </div>
  );
}
