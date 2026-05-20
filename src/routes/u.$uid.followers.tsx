import { createFileRoute } from "@tanstack/react-router";
import { UserListPage } from "@/components/UserListPage";

export const Route = createFileRoute("/u/$uid/followers")({
  component: () => {
    const { uid } = Route.useParams();
    return <UserListPage uid={uid} mode="followers" />;
  },
});
