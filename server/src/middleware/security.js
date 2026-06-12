const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('../config/config');
const { SUPPORTED_DOMAINS, ERROR_CODES } = require('../../../shared/constants/constants.json');

// Parse CLIENT_URL as comma-separated list to support multiple origins (localhost + Vercel)
const allowedOrigins = config.CLIENT_URL
  ? config.CLIENT_URL.split(',').map(o => o.trim())
  : ['http://localhost:5173'];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin '${origin}' not allowed`));
  },
  optionsSuccessStatus: 200
};
const corsMiddleware = cors(corsOptions);

// Setup Helmet for security headers
const helmetMiddleware = helmet({
  contentSecurityPolicy: config.NODE_ENV === 'production' ? undefined : false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

// Setup Rate Limiting
const rateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  message: {
    code: ERROR_CODES.SERVER_ERROR,
    message: 'Too many requests from this IP. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Validate media URLs.
 */
function validateUrl(req, res, next) {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({
      code: ERROR_CODES.INVALID_URL,
      message: 'A media URL is required'
    });
  }

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    
    // Check if domain matches supported list
    const isSupported = SUPPORTED_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );

    if (!isSupported) {
      return res.status(400).json({
        code: ERROR_CODES.UNSUPPORTED_SITE,
        message: 'The URL domain is not supported. Supported sites include: ' + SUPPORTED_DOMAINS.join(', ')
      });
    }

    next();
  } catch (e) {
    return res.status(400).json({
      code: ERROR_CODES.INVALID_URL,
      message: 'The provided value is not a valid HTTP/HTTPS URL'
    });
  }
}

module.exports = {
  corsMiddleware,
  helmetMiddleware,
  rateLimiter,
  validateUrl
};
