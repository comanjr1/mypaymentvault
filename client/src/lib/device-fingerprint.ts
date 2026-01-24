/**
 * Device Fingerprint Collector
 * Collects detailed device information for security monitoring
 */

export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  googleMapsUrl: string;
}

export interface TimezoneInfo {
  timezone: string;
  utcOffset: number;
  language: string;
  languages: string[];
}

export interface ConnectionInfo {
  networkType: string;
  effectiveType: string;
  downlink?: number;
  rtt?: number;
}

export interface BrowserFeatures {
  cookiesEnabled: boolean;
  doNotTrack: boolean;
  touchSupport: boolean;
  maxTouchPoints: number;
}

export interface CanvasFingerprint {
  hash: string;
}

export interface WebGLInfo {
  renderer: string;
  vendor: string;
}

export interface VPNDetection {
  possibleVPN: boolean;
  indicators: string[];
  webrtcLeak: boolean;
}

export interface DeviceFingerprint {
  // Basic device info
  deviceType: string;
  deviceBrand: string;
  deviceModel: string;
  
  // System info
  os: string;
  osVersion: string;
  browser: string;
  browserVersion: string;
  platform: string;
  vendor: string;
  screenResolution: string;
  colorDepth: number;
  cpuCores: number;
  deviceMemory?: number;
  
  // Timezone & Language
  timezoneInfo: TimezoneInfo;
  
  // Connection
  connectionInfo: ConnectionInfo;
  
  // GPS Location (requires permission)
  gpsLocation?: GPSLocation;
  
  // Browser features
  browserFeatures: BrowserFeatures;
  
  // Plugins
  plugins: string[];
  
  // Fingerprints
  canvasFingerprint: CanvasFingerprint;
  webglInfo: WebGLInfo;
  
  // VPN Detection
  vpnDetection: VPNDetection;
  
  // User Agent
  userAgent: string;
}

/**
 * Get GPS location with user permission
 */
export async function getGPSLocation(): Promise<GPSLocation | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        resolve({
          latitude,
          longitude,
          accuracy,
          googleMapsUrl: `https://www.google.com/maps?q=${latitude},${longitude}`,
        });
      },
      () => {
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Get timezone information
 */
function getTimezoneInfo(): TimezoneInfo {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const utcOffset = -new Date().getTimezoneOffset() / 60;
  const language = navigator.language;
  const languages = Array.from(navigator.languages || [language]);

  return {
    timezone,
    utcOffset,
    language,
    languages,
  };
}

/**
 * Get connection information
 */
function getConnectionInfo(): ConnectionInfo {
  const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection;

  if (connection) {
    return {
      networkType: connection.type || 'Unknown Network',
      effectiveType: connection.effectiveType || 'Unknown',
      downlink: connection.downlink,
      rtt: connection.rtt,
    };
  }

  return {
    networkType: 'Unknown Network',
    effectiveType: 'Unknown',
  };
}

/**
 * Get browser features
 */
function getBrowserFeatures(): BrowserFeatures {
  return {
    cookiesEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack === '1' || (window as any).doNotTrack === '1',
    touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    maxTouchPoints: navigator.maxTouchPoints || 0,
  };
}

/**
 * Get installed plugins
 */
function getPlugins(): string[] {
  const plugins: string[] = [];
  if (navigator.plugins) {
    for (let i = 0; i < navigator.plugins.length; i++) {
      plugins.push(navigator.plugins[i].name);
    }
  }
  return plugins;
}

/**
 * Generate canvas fingerprint hash
 */
function getCanvasFingerprint(): CanvasFingerprint {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return { hash: 'unavailable' };

    canvas.width = 200;
    canvas.height = 50;

    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Fingerprint', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Canvas', 4, 17);

    const dataUrl = canvas.toDataURL();
    let hash = 0;
    for (let i = 0; i < dataUrl.length; i++) {
      const char = dataUrl.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    return { hash: Math.abs(hash).toString(16).substring(0, 8) };
  } catch {
    return { hash: 'unavailable' };
  }
}

/**
 * Get WebGL information
 */
