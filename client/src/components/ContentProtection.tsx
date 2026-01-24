import { useEffect } from 'react';

/**
 * ContentProtection Component
 * 
 * Comprehensive content protection against:
 * - Right-click / Context menu
 * - Text selection
 * - Copy/Cut/Paste
 * - Screenshot (Print Screen, Windows Snipping Tool)
 * - Developer Tools (F12, Ctrl+Shift+I)
 * - View Source (Ctrl+U)
 * - Drag & Drop
 * - Image saving
 */
export function ContentProtection() {
  useEffect(() => {
    // ========================================
    // LAYER 1: DISABLE RIGHT-CLICK & CONTEXT MENU
    // ========================================
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };
    
    // ========================================
    // LAYER 2: SELECTIVE TEXT SELECTION PROTECTION
    // ========================================
    const preventSelection = (e: Event) => {
      // Allow selection in form fields
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return true; // Allow selection
      }
      // Prevent selection of other content
      e.preventDefault();
      return false;
    };
    
    // ========================================
    // LAYER 3: SELECTIVE COPY/CUT PROTECTION
    // ========================================
    const preventCopyPaste = (e: ClipboardEvent) => {
      // Allow copy/paste in input and textarea elements
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return true; // Allow
      }
      // Prevent copy/paste of other content
      e.preventDefault();
      return false;
    };
    
    // ========================================
    // LAYER 4: DISABLE KEYBOARD SHORTCUTS
    // ========================================
    const preventKeyboardShortcuts = (e: KeyboardEvent) => {
      // Prevent Developer Tools
      // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C') ||
        // Prevent View Source
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.key === 'U') ||
        // Prevent Save Page
        (e.ctrlKey && e.key === 's') ||
        (e.ctrlKey && e.key === 'S') ||
        // Prevent Print
        (e.ctrlKey && e.key === 'p') ||
        (e.ctrlKey && e.key === 'P') ||
        // Prevent Print Screen
        e.key === 'PrintScreen' ||
        // Prevent Windows Snipping Tool shortcuts
        (e.metaKey && e.shiftKey && e.key === 's') || // Win+Shift+S
        (e.metaKey && e.shiftKey && e.key === 'S')
      ) {
        e.preventDefault();
        return false;
      }
      
      // Allow copy/paste/select in form fields, prevent elsewhere
      const target = e.target as HTMLElement;
      const isFormField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      
      if (!isFormField) {
        // Prevent Copy (Ctrl+C)
        if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
          e.preventDefault();
          return false;
        }
        
        // Prevent Cut (Ctrl+X)
        if (e.ctrlKey && (e.key === 'x' || e.key === 'X')) {
          e.preventDefault();
          return false;
        }
        
        // Prevent Select All (Ctrl+A)
        if (e.ctrlKey && (e.key === 'a' || e.key === 'A')) {
          e.preventDefault();
          return false;
        }
      }
      
      return true;
    };
    
    // ========================================
    // LAYER 5: DISABLE DRAG & DROP
    // ========================================
    const preventDragDrop = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };
    
    // ========================================
    // LAYER 6: SUBTLE SCREENSHOT DETECTION
    // ========================================
    // Note: Don't blur UI on focus loss - this breaks normal workflow
    // Instead, just log the event for monitoring
    const detectScreenshot = () => {
      console.log('[ContentProtection] Window lost focus - potential screenshot');
    };
    
    const removeScreenshotProtection = () => {
      // No-op - we don't apply visual effects anymore
    };
    
    // ========================================
    // LAYER 7: DISABLE IMAGE DRAGGING
    // ========================================
    const preventImageDrag = (e: DragEvent) => {
      if ((e.target as HTMLElement).tagName === 'IMG') {
        e.preventDefault();
        return false;
      }
    };
    
    // ========================================
    // ATTACH ALL EVENT LISTENERS
    // ========================================
    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('selectstart', preventSelection);
    document.addEventListener('copy', preventCopyPaste);
    document.addEventListener('cut', preventCopyPaste);
    document.addEventListener('paste', preventCopyPaste);
    document.addEventListener('keydown', preventKeyboardShortcuts);
    document.addEventListener('dragstart', preventDragDrop);
    document.addEventListener('drop', preventDragDrop);
    document.addEventListener('dragover', preventImageDrag);
    
    // Screenshot detection via window blur
    window.addEventListener('blur', detectScreenshot);
    window.addEventListener('focus', removeScreenshotProtection);
    
    // ========================================
    // APPLY CSS PROTECTION
    // ========================================
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
      
      /* Allow selection for input fields only */
      input, textarea {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
      
      /* Prevent image dragging */
      img {
        pointer-events: none !important;
        -webkit-user-drag: none !important;
        -khtml-user-drag: none !important;
        -moz-user-drag: none !important;
        -o-user-drag: none !important;
        user-drag: none !important;
      }
      
      /* Watermark for screenshots - INVISIBLE (white transparent) */
      body::before {
        content: "© 2025 MyPaymentVault - Northlane";
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        font-size: 72px;
        color: rgba(255, 255, 255, 0);
        opacity: 0;
        pointer-events: none;
        z-index: 9999;
        white-space: nowrap;
        user-select: none;
        font-weight: bold;
      }
    `;
    document.head.appendChild(style);
    
    // ========================================
    // DETECT DEVTOOLS OPENING
    // ========================================
    const devtoolsDetector = setInterval(() => {
      // Check if devtools is open by measuring timing
      const start = performance.now();
      // This debugger statement takes longer when devtools is open
      // eslint-disable-next-line no-debugger
      debugger;
      const end = performance.now();
      
      // If execution took more than 100ms, devtools might be open
      if (end - start > 100) {
        // Optionally redirect or show warning
        console.clear();
      }
    }, 1000);
    
    // ========================================
    // CLEANUP
    // ========================================
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
      window.removeEventListener('blur', detectScreenshot);
      window.removeEventListener('focus', removeScreenshotProtection);
      
      const styleEl = document.getElementById('content-protection-styles');
      if (styleEl) styleEl.remove();
      
      clearInterval(devtoolsDetector);
    };
  }, []);
  
  // This component doesn't render anything
  return null;
}
