import { useTheme } from '@/hooks/use-theme';
import { DropdownMenu } from './dropdown-menu';
import styles from './theme-toggle.module.css';

function SunIcon() {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function ThemeToggle() {
  const { mode, resolved, setMode } = useTheme();

  const TriggerIcon = resolved === 'dark' ? MoonIcon : SunIcon;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className={styles.trigger}
        aria-label="Toggle theme"
      >
        <TriggerIcon />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.SubItem
          checked={mode === 'light'}
          onSelect={() => setMode('light')}
        >
          Light
        </DropdownMenu.SubItem>
        <DropdownMenu.SubItem
          checked={mode === 'dark'}
          onSelect={() => setMode('dark')}
        >
          Dark
        </DropdownMenu.SubItem>
        <DropdownMenu.SubItem
          checked={mode === 'system'}
          onSelect={() => setMode('system')}
        >
          System
        </DropdownMenu.SubItem>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
