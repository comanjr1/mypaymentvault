import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  collectDeviceFingerprint, 
  storeFingerprint, 
  hasUserConsented, 
  setUserConsent,
  getGPSLocation
} from '@/lib/device-fingerprint';

interface CookieConsentProps {
  onConsent?: (hasGPS: boolean) => void;
}

export function CookieConsent({ onConsent }: CookieConsentProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    if (!hasUserConsented()) {
      // Small delay to not show immediately
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      // Already consented, collect fingerprint
      collectAndStore(false);
    }
  }, []);

  const collectAndStore = async (requestGPS: boolean) => {
    setIsCollecting(true);
    try {
      // If requesting GPS, get location first
      let hasGPS = false;
      if (requestGPS) {
        const gps = await getGPSLocation();
        hasGPS = gps !== null;
      }
      
      // Collect full fingerprint
      const fingerprint = await collectDeviceFingerprint(requestGPS);
      storeFingerprint(fingerprint);
      
      onConsent?.(hasGPS);
    } catch (error) {
      console.error('Failed to collect fingerprint:', error);
    }
    setIsCollecting(false);
  };

  const handleAccept = async () => {
    setUserConsent(true);
    setShowBanner(false);
    
    // Collect fingerprint with GPS
    await collectAndStore(true);
  };

  const handleDecline = () => {
    setUserConsent(true);
    setShowBanner(false);
    
    // Collect fingerprint without GPS
    collectAndStore(false);
  };

  if (!showBanner) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.95)' }}
      data-testid="cookie-consent-banner"
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-white text-sm md:text-base">
            <p className="font-semibold mb-1">Cookie & Location Notice</p>
            <p className="text-gray-300 text-xs md:text-sm">
              We use cookies and location services to enhance your security and provide better services. 
              By clicking "Accept", you consent to our use of cookies and allow us to access your location 
              for verification purposes.
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDecline}
              disabled={isCollecting}
              className="text-white border-gray-500 hover:bg-gray-800"
              data-testid="button-cookie-decline"
            >
              Decline
            </Button>
            <Button
              size="sm"
              onClick={handleAccept}
              disabled={isCollecting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="button-cookie-accept"
            >
              {isCollecting ? 'Processing...' : 'Accept All'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
