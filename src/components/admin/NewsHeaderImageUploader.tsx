import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ImageUploader from './ImageUploader';
import { ImageIcon, Link as LinkIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface NewsHeaderImageUploaderProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

const NewsHeaderImageUploader = ({ value, onChange }: NewsHeaderImageUploaderProps) => {
  const [urlInput, setUrlInput] = useState(value || '');

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
    }
  };

  const handleImageSelect = (imageUrl: string) => {
    console.log('NewsHeaderImageUploader: received imageUrl:', imageUrl);
    onChange(imageUrl || null);
    // Обновляем preview локально
    setUrlInput(imageUrl);
  };

  const handleClear = () => {
    setUrlInput('');
    onChange(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Изображение шапки новости</Label>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-8 text-muted-foreground"
          >
            Очистить
          </Button>
        )}
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">
            <ImageIcon className="w-4 h-4 mr-2" />
            Загрузить
          </TabsTrigger>
          <TabsTrigger value="url">
            <LinkIcon className="w-4 h-4 mr-2" />
            URL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <ImageUploader
            onImageSelect={handleImageSelect}
            existingImageUrl={value}
            maxSize={5 * 1024 * 1024} // 5 MB для шапки
            endpoint="/upload/header-image"
          />
        </TabsContent>

        <TabsContent value="url" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="header-image-url" className="text-sm text-muted-foreground">
              Введите URL изображения
            </Label>
            <div className="flex gap-2">
              <Input
                id="header-image-url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
              />
              <Button
                type="button"
                onClick={handleUrlSubmit}
                disabled={!urlInput.trim()}
              >
                OK
              </Button>
            </div>
          </div>

          {urlInput && (
            <div className="relative">
              <p className="text-sm text-muted-foreground mb-2">Предпросмотр:</p>
              <div className="flex items-center justify-center bg-muted rounded-lg border overflow-hidden" style={{ height: '12rem' }}>
                <img
                  src={urlInput}
                  alt="Preview"
                  className="object-contain"
                  style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground">
        Рекомендуемый размер: 1200×600px. Форматы: JPG, PNG, GIF, WebP. Макс. размер: 5MB.
      </p>
    </div>
  );
};

export default NewsHeaderImageUploader;
