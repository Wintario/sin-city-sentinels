import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Smile, Bold, Italic, Quote } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface CommentEditorProps {
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  replyingTo?: { id: number; author: string };
  initialValue?: string;
  isEditing?: boolean;
  disabled?: boolean;
}

const getPlainText = (html: string): string => {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return (tmp.textContent || '').replace(/\u00a0/g, ' ').trim();
};

const stripBidiControls = (value: string): string =>
  value.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '');

const CommentEditor = ({
  onSubmit,
  onCancel,
  replyingTo,
  initialValue = '',
  isEditing = false,
  disabled = false,
}: CommentEditorProps) => {
  const [content, setContent] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setContent(initialValue);
    if (editorRef.current && editorRef.current.innerHTML !== initialValue) {
      editorRef.current.innerHTML = initialValue;
    }
  }, [initialValue]);

  useLayoutEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const raf = requestAnimationFrame(() => {
      if (document.activeElement === editor) return;

      editor.focus({ preventScroll: true });

      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);

      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    });

    return () => cancelAnimationFrame(raf);
  }, [isEditing, replyingTo?.id]);

  const maxLength = 2000;
  const plainText = getPlainText(content);
  const remainingChars = maxLength - plainText.length;

  const syncContentFromEditor = () => {
    const html = editorRef.current?.innerHTML ?? '';
    const normalized = stripBidiControls(
      html.replace(/\sdir=(["']).*?\1/gi, '')
    );
    if (editorRef.current && normalized !== html) {
      editorRef.current.innerHTML = normalized;
    }
    setContent(normalized);
  };

  const handleBold = () => {
    editorRef.current?.focus();
    document.execCommand('bold');
    syncContentFromEditor();
  };

  const handleItalic = () => {
    editorRef.current?.focus();
    document.execCommand('italic');
    syncContentFromEditor();
  };

  const handleQuote = () => {
    editorRef.current?.focus();

    if (replyingTo) {
      document.execCommand(
        'insertHTML',
        false,
        `<blockquote><strong>${replyingTo.author} пишет:</strong><br /></blockquote><p><br /></p>`
      );
    } else {
      document.execCommand('insertHTML', false, '<blockquote><br /></blockquote><p><br /></p>');
    }

    syncContentFromEditor();
  };

  const handleEmojiSelect = (emoji: any) => {
    editorRef.current?.focus();
    document.execCommand('insertText', false, emoji.native);
    syncContentFromEditor();
    setShowEmojiPicker(false);
  };

  const keepEditorFocus = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!plainText) {
      toast.error('Введите текст комментария');
      return;
    }

    if (plainText.length > maxLength) {
      toast.error(`Комментарий слишком длинный (макс. ${maxLength} символов)`);
      return;
    }

    const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
    const emojis = plainText.match(emojiRegex);
    if (emojis && emojis.length > 10) {
      toast.error('Слишком много смайлов (макс. 10)');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(content);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = disabled || isSubmitting;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {isEditing
            ? 'Редактирование комментария'
            : replyingTo
            ? `Ответ: ${replyingTo.author}`
            : 'Комментарий'}
        </Label>

        <div
          ref={editorRef}
          dir="ltr"
          contentEditable={!isDisabled}
          suppressContentEditableWarning
          onFocus={() => editorRef.current?.setAttribute('dir', 'ltr')}
          onInput={syncContentFromEditor}
          className="min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-sans whitespace-pre-wrap break-words text-left"
          style={{ direction: 'ltr', unicodeBidi: 'normal', textAlign: 'left' }}
        />
        {!plainText && (
          <p className="text-xs text-muted-foreground">
            {replyingTo
              ? `Напишите ответ ${replyingTo.author}...`
              : 'Напишите комментарий...'}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleBold}
              onMouseDown={keepEditorFocus}
              title="Жирный текст"
              disabled={isDisabled}
              className="h-8 w-8 p-0"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleItalic}
              onMouseDown={keepEditorFocus}
              title="Курсив"
              disabled={isDisabled}
              className="h-8 w-8 p-0"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleQuote}
              onMouseDown={keepEditorFocus}
              title="Цитата"
              disabled={isDisabled}
              className="h-8 w-8 p-0"
            >
              <Quote className="h-4 w-4" />
            </Button>
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onMouseDown={keepEditorFocus}
                  title="Смайлы"
                  disabled={isDisabled}
                  className="h-8 w-8 p-0"
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Picker
                  data={data}
                  onEmojiSelect={handleEmojiSelect}
                  theme="light"
                  locale="ru"
                />
              </PopoverContent>
            </Popover>
          </div>

          <span
            className={`text-xs ${
              remainingChars < 100
                ? 'text-destructive'
                : 'text-muted-foreground'
            }`}
          >
            {remainingChars} символов осталось
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={isDisabled || !plainText}
          size="sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? 'Сохранение...' : 'Отправка'}
            </>
          ) : (
            isEditing ? 'Сохранить' : replyingTo ? 'Ответить' : 'Опубликовать'
          )}
        </Button>

        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isDisabled}
            size="sm"
          >
            Отмена
          </Button>
        )}
      </div>
    </form>
  );
};

export default CommentEditor;
