import { createFileRoute } from "@tanstack/react-router";
import { UserListPage } from "@/components/UserListPage";

export const Route = createFileRoute("/u/$uid/following")({
  component: () => {
    const { uid } = Route.useParams();
    return <UserListPage uid={uid} mode="following" />;
  },
});
