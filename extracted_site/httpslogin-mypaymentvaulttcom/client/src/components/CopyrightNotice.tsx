/**
 * CopyrightNotice Component
 * 
 * DMCA & Legal Protection Notice
 * Modified: All text is white (invisible on white background) per user request
 */
export function CopyrightNotice() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border py-2 px-4 z-50" style={{ color: 'white' }}>
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-xs" style={{ color: 'white' }}>
          <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start" style={{ color: 'white' }}>
            <span className="font-semibold" style={{ color: 'white' }}>
              © 2025 MyPaymentVault - Northlane. All Rights Reserved.
            </span>
            <span className="hidden md:inline" style={{ color: 'white' }}>|</span>
            <span className="text-[10px] opacity-75" style={{ color: 'white', opacity: 1 }}>
              Protected by DMCA & Copyright Law
            </span>
          </div>
          
          <div className="flex items-center gap-3 text-[10px]" style={{ color: 'white' }}>
            <a 
              href="/terms" 
              className="hover:text-foreground transition-colors"
              onClick={(e) => e.preventDefault()}
              style={{ color: 'white' }}
            >
              Terms of Use
            </a>
            <span style={{ color: 'white' }}>•</span>
            <a 
              href="/privacy" 
              className="hover:text-foreground transition-colors"
              onClick={(e) => e.preventDefault()}
              style={{ color: 'white' }}
            >
              Privacy Policy
            </a>
            <span style={{ color: 'white' }}>•</span>
            <span className="font-medium text-destructive" style={{ color: 'white' }}>
              ⚠ Unauthorized access prohibited
            </span>
          </div>
        </div>
        
        <div className="mt-1 text-center text-[9px] opacity-60" style={{ color: 'white', opacity: 1 }}>
          This site is protected against unauthorized cloning, scraping, and content theft. 
          Violations will be prosecuted under applicable law.
        </div>
      </div>
    </div>
  );
}