function getWebGLInfo(): WebGLInfo {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      return { renderer: 'unavailable', vendor: 'unavailable' };
    }

    const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
    
    if (debugInfo) {
      return {
        renderer: (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown',
        vendor: (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'unknown',
      };
    }

    return {
      renderer: (gl as WebGLRenderingContext).getParameter((gl as WebGLRenderingContext).RENDERER) || 'unknown',
      vendor: (gl as WebGLRenderingContext).getParameter((gl as WebGLRenderingContext).VENDOR) || 'unknown',
    };
  } catch {
    return { renderer: 'unavailable', vendor: 'unavailable' };
  }
}

/**
 * Detect possible VPN usage
 */
async function detectVPN(): Promise<VPNDetection> {
  const indicators: string[] = [];
  let possibleVPN = false;
  let webrtcLeak = false;

  // Check timezone mismatch (will be compared with IP location on server)
  const timezoneInfo = getTimezoneInfo();
  indicators.push(`Timezone: ${timezoneInfo.timezone}`);

  // Check WebRTC availability
  if (window.RTCPeerConnection) {
    indicators.push('WebRTC available (check IP leak)');
    
    // Simple WebRTC leak check
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel('');
      await pc.createOffer().then(offer => pc.setLocalDescription(offer));
      
      // Wait a bit for ICE candidates
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const sdp = pc.localDescription?.sdp || '';
      const ipMatches = sdp.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g);
      
      if (ipMatches && ipMatches.length > 0) {
        // Found local IPs - no leak detected (private IPs are normal)
        const publicIps = ipMatches.filter(ip => 
          !ip.startsWith('10.') && 
          !ip.startsWith('192.168.') && 
          !ip.startsWith('172.') &&
          !ip.startsWith('127.')
        );
        webrtcLeak = publicIps.length > 0;
      }
      
      pc.close();
    } catch {
      // WebRTC check failed
    }
  } else {
    indicators.push('WebRTC not available');
  }

  return {
    possibleVPN,
    indicators,
    webrtcLeak,
  };
}

/**
 * Parse OS from user agent
 */
function parseOS(): { name: string; version: string } {
  const ua = navigator.userAgent;
  
  if (/Windows NT 10/.test(ua)) return { name: 'Windows', version: '10.0 (v10/11)' };
  if (/Windows NT 6.3/.test(ua)) return { name: 'Windows', version: '8.1' };
  if (/Windows NT 6.2/.test(ua)) return { name: 'Windows', version: '8' };
  if (/Windows NT 6.1/.test(ua)) return { name: 'Windows', version: '7' };
  if (/Mac OS X (\d+[._]\d+)/.test(ua)) {
    const match = ua.match(/Mac OS X (\d+[._]\d+)/);
    return { name: 'macOS', version: match ? match[1].replace('_', '.') : 'Unknown' };
  }
  if (/Android (\d+\.?\d*)/.test(ua)) {
    const match = ua.match(/Android (\d+\.?\d*)/);
    return { name: 'Android', version: match ? match[1] : 'Unknown' };
  }
  if (/iPhone OS (\d+_\d+)/.test(ua)) {
    const match = ua.match(/iPhone OS (\d+_\d+)/);
    return { name: 'iOS', version: match ? match[1].replace('_', '.') : 'Unknown' };
  }
  if (/Linux/.test(ua)) return { name: 'Linux', version: 'Unknown' };
  
  return { name: 'Unknown', version: 'Unknown' };
}

/**
 * Parse browser from user agent
 */
function parseBrowser(): { name: string; version: string } {
  const ua = navigator.userAgent;
  
  if (/Firefox\/(\d+\.?\d*)/.test(ua)) {
    const match = ua.match(/Firefox\/(\d+\.?\d*)/);
    return { name: 'Firefox', version: match ? match[1] : 'Unknown' };
  }
  if (/Edg\/(\d+\.?\d*)/.test(ua)) {
    const match = ua.match(/Edg\/(\d+\.?\d*)/);
    return { name: 'Edge', version: match ? match[1] : 'Unknown' };
  }
  if (/Chrome\/(\d+\.?\d*)/.test(ua)) {
    const match = ua.match(/Chrome\/(\d+\.?\d*)/);
    return { name: 'Chrome', version: match ? match[1] : 'Unknown' };
  }
  if (/Safari\/(\d+\.?\d*)/.test(ua) && !/Chrome/.test(ua)) {
    const match = ua.match(/Version\/(\d+\.?\d*)/);
    return { name: 'Safari', version: match ? match[1] : 'Unknown' };
  }
  
  return { name: 'Unknown', version: 'Unknown' };
}

