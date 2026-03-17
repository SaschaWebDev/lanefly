import { createFileRoute } from '@tanstack/react-router';
import { BoardView } from '@/features/boards/components/board-view';

export const Route = createFileRoute('/_authenticated/boards/$boardId')({
  component: BoardViewRoute,
});

function BoardViewRoute() {
  const { boardId } = Route.useParams();
  return <BoardView boardId={boardId} />;
}
