import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { apiCall, uploadVideoForNews } from '@/lib/api';
import {
  buildExternalVideoMarker,
  buildUploadedVideoMarker,
  parseExternalVideoUrl
} from './videoUtils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState, forwardRef } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import EmojiPicker from './EmojiPicker';
import ImportCharacter from './ImportCharacter';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link,
  Image,
  Table,
  Undo,
  Redo,
  Minus,
  Type,
  Trash2,
  Upload,
  Video,
  Shrink,
  Expand,
  Smile,
  Palette,
  Paintbrush,
  Maximize,
  User
} from 'lucide-react';

interface ToolbarProps {
  editor: Editor;
  onImageUpload?: (file: File) => Promise<string>;
}

interface CopiedFormat {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  color: string | null;
  highlight: string | null;
  fontFamily: string | null;
  fontSize: string | null;
  lineHeight: string | null;
}

interface TooltipButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  content: string;
  variant?: 'ghost' | 'default' | 'outline' | 'destructive';
  className?: string;
}

const TooltipButton = forwardRef<HTMLButtonElement, TooltipButtonProps>(({
  onClick,
  disabled,
  children,
  content,
  variant = 'ghost',
  className = ''
}, ref) => (
  <Tooltip delayDuration={300}>
    <TooltipTrigger asChild>
      <Button
        type="button"
        variant={variant}
        size="sm"
        onClick={onClick}
        disabled={disabled}
        className={`h-8 w-8 p-0 ${className}`}
        ref={ref}
      >
        {children}
      </Button>
    </TooltipTrigger>
    <TooltipContent side="bottom">
      <p className="text-xs">{content}</p>
    </TooltipContent>
  </Tooltip>
));

TooltipButton.displayName = 'TooltipButton';

const generateVideoThumbnailFromFile = (file: File): Promise<string | null> =>
  new Promise((resolve) => {
    const blobUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.src = blobUrl;

    const cleanup = () => {
      URL.revokeObjectURL(blobUrl);
      video.removeAttribute('src');
      video.load();
    };

    const capture = () => {
      try {
        const canvas = document.createElement('canvas');
        const maxWidth = 640;
        const sourceWidth = video.videoWidth || maxWidth;
        const sourceHeight = video.videoHeight || 360;
        const width = Math.min(maxWidth, sourceWidth);
        const height = Math.max(1, Math.round((sourceHeight / sourceWidth) * width));
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          resolve(null);
          return;
        }
        ctx.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        cleanup();
        resolve(dataUrl);
      } catch {
        cleanup();
        resolve(null);
      }
    };

    video.addEventListener('loadeddata', () => {
      if (video.duration > 2) {
        video.currentTime = 2;
      } else {
        capture();
      }
    });
    video.addEventListener('seeked', capture);
    video.addEventListener('error', () => {
      cleanup();
      resolve(null);
    });
  });