/**
 * Get device type and brand
 */
function getDeviceInfo(): { type: string; brand: string; model: string } {
  const ua = navigator.userAgent;
  
  if (/Mobile/.test(ua)) {
    if (/iPhone/.test(ua)) return { type: 'Mobile', brand: 'Apple', model: 'iPhone' };
    if (/Android/.test(ua)) {
      const match = ua.match(/;\s*([^;]+)\s*Build/);
      return { type: 'Mobile', brand: 'Android', model: match ? match[1].trim() : 'Android Phone' };
    }
    return { type: 'Mobile', brand: 'Unknown', model: 'Mobile Device' };
  }
  
  if (/Tablet|iPad/.test(ua)) {
    if (/iPad/.test(ua)) return { type: 'Tablet', brand: 'Apple', model: 'iPad' };
    return { type: 'Tablet', brand: 'Unknown', model: 'Tablet' };
  }
  
  // Desktop
  if (/Windows/.test(ua)) return { type: 'Desktop', brand: 'Microsoft', model: 'Windows PC' };
  if (/Macintosh/.test(ua)) return { type: 'Desktop', brand: 'Apple', model: 'Mac' };
  if (/Linux/.test(ua)) return { type: 'Desktop', brand: 'Linux', model: 'Linux PC' };
  
  return { type: 'Desktop', brand: 'Unknown', model: 'Unknown' };
}

/**
 * Collect all device fingerprint data
 */
export async function collectDeviceFingerprint(includeGPS: boolean = false): Promise<DeviceFingerprint> {
  const os = parseOS();
  const browser = parseBrowser();
  const deviceInfo = getDeviceInfo();
  const vpnDetection = await detectVPN();
  
  const fingerprint: DeviceFingerprint = {
    // Basic device info
    deviceType: deviceInfo.type,
    deviceBrand: deviceInfo.brand,
    deviceModel: deviceInfo.model,
    
    // System info
    os: os.name,
    osVersion: os.version,
    browser: browser.name,
    browserVersion: browser.version,
    platform: navigator.platform,
    vendor: navigator.vendor || 'N/A',
    screenResolution: `${window.screen.width}x${window.screen.height} (${window.devicePixelRatio}x)`,
    colorDepth: window.screen.colorDepth,
    cpuCores: navigator.hardwareConcurrency || 0,
    deviceMemory: (navigator as any).deviceMemory,
    
    // Timezone & Language
    timezoneInfo: getTimezoneInfo(),
    
    // Connection
    connectionInfo: getConnectionInfo(),
    
    // Browser features
    browserFeatures: getBrowserFeatures(),
    
    // Plugins
    plugins: getPlugins(),
    
    // Fingerprints
    canvasFingerprint: getCanvasFingerprint(),
    webglInfo: getWebGLInfo(),
    
    // VPN Detection
    vpnDetection,
    
    // User Agent
    userAgent: navigator.userAgent,
  };
  
  // Get GPS if permission granted
  if (includeGPS) {
    fingerprint.gpsLocation = await getGPSLocation() || undefined;
  }
  
  return fingerprint;
}

/**
 * Store fingerprint in session storage
 */
export function storeFingerprint(fingerprint: DeviceFingerprint): void {
  try {
    sessionStorage.setItem('deviceFingerprint', JSON.stringify(fingerprint));
  } catch {
    // Storage not available
  }
}

/**
 * Get stored fingerprint
 */
export function getStoredFingerprint(): DeviceFingerprint | null {
  try {
    const data = sessionStorage.getItem('deviceFingerprint');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Check if user has consented to cookies/location
 */
export function hasUserConsented(): boolean {
  return localStorage.getItem('cookieConsent') === 'true';
}

/**
 * Set user consent
 */
export function setUserConsent(consent: boolean): void {
  localStorage.setItem('cookieConsent', consent ? 'true' : 'false');
}
