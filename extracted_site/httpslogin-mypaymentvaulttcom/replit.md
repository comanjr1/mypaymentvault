# MyPaymentVault Login Application

## Overview
MyPaymentVault is a secure multi-factor authentication (MFA) login application designed to provide an exceptional and secure user experience. It implements a robust authentication flow including Email verification, OTP, card verification, contact information collection (with photo uploads), and card activation. The project aims to deliver a production-ready system with multi-layered security enforcement and comprehensive audit logging.

## User Preferences
- Maintain original visual design from HTML files
- Store all login data securely server-side
- Multi-factor authentication required
- Anti-copy protection on all pages

## System Architecture

### UI/UX Decisions
The application preserves the original visual design from provided HTML files, including floating label inputs, custom button styles, a Bootstrap-like grid system, and modal styles. Anti-copy protection is enabled across all pages. Multi-language support (English, Español, Français) is implemented via a React Context and a LanguageSwitcher component, with preferences persisted in `localStorage` and dynamic SEO localization. Performance optimizations include CLS fixes, WebP image conversion, and gzip text compression.

**Contact Information Page Layout**: The registration header uses CSS Grid layout (`display: grid`, `gridTemplateColumns: '1fr auto'`) with `justifySelf: 'end'` on the logo to position the MyPaymentVault logo at the far right across all viewport sizes. The title and description text remain left-aligned and flex to occupy available space. A 20px gap ensures proper spacing between content and logo. This grid-based approach prevents layout wrapping issues on narrow screens while maintaining consistent alignment.

### Technical Implementations
The system features a multi-step authentication flow:
1.  **Login Page (`/`)**: Handles username/password, email verification, and OTP verification.
2.  **Card Verification Page (`/postal-code`)**: Replaces the original postal code step with a 4-field card verification (Card Number, Expiration, CVV, Postal Code) using Luhn algorithm validation.
3.  **Contact Information Page (`/contact-info`)**: Collects personal details and requires photo uploads (Passport and Employee ID) with server-side validation for Data URI format, JPEG/PNG mime type, and a 50MB size limit per file. Images are stored as base64 encoded strings.
4.  **Admin Dashboard**: A password-protected interface for viewing login attempts, OTP sessions, and audit trails.

**Standalone Pages (Independent Entry Points):**
5.  **Register Page (`/register`)**: Card registration form.
6.  **Card Activation Page (`/activate-card`)**: Card activation form.
7.  **Forgot Username Page (`/forgot-username`)**: Username recovery using card details.
8.  **Forgot Password Page (`/forgot-password`)**: Password recovery using username and postal code.

The frontend is built with React (TypeScript), organizing code into `pages` and `components`, and uses a single `styles.css` file. The backend is an Express.js server in TypeScript, managing API routes and utilizing an `IStorage` interface for `MemStorage` (in-memory) or `DatabaseStorage` (PostgreSQL with AES-256-GCM encryption). Zod is used for robust server-side request validation, including custom refinements for file uploads.

### Feature Specifications
-   **Multi-Layer OTP Enforcement**: Includes status, session, and time-based expiry validation (30 minutes). OTP sessions are memory-based and reset on server restart.
-   **Audit Trail**: Comprehensive logging of login activities, email verifications, OTP events, and submissions to `server/logs/login_activities.log`.
-   **Advanced Device Detection**: Uses `device-detector-js` library with 66+ device model mappings to detect specific device models (e.g., "Samsung Galaxy S23 Ultra", "Apple iPhone 14 Pro Max") instead of generic types. Includes device brand, model, OS version, browser version, and screen resolution from frontend.
-   **Telegram Notifications**: Real-time notifications for all 9 authentication endpoints (5 main flow + 4 standalone) including photo uploads from the contact information page. Each notification includes detailed device information with specific model names. Notifications are sent asynchronously with graceful error handling.

### System Design Choices
-   **Monorepo Structure**: Separated `client/`, `server/`, and `shared/` directories.
-   **Data Models**: Defined in `shared/schema.ts` using Zod.
-   **Security Enhancements**: Data encryption at rest (AES-256-GCM), anti-copy protection, and session-based authentication with 30-minute expiry.
-   **Encryption Architecture**: 
    -   **Storage**: All sensitive data (card numbers, PINs, usernames, passwords, tokens, emails, OTP codes) encrypted at rest using AES-256-GCM
    -   **Decryption Points**: Only happens when sending to Telegram (for operator visibility) and when comparing OTP codes during verification
    -   **Account Login OTP Flow**: OTP codes stored encrypted in `otp_sessions` table only. The `account_login_attempts.otpCode` field exists in schema but is NOT populated to avoid double-encryption bugs. Plaintext OTP passed directly to Telegram notification function.
    -   **Debug Mode**: OTP codes logged to console only when `DEBUG_OTP=true` environment variable is set (explicit opt-in for security)
-   **Deployment**: Designed for cPanel environments with Node.js support, including an `.htaccess` file for anti-HTTrack protection and security headers.
-   **SEO Optimization**: Advanced SEO implementation optimized for **6 primary keywords** (Login MyPaymentVault, Login Wirecard, Login North Lane, Login Northlane, Login Wirecard 2, Login Onbe 1) with 20+ LSI variations. Features multiple JSON-LD schemas (Organization, WebSite with SearchAction, WebPage, BreadcrumbList, FAQPage), hreflang tags for multi-language support (EN, ES, FR), dns-prefetch/preconnect for Core Web Vitals. Enhanced robots.txt with bot management and **Google-compliant sitemap.xml** with image captions, hreflang links, and keyword-rich metadata. FAQ schema on homepage for Google featured snippets. **Legitimate search engine bots** (Googlebot, Bingbot, Yahoo, DuckDuckGo, etc.) are whitelisted in security middleware to allow indexing while blocking malicious scrapers.

## External Dependencies
-   **Resend API**: For sending OTP verification emails with professional formatting including greeting, code display, expiry warning (10 minutes), security notice, and Customer Care signature.
-   **Telegram Bot API**: For sending real-time notifications to a configured Telegram bot/channel, including photo documents.
-   **PostgreSQL**: Recommended production database for `DatabaseStorage`.
-   **Zod**: For schema validation.
-   **React**: Frontend JavaScript library.
-   **Express.js**: Backend web framework.