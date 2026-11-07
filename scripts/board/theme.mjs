// Palettes and SVG helpers for the lane board. Two themes because the README
// serves one image per colour scheme through <picture>.

export const THEMES = {
  dark: {
    card: "#161b22", line: "#30363d", text: "#e6edf3", muted: "#8b949e",
    amber: "#f0a500", green: "#3fb950", blue: "#58a6ff", purple: "#bc8cff", pink: "#f778ba", red: "#f85149",
  },
  light: {
    card: "#f6f8fa", line: "#d0d7de", text: "#1f2328", muted: "#59636e",
    amber: "#9a6700", green: "#1a7f37", blue: "#0969da", purple: "#8250df", pink: "#bf3989", red: "#cf222e",
  },
};

// System fonts only: GitHub's image proxy serves SVGs with `default-src 'none'`,
// so a web font referenced from inside the SVG would never load.
const FONT = "ui-sans-serif,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

// Text that came from data/board.json is escaped before it reaches markup.
export const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function svg(w, h, body, css = "", label = "") {
  const aria = label ? ` role="img" aria-label="${esc(label)}"` : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"${aria}>` +
    `<style>text{font-family:${FONT}} .m{font-family:${MONO}} ${css}</style>${body}</svg>\n`
  );
}

export const frame = (w, h, p, r = 12) =>
  `<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="${r}" fill="${p.card}" stroke="${p.line}"/>`;
