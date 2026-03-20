import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './date-picker.module.css';

interface DatePickerProps {
  value: string | null;
  onChange: (date: string | null) => void;
  disabled?: boolean;
}

export function DatePicker({ value, onChange, disabled }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parsedValue = value ? new Date(value) : null;

  const getDateClass = () => {
    if (!parsedValue) return '';
    const diff = parsedValue.getTime() - today.getTime();
    const dayMs = 86400000;
    if (diff < 0) return styles.overdue;
    if (diff < dayMs * 2) return styles.soon;
    return styles.future;
  };

  const formatDisplay = () => {
    if (!parsedValue) return 'Set due date';
    return parsedValue.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: parsedValue.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  };

  const handleOpen = useCallback(() => {
    if (disabled) return;
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setPosition({
        top: rect.bottom + 4,
        left: Math.max(8, rect.left),
      });
    }
    setOpen(true);
  }, [disabled]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (
        panelRef.current && !panelRef.current.contains(target) &&
        triggerRef.current && !triggerRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value || null);
    setOpen(false);
  };

  const handleQuickDate = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    onChange(d.toISOString().split('T')[0]);
    setOpen(false);
  };

  return (
    <>
      <button
        ref={triggerRef}
        className={`${styles.trigger} ${getDateClass()}`}
        onClick={handleOpen}
        disabled={disabled}
        type="button"
      >
        {formatDisplay()}
      </button>

      {open && createPortal(
        <div
          ref={panelRef}
          className={styles.panel}
          style={{ position: 'fixed', top: position.top, left: position.left, zIndex: 100 }}
        >
          <input
            type="date"
            className={styles.dateInput}
            value={value ?? ''}
            onChange={handleDateChange}
            autoFocus
          />
          <div className={styles.quickDates}>
            <button className={styles.quickBtn} onClick={() => handleQuickDate(0)} type="button">Today</button>
            <button className={styles.quickBtn} onClick={() => handleQuickDate(1)} type="button">Tomorrow</button>
            <button className={styles.quickBtn} onClick={() => handleQuickDate(7)} type="button">Next week</button>
          </div>
          {value && (
            <button
              className={styles.clearBtn}
              onClick={() => { onChange(null); setOpen(false); }}
              type="button"
            >
              Clear date
            </button>
          )}
        </div>,
        document.body,
      )}
    </>
  );
}
