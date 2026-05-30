"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  Quote,
} from "lucide-react";

function ToolbarBtn({
  on,
  active,
  label,
  children,
}: {
  on: () => void;
  active?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={on}
      aria-label={label}
      aria-pressed={active}
      className={`grid h-8 w-8 place-items-center rounded-md transition ${
        active ? "bg-primary/15 text-primary" : "text-ink-soft hover:bg-cream hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

/** Lightweight rich-text editor for module bodies. Emits HTML via onChange. */
export function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    immediatelyRender: false, // required under Next SSR to avoid hydration mismatch
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[140px] px-3 py-2.5 focus:outline-none text-ink",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) {
    return (
      <div className="rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink-soft">
        Loading editor…
      </div>
    );
  }

  const Btn = ToolbarBtn;

  return (
    <div className="overflow-hidden rounded-xl border border-ink/15 bg-white">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-ink/10 bg-cream/40 px-1.5 py-1">
        <Btn on={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} label="Bold">
          <Bold size={15} />
        </Btn>
        <Btn on={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} label="Italic">
          <Italic size={15} />
        </Btn>
        <span className="mx-1 h-5 w-px bg-ink/10" />
        <Btn
          on={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          label="Heading"
        >
          <Heading2 size={15} />
        </Btn>
        <Btn
          on={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          label="Subheading"
        >
          <Heading3 size={15} />
        </Btn>
        <span className="mx-1 h-5 w-px bg-ink/10" />
        <Btn on={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} label="Bullet list">
          <List size={15} />
        </Btn>
        <Btn on={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} label="Numbered list">
          <ListOrdered size={15} />
        </Btn>
        <Btn on={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} label="Quote">
          <Quote size={15} />
        </Btn>
        <Btn
          on={() => {
            const prev = editor.getAttributes("link").href as string | undefined;
            const url = window.prompt("Link URL", prev ?? "https://");
            if (url === null) return;
            if (url === "") {
              editor.chain().focus().extendMarkRange("link").unsetLink().run();
            } else {
              editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
            }
          }}
          active={editor.isActive("link")}
          label="Link"
        >
          <LinkIcon size={15} />
        </Btn>
      </div>
      <EditorContent editor={editor} placeholder={placeholder} />
    </div>
  );
}
