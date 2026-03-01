import { useEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';

interface UseImageResizeOptions {
  editor: Editor | null;
}

export const useImageResize = ({ editor }: UseImageResizeOptions) => {
  const resizeState = useRef<{
    isResizing: boolean;
    startX: number;
    startWidth: number;
    image: HTMLImageElement | null;
  }>({
    isResizing: false,
    startX: 0,
    startWidth: 0,
    image: null,
  });

  useEffect(() => {
    if (!editor) return;

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Проверяем, что клик на изображении
      if (target.tagName === 'IMG') {
        const rect = target.getBoundingClientRect();
        
        // Проверяем, что клик в правом нижнем углу (где resize handle)
        const handleX = rect.right - 10;
        const handleY = rect.bottom - 10;
        const clickX = e.clientX;
        const clickY = e.clientY;
        
        // Если клик в пределах handle (24x24px)
        if (
          clickX >= handleX - 24 && 
          clickX <= handleX + 10 && 
          clickY >= handleY - 24 && 
          clickY <= handleY + 10
        ) {
          e.preventDefault();
          resizeState.current.isResizing = true;
          resizeState.current.startX = clickX;
          resizeState.current.startWidth = target.width || target.clientWidth;
          resizeState.current.image = target;
          
          target.style.cursor = 'nwse-resize';
          
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeState.current.isResizing || !resizeState.current.image) return;
      
      const deltaX = e.clientX - resizeState.current.startX;
      const newWidth = resizeState.current.startWidth + deltaX;
      
      // Минимальная ширина 50px
      if (newWidth >= 50) {
        resizeState.current.image.style.width = `${newWidth}px`;
        resizeState.current.image.setAttribute('width', String(newWidth));
      }
    };

    const handleMouseUp = () => {
      if (resizeState.current.image) {
        resizeState.current.image.style.cursor = 'pointer';
        
        // Сохраняем новый размер в Tiptap
        const newWidth = resizeState.current.image.width;
        const currentSrc = resizeState.current.image.src;
        
        // Находим позицию изображения в редакторе
        const { view } = editor;
        const { state, dispatch } = view;
        
        // Ищем изображение в документе по src
        let imgPos = -1;
        state.doc.nodesBetween(0, state.doc.content.size, (node, pos) => {
          if (node.type.name === 'image' && node.attrs.src === currentSrc) {
            imgPos = pos;
            return false; // stop searching
          }
          return true; // continue searching
        });
        
        if (imgPos >= 0) {
          const node = state.doc.nodeAt(imgPos);
          if (node) {
            const tr = state.tr.setNodeMarkup(imgPos, null, {
              ...node.attrs,
              width: String(newWidth),
              style: `width: ${newWidth}px;`,
            });
            dispatch(tr);
            console.log('Saved image width:', newWidth);
          }
        }
      }
      resizeState.current.isResizing = false;
      resizeState.current.image = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    // Добавляем глобальный слушатель на editor
    const editorElement = document.querySelector('.editor-content');
    if (editorElement) {
      editorElement.addEventListener('mousedown', handleMouseDown);
    }

    return () => {
      if (editorElement) {
        editorElement.removeEventListener('mousedown', handleMouseDown);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [editor]);

  return null;
};

export default useImageResize;
