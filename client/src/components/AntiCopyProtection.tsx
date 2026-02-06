import { useEffect } from 'react';

export function AntiCopyProtection() {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.key) return;
      
      const key = e.key.toLowerCase();
      
      if (e.key === "F12") {
        e.preventDefault();
        return false;
      }
      
      if (e.ctrlKey && key === "u") {
        e.preventDefault();
        return false;
      }
      
      if (e.ctrlKey && (key === "c" || key === "v")) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          return true;
        }
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return null;
}
