import { Request } from 'express';
import DeviceDetector from 'device-detector-js';

export interface DeviceInfo {
  deviceType: 'Mobile' | 'Tablet' | 'Desktop' | 'Unknown';
  deviceModel: string; // NEW: Specific device model like "iPhone 14 Pro Max"
  deviceBrand: string; // NEW: Brand like "Apple", "Samsung"
  os: string;
  browser: string;
  screenResolution?: string;
  userAgent: string;
}

const deviceDetector = new DeviceDetector();

// Model mapping untuk nama marketing yang lebih user-friendly
const MODEL_MAPPING: { [key: string]: string } = {
  // Samsung Galaxy Series
  'SM-S928B': 'Samsung Galaxy S24 Ultra',
  'SM-S926B': 'Samsung Galaxy S24+',
  'SM-S921B': 'Samsung Galaxy S24',
  'SM-S918B': 'Samsung Galaxy S23 Ultra',
  'SM-S916B': 'Samsung Galaxy S23+',
  'SM-S911B': 'Samsung Galaxy S23',
  'SM-S908B': 'Samsung Galaxy S22 Ultra',
  'SM-S906B': 'Samsung Galaxy S22+',
  'SM-S901B': 'Samsung Galaxy S22',
  'SM-G998B': 'Samsung Galaxy S21 Ultra',
  'SM-G996B': 'Samsung Galaxy S21+',
  'SM-G991B': 'Samsung Galaxy S21',
  'SM-A536B': 'Samsung Galaxy A53',
  'SM-A546B': 'Samsung Galaxy A54',
  'SM-A556B': 'Samsung Galaxy A55',
  
  // Apple iPhone (berdasarkan identifier dari iOS version)
  'iPhone15,3': 'Apple iPhone 14 Pro Max',
  'iPhone15,2': 'Apple iPhone 14 Pro',
  'iPhone14,3': 'Apple iPhone 13 Pro Max',
  'iPhone14,2': 'Apple iPhone 13 Pro',
  'iPhone13,4': 'Apple iPhone 12 Pro Max',
  'iPhone13,3': 'Apple iPhone 12 Pro',
  
  // Xiaomi
  '2211133C': 'Xiaomi 12T Pro',
  '2201123G': 'Xiaomi 12 Pro',
  '2211133G': 'Xiaomi 12T',
  '22071212AG': 'Xiaomi 12S Ultra',
  
  // Google Pixel
  'Pixel 8 Pro': 'Google Pixel 8 Pro',
  'Pixel 8': 'Google Pixel 8',
  'Pixel 7 Pro': 'Google Pixel 7 Pro',
  'Pixel 7': 'Google Pixel 7',
  
  // OnePlus
  'CPH2449': 'OnePlus 11 5G',
  'CPH2423': 'OnePlus 11',
  
  // Oppo
  'CPH2451': 'Oppo Find X6 Pro',
  
  // Vivo
  'V2227A': 'Vivo X90 Pro',
  
  // Huawei
  'ELS-NX9': 'Huawei P50 Pro',
};

export function detectDevice(req: Request, screenResolution?: string): DeviceInfo {
  const userAgent = req.headers['user-agent'] || 'Unknown';
  
  // Parse user agent with device-detector-js
  const result = deviceDetector.parse(userAgent);
  
  // Extract device information
  const deviceType = getDeviceType(result);
  const deviceModel = getDeviceModel(result);
  const deviceBrand = getDeviceBrand(result);
  const os = getOperatingSystem(result);
  const browser = getBrowser(result);
  
  return {
    deviceType,
    deviceModel,
    deviceBrand,
    os,
    browser,
    screenResolution,
    userAgent,
  };
}

function getDeviceType(result: any): 'Mobile' | 'Tablet' | 'Desktop' | 'Unknown' {
  if (!result.device) return 'Unknown';
  
  const type = result.device.type?.toLowerCase();
  
  if (type === 'smartphone') return 'Mobile';
  if (type === 'tablet') return 'Tablet';
  if (type === 'desktop') return 'Desktop';
  if (type === 'tv') return 'Desktop'; // Smart TV treated as desktop
  if (type === 'car browser') return 'Desktop';
  
  // If client info exists but no specific type, check OS
  if (result.os?.name) {
    const osName = result.os.name.toLowerCase();
    if (osName.includes('ios') || osName.includes('android')) {
      return 'Mobile';
    }
  }
  
  return 'Desktop'; // Default fallback
}

