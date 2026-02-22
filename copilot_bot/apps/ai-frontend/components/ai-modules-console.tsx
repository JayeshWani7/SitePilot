"use client";

import { KeyboardEvent, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MermaidBlock from "./mermaid-block";

const markdownComponents = {
  code(props: { className?: string; children?: React.ReactNode }) {
    const { className, children } = props;
    const match = /language-(\w+)/.exec(className || "");
    if (match && match[1] === "mermaid") {
      return <MermaidBlock code={String(children).trim()} />;
    }
    return <code className={className}>{children}</code>;
  },
};

type ChatRole = "assistant" | "user";
type VisualizationType = "kpi" | "bar" | "progress" | "timeline";

type VisualizationItem = {
  label: string;
  value: number;
};

type ChatVisualization = {
  title: string;
  type: VisualizationType;
  insight: string;
  unit?: string;
  items: VisualizationItem[];
};

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  visualizations?: ChatVisualization[];
};

type ModuleOption = {
  id: "general" | "onboarding" | "component-suggester" | "brand-consistency" | "usage-coach" | "seo-copilot";
  label: string;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4001";

const moduleOptions: ModuleOption[] = [
  { id: "general", label: "General" },
  { id: "onboarding", label: "Onboarding" },
  { id: "component-suggester", label: "Components" },
  { id: "brand-consistency", label: "Brand" },
  { id: "usage-coach", label: "Usage" },
  { id: "seo-copilot", label: "SEO" }
];

const extractErrorMessage = (data: unknown, fallback: string): string => {
  if (!data || typeof data !== "object") {
    return fallback;
  }

  const possibleMessage = "message" in data ? data.message : undefined;
  if (typeof possibleMessage === "string" && possibleMessage.trim()) {
    return possibleMessage;
  }

  const possibleError = "error" in data ? data.error : undefined;
  if (typeof possibleError === "string" && possibleError.trim()) {
    return possibleError;
  }

  if (possibleError && typeof possibleError === "object") {
    return JSON.stringify(possibleError, null, 2);
  }

  return fallback;
};

const createMessage = (role: ChatRole, content: string, visualizations?: ChatVisualization[]): ChatMessage => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  role,
  content,
  visualizations
});

const formatValue = (value: number, unit?: string): string => {
  if (unit === "%") {
    return `${Math.round(value)}%`;
  }

  const formatted = new Intl.NumberFormat("en-US", {
    notation: Math.abs(value) >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1
  }).format(value);

  return unit ? `${formatted}${unit}` : formatted;
};

const normalizeVisualizations = (data: unknown): ChatVisualization[] => {
  if (!data || typeof data !== "object" || !("visualizations" in data) || !Array.isArray(data.visualizations)) {
    return [];
  }

  return data.visualizations
    .map((visualization): ChatVisualization | null => {
      if (!visualization || typeof visualization !== "object") {
        return null;
      }

      const title = "title" in visualization && typeof visualization.title === "string" ? visualization.title.trim() : "";
      const type = "type" in visualization && typeof visualization.type === "string" ? visualization.type : "bar";
      const insight = "insight" in visualization && typeof visualization.insight === "string" ? visualization.insight.trim() : "";
      const unit = "unit" in visualization && typeof visualization.unit === "string" ? visualization.unit.trim() : undefined;
      const rawItems = "items" in visualization && Array.isArray(visualization.items) ? visualization.items : [];

      if (!["kpi", "bar", "progress", "timeline"].includes(type)) {
        return null;
      }

      const items = rawItems
        .map((item: unknown): VisualizationItem | null => {
          if (!item || typeof item !== "object") {
            return null;
          }

          const label = "label" in item && typeof item.label === "string" ? item.label.trim() : "";
          const value = "value" in item ? Number(item.value) : Number.NaN;

          if (!label || !Number.isFinite(value)) {
            return null;
          }

          return { label, value };
        })
        .filter((item: VisualizationItem | null): item is VisualizationItem => Boolean(item))
        .slice(0, 6);

      if (!title || !insight || items.length === 0) {
        return null;
      }

      return {
        title,
        type: type as VisualizationType,
        insight,
        unit,
        items
      };
    })
    .filter((visualization): visualization is ChatVisualization => Boolean(visualization))
    .slice(0, 3);
};

