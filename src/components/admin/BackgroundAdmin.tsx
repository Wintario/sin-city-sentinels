import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { backgroundAPI } from '@/lib/api';

const BackgroundAdmin = () => {
  const [bgImageUrl, setBgImageUrl] = useState('');
  const [bgColor, setBgColor] = useState('#1a1a1a');
  const [bgOpacity, setBgOpacity] = useState(0.7);
  const [previewActive, setPreviewActive] = useState(false);

  useEffect(() => {
    // Загружаем сохранённые настройки
    const settings = backgroundAPI.get();
    setBgImageUrl(settings.bgImageUrl);
    setBgColor(settings.bgColor);
    setBgOpacity(settings.bgOpacity);
  }, []);

  const handleSave = () => {
    backgroundAPI.save({
      bgImageUrl,
      bgColor,
      bgOpacity,
    });
    toast.success('Настройки фона сохранены');
  };

  const handleReset = () => {
    setBgImageUrl('');
    setBgColor('#1a1a1a');
    setBgOpacity(0.7);
    backgroundAPI.save({
      bgImageUrl: '',
      bgColor: '#1a1a1a',
      bgOpacity: 0.7,
    });
    toast.success('Настройки сброшены');
  };

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
          {bgImageUrl && (
            <img 
              src={bgImageUrl} 
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
            <span className="text-white text-sm">Превью фона</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            URL изображения фона
          </label>
          <Input
            type="url"
            value={bgImageUrl}
            onChange={(e) => setBgImageUrl(e.target.value)}
            placeholder="https://example.com/background.jpg"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Оставьте пустым для использования только цвета
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Цвет фона
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
          <p className="text-xs text-muted-foreground mt-1">
            0% - полностью прозрачное, 100% - полностью видимое
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button onClick={handleSave}>
            Сохранить настройки
          </Button>
          <Button variant="outline" onClick={handleReset}>
            Сбросить
          </Button>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg">
          <h3 className="font-medium mb-2">Как это работает</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Настройки сохраняются в браузере (localStorage)</li>
            <li>• Изменения применяются на главной странице сайта</li>
            <li>• Для применения на VPS - добавьте загрузку настроек в код</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BackgroundAdmin;
