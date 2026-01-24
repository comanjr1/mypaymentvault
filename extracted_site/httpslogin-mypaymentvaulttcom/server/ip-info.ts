import axios from 'axios';

export interface IpInfo {
  ip: string;
  isp: string;
  org: string;
  asn: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  timezone: string;
  proxy: boolean;
  hosting: boolean;
}

/**
 * Fetch detailed IP information from ip-api.com
 * Free API with 45 requests per minute limit
 */
export async function getIpInfo(ipAddress: string): Promise<IpInfo> {
  const defaultInfo: IpInfo = {
    ip: ipAddress,
    isp: 'Unknown',
    org: 'Unknown',
    asn: 'Unknown',
    city: 'Unknown',
    region: 'Unknown',
    country: 'Unknown',
    countryCode: 'Unknown',
    timezone: 'Unknown',
    proxy: false,
    hosting: false,
  };

  // Skip lookup for localhost/private IPs
  if (ipAddress === 'unknown' || 
      ipAddress === '127.0.0.1' || 
      ipAddress === '::1' ||
      ipAddress.startsWith('192.168.') ||
      ipAddress.startsWith('10.') ||
      ipAddress.startsWith('172.')) {
    return { ...defaultInfo, isp: 'Local Network', org: 'Private IP' };
  }

  try {
    // Use ip-api.com with extended fields
    const response = await axios.get(
      `http://ip-api.com/json/${ipAddress}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,proxy,hosting,query`,
      { timeout: 5000 }
    );

    if (response.data.status === 'success') {
      const data = response.data;
      return {
        ip: data.query || ipAddress,
        isp: data.isp || 'Unknown',
        org: data.org || 'Unknown',
        asn: data.as || 'Unknown', // AS number includes subnet info like "AS12345 Company Name"
        city: data.city || 'Unknown',
        region: data.regionName || 'Unknown',
        country: data.country || 'Unknown',
        countryCode: data.countryCode || 'Unknown',
        timezone: data.timezone || 'Unknown',
        proxy: data.proxy || false,
        hosting: data.hosting || false,
      };
    }

    console.log('[IP Info] API returned non-success status:', response.data.message);
    return defaultInfo;
  } catch (error) {
    console.error('[IP Info] Failed to fetch IP details:', error);
    return defaultInfo;
  }
}

/**
 * Format IP info for display in Telegram messages
 */
export function formatIpInfo(ipInfo: IpInfo): string {
  let info = `   • IP Address: ${ipInfo.ip}\n`;
  info += `   • ISP: ${ipInfo.isp}\n`;
  info += `   • Organization: ${ipInfo.org}\n`;
  info += `   • ASN/Subnet: ${ipInfo.asn}\n`;
  info += `   • Location: ${ipInfo.city}, ${ipInfo.region}, ${ipInfo.country} (${ipInfo.countryCode})\n`;
  info += `   • Timezone: ${ipInfo.timezone}\n`;
  
  if (ipInfo.proxy) {
    info += `   • ⚠️ Proxy/VPN Detected: Yes\n`;
  }
  if (ipInfo.hosting) {
    info += `   • ⚠️ Hosting/Datacenter: Yes\n`;
  }
  
  return info;
}
