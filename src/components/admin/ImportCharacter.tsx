import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

// Используем локальный путь к файлу через бэкенд
const infoIcon = '/info.gif';

interface ImportCharacterProps {
  onImport: (data: CharacterData, iconUrl: string, characterUrl: string) => void;
}

interface CharacterData {
  nickname: string;
  level: number;
  clanIcon?: string;
  clanName?: string;
  clanUrl?: string;
}

const ICON_URL = infoIcon;

const ImportCharacter = ({ onImport }: ImportCharacterProps) => {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const parseCharacterData = (html: string): CharacterData | null => {
    console.log('Parsing HTML, length:', html.length);
    console.log('First 300 chars:', html.substring(0, 300));

    let nickname = '';
    let level = 0;
    let clanIcon: string | undefined;
    let clanName: string | undefined;
    let clanUrl: string | undefined;

    // Способ 1: Ищем title через regex
    // Формат: "! MissSweeneyTodd ! - Эльф [21] - Персональная информация"
    const titleMatch = html.match(/<title[^>]*>([^<]+?)\s*-\s*[^\[]+\s*\[(\d+)\]/i);
    console.log('Title match:', titleMatch);
    if (titleMatch) {
      nickname = titleMatch[1].trim();
      level = parseInt(titleMatch[2], 10);
      console.log('Extracted from title - Nickname:', nickname, 'Level:', level);
    }

    // Способ 2: Ищем verh_persa.png и данные рядом
    if (!nickname || !level) {
      const persContainerMatch = html.match(/verh_persa\.png[^>]*>[\s\S]{0,500}?(\d{1,3})[\s\S]{0,200}?<span[^>]*class=cnavy[^>]*>([^<]+)<\/span>/i);
      console.log('Pers container match:', persContainerMatch);
      if (persContainerMatch) {
        level = parseInt(persContainerMatch[1], 10);
        nickname = persContainerMatch[2].trim();
        console.log('Extracted from pers container - Nickname:', nickname, 'Level:', level);
      }
    }

    // Ищем информацию о клане через regex
    // Ищем паттерн: <td class="writer">Состоит в</td> или просто "Состоит"
    const clanMatch = html.match(/<td[^>]*class="writer"[^>]*>Состоит[^<]*<\/td>\s*<td[^>]*>([\s\S]{0,1000}?)<\/td>/i);
    console.log('Clan match:', clanMatch);
    if (clanMatch) {
      const clanCell = clanMatch[1];
      console.log('Clan cell HTML:', clanCell.substring(0, 200));
      
      // Извлекаем иконку клана
      const iconMatch = clanCell.match(/<img[^>]*src="([^"]+)"/i);
      if (iconMatch) {
        clanIcon = iconMatch[1];
        console.log('Clan icon:', clanIcon);
      }
      
      // Извлекаем название и URL клана
      const linkMatch = clanCell.match(/<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/i);
      if (linkMatch) {
        clanUrl = linkMatch[1];
        clanName = linkMatch[2].trim();
        console.log('Clan name:', clanName);
        console.log('Clan url:', clanUrl);
      }
    }

    console.log('Final result - nickname:', nickname, 'level:', level, 'clan:', clanName);
    if (!nickname || !level) {
      console.log('Character data not found');
      return null;
    }

    return { nickname, level, clanIcon, clanName, clanUrl };
  };

  const getComputedStyle = (doc: Document, containerDiv: Element): string => {
    // Пытаемся извлечь стили для форматирования
    const style = containerDiv.getAttribute('style') || '';
    
    // Извлекаем важные стили
    const fontFamily = style.match(/font-family:\s*([^;]+)/)?.[1] || 'Arial, sans-serif';
    const fontSize = style.match(/font-size:\s*([^;]+)/)?.[1] || '14px';
    const color = style.match(/color:\s*([^;]+)/)?.[1] || '#000000';
    
    return `font-family: ${fontFamily}; font-size: ${fontSize}; color: ${color};`;
  };

  const handleImport = async () => {
    if (!url.trim()) {
      toast.error('Введите URL персонажа');
      return;
    }

    // Валидация URL
    try {
      const parsedUrl = new URL(url);
      
      // Проверяем что домен содержит apeha.ru и URL содержит info
      if (!parsedUrl.hostname.includes('apeha.ru')) {
        toast.error('URL должен содержать домен apeha.ru');
        return;
      }
      
      if (!parsedUrl.pathname.includes('info')) {
        toast.error('URL должен содержать страницу персонажа (info)');
        return;
      }
    } catch {
      toast.error('Неверный формат URL');
      return;
    }

    setIsLoading(true);

    try {
      // Первый запрос
      let html = await fetchHtml(url);
      
      // Проверяем на JavaScript редирект
      const redirectMatch = html.match(/location\.href\s*=\s*["']([^"']+)["']/i);
      if (redirectMatch && redirectMatch[1]) {
        let redirectUrl = redirectMatch[1];
        console.log('Found JavaScript redirect to:', redirectUrl);
        
        // Если URL относительный - преобразуем в абсолютный
        if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
          redirectUrl = new URL(redirectUrl, url).href;
          console.log('Converted to absolute URL:', redirectUrl);
        }
        
        // Делаем второй запрос по URL редиректа
        html = await fetchHtml(redirectUrl);
      }

      // Парсим данные
      const charData = parseCharacterData(html);

      if (!charData) {
        toast.error('Не удалось найти данные персонажа. Проверьте ссылку.');
        setIsLoading(false);
        setOpen(false);
        return;
      }

      onImport(charData, ICON_URL, url);

      toast.success(`Персонаж импортирован: ${charData.nickname} ${charData.level}`);
      setOpen(false);
      setUrl('');
    } catch (error: any) {
      console.error('Import error:', error);
      if (error.name === 'AbortError') {
        toast.error('Сервер не ответил за 10 секунд. Попробуйте позже.');
      } else {
        toast.error('Ошибка: ' + (error.message || 'не удалось загрузить страницу'));
      }
    } finally {
      setIsLoading(false);
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
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => setOpen(true)}
        title="Импортировать персонажа"
      >
        <img src={infoIcon} alt="Import" className="w-4 h-4" />
      </Button>
    
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Импорт персонажа</DialogTitle>
            <DialogDescription>
              Введите ссылку на страницу персонажа для автоматического извлечения данных
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="character-url">URL персонажа</Label>
              <Input
                id="character-url"
                type="url"
                placeholder="https://kovcheg2.apeha.ru/info.html?user=123456"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleImport()}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Пример: https://kovcheg2.apeha.ru/info.html?user=123456
              </p>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Отмена
              </Button>
              <Button
                onClick={handleImport}
                disabled={isLoading || !url.trim()}
              >
                {isLoading ? 'Загрузка...' : 'Импортировать'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImportCharacter;
