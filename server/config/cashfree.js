import { Cashfree, CFEnvironment } from 'cashfree-pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env relative to server root as well as cwd
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

/**
 * Dynamically resolves Cashfree Payment Gateway configuration
 * Supports both SANDBOX and PRODUCTION environments
 * Automatically adapts if Production/Sandbox keys are detected
 */
export const getCashfreeConfig = (req = null) => {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
  dotenv.config();

  const appId = (process.env.CASHFREE_APP_ID || process.env.CASHFREE_CLIENT_ID || '').trim();
  const secretKey = (process.env.CASHFREE_SECRET_KEY || '').trim();
  let env = (process.env.CASHFREE_ENV || '').trim().toUpperCase();
  const apiVersion = (process.env.CASHFREE_API_VERSION || '2023-08-01').trim();

  // Smart environment resolution based on secret key prefix
  if (secretKey.includes('_prod_')) {
    env = 'PRODUCTION';
  } else if (secretKey.includes('_test_')) {
    env = 'SANDBOX';
  } else if (!env) {
    env = 'SANDBOX';
  }

  const cfEnv = env === 'PRODUCTION'
    ? CFEnvironment.PRODUCTION
    : CFEnvironment.SANDBOX;

  // Instantiate Cashfree SDK client
  const cashfreeClient = new Cashfree(cfEnv, appId, secretKey);
  cashfreeClient.XApiVersion = apiVersion;

  // Determine client URL dynamically from request header or environment
  let clientUrl = process.env.CLIENT_URL || '';
  if (!clientUrl && req) {
    const origin = req.get('origin') || req.get('referer');
    if (origin) {
      try {
        const parsed = new URL(origin);
        clientUrl = `${parsed.protocol}//${parsed.host}`;
      } catch (e) {
        // ignore parse error
      }
    }
  }
  if (!clientUrl) {
    clientUrl = 'http://localhost:3000';
  }
  clientUrl = clientUrl.replace(/\/$/, '');

  let serverUrl = (process.env.SERVER_URL || '').replace(/\/$/, '');
  if (!serverUrl) {
    serverUrl = 'http://localhost:5000';
  }

  // Cashfree Production mode strictly enforces HTTPS on return_url and notify_url
  let returnBaseUrl = serverUrl;
  if (env === 'PRODUCTION' && !returnBaseUrl.startsWith('https://')) {
    returnBaseUrl = (process.env.PROD_SERVER_URL || 'https://rising-esports-wvay.vercel.app').replace(/\/$/, '');
  }

  return {
    appId,
    secretKey,
    env,
    apiVersion,
    clientUrl,
    serverUrl,
    returnBaseUrl,
    cashfreeClient,
  };
};

export default getCashfreeConfig;
