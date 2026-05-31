import { requireOnboardedProfile } from "@/lib/guards";
import { ChatWindow } from "@/components/marketplace/chat-window";
import { listMyConversations, getThread } from "@/lib/marketplace/chat";

/** The marketplace Chat window — all conversations + the open thread. */
export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user } = await requireOnboardedProfile();
  const sp = await searchParams;
  const selectedId = (Array.isArray(sp.c) ? sp.c[0] : sp.c) ?? null;

  const [conversations, thread] = await Promise.all([
    listMyConversations(),
    selectedId ? getThread(selectedId) : Promise.resolve(null),
  ]);

  return (
    <ChatWindow
      conversations={conversations}
      thread={thread}
      selectedId={thread ? selectedId : null}
      myUserId={user.id}
    />
  );
}
