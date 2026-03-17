import {
  type ReactNode,
  type ButtonHTMLAttributes,
  useState,
  useRef,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from 'react';
import { createPortal } from 'react-dom';
import styles from './dropdown-menu.module.css';

interface DropdownContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerRef: React.MutableRefObject<HTMLButtonElement | null>;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

function useDropdown() {
  const ctx = useContext(DropdownContext);
  if (!ctx) throw new Error('DropdownMenu compound components must be used within DropdownMenu.Root');
  return ctx;
}

function Root({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  return (
    <DropdownContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className={styles.wrapper}>{children}</div>
    </DropdownContext.Provider>
  );
}

function Trigger({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen, triggerRef } = useDropdown();

  return (
    <button
      ref={(el) => { triggerRef.current = el; }}
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
    </button>
  );
}

function Content({ children }: { children: ReactNode }) {
  const { open, setOpen, triggerRef } = useDropdown();
  const contentRef = useRef<HTMLDivElement>(null);
  const [focusIndex, setFocusIndex] = useState(-1);
  const [position, setPosition] = useState<{ top: number; left: number; flipUp: boolean }>({
    top: 0,
    left: 0,
    flipUp: false,
  });

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const flipUp = spaceBelow < 220;

    setPosition({
      top: flipUp ? rect.top : rect.bottom + 4,
      left: Math.max(8, rect.right - 180),
      flipUp,
    });
  }, [triggerRef]);

  useEffect(() => {
    if (!open) {
      setFocusIndex(-1);
      return;
    }
    updatePosition();

    function handleClickOutside(e: MouseEvent) {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (
        contentRef.current &&
        !contentRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }

      const items = contentRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
      if (!items?.length) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = focusIndex < items.length - 1 ? focusIndex + 1 : 0;
        setFocusIndex(next);
        items[next]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = focusIndex > 0 ? focusIndex - 1 : items.length - 1;
        setFocusIndex(prev);
        items[prev]?.focus();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, setOpen, triggerRef, focusIndex, updatePosition]);

  if (!open) return null;

  const style: React.CSSProperties = {
    position: 'fixed',
    zIndex: 100,
    left: position.left,
    ...(position.flipUp
      ? { bottom: window.innerHeight - position.top + 4 }
      : { top: position.top }),
    minWidth: 180,
  };

  return createPortal(
    <div
      ref={contentRef}
      className={styles.content}
      role="menu"
      style={style}
    >
      {children}
    </div>,
    document.body,
  );
}

interface ItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  danger?: boolean;
  onSelect?: () => void;
}

function Item({ children, danger, onSelect, onClick, ...props }: ItemProps) {
  const { setOpen } = useDropdown();

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    onClick?.(e);
    onSelect?.();
    setOpen(false);
  }

  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      className={danger ? styles.itemDanger : styles.item}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <div className={styles.separator} role="separator" />;
}

function Sub({ label, children }: { label: string; children: ReactNode }) {
  const [isSubOpen, setIsSubOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [flipLeft, setFlipLeft] = useState(false);

  const open = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsSubOpen(true);

    // Check if submenu would overflow right edge
    requestAnimationFrame(() => {
      const el = wrapperRef.current?.querySelector<HTMLElement>(`.${styles.subContent}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.right > window.innerWidth - 8) {
          setFlipLeft(true);
        }
      }
    });
  }, []);

  const close = useCallback(() => {
    timerRef.current = setTimeout(() => setIsSubOpen(false), 100);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={styles.subWrapper}
      onMouseEnter={open}
      onMouseLeave={close}
    >
      <button
        type="button"
        role="menuitem"
        tabIndex={-1}
        className={styles.subTrigger}
        aria-haspopup="menu"
        aria-expanded={isSubOpen}
        onClick={open}
      >
        {label}
        <span aria-hidden>›</span>
      </button>
      {isSubOpen && (
        <div
          className={`${styles.subContent} ${flipLeft ? styles.subContentFlipped : ''}`}
          role="menu"
        >
          {children}
        </div>
      )}
    </div>
  );
}

function SubItem({ children, checked, onSelect, ...props }: ItemProps & { checked?: boolean }) {
  const { setOpen } = useDropdown();

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    props.onClick?.(e);
    onSelect?.();
    setOpen(false);
  }

  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={checked}
      tabIndex={-1}
      className={styles.item}
      onClick={handleClick}
      {...props}
    >
      <span className={styles.checkMark}>{checked ? '✓' : ''}</span>
      {children}
    </button>
  );
}

export const DropdownMenu = {
  Root,
  Trigger,
  Content,
  Item,
  Separator,
  Sub,
  SubItem,
};
