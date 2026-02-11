import { Request, Response, NextFunction } from 'express';

// Advanced Security Headers Middleware
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // NOTE: X-Robots-Tag noindex REMOVED to allow Google/Bing indexing
  // Only keep anti-AI headers which don't affect search engine indexing
  
  // Anti-AI Training Headers (2025 Best Practice) - Does NOT affect Google/Bing
  res.setHeader('X-AI-Index', 'noindex');
  res.setHeader('X-AI-Training', 'disallow');
  res.setHeader('X-AI-Crawl', 'disallow');
  
  // Content Security Policy - Prevent Unauthorized Scripts
  // Note: In development, Vite requires 'unsafe-inline' for HMR
  // In production, we allow 'unsafe-inline' for styles only (for dynamic Tailwind/component styles)
  // but keep scripts strict
  const isDevelopment = process.env.NODE_ENV === 'development';
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    (isDevelopment 
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " // Dev only - for Vite HMR
      : "script-src 'self'; ") + // Production - strict, no inline scripts
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " + // Allow inline styles for React components
    "img-src 'self' data: https: blob:; " +
    "font-src 'self' https://fonts.gstatic.com data:; " +
    "connect-src 'self' https://api.resend.com https://api.telegram.org; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';"
  );
  
  // Prevent Clickjacking & Embedding
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Frame-Options', 'DENY');
  
  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Referrer Policy - Hide referrer information
  res.setHeader('Referrer-Policy', 'no-referrer');
  
  // Permissions Policy - Disable Features
  res.setHeader('Permissions-Policy', 
    'geolocation=(), ' +
    'microphone=(), ' +
    'camera=(), ' +
    'payment=(), ' +
    'usb=(), ' +
    'magnetometer=(), ' +
    'gyroscope=(), ' +
    'accelerometer=(), ' +
    'picture-in-picture=(), ' +
    'screen-wake-lock=(), ' +
    'web-share=()'
  );
  
  // HSTS - Force HTTPS (only in production)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Cache Control - Prevent Caching of Sensitive Pages
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  // Copyright & DMCA Protection Headers
  res.setHeader('X-Copyright', '© 2025 MyPaymentVault - Northlane. All Rights Reserved.');
  res.setHeader('X-DMCA-Protection', 'Enabled');
  res.setHeader('X-Content-Protection', 'Active');
  
  // Domain Protection
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  
  next();
}

