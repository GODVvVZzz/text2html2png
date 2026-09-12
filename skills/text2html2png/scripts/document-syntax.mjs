// HTML and CSS are parsed with their own grammars. Text nodes, comments and
// quoted CSS strings must never be mistaken for attributes or declarations.
import { parse as parseHtml } from "parse5";
import { generate, ident, parse, walk } from "css-tree";

export { generate as cssText, walk as walkCss };
export const cssIdentifier = (name) => ident.decode(name);

export function htmlDocument(source) {
  // Match the renderer, which disables page JavaScript before navigation.
  return parseHtml(source, { scriptingEnabled: false });
}

export function* htmlNodes(root) {
  const pending = [root];
  while (pending.length) {
    const node = pending.pop();
    yield node;
    // Template contents have a separate document fragment in the HTML5 tree.
    if (node.content) pending.push(node.content);
    for (const child of [...(node.childNodes ?? [])].reverse()) pending.push(child);
  }
}

export function htmlAttribute(element, name) {
  return element.attrs?.find((attribute) => attribute.name.toLowerCase() === name)?.value;
}

export function styleText(element) {
  return (element.childNodes ?? []).filter((node) => node.nodeName === "#text").map((node) => node.value).join("");
}

// Text for font subsetting: includes labels calculated by chart renderers and
// decodes character references, while excluding non-rendered source blocks.
export function markupText(source) {
  const text = [];
  const pending = [htmlDocument(source)];
  while (pending.length) {
    const node = pending.pop();
    if (["head", "script", "style", "template"].includes(node.tagName)) continue;
    if (node.nodeName === "#text") text.push(node.value);
    for (const child of [...(node.childNodes ?? [])].reverse()) pending.push(child);
  }
  return text.join("\n");
}

export function parseCss(source, context = "stylesheet") {
  const ast = parse(source, {
    context,
    parseCustomProperty: true,
    onParseError(error) { throw error; },
  });
  // Do not silently approve syntax that the parser had to leave unexamined.
  walk(ast, (node) => {
    if (node.type === "Raw") throw new Error("Unsupported CSS syntax.");
  });
  return ast;
}

export function cssResources(ast) {
  const resources = [];
  walk(ast, (node) => {
    if (node.type === "Url") resources.push(node.value);
    if (node.type === "Atrule" && cssIdentifier(node.name).toLowerCase() === "import") {
      const first = node.prelude?.children?.first;
      if (first?.type === "String") resources.push(first.value);
    }
    // image-set() accepts URL strings without url(). Escaped function names
    // are decoded too, e.g. u\72l("https://example.test/image.png").
    if (node.type === "Function" && ["url", "src", "image", "image-set", "-webkit-image-set"].includes(cssIdentifier(node.name).toLowerCase())) {
      for (const child of node.children) if (child.type === "String") resources.push(child.value);
    }
  });
  return resources;
}

export function pureThemeReference(value) {
  const children = value.children?.toArray() ?? [];
  if (children.length !== 1 || children[0].type !== "Function" || cssIdentifier(children[0].name).toLowerCase() !== "var") return false;
  const args = children[0].children.toArray();
  return args.length === 1 && args[0].type === "Identifier" && /^--t-[a-z0-9-]+$/.test(cssIdentifier(args[0].name));
}

export function literalCssColors(ast) {
  const colors = [];
  walk(ast, {
    visit: "Declaration",
    enter(declaration) {
      walk(declaration.value, (node) => {
        if (node.type === "Hash" || (node.type === "Function" && ["rgb", "rgba", "hsl", "hsla", "hwb", "lab", "lch", "oklab", "oklch", "color"].includes(cssIdentifier(node.name).toLowerCase()))) {
          colors.push(generate(node));
        }
      });
    },
  });
  return [...new Set(colors)];
}
