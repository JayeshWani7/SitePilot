export const CANVAS_BASE_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; font-family: 'Inter', 'Segoe UI', sans-serif; color: #1a1a2e; line-height: 1.6; }
  img { max-width: 100%; height: auto; display: block; }
  a { color: inherit; text-decoration: none; }

  /* Utility classes available in canvas */
  .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
  .flex { display: flex; }
  .flex-center { display: flex; align-items: center; justify-content: center; }
  .grid { display: grid; }
  .text-center { text-align: center; }

  /* Selection highlight injected by builder */
  [data-sp-selected] {
    outline: 2px solid #6366f1 !important;
    outline-offset: 1px;
  }
  [data-sp-hovered] {
    outline: 1px dashed #a5b4fc !important;
    outline-offset: 1px;
  }
  [data-sp-drop-target] {
    background: rgba(99,102,241,0.08) !important;
  }
`;
