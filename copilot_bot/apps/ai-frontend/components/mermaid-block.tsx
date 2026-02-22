"use client";

import { useEffect, useRef, useState } from "react";

let mermaidInitialized = false;

async function initMermaid() {
    if (mermaidInitialized) return;
    const mermaid = (await import("mermaid")).default;
    mermaid.initialize({
        startOnLoad: false,
        theme: "dark",
        themeVariables: {
            primaryColor: "#1e3a5f",
            primaryTextColor: "#edf2ff",
            primaryBorderColor: "#38bdf8",
            lineColor: "#38bdf8",
            secondaryColor: "#152035",
            tertiaryColor: "#0b1424",
            fontFamily: "IBM Plex Sans, Segoe UI, sans-serif",
            fontSize: "14px",
            nodeBorder: "#38bdf8",
            clusterBkg: "#101622",
            clusterBorder: "#253047",
            edgeLabelBackground: "#101622",
        },
    });
    mermaidInitialized = true;
}

export default function MermaidBlock({ code }: { code: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = useState<string>("");
    const [error, setError] = useState<string>("");

    useEffect(() => {
        let cancelled = false;
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        (async () => {
            try {
                await initMermaid();
                const mermaid = (await import("mermaid")).default;
                const { svg: rendered } = await mermaid.render(id, code);
                if (!cancelled) {
                    setSvg(rendered);
                    setError("");
                }
            } catch {
                if (!cancelled) {
                    setError("Could not render diagram");
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [code]);

    if (error) {
        return <pre className="chat-mermaid-error">{code}</pre>;
    }

    if (!svg) {
        return <div className="chat-mermaid-loading">Rendering diagram…</div>;
    }

    return (
        <div
            ref={containerRef}
            className="chat-mermaid"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
}
