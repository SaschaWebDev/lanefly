import { useBoardMembersQuery } from '../api/get-board-members';
import { Avatar } from './avatar';
import styles from './member-picker.module.css';

interface MemberPickerProps {
  boardId: string;
  selectedUserId: string | null;
  onSelect: (userId: string | null) => void;
}

export function MemberPicker({ boardId, selectedUserId, onSelect }: MemberPickerProps) {
  const { data: members } = useBoardMembersQuery(boardId);

  return (
    <div className={styles.list}>
      <button
        className={!selectedUserId ? styles.selected : styles.memberRow}
        onClick={() => onSelect(null)}
      >
        <span className={styles.name}>Unassigned</span>
        {!selectedUserId && <span className={styles.checkmark}>{'\u2713'}</span>}
      </button>
      {members?.map((member) => (
        <button
          key={member.id}
          className={selectedUserId === member.user_id ? styles.selected : styles.memberRow}
          onClick={() => onSelect(member.user_id)}
        >
          <Avatar name={member.display_name} imageUrl={member.avatar_url} size="sm" />
          <span className={styles.name}>{member.display_name ?? 'Unknown'}</span>
          {selectedUserId === member.user_id && <span className={styles.checkmark}>{'\u2713'}</span>}
        </button>
      ))}
    </div>
  );
}
