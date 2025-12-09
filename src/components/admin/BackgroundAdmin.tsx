import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { backgroundAPI } from '@/lib/api';
import { Upload, Loader2 } from 'lucide-react';

const BackgroundAdmin = () => {
  const [bgImageUrl, setBgImageUrl] = useState('');
  const [bgColor, setBgColor] = useState('#1a1a1a');
  const [bgOpacity, setBgOpacity] = useState(0.7);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await backgroundAPI.get();
        setBgImageUrl(settings.image_url || '');
        setBgColor(settings.color || '#1a1a1a');
        setBgOpacity(settings.opacity ?? 0.7);
      } catch (error) {
        console.error('Failed to load background settings:', error);
        // Fallback to localStorage
        setBgImageUrl(localStorage.getItem('clan_bgImageUrl') || '');
        setBgColor(localStorage.getItem('clan_bgColor') || '#1a1a1a');
        setBgOpacity(parseFloat(localStorage.getItem('clan_bgOpacity') || '0.7'));
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка типа файла
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Поддерживаются только JPG, PNG и WebP');
      return;
    }

    // Проверка размера (макс 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Файл слишком большой (макс. 10MB)');
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewFile(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error('Выберите файл');
      return;
    }

    setIsUploading(true);
    try {
      const result = await backgroundAPI.upload(file);
      setBgImageUrl(result.image_url);
      setPreviewFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast.success('Фон загружен');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка загрузки';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await backgroundAPI.updateSettings({
        color: bgColor,
        opacity: bgOpacity,
      });
      toast.success('Настройки сохранены');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка сохранения';
      toast.error(message);
    }
  };

  const handleReset = async () => {
    if (!confirm('Сбросить настройки фона?')) return;
    
    setBgImageUrl('');
    setBgColor('#1a1a1a');
    setBgOpacity(0.7);
    setPreviewFile(null);
    
    try {
      await backgroundAPI.updateSettings({
        color: '#1a1a1a',
        opacity: 0.7,
      });
      toast.success('Настройки сброшены');
    } catch (error) {
      console.error('Reset error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Настройки фона</h2>
      </div>

      <div className="max-w-xl space-y-6">
        {/* Preview Box */}
        <div 
          className="w-full h-48 rounded-lg border border-border overflow-hidden relative"
          style={{
            backgroundColor: bgColor,
          }}
        >
          {(previewFile || bgImageUrl) && (
            <img 
              src={previewFile || bgImageUrl} 
              alt="Preview" 
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: bgOpacity }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: `rgba(0,0,0,${1 - bgOpacity})` }}
          >
            <span className="text-white text-sm bg-black/50 px-3 py-1 rounded">Превью фона</span>
          </div>
        </div>

        {/* Загрузка файла */}
        <div className="p-4 border border-dashed border-border rounded-lg">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Загрузить новый фон
          </label>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            {previewFile && (
              <Button onClick={handleUpload} disabled={isUploading}>
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Загрузить
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Поддерживаются: JPG, PNG, WebP (до 10MB)
          </p>
        </div>

        {/* Текущий URL */}
        {bgImageUrl && (
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Текущий фон
            </label>
            <Input
              type="url"
              value={bgImageUrl}
              readOnly
              className="bg-muted"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Цвет фона (если нет изображения)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="w-12 h-10 rounded border border-border cursor-pointer"
            />
            <Input
              type="text"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              placeholder="#1a1a1a"
              className="flex-1"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Прозрачность изображения: {Math.round(bgOpacity * 100)}%
          </label>
          <Slider
            value={[bgOpacity]}
            onValueChange={(value) => setBgOpacity(value[0])}
            min={0}
            max={1}
            step={0.05}
            className="w-full"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button onClick={handleSaveSettings}>
            Сохранить настройки
          </Button>
          <Button variant="outline" onClick={handleReset}>
            Сбросить
          </Button>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg">
          <h3 className="font-medium mb-2">Как это работает</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Загруженные изображения сохраняются на сервере</li>
            <li>• Все пользователи видят одинаковый фон</li>
            <li>• Изменения применяются сразу на главной странице</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BackgroundAdmin;