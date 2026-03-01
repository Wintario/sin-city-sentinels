import { useEditor, EditorContent, mergeAttributes } from '@tiptap/react';
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
import FontSize from 'tiptap-extension-font-size';
import { useEffect, useState } from 'react';
import { Toolbar } from './RichTextEditorToolbar';
import { useImageResize } from './useImageResize';
import { Button } from '@/components/ui/button';
import { Monitor, Tablet, Smartphone } from 'lucide-react';
import './RichTextEditor.css';

type CardWidth = 'wide' | 'narrow' | 'square';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
  maxLength?: number;
  placeholder?: string;
}

const RichTextEditor = ({
  content,
  onChange,
  onImageUpload,
  maxLength = 50000,
  placeholder = 'Введите текст новости...'
}: RichTextEditorProps) => {
  const [cardWidth, setCardWidth] = useState<CardWidth>('wide');
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Underline,
      TextStyle,
      Color.configure({
        types: ['textStyle'],
        defaultColor: '#000000'
      }),
      Highlight.configure({
        multicolor: true
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'image'],
        alignments: ['left', 'center', 'right', 'justify']
      }),
      FontFamily.configure({
        types: ['textStyle'],
        defaultFontFamily: 'Arial'
      }),
      FontSize.configure({
        types: ['textStyle'],
        defaultFontSize: '14px'
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline hover:text-primary/80'
        }
      }),
      Image.configure({
        inline: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg cursor-pointer'
        },
        renderHTML({ HTMLAttributes }) {
          // Если есть width, добавляем его как inline style
          if (HTMLAttributes.width) {
            const existingStyle = HTMLAttributes.style || '';
            HTMLAttributes.style = `width: ${HTMLAttributes.width}px; ${existingStyle}`;
          }
          return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
        }
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'min-w-full border-collapse'
        }
      }),
      TableRow,
      TableCell,
      TableHeader,
      CharacterCount.configure({
        limit: maxLength
      })
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      handlePaste: (view, event, slice) => {
        // Обработка вставки изображений из буфера
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find(item => item.type.startsWith('image'));
        
        if (imageItem && onImageUpload) {
          event.preventDefault();
          const file = imageItem.getAsFile();
          if (file) {
            onImageUpload(file).then(url => {
              editor.chain().focus().setImage({ src: url }).run();
            }).catch(err => {
              console.error('Failed to upload image from clipboard:', err);
            });
          }
          return true;
        }
        return false;
      }
    }
  });

  // Обновление контента при изменении извне
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Хук для изменения размера изображений мышкой
  useImageResize({ editor });

  // Обработка вставки эмодзи
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

      {/* Переключатель форматов карточки - ЗАКОММЕНТИРОВАНО ВРЕМЕННО
      <div className="flex items-center justify-center gap-2 py-2 border-b border-border bg-muted/30">
        <span className="text-xs text-muted-foreground">Формат:</span>
        <Button
          type="button"
          variant={cardWidth === 'wide' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setCardWidth('wide')}
          className="h-7 px-2"
          title="Широкая карточка (100%)"
        >
          <Monitor className="h-3 w-3 mr-1" />
          <span className="text-xs">Широкая</span>
        </Button>
        <Button
          type="button"
          variant={cardWidth === 'narrow' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setCardWidth('narrow')}
          className="h-7 px-2"
          title="Узкая карточка (600px)"
        >
          <Tablet className="h-3 w-3 mr-1" />
          <span className="text-xs">Узкая</span>
        </Button>
      </div>
      --> */}

      <div className="editor-content-wrapper">
        <EditorContent 
          editor={editor} 
          className="editor-content"
        />

        {/* Счётчик символов */}
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