function getDeviceModel(result: any): string {
  if (!result.device) return 'Unknown Device';
  
  const brand = result.device.brand || '';
  const model = result.device.model || '';
  
  // 1. Check MODEL_MAPPING terlebih dahulu (prioritas tertinggi)
  if (model && MODEL_MAPPING[model]) {
    return MODEL_MAPPING[model];
  }
  
  // 2. Check partial match untuk model (contoh: jika model="SM-S911B Build/TP1A")
  if (model) {
    const modelCode = model.split(' ')[0]; // Ambil kode pertama saja
    if (MODEL_MAPPING[modelCode]) {
      return MODEL_MAPPING[modelCode];
    }
  }
  
  // 3. Untuk iPhone, coba extract dari OS version
  if (brand.toLowerCase() === 'apple' || result.os?.name?.includes('iOS')) {
    // iPhone biasanya punya format seperti "iPhone15,3" di User-Agent
    const iphoneMatch = result.device.userAgent?.match(/iPhone(\d+,\d+)/);
    if (iphoneMatch && MODEL_MAPPING[iphoneMatch[0]]) {
      return MODEL_MAPPING[iphoneMatch[0]];
    }
    
    // Fallback untuk iPhone generic
    if (model.toLowerCase().includes('ipad')) {
      return 'Apple iPad';
    }
    return 'Apple iPhone';
  }
  
  // 4. If we have both brand and model, combine them intelligently
  if (brand && model) {
    // Check if model already contains brand name
    if (model.toLowerCase().includes(brand.toLowerCase())) {
      return model;
    }
    return `${brand} ${model}`;
  }
  
  // 5. If only model, return it
  if (model) return model;
  
  // 6. If only brand, return brand with device type
  if (brand) {
    const type = result.device.type || 'Device';
    const typeName = type.charAt(0).toUpperCase() + type.slice(1);
    
    // Spesial handling untuk brand terkenal
    if (brand.toLowerCase() === 'apple') {
      if (typeName === 'Tablet') return 'Apple iPad';
      if (typeName === 'Desktop') return 'Apple Mac';
      return 'Apple iPhone';
    }
    if (brand.toLowerCase() === 'samsung') return `Samsung ${typeName}`;
    if (brand.toLowerCase() === 'xiaomi') return `Xiaomi ${typeName}`;
    if (brand.toLowerCase() === 'huawei') return `Huawei ${typeName}`;
    
    return `${brand} ${typeName}`;
  }
  
  // 7. Fallback based on OS
  if (result.os?.name) {
    const osName = result.os.name;
    if (osName.includes('iOS')) return 'Apple iPhone/iPad';
    if (osName.includes('Android')) return 'Android Device';
    if (osName.includes('Windows')) return 'Windows PC';
    if (osName.includes('Mac')) return 'Apple Mac';
  }
  
  return 'Unknown Device';
}

function getDeviceBrand(result: any): string {
  if (!result.device?.brand) {
    // Try to infer from OS
    if (result.os?.name) {
      const osName = result.os.name.toLowerCase();
      if (osName.includes('ios') || osName.includes('mac')) return 'Apple';
      if (osName.includes('windows')) return 'Microsoft';
    }
    return 'Unknown';
  }
  
  return result.device.brand;
}

function getOperatingSystem(result: any): string {
  if (!result.os) return 'Unknown OS';
  
  const name = result.os.name || 'Unknown OS';
  const version = result.os.version || '';
  
  if (version) {
    return `${name} ${version}`;
  }
  
  return name;
}

function getBrowser(result: any): string {
  if (!result.client) return 'Unknown Browser';
  
  const name = result.client.name || 'Unknown Browser';
  const version = result.client.version || '';
  
  if (version) {
    return `${name} ${version}`;
  }
  
  return name;
}

export function formatDeviceInfo(device: DeviceInfo): string {
  let info = '';
  
  // Device Model (most important)
  info += `📱 Device: ${device.deviceModel}\n`;
  
  // Operating System
  info += `💻 OS: ${device.os}\n`;
  
  // Browser
  info += `🌐 Browser: ${device.browser}`;
  
  // Screen Resolution (if available)
  if (device.screenResolution) {
    info += `\n📺 Screen: ${device.screenResolution}`;
  }
  
  return info;
}
