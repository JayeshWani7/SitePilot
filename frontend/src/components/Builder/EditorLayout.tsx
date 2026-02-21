"use client";

import { useState } from "react";
import BuilderToolbar from "./Toolbar";
import BuilderSidebar from "./Sidebar";
import BuilderCanvas from "./Canvas";
import BuilderStylePanel from "./StylePanel";
import VersionPanel from "./VersionPanel";

export default function BuilderEditorLayout() {
    const [showVersions, setShowVersions] = useState(false);

    return (
        <div className="builder-shell">
            <BuilderToolbar onOpenVersions={() => setShowVersions(true)} />
            <div className="builder-body">
                <BuilderSidebar />
                <BuilderCanvas />
                <BuilderStylePanel />
            </div>
            {showVersions && <VersionPanel onClose={() => setShowVersions(false)} />}
        </div>
    );
}
