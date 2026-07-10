// Escapes a value for safe interpolation into hand-built HTML templates
// (used by the print/PDF routes, which are not rendered through React's
// auto-escaping and so must escape user-controlled fields themselves).
export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
