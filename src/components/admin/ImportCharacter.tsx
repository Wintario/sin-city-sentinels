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
  raceCode?: string;
  raceClass?: string;
  raceTitle?: string;
  raceStyle?: string;
}

const ICON_URL = infoIcon;
const RACE_STYLES: Record<string, string> = {
  rOr: 'color: black; font-weight: bold;',
  rEl: 'color: green; font-weight: bold;',
  rGn: 'color: gray; font-weight: bold;',
  rHb: 'color: maroon; font-weight: bold;',
  rHm: 'color: #BC2EEA; font-weight: bold;',
  rDr: 'color: red; font-weight: bold;',
  rAr: 'color: #0066cc; font-weight: bold;',
  rAb: 'color: #0800B9; font-weight: bold;',
  rWm: 'color: black; font-weight: bold;',
};

const isApehaHost = (hostname: string) => hostname === 'apeha.ru' || hostname.endsWith('.apeha.ru');
const isCharacterPagePath = (pathname: string) => pathname.includes('info') || pathname.includes('pers');

const ImportCharacter = ({ onImport }: ImportCharacterProps) => {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const parseCharacterData = (html: string): CharacterData | null => {
    let nickname = '';
    let level = 0;
    let clanIcon: string | undefined;
    let clanName: string | undefined;
    let clanUrl: string | undefined;
    let raceCode: string | undefined;
    let raceClass: string | undefined;
    let raceTitle: string | undefined;
    let raceStyle: string | undefined;

    const titleMatch = html.match(/<title[^>]*>([^<]+?)\s*-\s*[^\[]+\s*\[(\d+)\]/i);
    if (titleMatch) {
      nickname = titleMatch[1].trim();
      level = parseInt(titleMatch[2], 10);
    }

    if (!nickname || !level) {
      const persContainerMatch = html.match(/verh_persa\.png[^>]*>[\s\S]{0,500}?(\d{1,3})[\s\S]{0,200}?<span[^>]*class=cnavy[^>]*>([^<]+)<\/span>/i);
      if (persContainerMatch) {
        level = parseInt(persContainerMatch[1], 10);
        nickname = persContainerMatch[2].trim();
      }
    }

    const raceMatch = html.match(
      /<span([^>]*)class\s*=\s*["']?(r(?:Or|El|Gn|Hb|Hm|Dr|Ar|Ab|Wm))["']?([^>]*)>\s*([A-Za-z]{2})\s*<\/span>/i
    );
    if (raceMatch) {
      const attrs = `${raceMatch[1]} ${raceMatch[3]}`;
      raceClass = raceMatch[2];
      raceCode = raceMatch[4].trim();
      raceTitle = attrs.match(/title\s*=\s*["']([^"']+)["']/i)?.[1]?.trim();
      raceStyle = RACE_STYLES[raceClass] || 'font-weight: bold;';
    }

    const clanRowRegex = /<td[^>]*class=["']writer["'][^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]{0,2000}?)<\/td>/gi;
    let clanRowMatch: RegExpExecArray | null = null;
    while ((clanRowMatch = clanRowRegex.exec(html)) !== null) {
      const rawLabel = clanRowMatch[1] || '';
      const clanCell = clanRowMatch[2] || '';
      const labelText = rawLabel
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

      const hasClanMarkup = /<img[^>]+>\s*<a[^>]+>[^<]+<\/a>/i.test(clanCell)
        || /alt="(?:Логотип\s+)?[^"]+"/i.test(clanCell);

      const isClanStatusRow = labelText.includes('состоит')
        || labelText.includes('глава')
        || labelText.includes('зам. главы')
        || labelText.includes('зам главы')
        || labelText.includes('советник');

      if (!isClanStatusRow && !hasClanMarkup) {
        continue;
      }

      const iconMatch = clanCell.match(/<img[^>]*src="([^"]+)"/i);
      if (iconMatch) {
        clanIcon = iconMatch[1];
      }

      const linkMatch = clanCell.match(/<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/i);
      if (linkMatch) {
        clanUrl = linkMatch[1];
        clanName = linkMatch[2].trim();
      }

      if (!clanName) {
        const altNameMatch = clanCell.match(/<img[^>]*alt="(?:Логотип\s+)?([^"]+)"[^>]*>/i);
        if (altNameMatch) {
          clanName = altNameMatch[1].trim();
        }
      }

      break;
    }

    if (!nickname || !level) {
      return null;
    }

    return { nickname, level, clanIcon, clanName, clanUrl, raceCode, raceClass, raceTitle, raceStyle };
  };

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

  const handleImport = async () => {
    if (!url.trim()) {
      toast.error('Введите URL персонажа');
      return;
    }

    try {
      const parsedUrl = new URL(url);

      if (!isApehaHost(parsedUrl.hostname)) {
        toast.error('URL должен содержать домен apeha.ru');
        return;
      }

      if (!isCharacterPagePath(parsedUrl.pathname)) {
        toast.error('URL должен вести на страницу персонажа (info/pers)');
        return;
      }
    } catch {
      toast.error('Неверный формат URL');
      return;
    }

    setIsLoading(true);

    try {
      let html = await fetchHtml(url);

      const redirectMatch = html.match(/location\.href\s*=\s*["']([^"']+)["']/i);
      if (redirectMatch && redirectMatch[1]) {
        let redirectUrl = redirectMatch[1];
        if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
          redirectUrl = new URL(redirectUrl, url).href;
        }
        html = await fetchHtml(redirectUrl);
      }

      const charData = parseCharacterData(html);
      if (!charData) {
        toast.error('Не удалось найти данные персонажа. Проверьте ссылку.');
        setOpen(false);
        return;
      }

      onImport(charData, ICON_URL, url);
      toast.success(`Персонаж импортирован: ${charData.nickname} ${charData.level}`);
      setOpen(false);
      setUrl('');
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast.error('Сервер не ответил за 10 секунд. Попробуйте позже.');
      } else {
        toast.error(`Ошибка: ${error.message || 'не удалось загрузить страницу'}`);
      }
    } finally {
      setIsLoading(false);
    }
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
              Введите ссылку на страницу персонажа для автоматического извлечения данных.
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
              <Button type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Отмена
              </Button>
              <Button type="button"
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


