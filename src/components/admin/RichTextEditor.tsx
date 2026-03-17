import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Underline from '@tiptap/extension-underline';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import CharacterCount from '@tiptap/extension-character-count';
import FontFamily from '@tiptap/extension-font-family';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Toolbar } from './RichTextEditorToolbar';
import { useImageResize } from './useImageResize';
import LineHeight from './extensions/LineHeight';
import './RichTextEditor.css';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
  maxLength?: number;
  placeholder?: string;
}

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/bmp': 'bmp',
  'image/svg+xml': 'svg',
};

const extractFirstDataImageUri = (html: string): string | null => {
  if (!html) return null;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const img = doc.querySelector('img[src^="data:image/"]');
  return img?.getAttribute('src')?.trim() || null;
};

const dataUriToFile = (dataUri: string): File => {
  const source = (dataUri || '').trim();
  const match = source.match(/^data:(image\/[a-zA-Z0-9.+-]+)(;base64)?,(.*)$/i);
  if (!match) {
    throw new Error('Некорректный формат data:image');
  }

  const mimeType = (match[1] || 'image/png').toLowerCase();
  const isBase64 = Boolean(match[2]);
  const payload = match[3] || '';

  let byteString: string;
  if (isBase64) {
    byteString = atob(payload);
  } else {
    byteString = decodeURIComponent(payload);
  }

  const bytes = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i += 1) {
    bytes[i] = byteString.charCodeAt(i);
  }

  const ext = MIME_TO_EXT[mimeType] || 'png';
  const filename = `clipboard-image-${Date.now()}.${ext}`;
  return new File([bytes], filename, { type: mimeType });
};

const RichTextEditor = ({
  content,
  onChange,
  onImageUpload,
  maxLength = 50000,
}: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextStyle,
      Color.configure({
        types: ['textStyle'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'image'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      FontFamily.configure({
        types: ['textStyle'],
      }),
      LineHeight.configure({
        types: ['paragraph', 'heading'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline hover:text-primary/80',
        },
      }),
      Image.configure({
        inline: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg cursor-pointer',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'min-w-full border-collapse',
        },
      }),
      TableRow,
      TableCell,
      TableHeader,
      CharacterCount.configure({
        limit: maxLength,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      handlePaste: (_view, event) => {
        if (!onImageUpload) return false;

        const clipboard = event.clipboardData;
        if (!clipboard) return false;

        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find((item) => item.type.startsWith('image'));
        const html = clipboard.getData('text/html');

        const fileFromClipboard = imageItem?.getAsFile() || null;
        const dataImageUri = !fileFromClipboard ? extractFirstDataImageUri(html) : null;

        if (!fileFromClipboard && !dataImageUri) {
          return false;
        }

        event.preventDefault();

        let fileToUpload: File;
        try {
          fileToUpload = fileFromClipboard || dataUriToFile(dataImageUri!);
        } catch (err) {
          console.error('Failed to parse image from clipboard:', err);
          toast.error('Не удалось распознать изображение из буфера обмена');
          return true;
        }

        onImageUpload(fileToUpload)
          .then((url) => {
            editor?.chain().focus().setImage({ src: url }).run();
          })
          .catch((err) => {
            console.error('Failed to upload image from clipboard:', err);
            toast.error(err instanceof Error ? err.message : 'Не удалось загрузить изображение из буфера обмена');
          });

        return true;
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  useImageResize({ editor });

  useEffect(() => {
    const handleEmojiInsert = (event: CustomEvent<{ emoji: string }>) => {
      if (editor) {
        editor.chain().focus().insertContent(event.detail.emoji).run();
      }
    };

    window.addEventListener('insert-emoji' as any, handleEmojiInsert as any);
    return () => {
      window.removeEventListener('insert-emoji' as any, handleEmojiInsert as any);
    };
  }, [editor]);

  if (!editor) {
    return null;
  }

  const characterCount = editor.storage.characterCount;
  const currentLength = characterCount.characters();

  return (
    <div className="rich-text-editor">
      <Toolbar editor={editor} onImageUpload={onImageUpload} />

      <div className="editor-content-wrapper">
        <EditorContent editor={editor} className="editor-content" />

        <div className="character-count">
          <span className={currentLength > maxLength * 0.9 ? 'text-red-500' : 'text-muted-foreground'}>
            {currentLength} / {maxLength} символов
          </span>
        </div>
      </div>
    </div>
  );
};

export default RichTextEditor;
