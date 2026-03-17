import { memo } from 'react';
import clsx from 'clsx';
import { sanitizeHtml } from '@/lib/sanitize';
import styles from './safe-html.module.css';

interface SafeHtmlProps {
  html: string;
  className?: string;
}

export const SafeHtml = memo(function SafeHtml({ html, className }: SafeHtmlProps) {
  const clean = sanitizeHtml(html);

  return (
    <div
      className={clsx(styles.prose, className)}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
});
