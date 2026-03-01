import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
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
  Shrink,
  Expand,
  Smile,
  Palette,
  Maximize,
  User
} from 'lucide-react';

interface ToolbarProps {
  editor: Editor;
  onImageUpload?: (file: File) => Promise<string>;
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

export const Toolbar = ({ editor, onImageUpload }: ToolbarProps) => {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [characterImageUrl, setCharacterImageUrl] = useState('');
  const [showCharacterImage, setShowCharacterImage] = useState(false);

  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setLinkOpen(false);
    }
  };

  const addImageByUrl = () => {
    if (imageUrl) {
      // Вставляем изображение после курсора, а не заменяем выделение
      editor.chain().focus().insertContent({
        type: 'image',
        attrs: { src: imageUrl }
      }).run();
      setImageUrl('');
      setImageDialogOpen(false);
    }
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
          // Вставляем изображение после курсора, а не заменяем выделение
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

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const addHorizontalRule = () => {
    editor.chain().focus().setHorizontalRule().run();
  };

  const clearFormatting = () => {
    editor.chain().focus().unsetAllMarks().run();
  };

  const insertCharacterImage = async () => {
    if (!characterImageUrl.trim()) {
      console.error('Character URL is empty');
      return;
    }

    try {
      console.log('Fetching character image from:', characterImageUrl);

      // Первый запрос
      let html = await fetchHtml(characterImageUrl);
      
      // Проверяем на JavaScript редирект
      const redirectMatch = html.match(/location\.href\s*=\s*["']([^"']+)["']/i);
      if (redirectMatch && redirectMatch[1]) {
        let redirectUrl = redirectMatch[1];
        console.log('Found JavaScript redirect to:', redirectUrl);
        
        // Если URL относительный - преобразуем в абсолютный
        if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
          redirectUrl = new URL(redirectUrl, characterImageUrl).href;
          console.log('Converted to absolute URL:', redirectUrl);
        }
        
        // Делаем второй запрос по URL редиректа
        html = await fetchHtml(redirectUrl);
      }

      // Парсим HTML для поиска образа
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      let imageUrl: string | null = null;

      // Способ 1: Ищем div с pers/N_XXXXX.gif в background
      const allDivs = doc.querySelectorAll('div');
      for (const div of allDivs) {
        const style = div.getAttribute('style') || '';
        
        // Ищем pers/номер.gif в background
        const match = style.match(/background(?:-image)?\s*:\s*url\(['"]?([^'")\s]+pers\/\d+_\d+\.gif)['"]?\)/i);
        if (match && match[1]) {
          imageUrl = match[1];
          console.log('Found character image URL (method 1):', imageUrl);
          break;
        }
      }

      // Способ 2: Если не нашли, ищем img с pers/N_XXXXX.gif
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

      // Способ 3: Ищем любой img с .gif в pers/
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

      if (imageUrl) {
        console.log('Inserting image:', imageUrl);
        // Вставляем изображение
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

  // Функция для загрузки HTML через backend proxy
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
      {/* История */}
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

      {/* Выпадающий список: Шрифт */}
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

      {/* Выпадающий список: Размер шрифта */}
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
              editor.chain().focus().setFontSize('10px').run();
            }}
          >
            10px
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              editor.chain().focus().setFontSize('12px').run();
            }}
          >
            12px
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              editor.chain().focus().setFontSize('14px').run();
            }}
          >
            14px
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              editor.chain().focus().setFontSize('16px').run();
            }}
          >
            16px
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              editor.chain().focus().setFontSize('18px').run();
            }}
          >
            18px
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              editor.chain().focus().setFontSize('20px').run();
            }}
          >
            20px
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              editor.chain().focus().setFontSize('').run();
            }}
          >
            Сбросить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Выпадающий список: Междустрочный интервал */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-auto px-2"
            title="Междустрочный интервал"
          >
            <span className="text-xs leading-none">A≋A</span>
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

      <div className="w-px h-6 bg-border mx-1" />

      {/* Форматирование текста */}
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
        content="Подчёркнутый (Ctrl+U)"
        variant={editor.isActive('underline') ? 'default' : 'ghost'}
      >
        <Underline className="h-4 w-4" />
      </TooltipButton>
      <TooltipButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        content="Зачёркнутый"
        variant={editor.isActive('strike') ? 'default' : 'ghost'}
      >
        <Strikethrough className="h-4 w-4" />
      </TooltipButton>

      {/* Эмодзи */}
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
                <span className="text-xl">😄</span>
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

      {/* Импорт персонажа */}
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <ImportCharacter
            onImport={(data, iconUrl, characterUrl) => {
              // Формируем HTML для вставки одним блоком
              let html = '<span style="display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;">';
              
              // Если есть клан - добавляем иконку клана
              if (data.clanIcon) {
                html += `<img src="${data.clanIcon}" alt="${data.clanName || 'Clan'}" style="width: 16px; height: 16px; display: inline;" /> `;
              }
              
              // Добавляем никнейм
              html += `<strong style="color: navy; font-family: Arial, Verdana;">${data.nickname}</strong> `;
              
              // Добавляем уровень
              html += `<strong>${data.level}</strong> `;
              
              // Вставляем иконку инфо как ссылку
              html += `<a href="${characterUrl}" target="_blank" rel="noopener noreferrer"><img src="${iconUrl}" alt="info" style="width: 16px; height: 16px; display: inline;" /></a>`;
              html += '</span>';
              
              // Вставляем всё одним вызовом
              editor.chain().focus().insertContent(html).run();
            }}
          />
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">Импортировать персонажа</p>
        </TooltipContent>
      </Tooltip>

      {/* Цвет текста */}
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
                <span className="text-lg font-bold text-black">A</span>
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
              <Button
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

      {/* Цвет фона (highlight) */}
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
                <span className="text-lg font-bold text-black">A</span>
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
              <Button
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

      {/* Выравнивание */}
      <TooltipButton
        onClick={() => {
          // Для изображений — оборачиваем в параграф с text-align
          if (editor.isActive('image')) {
            const { state } = editor;
            const { selection } = state;
            const node = selection.$anchor.node();
            const currentWidth = node.type.name === 'image' ? node.attrs.width : null;
            const currentSrc = node.type.name === 'image' ? node.attrs.src : null;
            
            if (currentSrc) {
              // Заменяем изображение на параграф с изображением внутри
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

      {/* Списки */}
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

      {/* Вставка */}
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
            <Button onClick={addLink} size="sm">OK</Button>
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
                <Button onClick={addImageByUrl} size="sm">OK</Button>
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
                <Button onClick={insertCharacterImage} size="sm">OK</Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Введите URL страницы персонажа для извлечения изображения
              </p>
            </div>
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

      {/* Очистка форматирования */}
      <TooltipButton
        onClick={clearFormatting}
        content="Очистить форматирование"
      >
        <Trash2 className="h-4 w-4" />
      </TooltipButton>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Размер изображений - выпадающий список */}
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
