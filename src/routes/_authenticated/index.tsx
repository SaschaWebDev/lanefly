import { createFileRoute } from '@tanstack/react-router';
import { BoardList } from '@/features/boards/components/board-list';

export const Route = createFileRoute('/_authenticated/')({
  component: BoardList,
});
