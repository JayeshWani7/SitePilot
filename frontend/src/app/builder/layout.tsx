import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Website Builder | SitePilot",
    description: "Drag-and-drop visual website builder",
};

// Full-screen layout — no AppFrame sidebar/nav
export default function BuilderLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
