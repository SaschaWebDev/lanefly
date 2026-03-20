import { useState, useCallback } from 'react';
import { Button } from './button';
import { SafeHtml } from './safe-html';
import styles from './markdown-editor.module.css';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

function markdownToHtml(md: string): string {
  let html = md;

  // Code blocks (``` ... ```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold & Italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/~~(.+?)~~/g, '<s>$1</s>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Unordered lists
  html = html.replace(/^[*-] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

  // Line breaks for remaining plain text
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');

  // Wrap in paragraphs if not already wrapped in block elements
  if (!html.startsWith('<')) {
    html = `<p>${html}</p>`;
  }

  return html;
}

export function MarkdownEditor({ value, onChange, onSave, onCancel }: MarkdownEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');

  const insertFormatting = useCallback(
    (before: string, after: string) => {
      const textarea = document.querySelector<HTMLTextAreaElement>(`.${styles.textarea}`);
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = value.slice(start, end);
      const newValue = value.slice(0, start) + before + selected + after + value.slice(end);
      onChange(newValue);
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.selectionStart = start + before.length;
        textarea.selectionEnd = end + before.length;
      });
    },
    [value, onChange],
  );

  return (
    <div className={styles.editor}>
      <div className={styles.toolbar}>
        <div className={styles.formatButtons}>
          <button
            className={styles.formatBtn}
            onClick={() => insertFormatting('**', '**')}
            title="Bold"
            type="button"
          >
            <strong>B</strong>
          </button>
          <button
            className={styles.formatBtn}
            onClick={() => insertFormatting('*', '*')}
            title="Italic"
            type="button"
          >
            <em>I</em>
          </button>
          <button
            className={styles.formatBtn}
            onClick={() => insertFormatting('~~', '~~')}
            title="Strikethrough"
            type="button"
          >
            <s>S</s>
          </button>
          <button
            className={styles.formatBtn}
            onClick={() => insertFormatting('`', '`')}
            title="Code"
            type="button"
          >
            {'</>'}
          </button>
          <button
            className={styles.formatBtn}
            onClick={() => insertFormatting('[', '](url)')}
            title="Link"
            type="button"
          >
            &#128279;
          </button>
          <button
            className={styles.formatBtn}
            onClick={() => insertFormatting('- ', '')}
            title="List"
            type="button"
          >
            &#8226;
          </button>
        </div>
        <div className={styles.modeTabs}>
          <button
            className={mode === 'edit' ? styles.tabActive : styles.tab}
            onClick={() => setMode('edit')}
            type="button"
          >
            Edit
          </button>
          <button
            className={mode === 'preview' ? styles.tabActive : styles.tab}
            onClick={() => setMode('preview')}
            type="button"
          >
            Preview
          </button>
        </div>
      </div>

      {mode === 'edit' ? (
        <textarea
          className={styles.textarea}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write your description using Markdown..."
          autoFocus
        />
      ) : (
        <div className={styles.preview}>
          {value ? (
            <SafeHtml html={markdownToHtml(value)} />
          ) : (
            <span className={styles.placeholder}>Nothing to preview</span>
          )}
        </div>
      )}

      <div className={styles.actions}>
        <Button size="sm" onClick={onSave}>Save</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export { markdownToHtml };
