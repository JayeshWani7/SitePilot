import type { ElementNode, StyleMap } from "@/lib/builder/types";
import { CANVAS_BASE_CSS } from "./defaultStyles";

function styleToString(styles: StyleMap): string {
    return Object.entries(styles)
        .map(([k, v]) => {
            // camelCase → kebab-case
            const prop = k.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`);
            return `${prop}: ${v}`;
        })
        .join("; ");
}

function attrsToString(attrs: Record<string, string> = {}): string {
    return Object.entries(attrs)
        .map(([k, v]) => `${k}="${v}"`)
        .join(" ");
}

function renderNode(node: ElementNode): string {
    const styleStr = styleToString(node.styles);
    const attrStr = attrsToString(node.attrs);
    const style = styleStr ? ` style="${styleStr}"` : "";
    const attrs = attrStr ? ` ${attrStr}` : "";

    // Self-closing tags
    if (["img", "hr", "br", "input"].includes(node.tag)) {
        return `<${node.tag}${style}${attrs} />`;
    }

    // iframe
    if (node.tag === "iframe") {
        return `<${node.tag}${style}${attrs}></${node.tag}>`;
    }

    const inner =
        node.children.length > 0
            ? node.children.map(renderNode).join("\n")
            : (node.content ?? "");

    return `<${node.tag}${style}${attrs}>${inner}</${node.tag}>`;
}

export function exportToHtml(elements: ElementNode[], pageTitle = "My Page"): string {
    const body = elements.map(renderNode).join("\n");
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${pageTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
  <style>
${CANVAS_BASE_CSS}
  </style>
</head>
<body>
${body}
</body>
</html>`;
}

export function serializeForCanvas(elements: ElementNode[]): string {
    return elements.map(renderNode).join("\n");
}
