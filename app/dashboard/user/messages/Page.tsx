// app/(dashboard)/user/messages/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/auth";
import { ChatList } from "./components/ChatList";
import { ChatWindow } from "./components/ChatWindow";

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="h-[calc(100vh-4rem)] bg-white dark:bg-gray-900">
      <div className="flex h-full">
        {/* Chat List */}
        <div className="w-full md:w-80 border-r border-gray-200 dark:border-gray-700">
          <ChatList userId={session.user.id} />
        </div>

        {/* Chat Window */}
        <div className="hidden md:flex-1 md:flex">
          <ChatWindow userId={session.user.id} />
        </div>
      </div>
    </div>
  );
}
