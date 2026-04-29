import ChatPanel from "@/components/ChatPanel";
import InteractionForm from "@/components/InteractionForm";

export default function Home() {
  return (
    <div className="flex max-h-screen">
      <div className="flex-1 overflow-y-auto">
        <InteractionForm />
      </div>
      <div className="w-1/3 border-l border-slate-200 absoulute right-0 top-0">
        <ChatPanel />
      </div>
    </div>
  );
}