// Bot Detection & User-Agent Filtering Middleware
export function botDetection(req: Request, res: Response, next: NextFunction) {
  const userAgent = (req.get('User-Agent') || '').toLowerCase();
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const path = req.path;
  
  // WHITELIST: Allow SEO files and legitimate search engine crawlers
  const seoRoutes = ['/sitemap.xml', '/robots.txt'];
  const isSeoRoute = seoRoutes.includes(path);
  
  // Legitimate Search Engine Bots (MUST be allowed for SEO)
  const legitimateSearchBots = [
    /googlebot/i,           // Google
    /bingbot/i,             // Bing
    /yahoo/i,               // Yahoo
    /duckduckbot/i,         // DuckDuckGo
    /baiduspider/i,         // Baidu
    /yandex/i,              // Yandex
    /slurp/i,               // Yahoo Slurp
    /facebot/i,             // Facebook
    /twitterbot/i,          // Twitter
    /linkedinbot/i,         // LinkedIn
    /pinterestbot/i,        // Pinterest
    /whatsapp/i,            // WhatsApp
    /slackbot/i,            // Slack
    /telegrambot/i,         // Telegram
    /applebot/i,            // Apple
    /msnbot/i,              // Microsoft MSN
    /archive\.org_bot/i,    // Internet Archive (Wayback Machine)
  ];
  
  // Check if it's a legitimate search engine bot
  const isLegitimateBot = legitimateSearchBots.some(pattern => pattern.test(userAgent));
  
  // Allow legitimate search bots to access SEO routes
  if (isSeoRoute && isLegitimateBot) {
    console.log(`[SEO] Legitimate bot allowed - Route: ${path}, User-Agent: ${userAgent}`);
    return next();
  }
  
  // Allow legitimate search bots to access main pages for indexing
  if (isLegitimateBot) {
    console.log(`[SEO] Legitimate bot allowed - Route: ${path}, User-Agent: ${userAgent}`);
    return next();
  }
  
  // Allow localhost/internal access in development (for preview, health checks, etc.)
  const isLocalhost = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
  if (isLocalhost && process.env.NODE_ENV === 'development') {
    return next();
  }

  // Known malicious bot/scraper patterns (2025 comprehensive list)
  const botPatterns = [
    // HTTP clients (exact matches)
    /^curl/i, /^wget/i, /python-urllib/i, /python-requests/i, 
    /\bjava\//i, /go-http-client/i, /libwww/i,
    /httpclient/i, /httpunit/i, /nutch/i, /phpcrawl/i,
    
    // Headless browsers (automated tools, not search engines)
    /headless/i, /phantom/i, /selenium/i, /webdriver/i, /puppeteer/i,
    /playwright/i, /chromedriver/i, /geckodriver/i,
    
    // AI scrapers (not legitimate search engines)
    /gptbot/i, /chatgpt-user/i, /anthropic-ai/i, /claude-web/i, /\bbard\b/i,
    /cohere-ai/i, /openai/i, /perplexitybot/i, /diffbot/i,
    /ccbot/i, /omgilibot/i,
    
    // Archive & Mirror sites (except Internet Archive which is whitelisted)
    /httrack/i, /teleport/i, /webcopier/i, /webzip/i,
    /offline.?explorer/i, /webcapture/i,
    
    // SEO & Analysis tools (aggressive crawlers)
    /semrushbot/i, /ahrefsbot/i, /majestic/i, /rogerbot/i, /screaming.?frog/i,
    /seokicks/i, /linkdex/i, /dotbot/i,
    
    // Vulnerability scanners
    /nmap/i, /nikto/i, /nessus/i, /acunetix/i, /burpsuite/i,
    /zaproxy/i, /sqlmap/i, /metasploit/i,
    
    // Content scrapers (specific library names)
    /scrapy/i, /beautifulsoup/i, /mechanize/i,
  ];
  
  // Check if User-Agent matches malicious bot patterns
  const isBot = botPatterns.some(pattern => pattern.test(userAgent));
  
  if (isBot) {
    // Log bot attempt
    console.warn(`[SECURITY] Malicious bot detected - IP: ${ip}, User-Agent: ${userAgent}`);
    
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Automated access is not permitted.',
      error: 'BOT_DETECTED'
    });
  }
  
  // Allow HEAD requests (used by crawlers for prefetching)
  if (req.method === 'HEAD') {
    return next();
  }
  
  // Allow requests to SEO routes without Accept header check
  if (isSeoRoute) {
    return next();
  }
  
  // Check for empty User-Agent
  if (!userAgent || userAgent.trim() === '') {
    console.warn(`[SECURITY] Empty User-Agent - IP: ${ip}`);
    
    return res.status(403).json({ 
      success: false,
      message: 'User-Agent is required.',
      error: 'NO_USER_AGENT'
    });
  }
  
  next();
}

// Honeypot Trap Middleware (detects automated form submissions)
export function honeypotTrap(req: Request, res: Response, next: NextFunction) {
  // Check for honeypot fields in request body
  const honeypotFields = ['website', 'url', 'homepage', 'bot_field', 'email_confirm'];
  
  // If any honeypot field is filled, it's likely a bot
  const honeypotTriggered = honeypotFields.some(field => req.body[field]);
  
  if (honeypotTriggered) {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    console.warn(`[SECURITY] Honeypot triggered - IP: ${ip}`);
    
    // Return success to avoid revealing honeypot detection
    return res.status(200).json({ 
      success: true,
      message: 'Request processed successfully.'
    });
  }
  
  next();
}

// Request Fingerprinting (additional security layer)
export function requestFingerprint(req: Request, res: Response, next: NextFunction) {
  const fingerprint = {
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get('User-Agent'),
    acceptLanguage: req.get('Accept-Language'),
    acceptEncoding: req.get('Accept-Encoding'),
    connection: req.get('Connection'),
    timestamp: Date.now(),
  };
  
  // Attach fingerprint to request for logging
  (req as any).fingerprint = fingerprint;
  
  next();
}
