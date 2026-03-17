import { type TextareaHTMLAttributes, forwardRef, useId, useCallback, useEffect, useRef } from 'react';
import clsx from 'clsx';
import styles from './textarea.module.css';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  autoResize?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, error, autoResize, className, onChange, ...props }, ref) {
    const id = useId();
    const internalRef = useRef<HTMLTextAreaElement | null>(null);

    const adjustHeight = useCallback(() => {
      const el = internalRef.current;
      if (!el || !autoResize) return;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }, [autoResize]);

    useEffect(() => {
      adjustHeight();
    }, [adjustHeight, props.value]);

    function setRefs(el: HTMLTextAreaElement | null) {
      internalRef.current = el;
      if (typeof ref === 'function') {
        ref(el);
      } else if (ref) {
        ref.current = el;
      }
    }

    function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
      onChange?.(e);
      adjustHeight();
    }

    return (
      <div className={styles.wrapper}>
        {label && (
          <label htmlFor={id} className={styles.label}>
            {label}
          </label>
        )}
        <textarea
          ref={setRefs}
          id={id}
          className={clsx(
            styles.textarea,
            autoResize && styles.autoResize,
            error && styles.error,
            className,
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={handleChange}
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
