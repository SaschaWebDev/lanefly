import clsx from 'clsx';
import styles from './spinner.module.css';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      className={clsx(styles.spinner, styles[size], className)}
      role="status"
      aria-label="Loading"
    />
  );
}
