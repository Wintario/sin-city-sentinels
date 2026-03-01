import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { apiUpload } from '@/lib/api';

interface ImageUploaderProps {
  onImageSelect: (imageUrl: string) => void;
  existingImageUrl?: string | null;
  multiple?: boolean;
  maxSize?: number; // в байтах
  accept?: Record<string, string[]>;
  endpoint?: string; // эндпоинт для загрузки
}

const ImageUploader = ({
  onImageSelect,
  existingImageUrl,
  multiple = false,
  maxSize = 5 * 1024 * 1024, // 5 MB
  accept = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp']
  },
  endpoint = '/upload/header-image'
}: ImageUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(existingImageUrl || null);

  const uploadImage = async (file: File): Promise<string> => {
    setIsUploading(true);
    
    try {
      // Проверка размера
      if (file.size > maxSize) {
        throw new Error(`Файл слишком большой. Максимум ${maxSize / 1024 / 1024}MB`);
      }

      // Проверка типа
      if (!accept || !Object.keys(accept).some(type =>
        file.type === type || file.name.toLowerCase().endsWith(accept[type as keyof typeof accept]?.[0] || '')
      )) {
        throw new Error('Недопустимый формат файла');
      }

      console.log('Uploading image to:', endpoint, 'file:', file.name, 'size:', file.size);

      // Загрузка на сервер
      const result = await apiUpload<{ url: string; file?: { url: string } }>(
        endpoint,
        file,
        endpoint === '/upload/image' ? 'images' : 'image'
      );

      console.log('Upload result:', result);

      // Получаем URL из ответа (разные форматы ответа)
      // Для /upload/header-image: {success: true, file: {url: "...", ...}}
      // Для /upload/image: {success: true, files: [{url: "...", ...}]}
      let imageUrl: string | undefined;
      
      if ('file' in result && result.file && typeof result.file === 'object' && 'url' in result.file) {
        imageUrl = (result.file as { url: string }).url;
      } else if ('files' in result && Array.isArray(result.files) && result.files.length > 0) {
        imageUrl = result.files[0].url;
      } else if ('url' in result) {
        imageUrl = result.url;
      }
      
      console.log('Extracted imageUrl:', imageUrl);
      
      if (!imageUrl) {
        throw new Error('Сервер не вернул URL изображения. Ответ: ' + JSON.stringify(result));
      }

      setPreview(imageUrl);
      onImageSelect(imageUrl);
      toast.success('Изображение загружено');
      
      return imageUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка загрузки';
      console.error('Upload error:', error);
      toast.error(message);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    await uploadImage(file);
  }, [onImageSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple,
    disabled: isUploading
  });

  const handleRemove = () => {
    setPreview(null);
    onImageSelect('');
  };

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="relative group">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleRemove}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors
            ${isDragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
            }
            ${isUploading ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center gap-3">
            {isUploading ? (
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            ) : isDragActive ? (
              <Upload className="w-10 h-10 text-primary" />
            ) : (
              <ImageIcon className="w-10 h-10 text-muted-foreground" />
            )}
            
            <div className="space-y-1">
              {isDragActive ? (
                <p className="text-primary font-medium">
                  Отпустите для загрузки...
                </p>
              ) : (
                <>
                  <p className="text-sm font-medium">
                    Перетащите изображение сюда
                  </p>
                  <p className="text-xs text-muted-foreground">
                    или нажмите для выбора файла
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, GIF, WebP (макс. {maxSize / 1024 / 1024}MB)
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
