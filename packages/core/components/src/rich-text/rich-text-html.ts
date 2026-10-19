/** URL policy for editor links/images. Persistence sanitization remains server-owned. */
export function isSafeRichTextURL(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const url = value.trim();
  if (!url || /[\u0000-\u0020\u007f]/.test(url) || url.includes("\\"))
    return false;
  if (url.startsWith("//")) return false;
  if (/^(?:https?:\/\/|mailto:|tel:)/i.test(url)) return true;
  return !/^[a-z][a-z\d+.-]*:/i.test(url);
}

/**
 * Unsupported markup stays editable as source, rather than silently losing
 * nodes/attributes when a headless editor serializes its smaller schema.
 */
export function inspectRichTextHTML(value: string): {
  html: string;
  sourceOnly: boolean;
} {
  const template = document.createElement("template");
  template.innerHTML = value;
  const supported = new Set([
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "del",
    "strike",
    "code",
    "pre",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "blockquote",
    "hr",
    "a",
    "img",
  ]);
  const inactive = new Set([
    "script",
    "style",
    "iframe",
    "object",
    "embed",
    "svg",
    "math",
    "form",
    "input",
    "button",
    "link",
    "meta",
    "base",
  ]);
  let sourceOnly = false;
  for (const element of template.content.querySelectorAll("*")) {
    const tag = element.tagName.toLowerCase();
    if (!supported.has(tag)) sourceOnly = true;
    if (inactive.has(tag)) {
      element.remove();
      continue;
    }
    const allowedAttributes =
      tag === "a"
        ? ["href", "title", "target", "rel"]
        : tag === "img"
          ? ["src", "alt", "title"]
          : tag === "ol"
            ? ["start"]
            : [];
    for (const attribute of [...element.attributes]) {
      if (!allowedAttributes.includes(attribute.name)) {
        sourceOnly = true;
        element.removeAttribute(attribute.name);
      }
    }
    for (const attribute of ["href", "src"]) {
      const url = element.getAttribute(attribute);
      if (url !== null && !isSafeRichTextURL(url)) {
        sourceOnly = true;
        element.removeAttribute(attribute);
      }
    }
    if (tag === "a")
      element.setAttribute("rel", "noopener noreferrer nofollow");
  }
  return { html: template.innerHTML, sourceOnly };
}
