/**
 * Security Service
 * Centralized security utilities with hardened implementations
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { logger } = require('../middleware/errorHandler');

class SecurityService {
  constructor() {
    this.sessionStore = new Map();
    this.failedAttempts = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 300000); // Cleanup every 5 minutes
  }

  /**
   * Secure constant-time string comparison
   * Resistant to timing attacks
   * @param {string} a - First string
   * @param {string} b - Second string
   * @returns {boolean} - Are strings equal
   */
  constantTimeCompare(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') {
      return false;
    }

    // Normalize lengths to prevent length-based timing attacks
    const maxLength = Math.max(a.length, b.length);
    const normalizedA = a.padEnd(maxLength, '\0');
    const normalizedB = b.padEnd(maxLength, '\0');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(normalizedA, 'utf8'),
        Buffer.from(normalizedB, 'utf8')
      );
    } catch (error) {
      logger.error('Constant time comparison error:', error);
      return false;
    }
  }

  /**
   * Validate admin credentials with security hardening
   * @param {string} username - Username to validate
   * @param {string} password - Password to validate
   * @param {string} clientIp - Client IP for security logging
   * @returns {Object} - Validation result
   */
  validateAdminCredentials(username, password, clientIp = 'unknown') {
    const validUsername = process.env.ADMIN_USERNAME;
    const validPassword = process.env.ADMIN_PASSWORD;

    if (!validUsername || !validPassword) {
      logger.error('❌ Admin credentials not configured in environment variables');
      return { 
        valid: false, 
        error: 'Server configuration error',
        code: 'CONFIG_ERROR'
      };
    }

    // Check for brute force attempts
    if (this.isBlocked(clientIp, username)) {
      logger.warn(`🚨 Login blocked for ${username} from ${clientIp} due to too many failed attempts`);
      return { 
        valid: false, 
        error: 'Account temporarily locked due to failed attempts',
        code: 'ACCOUNT_LOCKED',
        blocked: true,
        retryAfter: this.getRetryAfter(clientIp, username)
      };
    }

    // Perform constant-time validation
    const usernameValid = this.constantTimeCompare(username, validUsername);
    const passwordValid = this.constantTimeCompare(password, validPassword);
    const isValid = usernameValid && passwordValid;

    if (isValid) {
      this.clearFailedAttempts(clientIp, username);
      const sessionData = this.createSecureSession(username, clientIp);
      
      logger.info(`✅ Admin credentials validated for ${username} from ${clientIp}`);
      return { 
        valid: true,
        ...sessionData
      };
    } else {
      this.trackFailedAttempt(clientIp, username);
      
      // Add random delay to prevent timing attacks on failed logins
      const delay = Math.floor(Math.random() * 1000) + 500; // 500-1500ms
      setTimeout(() => {
        logger.warn(`❌ Invalid login attempt for username: ${username} from ${clientIp}`);
      }, delay);
      
      return { 
        valid: false, 
        error: 'Invalid username or password',
        code: 'INVALID_CREDENTIALS'
      };
    }
  }

  /**
   * Create secure session with comprehensive tracking
   * @param {string} username - Username
   * @param {string} clientIp - Client IP
   * @returns {Object} - Session data
   */
  createSecureSession(username, clientIp) {
    const sessionId = this.generateSecureSessionId();
    const userId = this.generateUserId();
    const now = new Date();

    const sessionData = {
      sessionId,
      userId,
      username,
      clientIp,
      createdAt: now,
      lastActivity: now,
      isActive: true,
      securityLevel: 'high',
      // Security metadata
      userAgent: null, // To be set by caller
      fingerprint: this.generateFingerprint(clientIp, username),
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours
      renewCount: 0
    };

    this.sessionStore.set(sessionId, sessionData);
    
    // Auto-cleanup expired sessions
    setTimeout(() => {
      this.invalidateSession(sessionId);
    }, 24 * 60 * 60 * 1000); // 24 hours

    logger.info(`✅ Secure session created for user ${username} from ${clientIp}`, {
      sessionId: sessionId.substring(0, 8) + '...',
      securityLevel: sessionData.securityLevel
    });

    return {
      sessionId,
      userId,
      username,
      expiresAt: sessionData.expiresAt
    };
  }

  /**
   * Validate session with comprehensive security checks
   * @param {string} sessionId - Session ID to validate
   * @param {string} clientIp - Client IP
   * @param {string} userAgent - User agent string
   * @returns {Object|null} - Session data or null
   */
  validateSession(sessionId, clientIp, userAgent = null) {
    if (!sessionId || typeof sessionId !== 'string') {
      return null;
    }

    const session = this.sessionStore.get(sessionId);
    
    if (!session || !session.isActive) {
      return null;
    }

    const now = new Date();

    // Check expiration
    if (now > session.expiresAt) {
      logger.info(`⏰ Session ${sessionId.substring(0, 8)}... expired for user ${session.username}`);
      this.invalidateSession(sessionId);
      return null;
    }

    // IP consistency check (configurable)
    if (process.env.ENFORCE_IP_CONSISTENCY === 'true' && session.clientIp !== clientIp) {
      logger.warn(`🚨 Session ${sessionId.substring(0, 8)}... IP mismatch: ${session.clientIp} vs ${clientIp}`);
      this.invalidateSession(sessionId);
      return null;
    }

    // User agent consistency check (if provided)
    if (session.userAgent && userAgent && session.userAgent !== userAgent) {
      logger.warn(`🚨 Session ${sessionId.substring(0, 8)}... User-Agent mismatch for user ${session.username}`);
      // Don't invalidate immediately, but log for monitoring
    }

    // Update session activity
    session.lastActivity = now;
    if (!session.userAgent && userAgent) {
      session.userAgent = userAgent;
    }

    return session;
  }

  /**
   * Generate cryptographically secure session ID
   * @returns {string} - Session ID
   */
  generateSecureSessionId() {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Generate secure user ID
   * @returns {string} - User ID
   */
  generateUserId() {
    return 'admin-' + crypto.randomBytes(16).toString('hex');
  }

  /**
   * Generate security fingerprint
   * @param {string} clientIp - Client IP
   * @param {string} username - Username
   * @returns {string} - Security fingerprint
   */
  generateFingerprint(clientIp, username) {
    const data = `${clientIp}:${username}:${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Track failed login attempts with exponential backoff
   * @param {string} ip - Client IP
   * @param {string} username - Username
   */
  trackFailedAttempt(ip, username) {
    const key = `${ip}:${username}`;
    const current = this.failedAttempts.get(key) || { 
      count: 0, 
      firstAttempt: new Date(),
      lastAttempt: null,
      backoffMultiplier: 1
    };

    current.count += 1;
    current.lastAttempt = new Date();
    current.backoffMultiplier = Math.min(current.backoffMultiplier * 2, 32); // Max 32x backoff

    this.failedAttempts.set(key, current);

    logger.warn(`🚨 Failed login attempt #${current.count} from ${ip} for user ${username}`, {
      backoffMultiplier: current.backoffMultiplier,
      willBeBlocked: current.count >= this.getMaxAttempts()
    });

    // Auto-cleanup after extended period
    setTimeout(() => {
      this.failedAttempts.delete(key);
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  /**
   * Check if IP/username combination is blocked
   * @param {string} ip - Client IP
   * @param {string} username - Username
   * @returns {boolean} - Is blocked
   */
  isBlocked(ip, username) {
    const key = `${ip}:${username}`;
    const attempts = this.failedAttempts.get(key);

    if (!attempts) return false;

    const maxAttempts = this.getMaxAttempts();
    if (attempts.count < maxAttempts) return false;

    // Calculate dynamic lockout time with exponential backoff
    const baseLockoutTime = 15 * 60 * 1000; // 15 minutes base
    const lockoutTime = baseLockoutTime * attempts.backoffMultiplier;
    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt.getTime();

    return timeSinceLastAttempt < lockoutTime;
  }

  /**
   * Get retry after time in seconds
   * @param {string} ip - Client IP  
   * @param {string} username - Username
   * @returns {number} - Seconds until retry allowed
   */
  getRetryAfter(ip, username) {
    const key = `${ip}:${username}`;
    const attempts = this.failedAttempts.get(key);

    if (!attempts) return 0;

    const baseLockoutTime = 15 * 60 * 1000; // 15 minutes
    const lockoutTime = baseLockoutTime * attempts.backoffMultiplier;
    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt.getTime();
    const remainingTime = lockoutTime - timeSinceLastAttempt;

    return Math.max(0, Math.ceil(remainingTime / 1000));
  }

  /**
   * Get maximum allowed attempts before blocking
   * @returns {number} - Max attempts
   */
  getMaxAttempts() {
    return parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
  }

  /**
   * Clear failed attempts on successful login
   * @param {string} ip - Client IP
   * @param {string} username - Username
   */
  clearFailedAttempts(ip, username) {
    const key = `${ip}:${username}`;
    this.failedAttempts.delete(key);
  }

  /**
   * Invalidate a session
   * @param {string} sessionId - Session ID to invalidate
   */
  invalidateSession(sessionId) {
    const session = this.sessionStore.get(sessionId);
    if (session) {
      session.isActive = false;
      this.sessionStore.delete(sessionId);
      logger.info(`🔐 Session invalidated for user ${session.username}`);
    }
  }

  /**
   * Get all active sessions for monitoring
   * @returns {Array} - Active sessions
   */
  getActiveSessions() {
    const sessions = [];
    for (const [sessionId, session] of this.sessionStore.entries()) {
      if (session.isActive && new Date() < session.expiresAt) {
        sessions.push({
          sessionId: sessionId.substring(0, 8) + '...',
          username: session.username,
          clientIp: session.clientIp,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity,
          securityLevel: session.securityLevel,
          renewCount: session.renewCount
        });
      }
    }
    return sessions;
  }

  /**
   * Cleanup expired sessions and old failed attempts
   */
  cleanup() {
    const now = new Date();
    let sessionsCleanedUp = 0;
    let attemptsCleanedUp = 0;

    // Cleanup expired sessions
    for (const [sessionId, session] of this.sessionStore.entries()) {
      if (!session.isActive || now > session.expiresAt) {
        this.sessionStore.delete(sessionId);
        sessionsCleanedUp++;
      }
    }

    // Cleanup old failed attempts (older than 24 hours)
    for (const [key, attempts] of this.failedAttempts.entries()) {
      const timeSinceFirst = now - attempts.firstAttempt;
      if (timeSinceFirst > 24 * 60 * 60 * 1000) { // 24 hours
        this.failedAttempts.delete(key);
        attemptsCleanedUp++;
      }
    }

    if (sessionsCleanedUp > 0 || attemptsCleanedUp > 0) {
      logger.debug(`🧹 Security cleanup: ${sessionsCleanedUp} sessions, ${attemptsCleanedUp} failed attempts`);
    }
  }

  /**
   * Get security statistics
   * @returns {Object} - Security stats
   */
  getSecurityStats() {
    return {
      activeSessions: this.sessionStore.size,
      blockedIPs: Array.from(this.failedAttempts.entries())
        .filter(([key, attempts]) => this.isBlocked(...key.split(':')))
        .length,
      totalFailedAttempts: this.failedAttempts.size,
      lastCleanup: new Date().toISOString()
    };
  }

  /**
   * Destroy security service and cleanup
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.sessionStore.clear();
    this.failedAttempts.clear();
  }
}

// Export singleton instance
const securityService = new SecurityService();

module.exports = securityService;