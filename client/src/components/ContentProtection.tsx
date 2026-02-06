import { useEffect } from 'react';

export function ContentProtection() {
  useEffect(() => {
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };
    
    const preventSelection = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return true;
      }
      e.preventDefault();
      return false;
    };
    
    const preventCopyPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return true;
      }
      e.preventDefault();
      return false;
    };
    
    const preventKeyboardShortcuts = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C') ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.key === 'U') ||
        (e.ctrlKey && e.key === 's') ||
        (e.ctrlKey && e.key === 'S') ||
        (e.ctrlKey && e.key === 'p') ||
        (e.ctrlKey && e.key === 'P') ||
        e.key === 'PrintScreen' ||
        (e.metaKey && e.shiftKey && e.key === 's') ||
        (e.metaKey && e.shiftKey && e.key === 'S')
      ) {
        e.preventDefault();
        return false;
      }
      
      const target = e.target as HTMLElement;
      const isFormField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      
      if (!isFormField) {
        if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
          e.preventDefault();
          return false;
        }
        
        if (e.ctrlKey && (e.key === 'x' || e.key === 'X')) {
          e.preventDefault();
          return false;
        }
        
        if (e.ctrlKey && (e.key === 'a' || e.key === 'A')) {
          e.preventDefault();
          return false;
        }
      }
      
      return true;
    };
    
    const preventDragDrop = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };
    
    const preventImageDrag = (e: DragEvent) => {
      if ((e.target as HTMLElement).tagName === 'IMG') {
        e.preventDefault();
        return false;
      }
    };
    
    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('selectstart', preventSelection);
    document.addEventListener('copy', preventCopyPaste);
    document.addEventListener('cut', preventCopyPaste);
    document.addEventListener('paste', preventCopyPaste);
    document.addEventListener('keydown', preventKeyboardShortcuts);
    document.addEventListener('dragstart', preventDragDrop);
    document.addEventListener('drop', preventDragDrop);
    document.addEventListener('dragover', preventImageDrag);
    
    const style = document.createElement('style');
    style.id = 'content-protection-styles';
    style.textContent = `
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
      
      input, textarea {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
      
      img {
        pointer-events: none !important;
        -webkit-user-drag: none !important;
        -khtml-user-drag: none !important;
        -moz-user-drag: none !important;
        -o-user-drag: none !important;
        user-drag: none !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('selectstart', preventSelection);
      document.removeEventListener('copy', preventCopyPaste);
      document.removeEventListener('cut', preventCopyPaste);
      document.removeEventListener('paste', preventCopyPaste);
      document.removeEventListener('keydown', preventKeyboardShortcuts);
      document.removeEventListener('dragstart', preventDragDrop);
      document.removeEventListener('drop', preventDragDrop);
      document.removeEventListener('dragover', preventImageDrag);
      
      const styleEl = document.getElementById('content-protection-styles');
      if (styleEl) styleEl.remove();
    };
  }, []);
  
  return null;
}
