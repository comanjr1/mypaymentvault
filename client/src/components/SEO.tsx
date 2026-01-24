import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
  breadcrumbs?: Array<{ name: string; url: string }>;
  faqItems?: Array<{ question: string; answer: string }>;
}

export function SEO({ 
  title, 
  description, 
  keywords = "login mypaymentvault, login wirecard, login north lane, login northlane, login wirecard 2, login onbe 1, mypaymentvault northlane, northlane login, mypaymentvault login, wirecard login, north lane login, northlane mypaymentvault login, wirecard 2 login, onbe 1 login, my payment vault northlane, northlane payment vault, wirecard payment portal, north lane payment gateway, onbe payment system, employee payment portal northlane, secure payment login, mypaymentvault card login, wirecard card authentication, northlane card authentication, north lane secure access, onbe card portal, payment vault access northlane, mypaymentvault account login, northlane employee portal, wirecard employee access, royal caribbean mypaymentvault, wirecard login alternative, north lane login portal, northlane secure login, multi factor authentication login, mypaymentvault otp login, wirecard otp verification, northlane payment gateway, north lane payment processing, onbe secure authentication, employee card portal northlane, mypaymentvault sign in, wirecard sign in, northlane cardholder login, payment processing northlane, mypaymentvault portal access, wirecard portal access, northlane vault login, north lane vault access, secure employee payment northlane, mypaymentvault 24/7 access, wirecard 24/7 portal, mypaymentvault activate card, wirecard card activation, mypaymentvault card activation, activate mypaymentvault card online, activate wirecard online, mypaymentvault forgot username, wirecard forgot username, mypaymentvault forgot password, wirecard forgot password, north lane password reset, mypaymentvault username recovery, wirecard username recovery, mypaymentvault password reset, wirecard password reset, mypaymentvault register, wirecard register, northlane registration, mypaymentvault registration, wirecard registration, north lane signup, mypaymentvault create account, wirecard create account, mypaymentvault help, wirecard help, northlane help, mypaymentvault support, wirecard support, north lane support, mypaymentvault customer service, wirecard customer service, royal caribbean group payment vault, payment gateway login, secure payment access, card authentication system, employee payment portal, payment vault access, online payment login, secure employee portal, payment card portal",
  canonical,
  ogType = "website",
  ogImage = "https://login-mypaymentvaultl.com/og-image.png",
  breadcrumbs,
  faqItems
}: SEOProps) {
  useEffect(() => {
    // Update title
    document.title = title;
    
    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Standard meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    updateMetaTag('googlebot', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    updateMetaTag('bingbot', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    updateMetaTag('author', 'MyPaymentVault');
    updateMetaTag('publisher', 'MyPaymentVault');
    updateMetaTag('language', 'English, Spanish, French');
    updateMetaTag('revisit-after', '1 days');
    
    // Get current URL for OG/Twitter
    const currentUrl = canonical || window.location.href;
    
    // Open Graph meta tags for social sharing
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:type', ogType, true);
    updateMetaTag('og:url', currentUrl, true);
    updateMetaTag('og:image', ogImage, true);
    updateMetaTag('og:image:width', '1200', true);
    updateMetaTag('og:image:height', '630', true);
    updateMetaTag('og:image:alt', 'MyPaymentVault Secure Login Portal', true);
    updateMetaTag('og:site_name', 'MyPaymentVault Login Portal', true);
    updateMetaTag('og:locale', 'en_US', true);
    updateMetaTag('og:locale:alternate', 'es_ES', true);
    updateMetaTag('og:locale:alternate', 'fr_FR', true);
    
    // Twitter Card meta tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:url', currentUrl);
    updateMetaTag('twitter:image', ogImage);
    updateMetaTag('twitter:image:alt', 'MyPaymentVault Secure Login Portal');
    
    // Canonical URL
    const baseUrl = 'https://login-mypaymentvaultt.com';
    const canonicalUrl = canonical || currentUrl;
    
    let linkElement = document.querySelector('link[rel="canonical"]');
    if (!linkElement) {
      linkElement = document.createElement('link');
      linkElement.setAttribute('rel', 'canonical');
      document.head.appendChild(linkElement);
    }
    linkElement.setAttribute('href', canonicalUrl);
    
    // Hreflang tags for multi-language support (EN, ES, FR)
    const hreflangs = [
      { lang: 'en', url: canonicalUrl },
      { lang: 'es', url: canonicalUrl },
      { lang: 'fr', url: canonicalUrl },
      { lang: 'x-default', url: canonicalUrl }
    ];
    
    // Remove existing hreflang tags
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());
    
    hreflangs.forEach(({ lang, url }) => {
      const hreflangLink = document.createElement('link');
      hreflangLink.setAttribute('rel', 'alternate');
      hreflangLink.setAttribute('hreflang', lang);
      hreflangLink.setAttribute('href', url);
      document.head.appendChild(hreflangLink);
    });
    
    // DNS Prefetch and Preconnect for performance
    const addResourceHint = (rel: string, href: string) => {
      if (!document.querySelector(`link[rel="${rel}"][href="${href}"]`)) {
        const link = document.createElement('link');
        link.setAttribute('rel', rel);
        link.setAttribute('href', href);
        document.head.appendChild(link);
      }
    };
    
    addResourceHint('dns-prefetch', 'https://fonts.googleapis.com');
    addResourceHint('preconnect', 'https://fonts.googleapis.com');
    addResourceHint('preconnect', 'https://fonts.gstatic.com');
    
    // Multiple Structured Data Schemas (JSON-LD)
    const schemas: any[] = [];
    
    // 1. Organization Schema
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "MyPaymentVault",
      "alternateName": "My Payment Vault",
      "url": baseUrl,
      "logo": `${baseUrl}/logo-dark.png`,
      "description": "Secure payment vault login portal for employee and cardholder authentication. Official MyPaymentVault login access for Royal Caribbean Group employees.",
      "sameAs": [
        baseUrl
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "Customer Service",
        "availableLanguage": ["English", "Spanish", "French"]
      }
    });
    
    // 2. WebSite Schema with SearchAction
    schemas.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Login MyPaymentVault",
      "alternateName": ["MyPaymentVault Login Portal", "My Payment Vault Login", "MyPaymentVault Sign In"],
      "url": baseUrl,
      "description": "Official login portal for MyPaymentVault - Secure employee payment vault access with multi-factor authentication",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${baseUrl}/?q={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      },
      "inLanguage": ["en", "es", "fr"]
    });
    
    // 3. WebPage Schema
    schemas.push({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": title,
      "description": description,
      "url": canonicalUrl,
      "inLanguage": ["en", "es", "fr"],
      "isPartOf": {
        "@type": "WebSite",
        "name": "MyPaymentVault",
        "url": baseUrl
      },
      "primaryImageOfPage": {
        "@type": "ImageObject",
        "url": ogImage,
        "width": 1200,
        "height": 630
      },
      "datePublished": "2024-01-01T00:00:00+00:00",
      "dateModified": "2025-10-20T00:00:00+00:00"
    });
    
    // 4. SoftwareApplication Schema (Login Portal as WebApplication)
    schemas.push({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "MyPaymentVault Login Portal",
      "applicationCategory": "BusinessApplication",
      "applicationSubCategory": "Payment Portal",
      "operatingSystem": "Web Browser",
      "url": baseUrl,
      "description": "Secure multi-factor authentication portal for MyPaymentVault employee payment cards",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "featureList": [
        "Multi-factor authentication",
        "Secure login with OTP verification",
        "Card registration and activation",
        "Username and password recovery",
        "Multi-language support (EN, ES, FR)"
      ]
    });
    
    // 5. BreadcrumbList Schema (if breadcrumbs provided)
    if (breadcrumbs && breadcrumbs.length > 0) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbs.map((crumb, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": crumb.name,
          "item": `${baseUrl}${crumb.url}`
        }))
      });
    }
    
    // 6. FAQPage Schema (if FAQ items provided) - Enhanced for Featured Snippets
    if (faqItems && faqItems.length > 0) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqItems.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      });
    }
    
    // Remove existing JSON-LD scripts
    document.querySelectorAll('script[type="application/ld+json"]').forEach(el => el.remove());
    
    // Add all schemas
    schemas.forEach(schema => {
      const scriptElement = document.createElement('script');
      scriptElement.setAttribute('type', 'application/ld+json');
      scriptElement.textContent = JSON.stringify(schema);
      document.head.appendChild(scriptElement);
    });
  }, [title, description, keywords, canonical, ogType, ogImage, breadcrumbs, faqItems]);

  return null;
}
