import styles from './label-chip.module.css';

interface LabelChipProps {
  name: string;
  color: string;
  small?: boolean;
}

export function LabelChip({ name, color, small }: LabelChipProps) {
  return (
    <span
      className={small ? styles.chipSmall : styles.chip}
      style={{ backgroundColor: color }}
      title={name}
    >
      {small ? '' : name}
    </span>
  );
}
