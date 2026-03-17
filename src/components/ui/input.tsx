import { type InputHTMLAttributes, forwardRef, useId } from 'react';
import clsx from 'clsx';
import styles from './input.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, className, ...props }, ref) {
    const id = useId();

    return (
      <div className={styles.wrapper}>
        {label && (
          <label htmlFor={id} className={styles.label}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={clsx(styles.input, error && styles.error, className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
        {error && (
          <span id={`${id}-error`} className={styles.errorText} role="alert">
            {error}
          </span>
        )}
      </div>
    );
  },
);
