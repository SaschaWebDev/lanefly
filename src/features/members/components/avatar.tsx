import clsx from 'clsx';
import styles from './avatar.module.css';

interface AvatarProps {
  name: string | null;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ name, imageUrl, size = 'md', className }: AvatarProps) {
  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?';

  return (
    <div
      className={clsx(styles.avatar, styles[size], !imageUrl && styles.initials, className)}
      title={name ?? undefined}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={name ?? 'Avatar'} className={styles.image} />
      ) : (
        initials
      )}
    </div>
  );
}
