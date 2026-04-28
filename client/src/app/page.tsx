import ChatPanel from "@/components/ChatPanel";
import InteractionForm from "@/components/InteractionForm";

export default function Home() {
  return (
    <div className="page">
      <div className="container">
        <header className="header">
          <div>
            <p className="kicker">HCP Module</p>
            <h1 className="title">Log Interaction</h1>
            <p className="subtitle">
              Capture HCP touchpoints via structured fields or a conversational
              intake.
            </p>
          </div>
          <div className="pill-stack">
            <span className="pill">Groq · gemma2-9b-it</span>
            <span className="pill outline">LangGraph</span>
          </div>
        </header>

        <section className="grid">
          <div className="card delay-1">
            <InteractionForm />
          </div>
          <div className="card delay-2">
            <ChatPanel />
          </div>
        </section>
      </div>
    </div>
  );
}
