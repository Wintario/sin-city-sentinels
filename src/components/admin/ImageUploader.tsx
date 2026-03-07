import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon, Scissors } from 'lucide-react';
import { toast } from 'sonner';
import { apiUpload } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';

interface ImageUploaderProps {
  onImageSelect: (imageUrl: string) => void;
  onImageMetaChange?: (meta: string | null) => void;
  existingImageUrl?: string | null;
  existingImageMeta?: string | null;
  multiple?: boolean;
  maxSize?: number; // bytes
  targetUploadSize?: number; // desired size after auto-compression
  accept?: Record<string, string[]>;
  endpoint?: string;
}

interface CropOffset {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

const DEFAULT_TARGET_UPLOAD_SIZE = 900 * 1024; // < 1MB to avoid default nginx 413
const MAX_DIMENSION = 1920;
const HEADER_OUTPUT_WIDTH = 1200;
const HEADER_OUTPUT_HEIGHT = 600;
const HEADER_ASPECT = HEADER_OUTPUT_WIDTH / HEADER_OUTPUT_HEIGHT; // 2:1

// Exact ratios from current layout:
// Main page card image:
// - md: w-64 h-36 => 256x144 => 16:9
// - lg: w-72 h-36 => 288x144 => 2:1
const MAIN_MD_ASPECT = 256 / 144;
const MAIN_LG_ASPECT = 288 / 144;

// News detail image:
// - md: max-w-3xl(768), article p-12 => 768 - 96 = 672, h-64 => 672x256
// - lg: max-w-6xl(1152), article p-12 => 1152 - 96 = 1056, h-64 => 1056x256
const DETAIL_MD_ASPECT = 672 / 256;
const DETAIL_LG_ASPECT = 1056 / 256;

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Не удалось открыть изображение для сжатия'));
    };

    img.src = objectUrl;
  });

const loadImageFromSrc = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Не удалось загрузить изображение для редактирования'));
    img.src = src;
  });

const canvasToBlob = (canvas: HTMLCanvasElement, mimeType: string, quality?: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error('Не удалось сжать изображение'));
    }, mimeType, quality);
  });

const replaceFileExtension = (filename: string, ext: string): string => {
  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex === -1) {
    return `${filename}${ext}`;
  }

  return `${filename.slice(0, dotIndex)}${ext}`;
};

const compressImageIfNeeded = async (file: File, targetUploadSize: number): Promise<File> => {
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // Keep GIF untouched to avoid breaking animation.
  if (file.type === 'image/gif' || file.size <= targetUploadSize) {
    return file;
  }

  const source = await loadImage(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(source.width, source.height));
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Не удалось инициализировать canvas для сжатия изображения');
  }

  ctx.drawImage(source, 0, 0, width, height);

  let quality = 0.88;
  let bestBlob = await canvasToBlob(canvas, 'image/webp', quality);

  while (bestBlob.size > targetUploadSize && quality > 0.5) {
    quality -= 0.06;
    bestBlob = await canvasToBlob(canvas, 'image/webp', quality);
  }

  if (bestBlob.size >= file.size) {
    return file;
  }

  const nextName = replaceFileExtension(file.name, '.webp');
  return new File([bestBlob], nextName, { type: 'image/webp' });
};

