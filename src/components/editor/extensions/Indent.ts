import { Extension } from "@tiptap/core";

const MAX_INDENT = 5;
const INDENT_SIZE = 2; // em per level

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

const INDENTABLE_TYPES = ["paragraph", "heading"];

export const Indent = Extension.create({
  name: "indent",

  addGlobalAttributes() {
    return [
      {
        types: INDENTABLE_TYPES,
        attributes: {
          indent: {
            default: 0,
            renderHTML: (attributes) => {
              if (!attributes.indent) return {};
              return {
                style: `padding-left: ${attributes.indent * INDENT_SIZE}em`,
              };
            },
            parseHTML: (element) => {
              const padding = element.style.paddingLeft;
              if (!padding) return 0;
              return Math.round(parseFloat(padding) / INDENT_SIZE);
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ state, commands }) => {
          const { $from } = state.selection;
          const node = $from.node();
          if (!INDENTABLE_TYPES.includes(node.type.name)) return false;
          // Let StarterKit handle Tab inside list items (creates nested lists)
          const parent = $from.node($from.depth - 1);
          if (parent && parent.type.name === "listItem") return false;
          const current = node.attrs.indent || 0;
          if (current >= MAX_INDENT) return true; // prevent default Tab, just do nothing
          return commands.updateAttributes(node.type.name, {
            indent: current + 1,
          });
        },
      outdent:
        () =>
        ({ state, commands }) => {
          const { $from } = state.selection;
          const node = $from.node();
          if (!INDENTABLE_TYPES.includes(node.type.name)) return false;
          // Let StarterKit handle Shift-Tab inside list items
          const parent = $from.node($from.depth - 1);
          if (parent && parent.type.name === "listItem") return false;
          const current = node.attrs.indent || 0;
          if (current <= 0) return false;
          return commands.updateAttributes(node.type.name, {
            indent: current - 1,
          });
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.indent(),
      "Shift-Tab": () => this.editor.commands.outdent(),
    };
  },
});
