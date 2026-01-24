import { Resend } from 'resend';

// Default from email for OTP notifications
// Use Resend test email if domain not verified, or your verified domain email
const DEFAULT_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

async function getCredentialsFromConnector() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken || !hostname) {
    return null;
  }

  try {
    const connectionSettings = await fetch(
      'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      }
    ).then(res => res.json()).then(data => data.items?.[0]);

    if (connectionSettings?.settings?.api_key) {
      return {
        apiKey: connectionSettings.settings.api_key, 
        fromEmail: connectionSettings.settings.from_email || DEFAULT_FROM_EMAIL
      };
    }
  } catch (error) {
    console.log('[Resend] Connector fetch failed, will try env var:', error);
  }
  
  return null;
}

async function getCredentials() {
  // Priority 1: Use RESEND_API_KEY from environment variable (Secrets)
  const envApiKey = process.env.RESEND_API_KEY;
  if (envApiKey) {
    console.log('[Resend] Using API key from environment variable');
    return {
      apiKey: envApiKey,
      fromEmail: process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL
    };
  }

  // Priority 2: Try Replit Connectors
  const connectorCredentials = await getCredentialsFromConnector();
  if (connectorCredentials) {
    console.log('[Resend] Using API key from Replit Connector');
    return connectorCredentials;
  }

  throw new Error('Resend API key not found. Please set RESEND_API_KEY in Secrets.');
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getUncachableResendClient() {
  const credentials = await getCredentials();
  
  // Validate API key format
  if (!credentials.apiKey || !credentials.apiKey.startsWith('re_')) {
    console.error('[Resend] Invalid API key format. Key should start with "re_"');
    throw new Error('Invalid Resend API key format');
  }
  
  console.log('[Resend] Client initialized:');
  console.log('[Resend]   API Key: re_****' + credentials.apiKey.slice(-4));
  console.log('[Resend]   From Email:', credentials.fromEmail);
  
  return {
    client: new Resend(credentials.apiKey),
    fromEmail: credentials.fromEmail
  };
}