const dataUrlToFile = (dataUrl: string, filename: string): File | null => {
  const parts = dataUrl.split(',');
  if (parts.length !== 2) return null;

  const meta = parts[0].match(/data:(.*?);base64/);
  if (!meta) return null;

  try {
    const mime = meta[1] || 'image/jpeg';
    const binary = atob(parts[1]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new File([bytes], filename, { type: mime });
  } catch {
    return null;
  }
};

export const Toolbar = ({ editor, onImageUpload }: ToolbarProps) => {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoStatus, setVideoStatus] = useState('');
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [characterImageUrl, setCharacterImageUrl] = useState('');
  const [showCharacterImage, setShowCharacterImage] = useState(false);
  const [copiedFormat, setCopiedFormat] = useState<CopiedFormat | null>(null);

  const ensureLocalImageUrl = async (sourceUrl: string): Promise<string> => {
    if (!sourceUrl || sourceUrl.startsWith('/api/uploads/') || sourceUrl.startsWith('/uploads/')) {
      return sourceUrl;
    }

    const result = await apiCall<{
      success: boolean;
      file?: { url?: string };
      url?: string;
    }>('/upload/external-image', {
      method: 'POST',
      body: JSON.stringify({ url: sourceUrl }),
    });

    const localUrl = result?.file?.url || result?.url;
    if (!localUrl) {
      throw new Error('Upload external image failed: empty URL');
    }

    return localUrl;
  };

  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setLinkOpen(false);
    }
  };

  const addImageByUrl = () => {
    if (imageUrl) {
      // Insert image after cursor instead of replacing current selection.
      editor.chain().focus().insertContent({
        type: 'image',
        attrs: { src: imageUrl }
      }).run();
      setImageUrl('');
      setImageDialogOpen(false);
    }
  };

  const addVideoByUrl = () => {
    const parsed = parseExternalVideoUrl(videoUrl);

    if (!parsed) {
      toast.error('Поддерживаются только YouTube, VK Video и Rutube');
      return;
    }

    editor.chain().focus().insertContent({
      type: 'image',
      attrs: {
        src: parsed.thumbnailUrl,
        alt: buildExternalVideoMarker(parsed),
      }
    }).run();
    setVideoUrl('');
    setVideoDialogOpen(false);
    setVideoStatus('Video inserted into editor');
    toast.success('Видео вставлено в редактор');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) {
      setIsUploading(true);
      try {
        console.log('Toolbar: uploading file:', file.name);
        const url = await onImageUpload(file);
        console.log('Toolbar: got URL:', url);
        if (url) {
          // Insert image after cursor instead of replacing current selection.
          editor.chain().focus().insertContent({
            type: 'image',
            attrs: { src: url }
          }).run();
        }
        setImageDialogOpen(false);
      } catch (error) {
        console.error('Failed to upload image:', error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsVideoUploading(true);
    setVideoStatus('Uploading video...');
    const localThumbnailPromise = generateVideoThumbnailFromFile(file);
    const processingTimer = setTimeout(() => {
      setVideoStatus('Processing video...');
    }, 500);

    try {
      const result = await uploadVideoForNews(file);
      clearTimeout(processingTimer);
      let thumbnailSrc = result.thumbnailUrl;

      if (thumbnailSrc === '/video-placeholder.svg') {
        const localThumbnail = await localThumbnailPromise;
        if (localThumbnail) {
          const thumbFile = dataUrlToFile(localThumbnail, `video-thumb-${Date.now()}.jpg`);
          if (thumbFile && onImageUpload) {
            try {
              thumbnailSrc = await onImageUpload(thumbFile);
            } catch {
              thumbnailSrc = localThumbnail;
            }
          } else {
            thumbnailSrc = localThumbnail;
          }
        }
      }

      editor.chain().focus().insertContent({
        type: 'image',
        attrs: {
          // Prefer uploaded thumbnail URL, fallback to local data URL only if needed.
          src: thumbnailSrc,
          alt: buildUploadedVideoMarker(result.videoUrl),
        }
      }).run();

      setVideoStatus('Video inserted into editor');
      setVideoDialogOpen(false);
      toast.success('Видео вставлено в редактор');
    } catch (error) {
      clearTimeout(processingTimer);
      const message = error instanceof Error ? error.message : 'Ошибка загрузки видео';
      setVideoStatus('');
      toast.error(message);
    } finally {
      setIsVideoUploading(false);
      e.target.value = '';
    }
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const applyFontSize = (size: string) => {
    if (size) {
      editor.chain().focus().setMark('textStyle', { fontSize: size }).run();
      return;
    }

    editor.chain().focus().setMark('textStyle', { fontSize: null }).run();
  };

  const addHorizontalRule = () => {
    editor.chain().focus().setHorizontalRule().run();
  };

  const clearFormatting = () => {
    editor.chain().focus().unsetAllMarks().run();
  };

  const copyCurrentFormat = () => {
    const textStyle = editor.getAttributes('textStyle') as {
      color?: string;
      fontFamily?: string;
      fontSize?: string;
    };
    const highlight = editor.getAttributes('highlight') as { color?: string };
    const paragraph = editor.getAttributes('paragraph') as { lineHeight?: string };
    const heading = editor.getAttributes('heading') as { lineHeight?: string };

    setCopiedFormat({
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      underline: editor.isActive('underline'),
      strike: editor.isActive('strike'),
      color: textStyle?.color || null,
      highlight: highlight?.color || null,
      fontFamily: textStyle?.fontFamily || null,
      fontSize: textStyle?.fontSize || null,
      lineHeight: paragraph?.lineHeight || heading?.lineHeight || null,
    });
    toast.success('Формат скопирован');
  };

  const applyCopiedFormat = () => {
    if (!copiedFormat) {
      copyCurrentFormat();
      return;
    }

    let chain = editor.chain().focus();

    chain = copiedFormat.bold ? chain.setBold() : chain.unsetBold();
    chain = copiedFormat.italic ? chain.setItalic() : chain.unsetItalic();
    chain = copiedFormat.underline ? chain.setUnderline() : chain.unsetUnderline();
    chain = copiedFormat.strike ? chain.setStrike() : chain.unsetStrike();

    chain = copiedFormat.color ? chain.setColor(copiedFormat.color) : chain.unsetColor();
    chain = copiedFormat.highlight
      ? chain.setHighlight({ color: copiedFormat.highlight })
      : chain.unsetHighlight();

    if (copiedFormat.fontFamily) {
      chain = chain.setFontFamily(copiedFormat.fontFamily);
    } else {
      chain = chain.setFontFamily('');
    }

    chain = copiedFormat.fontSize
      ? chain.setMark('textStyle', { fontSize: copiedFormat.fontSize })
      : chain.setMark('textStyle', { fontSize: null });

    chain = chain.setLineHeight(copiedFormat.lineHeight || '');
    chain.run();
    toast.success('Формат применён');
  };

  const insertCharacterImage = async () => {
    if (!characterImageUrl.trim()) {
      console.error('Character URL is empty');
      return;
    }

    try {
      console.log('Fetching character image from:', characterImageUrl);
      let finalPageUrl = characterImageUrl;

      // First request
      let html = await fetchHtml(characterImageUrl);
      
      // Handle JavaScript redirect if present
      const redirectMatch = html.match(/location\.href\s*=\s*["']([^"']+)["']/i);
      if (redirectMatch && redirectMatch[1]) {
        let redirectUrl = redirectMatch[1];
        console.log('Found JavaScript redirect to:', redirectUrl);
        
        // Convert relative redirect URL to absolute.
        if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
          redirectUrl = new URL(redirectUrl, characterImageUrl).href;
          console.log('Converted to absolute URL:', redirectUrl);
        }
        
        // Fetch redirected page.
        html = await fetchHtml(redirectUrl);
        finalPageUrl = redirectUrl;
      }

      // Parse HTML to locate character portrait.
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      let imageUrl: string | null = null;
      const isPortraitContainer = (style: string) => {
        const normalized = (style || '').toLowerCase().replace(/\s+/g, ' ');
        const hasSize = normalized.includes('width: 210px') && normalized.includes('height: 190px');
        const hasPosition = normalized.includes('left: 20px') && normalized.includes('top: 20px');
        return hasSize && hasPosition;
      };

      // Method 1: portrait div with unique image pers/N_XXXXX.gif in background.
      const allDivs = doc.querySelectorAll('div');
      for (const div of allDivs) {
        const style = div.getAttribute('style') || '';
        if (!isPortraitContainer(style)) {
          continue;
        }
        
        // Match unique portrait URL in background.
        const match = style.match(/background(?:-image)?\s*:\s*url\(['"]?([^'")\s]+pers\/\d+_\d+\.gif)['"]?\)/i);
        if (match && match[1]) {
          imageUrl = match[1];
          console.log('Found character image URL (method 1):', imageUrl);
          break;
        }
      }

      // Method 2: fallback to img with pers/N_XXXXX.gif.
      if (!imageUrl) {
        const imgs = doc.querySelectorAll('img');
        for (const img of imgs) {
          const src = img.getAttribute('src') || '';
          if (src.includes('pers/') && src.match(/\/pers\/\d+_\d+\.gif$/i)) {
            imageUrl = src;
            console.log('Found character image URL (method 2):', imageUrl);
            break;
          }
        }
      }

      // Method 3: any resources.apeha.ru/pers/*.gif image.
      if (!imageUrl) {
        const imgs = doc.querySelectorAll('img');
        for (const img of imgs) {
          const src = img.getAttribute('src') || '';
          if (src.includes('resources.apeha.ru/pers/') && src.endsWith('.gif')) {
            imageUrl = src;
            console.log('Found character image URL (method 3):', imageUrl);
            break;
          }
        }
      }

      // Method 4: default race portrait in portrait block, e.g. img/Hm.gif.
      if (!imageUrl) {
        const allDivs = doc.querySelectorAll('div');
        for (const div of allDivs) {
          const style = div.getAttribute('style') || '';
          if (!isPortraitContainer(style)) {
            continue;
          }
          const match = style.match(/background(?:-image)?\s*:[^;]*url\(['"]?([^'")\s]*img\/[A-Za-z]{2}\.gif)['"]?\)/i);
          if (match && match[1]) {
            imageUrl = match[1];
            console.log('Found character image URL (method 4):', imageUrl);
            break;
          }
        }
      }

      if (imageUrl) {
        // Convert relative path (e.g. img/Hm.gif) to absolute URL.
        if (!/^https?:\/\//i.test(imageUrl) && !/^data:/i.test(imageUrl) && !/^blob:/i.test(imageUrl)) {
          imageUrl = new URL(imageUrl, finalPageUrl).href;
        }
        try {
          imageUrl = await ensureLocalImageUrl(imageUrl);
        } catch (e) {
          console.warn('Failed to localize character image, using source URL:', e);
        }
        console.log('Inserting image:', imageUrl);
        // Insert image into editor.
        editor.chain().focus().setImage({ src: imageUrl }).run();
        setShowCharacterImage(false);
        setCharacterImageUrl('');
        setImageDialogOpen(false);
      } else {
        console.error('Character image not found in HTML');
        console.log('Available images:', Array.from(doc.querySelectorAll('img')).map(img => img.getAttribute('src')).filter(Boolean));
        toast.error('Не удалось найти изображение персонажа');
      }
    } catch (error: any) {
      console.error('Error fetching character image:', error);
      toast.error('Ошибка: ' + (error.message || 'не удалось загрузить изображение'));
    }
  };

  // Fetch HTML via backend proxy.
  const fetchHtml = async (fetchUrl: string): Promise<string> => {
    const response = await fetch('/api/proxy/fetch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: fetchUrl }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Не удалось загрузить страницу');
    }

    const result = await response.json();
    return result.html;
  };

  return (
    <div className="editor-toolbar border border-border rounded-t-lg bg-muted/30 p-2 flex flex-wrap gap-1">
      {/* History */}
      <TooltipButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        content="Отменить (Ctrl+Z)"
      >
        <Undo className="h-4 w-4" />
      </TooltipButton>
      <TooltipButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        content="Повторить (Ctrl+Y)"
      >
        <Redo className="h-4 w-4" />
      </TooltipButton>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Dropdown: Font family */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-auto px-2"
            title="Шрифт"
          >
            <Type className="h-3 w-4 mr-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => {
              editor.chain().focus().setFontFamily('Arial').run();
            }}
          >
            Arial
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              editor.chain().focus().setFontFamily('Verdana').run();
            }}
          >
            Verdana
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              editor.chain().focus().setFontFamily('Times New Roman').run();
            }}
          >
            Times New Roman
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              editor.chain().focus().setFontFamily('Georgia').run();
            }}
          >
            Georgia
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              editor.chain().focus().setFontFamily('Courier New').run();
            }}
          >
            Courier New
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              editor.chain().focus().setFontFamily('').run();
            }}
          >
            Сбросить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dropdown: Font size */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-auto px-2"
            title="Размер шрифта"
          >
            <span className="text-xs">Aa</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => {
              applyFontSize('10px');
            }}
          >
            10px
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              applyFontSize('12px');
            }}
          >
            12px
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              applyFontSize('14px');
            }}
          >
            14px
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              applyFontSize('16px');
            }}
          >
            16px
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              applyFontSize('18px');
            }}
          >
            18px
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              applyFontSize('20px');
            }}
          >
            20px
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              applyFontSize('');
            }}
          >
            Сбросить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dropdown: Line height */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-auto px-2"
            title="Межстрочный интервал"
          >
            <span className="text-xs leading-none">A↕A</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => {
              editor.chain().focus().setLineHeight('0.8').run();
            }}
          >
            0.8 (Минимальный)
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              editor.chain().focus().setLineHeight('1').run();
            }}
          >
            1.0 (Одинарный)
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              editor.chain().focus().setLineHeight('1.15').run();
            }}
          >
            1.15 (Стандартный)
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              editor.chain().focus().setLineHeight('1.5').run();
            }}
          >
            1.5 (Полуторный)
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              editor.chain().focus().setLineHeight('2').run();
            }}
          >
            2.0 (Двойной)
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              editor.chain().focus().setLineHeight('').run();
            }}
          >
            Сбросить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TooltipButton
        onClick={applyCopiedFormat}
        content={copiedFormat ? 'Применить скопированный формат' : 'Скопировать формат'}
        variant={copiedFormat ? 'default' : 'ghost'}
      >
        <Paintbrush className="h-4 w-4" />
      </TooltipButton>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Text formatting */}
      <TooltipButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        content="Жирный (Ctrl+B)"
        variant={editor.isActive('bold') ? 'default' : 'ghost'}
      >
        <Bold className="h-4 w-4" />
      </TooltipButton>
      <TooltipButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        content="Курсив (Ctrl+I)"
        variant={editor.isActive('italic') ? 'default' : 'ghost'}
      >
        <Italic className="h-4 w-4" />
      </TooltipButton>
      <TooltipButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        content="Подчеркнутый (Ctrl+U)"
        variant={editor.isActive('underline') ? 'default' : 'ghost'}
      >
        <Underline className="h-4 w-4" />
      </TooltipButton>
      <TooltipButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        content="Зачеркнутый"
        variant={editor.isActive('strike') ? 'default' : 'ghost'}
      >
        <Strikethrough className="h-4 w-4" />
      </TooltipButton>

      {/* Emoji */}
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="Вставить эмодзи"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Picker
                data={data}
                onEmojiSelect={(emoji: any) => {
                  editor.chain().focus().insertContent(emoji.native).run();
                }}
                theme="system"
                locale="ru"
                previewPosition="none"
                perLine={8}
                maxFrequentRows={2}
              />
            </PopoverContent>
          </Popover>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">Вставить эмодзи</p>
        </TooltipContent>
      </Tooltip>

      {/* Character import */}
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <ImportCharacter
            onImport={async (data, iconUrl, characterUrl) => {
              // Build a single inline block for insertion.
              let html = '<span style="display: inline; white-space: nowrap; line-height: inherit; vertical-align: baseline;">';
              
              // Add clan icon if available.
              if (data.clanIcon) {
                let clanIconSrc = data.clanIcon;
                try {
                  clanIconSrc = new URL(clanIconSrc, characterUrl).href;
                } catch {
                  // keep source as-is
                }
                try {
                  clanIconSrc = await ensureLocalImageUrl(clanIconSrc);
                } catch (e) {
                  console.warn('Failed to localize clan icon, using source URL:', e);
                }
                const clanTitle = data.clanName || 'Клан';
                html += `<img src="${clanIconSrc}" alt="Логотип ${clanTitle}" title="${clanTitle}" style="width: 1em; height: 1em; display: inline; vertical-align: -0.12em; margin-right: 0.2em;" />`;
              }

              // Add race code with original styling from character page.
              if (data.raceCode) {
                html += `<span title="${data.raceTitle || data.raceCode}" style="${data.raceStyle || 'font-weight: bold;'} font-family: Arial, Verdana; line-height: inherit; vertical-align: baseline;">${data.raceCode}</span> `;
              }
              
              // Add nickname.
              html += `<strong style="color: navy; font-family: Arial, Verdana; line-height: inherit; vertical-align: baseline;">${data.nickname}</strong> `;
              
              // Add level.
              html += `<strong style="line-height: inherit; vertical-align: baseline;">${data.level}</strong> `;
              
              // Add info icon link.
              html += `<a href="${characterUrl}" target="_blank" rel="noopener noreferrer" style="line-height: inherit; vertical-align: baseline; margin-left: 0.2em;"><img src="${iconUrl}" alt="info" style="width: 1em; height: 1em; display: inline; vertical-align: -0.12em;" /></a>`;
              html += '</span>';
              
              // Insert all content in one operation.
              editor.chain().focus().insertContent(html).run();
            }}
          />
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">Импортировать персонажа</p>
        </TooltipContent>
      </Tooltip>

      {/* Text color */}
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 relative"
                title="Цвет текста"
              >
                <span className="text-lg font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">A</span>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-green-500 to-blue-500" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" side="bottom" align="start">
              <div className="grid grid-cols-5 gap-1">
                {['#000000', '#434343', '#666666', '#999999', '#cccccc',
                  '#efefef', '#f3f3f3', '#ffffff', '#cc0000', '#ff0000',
                  '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#0000ff',
                  '#9900ff', '#ff00ff', '#ffcccc', '#ffe6cc', '#ffffcc',
                  '#ccffcc', '#ccffff', '#ccccff', '#ffccff', '#ffffff'
                ].map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      console.log('Setting text color:', color);
                      editor.chain().focus().setColor(color).run();
                    }}
                    className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <Button type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log('Unsetting text color');
                  editor.chain().focus().unsetColor().run();
                }}
                className="w-full mt-2 text-xs"
              >
                Сбросить цвет
              </Button>
            </PopoverContent>
          </Popover>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">Цвет текста</p>
        </TooltipContent>
      </Tooltip>

      {/* Highlight color */}
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 relative"
                title="Цвет фона (заливка)"
              >
                <span className="text-lg font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">A</span>
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-300 via-pink-300 to-cyan-300" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" side="bottom" align="start">
              <div className="grid grid-cols-5 gap-1">
                {['#ffffff', '#ffcccc', '#ffe6cc', '#ffffcc', '#ccffcc',
                  '#ccffff', '#ccccff', '#ffccff', '#efefef', '#cc0000',
                  '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#0000ff',
                  '#9900ff', '#ff00ff', '#666666', '#434343', '#000000',
                  '#f3f3f3', '#999999', '#cccccc', '#ffcccc', '#ffe6cc'
                ].map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      console.log('Setting highlight color:', color);
                      editor.chain().focus().setHighlight({ color }).run();
                    }}
                    className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <Button type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log('Unsetting highlight');
                  editor.chain().focus().unsetHighlight().run();
                }}
                className="w-full mt-2 text-xs"
              >
                Сбросить фон
              </Button>
            </PopoverContent>
          </Popover>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">Цвет фона</p>
        </TooltipContent>
      </Tooltip>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Alignment */}
      <TooltipButton
        onClick={() => {
          // For images, wrap content in a paragraph with explicit text-align.
          if (editor.isActive('image')) {
            const { state } = editor;
            const { selection } = state;
            const node = selection.$anchor.node();
            const currentWidth = node.type.name === 'image' ? node.attrs.width : null;
            const currentSrc = node.type.name === 'image' ? node.attrs.src : null;
            
            if (currentSrc) {
              // Reinsert image wrapped by aligned paragraph.
              editor.chain().focus()
                .insertContent(`<p style="text-align: left;"><img src="${currentSrc}" ${currentWidth ? `width="${currentWidth}"` : ''} /></p>`)
                .run();
              return;
            }
          }
          editor.chain().focus().setTextAlign('left').run();
        }}
        content="По левому краю"
        variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
      >
        <AlignLeft className="h-4 w-4" />
      </TooltipButton>
      <TooltipButton
        onClick={() => {
          if (editor.isActive('image')) {
            const { state } = editor;
            const { selection } = state;
            const node = selection.$anchor.node();
            const currentWidth = node.type.name === 'image' ? node.attrs.width : null;
            const currentSrc = node.type.name === 'image' ? node.attrs.src : null;
            
            if (currentSrc) {
              editor.chain().focus()
                .insertContent(`<p style="text-align: center;"><img src="${currentSrc}" ${currentWidth ? `width="${currentWidth}"` : ''} /></p>`)
                .run();
              return;
            }
          }
          editor.chain().focus().setTextAlign('center').run();
        }}
        content="По центру"
        variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
      >
        <AlignCenter className="h-4 w-4" />
      </TooltipButton>
      <TooltipButton
        onClick={() => {
          if (editor.isActive('image')) {
            const { state } = editor;
            const { selection } = state;
            const node = selection.$anchor.node();
            const currentWidth = node.type.name === 'image' ? node.attrs.width : null;
            const currentSrc = node.type.name === 'image' ? node.attrs.src : null;
            
            if (currentSrc) {
              editor.chain().focus()
                .insertContent(`<p style="text-align: right;"><img src="${currentSrc}" ${currentWidth ? `width="${currentWidth}"` : ''} /></p>`)
                .run();
              return;
            }
          }
          editor.chain().focus().setTextAlign('right').run();
        }}
        content="По правому краю"
        variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
      >
        <AlignRight className="h-4 w-4" />
      </TooltipButton>
      <TooltipButton
        onClick={() => {
          editor.chain().focus().setTextAlign('justify').run();
        }}
        content="По ширине"
        variant={editor.isActive({ textAlign: 'justify' }) ? 'default' : 'ghost'}
      >
        <AlignJustify className="h-4 w-4" />
      </TooltipButton>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Lists */}
      <TooltipButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        content="Маркированный список"
        variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
      >
        <List className="h-4 w-4" />
      </TooltipButton>
      <TooltipButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        content="Нумерованный список"
        variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
      >
        <ListOrdered className="h-4 w-4" />
      </TooltipButton>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Insert tools */}
      <Popover open={linkOpen} onOpenChange={setLinkOpen}>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant={editor.isActive('link') ? 'default' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0"
              >
                <Link className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">Вставить ссылку</p>
          </TooltipContent>
        </Tooltip>
        <PopoverContent className="w-80">
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addLink()}
            />
            <Button type="button" onClick={addLink} size="sm">OK</Button>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogTrigger asChild>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setImageDialogOpen(true)}
                className="h-8 w-8 p-0 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Image className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">Вставить изображение</p>
            </TooltipContent>
          </Tooltip>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Вставить изображение</DialogTitle>
            <DialogDescription>
              Загрузите изображение с компьютера или вставьте по URL
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Загрузить с компьютера
              </label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Или</span>
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Вставить по URL
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addImageByUrl()}
                />
                <Button type="button" onClick={addImageByUrl} size="sm">OK</Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Или</span>
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Вставить образ игрока
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://kovcheg2.apeha.ru/info.html?user=123456"
                  value={characterImageUrl}
                  onChange={(e) => setCharacterImageUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && insertCharacterImage()}
                />
                <Button type="button" onClick={insertCharacterImage} size="sm">OK</Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Введите URL страницы персонажа для извлечения изображения
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogTrigger asChild>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setVideoDialogOpen(true)}
                className="h-8 w-8 p-0 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Video className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">Вставить видео</p>
            </TooltipContent>
          </Tooltip>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Вставить видео</DialogTitle>
            <DialogDescription>
              Добавьте ссылку YouTube/VK/Rutube или загрузите файл (mp4, mov, webm, mkv до 100MB)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Insert video link
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addVideoByUrl()}
                />
                <Button type="button" onClick={addVideoByUrl} size="sm">OK</Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Или</span>
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Upload video file
              </label>
              <Input
                type="file"
                accept=".mp4,.mov,.webm,.mkv,video/mp4,video/quicktime,video/webm,video/x-matroska"
                onChange={handleVideoFileUpload}
                disabled={isVideoUploading}
              />
            </div>
            {videoStatus && (
              <p className="text-sm text-muted-foreground">{videoStatus}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <TooltipButton
        onClick={addTable}
        content="Вставить таблицу"
      >
        <Table className="h-4 w-4" />
      </TooltipButton>

      <TooltipButton
        onClick={addHorizontalRule}
        content="Горизонтальная линия"
      >
        <Minus className="h-4 w-4" />
      </TooltipButton>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Clear formatting */}
      <TooltipButton
        onClick={clearFormatting}
        content="Очистить форматирование"
      >
        <Trash2 className="h-4 w-4" />
      </TooltipButton>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Image size dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-auto px-2"
            title="Размер изображения"
          >
            <Maximize className="h-4 w-4 mr-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => {
              console.log('Setting image width to 100%');
              editor.chain().focus().updateAttributes('image', { width: '100%' }).run();
            }}
          >
            <Expand className="h-4 w-4 mr-2" />
            100% (оригинал)
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              console.log('Setting image width to 75%');
              editor.chain().focus().updateAttributes('image', { width: '75%' }).run();
            }}
          >
            75%
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              console.log('Setting image width to 50%');
              editor.chain().focus().updateAttributes('image', { width: '50%' }).run();
            }}
          >
            50%
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              console.log('Setting image width to 25%');
              editor.chain().focus().updateAttributes('image', { width: '25%' }).run();
            }}
          >
            25%
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              console.log('Resetting image width');
              editor.chain().focus().updateAttributes('image', { width: null }).run();
            }}
          >
            <Shrink className="h-4 w-4 mr-2" />
            Сбросить размер
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};