const VisualizationCard = ({ visualization }: { visualization: ChatVisualization }) => {
  const maxValue = Math.max(...visualization.items.map((item) => Math.abs(item.value)), 1);

  if (visualization.type === "kpi") {
    const primary = visualization.items[0];

    return (
      <section className="chat-viz-card">
        <p className="chat-viz-title">{visualization.title}</p>
        <p className="chat-viz-insight">{visualization.insight}</p>
        <p className="chat-viz-kpi-value">{formatValue(primary.value, visualization.unit)}</p>
        <p className="chat-viz-kpi-label">{primary.label}</p>
      </section>
    );
  }

  return (
    <section className="chat-viz-card">
      <p className="chat-viz-title">{visualization.title}</p>
      <p className="chat-viz-insight">{visualization.insight}</p>
      <div className="chat-viz-rows">
        {visualization.items.map((item, index) => {
          const widthPercent = Math.max((Math.abs(item.value) / maxValue) * 100, 8);

          return (
            <div key={`${item.label}-${index}`} className="chat-viz-row">
              <div className="chat-viz-row-meta">
                <span>{item.label}</span>
                <strong>{formatValue(item.value, visualization.unit)}</strong>
              </div>
              <div className="chat-viz-track">
                <div className="chat-viz-fill" style={{ width: `${widthPercent}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default function AiModulesConsole() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleOption["id"]>("general");
  const [prompt, setPrompt] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage("assistant", "How can I help with your site today?")
  ]);
  const [error, setError] = useState("");
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const widgetClassName = isExpanded ? "chat-widget chat-widget--expanded" : "chat-widget";

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const sendPrompt = async () => {
    const text = prompt.trim();
    if (!text || isSending) {
      return;
    }

    setError("");
    setPrompt("");
    setMessages((previous) => [...previous, createMessage("user", text)]);
    setIsSending(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/ai/chat/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          module: activeModule,
          message: text
        })
      });

      const rawResponse = await response.text();
      const data = rawResponse ? (JSON.parse(rawResponse) as unknown) : null;

      if (!response.ok) {
        throw new Error(extractErrorMessage(data, `Request failed with status ${response.status}`));
      }

      const reply =
        data && typeof data === "object" && "reply" in data && typeof data.reply === "string"
          ? data.reply
          : "No response was returned.";

      const visualizations = normalizeVisualizations(data);
      setMessages((previous) => [...previous, createMessage("assistant", reply, visualizations)]);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Failed to send prompt.";
      setError(message);
    } finally {
      setIsSending(false);
    }
  };

  const onPromptKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendPrompt();
    }
  };

  return (
    <main className="chat-page">
      {!isOpen ? (
        <button
          type="button"
          className="chat-launcher"
          onClick={() => setIsOpen(true)}
          aria-label="Open SitePilot chat"
        >
          Copilot
        </button>
      ) : null}

      {isOpen ? (
        <section className={widgetClassName} role="dialog" aria-label="SitePilot chat assistant">
          <header className="chat-header">
            <div>
              <p className="chat-kicker">SitePilot</p>
              <h1>Copilot</h1>
            </div>
            <div className="chat-header-actions">
              <button
                type="button"
                className="chat-header-btn"
                onClick={() => setIsExpanded((previous) => !previous)}
                aria-label={isExpanded ? "Collapse chat" : "Expand chat"}
              >
                {isExpanded ? "Collapse" : "Expand"}
              </button>
              <button
                type="button"
                className="chat-header-btn"
                onClick={() => {
                  setIsOpen(false);
                  setIsExpanded(false);
                }}
                aria-label="Close chat"
              >
                Close
              </button>
            </div>
          </header>

          <div className="chat-controls">
            <label htmlFor="module" className="sr-only">
              AI module
            </label>
            <select id="module" value={activeModule} onChange={(event) => setActiveModule(event.target.value as ModuleOption["id"])}>
              {moduleOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="chat-messages">
            {messages.map((message) => (
              <article
                key={message.id}
                className={message.role === "assistant" ? "chat-bubble chat-bubble--assistant" : "chat-bubble chat-bubble--user"}
              >
                <div className="chat-text">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{message.content}</ReactMarkdown>
                </div>
                {message.role === "assistant" && message.visualizations && message.visualizations.length > 0 ? (
                  <div className="chat-viz-grid">
                    {message.visualizations.map((visualization, index) => (
                      <VisualizationCard key={`${visualization.title}-${index}`} visualization={visualization} />
                    ))}
                  </div>
                ) : null}
              </article>
            ))}

            {isSending ? <div className="chat-bubble chat-bubble--assistant chat-bubble--typing">Thinking...</div> : null}
            <div ref={messageEndRef} />
          </div>

          {error ? <p className="chat-error">{error}</p> : null}

          <footer className="chat-input-row">
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={onPromptKeyDown}
              placeholder="Ask SitePilot Copilot"
              rows={2}
            />
            <button type="button" onClick={() => void sendPrompt()} disabled={isSending || !prompt.trim()}>
              Send
            </button>
          </footer>
        </section>
      ) : null}
    </main>
  );
}
