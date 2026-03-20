import { Modal } from './modal';
import styles from './shortcuts-overlay.module.css';

interface ShortcutsOverlayProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'N', description: 'New card in first column' },
  { key: '/', description: 'Focus search bar' },
  { key: 'Esc', description: 'Close modal / deselect' },
  { key: 'B', description: 'Back to board list' },
  { key: '?', description: 'Show this shortcuts panel' },
  { key: 'F', description: 'Toggle filter bar' },
];

export function ShortcutsOverlay({ open, onClose }: ShortcutsOverlayProps) {
  return (
    <Modal open={open} onClose={onClose} title="Keyboard Shortcuts">
      <div className={styles.grid}>
        {SHORTCUTS.map((s) => (
          <div key={s.key} className={styles.row}>
            <kbd className={styles.key}>{s.key}</kbd>
            <span className={styles.desc}>{s.description}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
}