const getGeometry = (frame: Size, natural: Size, zoom: number) => {
  if (!frame.width || !frame.height || !natural.width || !natural.height) {
    return {
      ready: false,
      scale: 1,
      displayedWidth: 0,
      displayedHeight: 0,
      maxX: 0,
      maxY: 0,
    };
  }

  const baseScale = Math.max(frame.width / natural.width, frame.height / natural.height);
  const scale = baseScale * zoom;
  const displayedWidth = natural.width * scale;
  const displayedHeight = natural.height * scale;

  return {
    ready: true,
    scale,
    displayedWidth,
    displayedHeight,
    maxX: Math.max(0, (displayedWidth - frame.width) / 2),
    maxY: Math.max(0, (displayedHeight - frame.height) / 2),
  };
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getGuideRect = (targetAspect: number) => {
  if (targetAspect > HEADER_ASPECT) {
    return {
      width: '100%',
      height: `${(HEADER_ASPECT / targetAspect) * 100}%`,
    };
  }

  return {
    width: `${(targetAspect / HEADER_ASPECT) * 100}%`,
    height: '100%',
  };
};

const ImageUploader = ({
  onImageSelect,
  onImageMetaChange,
  existingImageUrl,
  existingImageMeta: _existingImageMeta,
  multiple = false,
  maxSize = 5 * 1024 * 1024, // 5 MB
  targetUploadSize = DEFAULT_TARGET_UPLOAD_SIZE,
  accept = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
  },
  endpoint = '/upload/header-image',
}: ImageUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(existingImageUrl || null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorImageSrc, setEditorImageSrc] = useState<string | null>(null);
  const [editorImageName, setEditorImageName] = useState('header-image');
  const [editorSessionId, setEditorSessionId] = useState(0);
  const [frameSize, setFrameSize] = useState<Size>({ width: 0, height: 0 });
  const [naturalSize, setNaturalSize] = useState<Size>({ width: 0, height: 0 });
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState<CropOffset>({ x: 0, y: 0 });

  const frameRef = useRef<HTMLDivElement | null>(null);
  const editorImageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    initialOffset: CropOffset;
  } | null>(null);
  const editorObjectUrlRef = useRef<string | null>(null);

  const ensureEditorMetrics = useCallback(() => {
    const frameEl = frameRef.current;
    if (frameEl) {
      const rect = frameEl.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setFrameSize((prev) =>
          prev.width === rect.width && prev.height === rect.height
            ? prev
            : { width: rect.width, height: rect.height }
        );
      }
    }

    const img = editorImageRef.current;
    if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
      setNaturalSize((prev) =>
        prev.width === img.naturalWidth && prev.height === img.naturalHeight
          ? prev
          : { width: img.naturalWidth, height: img.naturalHeight }
      );
    }
  }, []);

  useEffect(() => {
    setPreview(existingImageUrl || null);
  }, [existingImageUrl]);

  useEffect(() => {
    if (!editorOpen || !frameRef.current) return;

    const updateSize = () => {
      const rect = frameRef.current?.getBoundingClientRect();
      if (!rect) return;
      setFrameSize({ width: rect.width, height: rect.height });
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(frameRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [editorOpen]);

  useEffect(() => {
    if (!editorOpen) return;

    ensureEditorMetrics();

    let attempts = 0;
    const raf = () => {
      attempts += 1;
      ensureEditorMetrics();
      const frameRect = frameRef.current?.getBoundingClientRect();
      const frameOk = Boolean(frameRect && frameRect.width > 0 && frameRect.height > 0);
      const img = editorImageRef.current;
      const imageOk = Boolean(img && img.naturalWidth > 0 && img.naturalHeight > 0);

      if ((frameOk && imageOk) || attempts >= 20) {
        return;
      }

      window.requestAnimationFrame(raf);
    };

    window.requestAnimationFrame(raf);
  }, [editorOpen, editorSessionId, ensureEditorMetrics]);

  useEffect(() => {
    if (!editorOpen) return;

    let cancelled = false;

    const syncNaturalSizeFromDom = () => {
      const img = editorImageRef.current;
      if (!img) return false;
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        if (!cancelled) {
          setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
        }
        return true;
      }
      return false;
    };

    if (syncNaturalSizeFromDom()) {
      return;
    }

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      if (syncNaturalSizeFromDom()) {
        window.clearInterval(timer);
        return;
      }
      if (Date.now() - startedAt > 3000) {
        window.clearInterval(timer);
      }
    }, 80);

    // Fallback path: load via Image object in case DOM onLoad was skipped (cache/race).
    loadImageFromSrc(editorImageSrc || '')
      .then((img) => {
        if (!cancelled) {
          setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
        }
      })
      .catch(() => {
        // noop: DOM polling already handles best effort.
      });

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [editorOpen, editorImageSrc, editorSessionId]);

  useEffect(() => {
    return () => {
      if (editorObjectUrlRef.current) {
        URL.revokeObjectURL(editorObjectUrlRef.current);
        editorObjectUrlRef.current = null;
      }
    };
  }, []);

  const geometry = useMemo(() => getGeometry(frameSize, naturalSize, cropZoom), [frameSize, naturalSize, cropZoom]);

  const clampOffset = useCallback((offset: CropOffset, zoom = cropZoom) => {
    const nextGeometry = getGeometry(frameSize, naturalSize, zoom);
    return {
      x: clamp(offset.x, -nextGeometry.maxX, nextGeometry.maxX),
      y: clamp(offset.y, -nextGeometry.maxY, nextGeometry.maxY),
    };
  }, [cropZoom, frameSize, naturalSize]);

  const uploadImage = async (file: File): Promise<string> => {
    setIsUploading(true);

    try {
      const processedFile = await compressImageIfNeeded(file, targetUploadSize);

      if (processedFile.size < file.size) {
        const beforeMb = (file.size / 1024 / 1024).toFixed(2);
        const afterMb = (processedFile.size / 1024 / 1024).toFixed(2);
        toast.info(`Изображение сжато: ${beforeMb}MB -> ${afterMb}MB`);
      }

      if (processedFile.size > maxSize) {
        throw new Error(`Файл слишком большой. Максимум ${maxSize / 1024 / 1024}MB`);
      }

      if (
        !accept ||
        !Object.keys(accept).some((type) =>
          processedFile.type === type || processedFile.name.toLowerCase().endsWith(accept[type as keyof typeof accept]?.[0] || '')
        )
      ) {
        throw new Error('Недопустимый формат файла');
      }

      const result = await apiUpload<{ url?: string; file?: { url?: string }; files?: Array<{ url?: string }> }>(
        endpoint,
        processedFile,
        endpoint === '/upload/image' ? 'images' : 'image'
      );

      let imageUrl: string | undefined;

      if (result.file?.url) {
        imageUrl = result.file.url;
      } else if (result.files?.[0]?.url) {
        imageUrl = result.files[0].url;
      } else if (result.url) {
        imageUrl = result.url;
      }

      if (!imageUrl) {
        throw new Error(`Сервер не вернул URL изображения. Ответ: ${JSON.stringify(result)}`);
      }

      setPreview(imageUrl);
      onImageSelect(imageUrl);
      toast.success('Изображение загружено');

      return imageUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка загрузки';
      toast.error(message);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const openEditorForSource = useCallback((source: string, name = 'header-image', isObjectUrl = false) => {
    if (editorObjectUrlRef.current) {
      URL.revokeObjectURL(editorObjectUrlRef.current);
      editorObjectUrlRef.current = null;
    }

    if (isObjectUrl) {
      editorObjectUrlRef.current = source;
    }

    setEditorImageSrc(source);
    setEditorImageName(name);
    setEditorSessionId((prev) => prev + 1);
    setNaturalSize({ width: 0, height: 0 });
    setCropZoom(1);
    setCropOffset({ x: 0, y: 0 });
    setEditorOpen(true);
  }, []);

  const openEditorForFile = useCallback((file: File) => {
    const objectUrl = URL.createObjectURL(file);
    openEditorForSource(objectUrl, file.name, true);
  }, [openEditorForSource]);

  const buildCroppedFile = useCallback(async () => {
    if (!editorImageSrc) {
      throw new Error('Нет изображения для редактирования');
    }

    if (!geometry.ready || !frameSize.width || !frameSize.height) {
      throw new Error('Редактор еще не готов. Попробуйте снова');
    }

    const sourceImage = await loadImageFromSrc(editorImageSrc);

    const canvas = document.createElement('canvas');
    canvas.width = HEADER_OUTPUT_WIDTH;
    canvas.height = HEADER_OUTPUT_HEIGHT;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Не удалось инициализировать canvas для обрезки');
    }

    const left = frameSize.width / 2 - geometry.displayedWidth / 2 + cropOffset.x;
    const top = frameSize.height / 2 - geometry.displayedHeight / 2 + cropOffset.y;

    const sx = clamp((0 - left) / geometry.scale, 0, sourceImage.naturalWidth);
    const sy = clamp((0 - top) / geometry.scale, 0, sourceImage.naturalHeight);
    const sw = clamp(frameSize.width / geometry.scale, 1, sourceImage.naturalWidth - sx);
    const sh = clamp(frameSize.height / geometry.scale, 1, sourceImage.naturalHeight - sy);

    ctx.drawImage(
      sourceImage,
      sx,
      sy,
      sw,
      sh,
      0,
      0,
      HEADER_OUTPUT_WIDTH,
      HEADER_OUTPUT_HEIGHT
    );

    const blob = await canvasToBlob(canvas, 'image/webp', 0.9);
    return new File([blob], replaceFileExtension(editorImageName, '.webp'), { type: 'image/webp' });
  }, [cropOffset, editorImageName, editorImageSrc, frameSize, geometry]);

  const handleApplyCrop = useCallback(async () => {
    try {
      const croppedFile = await buildCroppedFile();
      await uploadImage(croppedFile);
      const maxX = Math.max(geometry.maxX, 1);
      const maxY = Math.max(geometry.maxY, 1);
      const meta = {
        zoom: cropZoom,
        offsetXRatio: Number((cropOffset.x / maxX).toFixed(6)),
        offsetYRatio: Number((cropOffset.y / maxY).toFixed(6)),
        editorVersion: 1
      };
      onImageMetaChange?.(JSON.stringify(meta));
      setEditorOpen(false);
      toast.success('Шапка обновлена');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось обработать изображение';
      toast.error(message);
    }
  }, [buildCroppedFile, cropOffset.x, cropOffset.y, cropZoom, geometry.maxX, geometry.maxY, onImageMetaChange]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    openEditorForFile(file);
  }, [openEditorForFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple,
    disabled: isUploading,
  });

  const handleRemove = () => {
    setPreview(null);
    onImageSelect('');
    onImageMetaChange?.(null);
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const frameRect = frameRef.current?.getBoundingClientRect();
    const img = editorImageRef.current;
    const liveFrame = {
      width: frameRect?.width || frameSize.width,
      height: frameRect?.height || frameSize.height,
    };
    const liveNatural = {
      width: img?.naturalWidth || naturalSize.width,
      height: img?.naturalHeight || naturalSize.height,
    };
    const liveGeometry = getGeometry(liveFrame, liveNatural, cropZoom);
    if (!liveGeometry.ready) {
      ensureEditorMetrics();
      return;
    }

    e.preventDefault();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialOffset: cropOffset,
    };
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;

    e.preventDefault();
    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;

    setCropOffset(clampOffset({
      x: dragRef.current.initialOffset.x + deltaX,
      y: dragRef.current.initialOffset.y + deltaY,
    }));
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;

    dragRef.current = null;
  };

  const handleWindowPointerMove = useCallback((e: PointerEvent) => {
    if (!dragRef.current) return;

    if (e.cancelable) {
      e.preventDefault();
    }

    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;

    setCropOffset(clampOffset({
      x: dragRef.current.initialOffset.x + deltaX,
      y: dragRef.current.initialOffset.y + deltaY,
    }));
  }, [clampOffset]);

  const stopDragging = useCallback(() => {
    if (!dragRef.current) return;
    dragRef.current = null;
  }, []);

  useEffect(() => {
    if (!editorOpen) return;

    window.addEventListener('pointermove', handleWindowPointerMove, { passive: false });
    window.addEventListener('pointerup', stopDragging);
    window.addEventListener('pointercancel', stopDragging);

    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', stopDragging);
      window.removeEventListener('pointercancel', stopDragging);
    };
  }, [editorOpen, handleWindowPointerMove, stopDragging]);

  const handleZoomChange = (values: number[]) => {
    const nextZoom = values[0] ?? 1;
    ensureEditorMetrics();
    setCropZoom(nextZoom);
    setCropOffset((prev) => clampOffset(prev, nextZoom));
  };

  const canEdit = Boolean(preview || editorImageSrc);

  return (
    <>
      <div className="space-y-2">
        {preview ? (
          <div className="relative group">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg border"
            />
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => preview && openEditorForSource(preview, 'header-image.webp', false)}
              >
                <Scissors className="w-4 h-4 mr-1" />
                Редактировать
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRemove}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors
              ${
                isDragActive
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
                  <p className="text-primary font-medium">Отпустите для загрузки...</p>
                ) : (
                  <>
                    <p className="text-sm font-medium">Перетащите изображение сюда</p>
                    <p className="text-xs text-muted-foreground">или нажмите для выбора файла</p>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG, GIF, WebP (макс. {maxSize / 1024 / 1024}MB)
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {!preview && canEdit && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => editorImageSrc && openEditorForSource(editorImageSrc, editorImageName, false)}
            className="w-full"
          >
            <Scissors className="w-4 h-4 mr-2" />
            Редактировать
          </Button>
        )}
      </div>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Редактор шапки новости</DialogTitle>
            <DialogDescription>
              Перетаскивайте изображение мышью и регулируйте масштаб. Итог: 1200x600.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div
              ref={frameRef}
              className="relative w-full aspect-[2/1] overflow-hidden rounded-lg border bg-muted touch-none select-none cursor-grab active:cursor-grabbing"
            >
              {editorImageSrc && (
                <img
                  key={`${editorSessionId}:${editorImageSrc}`}
                  ref={editorImageRef}
                  src={editorImageSrc}
                  alt="Crop preview"
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
                  }}
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  className="absolute top-1/2 left-1/2 max-w-none"
                  style={{
                    width: geometry.displayedWidth ? `${geometry.displayedWidth}px` : undefined,
                    height: geometry.displayedHeight ? `${geometry.displayedHeight}px` : undefined,
                    transform: `translate(-50%, -50%) translate(${cropOffset.x}px, ${cropOffset.y}px)`,
                    pointerEvents: 'none',
                  }}
                />
              )}
              <div
                className="absolute inset-0 z-40"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              />
              <div className="pointer-events-none absolute inset-0 z-20">
                <div
                  className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded border-2 border-dashed border-amber-400/90"
                  style={getGuideRect(MAIN_MD_ASPECT)}
                >
                  <span className="pointer-events-none absolute left-2 top-2 bg-black/55 px-2 py-0.5 text-[10px] text-amber-200 rounded">
                    Главная md: 256x144 (16:9)
                  </span>
                </div>
                <div
                  className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded border border-dashed border-amber-300/80"
                  style={getGuideRect(MAIN_LG_ASPECT)}
                >
                  <span className="pointer-events-none absolute left-2 bottom-2 bg-black/55 px-2 py-0.5 text-[10px] text-amber-100 rounded">
                    Главная lg: 288x144 (2:1)
                  </span>
                </div>
                <div
                  className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded border-2 border-dashed border-cyan-400/90"
                  style={getGuideRect(DETAIL_MD_ASPECT)}
                >
                  <span className="pointer-events-none absolute right-2 top-2 bg-black/55 px-2 py-0.5 text-[10px] text-cyan-200 rounded">
                    Новость md: 672x256 (2.63:1)
                  </span>
                </div>
                <div
                  className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded border border-dashed border-cyan-300/80"
                  style={getGuideRect(DETAIL_LG_ASPECT)}
                >
                  <span className="pointer-events-none absolute right-2 bottom-2 bg-black/55 px-2 py-0.5 text-[10px] text-cyan-100 rounded">
                    Новость lg: 1056x256 (4.13:1)
                  </span>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-0 border-2 border-white/80 rounded-lg" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Масштаб</span>
                <span>{cropZoom.toFixed(2)}x</span>
              </div>
              <Slider
                value={[cropZoom]}
                onValueChange={handleZoomChange}
                min={0.5}
                max={3}
                step={0.01}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditorOpen(false)}>
              Отмена
            </Button>
            <Button type="button" onClick={handleApplyCrop} disabled={isUploading || !editorImageSrc}>
              Применить и загрузить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageUploader;

