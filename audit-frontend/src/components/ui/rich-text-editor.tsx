import { useCallback, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import {
  Bold,
  Italic,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  List,
  ListOrdered,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  maxHeight?: number | string;
  maxWidth?: number | string;
  editable?: boolean;
  showDisabledToolbar?: boolean;
}

export function RichTextEditor({
  content = "",
  onChange,
  onBlur,
  placeholder = "Start typing...",
  className,
  autoFocus = true,
  maxWidth = "100%",
  editable = true,
  showDisabledToolbar = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-400 underline cursor-pointer break-all hover:text-blue-500",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      BulletList,
      OrderedList,
      ListItem,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    onBlur: () => {
      onBlur?.();
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none focus:outline-none min-h-30 p-3 overflow-y-auto flex-1 [&_*]:break-all [&_*]:whitespace-pre-wrap [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5",
        style: "word-break: break-word; overflow-wrap: anywhere; width: 100%;",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = content || "";
    if (current !== next) {
      editor.commands.setContent(next);
    }
  }, [editor, content]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editable);
  }, [editor, editable]);

  const applyList = useCallback(
    (type: "bullet" | "ordered") => {
      if (!editor) return;

      // If opposite list is active, switch to the requested one
      if (type === "bullet" && editor.isActive("orderedList")) {
        editor.chain().focus().toggleOrderedList().toggleBulletList().run();
        return;
      }
      if (type === "ordered" && editor.isActive("bulletList")) {
        editor.chain().focus().toggleBulletList().toggleOrderedList().run();
        return;
      }

      // Toggle requested list: if paragraphs -> list; if same list -> back to paragraphs
      if (type === "bullet") {
        editor.chain().focus().toggleBulletList().run();
      } else {
        editor.chain().focus().toggleOrderedList().run();
      }
    },
    [editor]
  );

  useEffect(() => {
    if (editor && autoFocus && !editor.isFocused) {
      setTimeout(() => {
        editor.commands.focus();
      }, 100);
    }
  }, [editor, autoFocus]);

  if (!editor) {
    return null;
  }

  return (
    <div
      className={cn(
        "border border-border rounded-md bg-background flex flex-col resize-y overflow-hidden",
        className
      )}
      style={{
        maxWidth: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth,
        width: "100%",
      }}
    >
      {(editable || showDisabledToolbar) && (
        <div className={cn("flex items-center gap-1 p-2 border-b border-border bg-muted/20", !editable && "opacity-50")}>
          <Button
            type="button"
            disabled={!editable}
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive("bold") && editable && "bg-muted text-foreground"
            )}
          >
            <Bold className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            disabled={!editable}
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive("italic") && editable && "bg-muted text-foreground"
            )}
          >
            <Italic className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            disabled={!editable}
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive("strike") && editable && "bg-muted text-foreground"
            )}
          >
            <Strikethrough className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          <Button
            type="button"
            disabled={!editable}
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive({ textAlign: "left" }) && editable &&
                "bg-muted text-foreground"
            )}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            disabled={!editable}
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive({ textAlign: "center" }) && editable &&
                "bg-muted text-foreground"
            )}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          <Button
            type="button"
            disabled={!editable}
            variant="ghost"
            size="sm"
            onClick={() => applyList("bullet")}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive("bulletList") && editable && "bg-muted text-foreground"
            )}
          >
            <List className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            disabled={!editable}
            variant="ghost"
            size="sm"
            onClick={() => applyList("ordered")}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive("orderedList") && editable && "bg-muted text-foreground"
            )}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div
        className="h-full min-h-30 relative overflow-y-auto overflow-x-hidden w-full"
      >
        <EditorContent editor={editor} className="focus-within:outline-none w-full" />
        {!editor.getText() && (
          <div className="absolute top-3 left-3 text-muted-foreground pointer-events-none text-sm">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
}
