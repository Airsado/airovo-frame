import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from "@codemirror/autocomplete";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import {
  bracketMatching,
  foldGutter,
  foldKeymap,
  indentOnInput,
  syntaxHighlighting,
} from "@codemirror/language";
import { search, searchKeymap } from "@codemirror/search";
import {
  Annotation,
  Compartment,
  EditorState,
  Transaction,
} from "@codemirror/state";
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  placeholder,
} from "@codemirror/view";
import { classHighlighter } from "@lezer/highlight";
import type {
  CodeEditorConfiguration,
  CodeEditorInstance,
  CodeEditorLanguage,
} from "./types";

function languageExtension(language: CodeEditorLanguage) {
  if (language === "json") return json();
  if (language === "text") return [];
  return javascript({ typescript: language === "typescript" });
}

// The engine is imported on mount, never from the framework's initial entry.
export function createCodeEditor(options: {
  parent: HTMLElement;
  value: string;
  configuration: CodeEditorConfiguration;
  onChange: (value: string) => void;
  onFocus: (event: FocusEvent) => void;
  onBlur: (event: FocusEvent) => void;
}): CodeEditorInstance {
  const externalValue = Annotation.define<boolean>();
  const language = new Compartment();
  const interaction = new Compartment();
  const attributes = new Compartment();
  const wrapping = new Compartment();
  const hint = new Compartment();
  const appearance = new Compartment();

  const interactionExtension = (configuration: CodeEditorConfiguration) => [
    EditorState.readOnly.of(configuration.readOnly || configuration.disabled),
    // Read-only code remains focusable and selectable. Disabled editors leave
    // the tab order and cannot accept contenteditable input.
    EditorView.editable.of(!configuration.disabled),
  ];
  const attributesExtension = (configuration: CodeEditorConfiguration) =>
    EditorView.contentAttributes.of({
      ...configuration.attributes,
      role: "textbox",
      "aria-multiline": "true",
      "aria-readonly": String(configuration.readOnly || configuration.disabled),
      "aria-disabled": String(configuration.disabled),
      tabindex: configuration.disabled ? "-1" : "0",
    });
  const configuration = options.configuration;
  const view = new EditorView({
    parent: options.parent,
    state: EditorState.create({
      doc: options.value,
      extensions: [
        lineNumbers(),
        foldGutter(),
        history(),
        drawSelection(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        search({ top: true }),
        keymap.of([
          indentWithTab,
          ...closeBracketsKeymap,
          ...completionKeymap,
          ...defaultKeymap,
          ...historyKeymap,
          ...searchKeymap,
          ...foldKeymap,
        ]),
        syntaxHighlighting(classHighlighter),
        language.of(languageExtension(configuration.language)),
        interaction.of(interactionExtension(configuration)),
        attributes.of(attributesExtension(configuration)),
        wrapping.of(configuration.lineWrapping ? EditorView.lineWrapping : []),
        hint.of(placeholder(configuration.placeholder)),
        appearance.of(EditorView.theme({}, { dark: configuration.dark })),
        EditorView.theme({
          "&": { height: "100%", backgroundColor: "transparent" },
          "&.cm-focused": { outline: "none" },
          ".cm-scroller": {
            overflow: "auto",
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "12px",
            lineHeight: "1.65",
          },
          ".cm-content": { padding: "12px 0", caretColor: "var(--foreground)" },
          ".cm-gutters": {
            backgroundColor: "transparent",
            color: "var(--muted-foreground)",
            borderColor: "var(--border)",
          },
          ".cm-line": { padding: "0 12px" },
          ".cm-activeLine, .cm-activeLineGutter": {
            backgroundColor:
              "color-mix(in srgb, var(--muted) 50%, transparent)",
          },
          ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
            backgroundColor:
              "color-mix(in srgb, var(--primary) 20%, transparent)",
          },
          ".cm-cursor": { borderLeftColor: "var(--foreground)" },
          ".cm-panels": {
            color: "var(--foreground)",
            backgroundColor: "var(--muted)",
            borderColor: "var(--border)",
          },
          ".cm-textfield, .cm-button": {
            color: "var(--foreground)",
            background: "var(--background)",
            border: "1px solid var(--border)",
            borderRadius: "4px",
          },
          ".cm-searchMatch": {
            backgroundColor:
              "color-mix(in srgb, var(--primary) 15%, transparent)",
          },
          ".cm-searchMatch.cm-searchMatch-selected": {
            backgroundColor:
              "color-mix(in srgb, var(--primary) 30%, transparent)",
          },
          ".cm-foldPlaceholder": {
            color: "var(--muted-foreground)",
            backgroundColor: "var(--muted)",
            borderColor: "var(--border)",
          },
          ".cm-tooltip": {
            color: "var(--foreground)",
            backgroundColor: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: "4px",
          },
          ".cm-tooltip-autocomplete > ul > li[aria-selected]": {
            color: "var(--accent-foreground)",
            backgroundColor: "var(--accent)",
          },
          ".cm-placeholder": { color: "var(--muted-foreground)" },
        }),
        EditorView.updateListener.of((update) => {
          if (
            update.docChanged &&
            !update.transactions.every((transaction) =>
              transaction.annotation(externalValue),
            )
          ) {
            options.onChange(update.state.doc.toString());
          }
        }),
        EditorView.domEventHandlers({
          focus: (event) => {
            options.onFocus(event);
            return false;
          },
          blur: (event) => {
            options.onBlur(event);
            return false;
          },
        }),
      ],
    }),
  });

  return {
    focus: () => {
      if (view.contentDOM.getAttribute("aria-disabled") !== "true")
        view.focus();
    },
    setValue: (value) => {
      const current = view.state.doc.toString();
      if (current === value) return;
      // Change only the differing span so selections in untouched text map to
      // the same positions. Parent synchronization never creates undo entries
      // or echoes an update:modelValue back to the parent.
      let from = 0;
      while (
        from < current.length &&
        from < value.length &&
        current[from] === value[from]
      )
        from++;
      let oldEnd = current.length;
      let newEnd = value.length;
      while (
        oldEnd > from &&
        newEnd > from &&
        current[oldEnd - 1] === value[newEnd - 1]
      ) {
        oldEnd--;
        newEnd--;
      }
      view.dispatch({
        changes: { from, to: oldEnd, insert: value.slice(from, newEnd) },
        annotations: [
          externalValue.of(true),
          Transaction.addToHistory.of(false),
        ],
      });
    },
    configure: (next) =>
      view.dispatch({
        effects: [
          language.reconfigure(languageExtension(next.language)),
          interaction.reconfigure(interactionExtension(next)),
          attributes.reconfigure(attributesExtension(next)),
          wrapping.reconfigure(
            next.lineWrapping ? EditorView.lineWrapping : [],
          ),
          hint.reconfigure(placeholder(next.placeholder)),
          appearance.reconfigure(EditorView.theme({}, { dark: next.dark })),
        ],
      }),
    destroy: () => view.destroy(),
  };
}
