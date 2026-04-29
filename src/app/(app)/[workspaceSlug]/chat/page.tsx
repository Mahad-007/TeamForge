import { MessageSquare } from "lucide-react";

export const metadata = { title: "Chat - TeamForge" };

export default function ChatPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center text-muted-foreground">
        <MessageSquare className="mx-auto h-12 w-12" />
        <h2 className="mt-4 text-lg font-medium">Select a channel</h2>
        <p className="text-sm">
          Choose a channel from the sidebar to start chatting.
        </p>
      </div>
    </div>
  );
}
