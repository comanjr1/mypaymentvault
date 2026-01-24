import { useEffect } from 'react';

export function AntiCopyProtection() {
  useEffect(() => {
    // Disable right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      alert("Not allowed");
    };

    // Disable F12, Ctrl+U, Ctrl+C, Ctrl+V
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.key) return; // Safety check for undefined key
      
      const key = e.key.toLowerCase();
      
      if (e.key === "F12") {
        e.preventDefault();
        alert("Not allowed");
        return false;
      }
      
      if (e.ctrlKey && key === "u") {
        e.preventDefault();
        alert("Not allowed");
        return false;
      }
      
      if (e.ctrlKey && (key === "c" || key === "v")) {
        e.preventDefault();
        alert("Not allowed copy/paste");
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
