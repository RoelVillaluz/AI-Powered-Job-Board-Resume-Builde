/**
 * Generate cryptographically secure verification code
 * @returns {string} 6-digit verification code
 */
export const generateVerificationCode = () => {
    return crypto.randomInt(100000, 999999).toString();
};

/**
 * Constant-time string comparison to prevent timing attacks
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} Whether strings match
 */
export const secureCompare = (a, b) => {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
};

/**
 * Sanitize email input
 * @param {string} email - Email to sanitize
 * @returns {string} Sanitized email
 */
export const sanitizeEmail = (email) => {
    return email.toLowerCase().trim();
};

/**
 * Hash verification code before storage
 * @param {string} code - Plain verification code
 * @returns {Promise<string>} Hashed code
 */
export const hashVerificationCode = async (code) => {
    return bcrypt.hash(code, 10);
};

/**
 * Verify hashed code
 * @param {string} plainCode - Plain code from user
 * @param {string} hashedCode - Hashed code from database
 * @returns {Promise<boolean>} Whether codes match
 */
export const verifyHashedCode = async (plainCode, hashedCode) => {
    return bcrypt.compare(plainCode, hashedCode);
};