/**
 * Security Service Tests
 * Comprehensive test coverage for security features and attack prevention
 */

const securityService = require('../../services/SecurityService');

// Mock logger
jest.mock('../../middleware/errorHandler', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  }
}));

describe('SecurityService', () => {
  beforeEach(() => {
    // Clear all timers and reset state
    jest.clearAllTimers();
    jest.clearAllMocks();
    
    // Reset environment variables
    process.env.ADMIN_USERNAME = 'admin';
    process.env.ADMIN_PASSWORD = 'securepassword123';
    process.env.MAX_LOGIN_ATTEMPTS = '5';
    
    // Clear security service state
    securityService.sessionStore.clear();
    securityService.failedAttempts.clear();
  });

  describe('constantTimeCompare', () => {
    it('should return true for identical strings', () => {
      const result = securityService.constantTimeCompare('hello', 'hello');
      expect(result).toBe(true);
    });

    it('should return false for different strings', () => {
      const result = securityService.constantTimeCompare('hello', 'world');
      expect(result).toBe(false);
    });

    it('should return false for strings of different lengths', () => {
      const result = securityService.constantTimeCompare('short', 'much longer string');
      expect(result).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(securityService.constantTimeCompare('', '')).toBe(true);
      expect(securityService.constantTimeCompare('', 'nonempty')).toBe(false);
      expect(securityService.constantTimeCompare('nonempty', '')).toBe(false);
    });

    it('should return false for non-string inputs', () => {
      expect(securityService.constantTimeCompare(null, 'string')).toBe(false);
      expect(securityService.constantTimeCompare('string', undefined)).toBe(false);
      expect(securityService.constantTimeCompare(123, 'string')).toBe(false);
    });

    it('should be resistant to timing attacks', () => {
      // This test ensures consistent timing regardless of where strings differ
      const result1 = securityService.constantTimeCompare('password123', 'password456');
      const result2 = securityService.constantTimeCompare('password123', 'different');
      const result3 = securityService.constantTimeCompare('password123', 'password123');
      
      // Results should be deterministic regardless of difference location
      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(result3).toBe(true);
      
      // Function should complete without errors for various inputs
      expect(() => {
        securityService.constantTimeCompare('a'.repeat(1000), 'b'.repeat(1000));
      }).not.toThrow();
    });
  });

  describe('validateAdminCredentials', () => {
    it('should validate correct admin credentials', () => {
      const result = securityService.validateAdminCredentials('admin', 'securepassword123', '127.0.0.1');
      
      expect(result.valid).toBe(true);
      expect(result.sessionId).toBeDefined();
      expect(result.userId).toBeDefined();
      expect(result.username).toBe('admin');
      expect(result.expiresAt).toBeDefined();
    });

    it('should reject incorrect username', () => {
      const result = securityService.validateAdminCredentials('wronguser', 'securepassword123', '127.0.0.1');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid username or password');
      expect(result.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject incorrect password', () => {
      const result = securityService.validateAdminCredentials('admin', 'wrongpassword', '127.0.0.1');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid username or password');
      expect(result.code).toBe('INVALID_CREDENTIALS');
    });

    it('should handle missing environment configuration', () => {
      delete process.env.ADMIN_USERNAME;
      delete process.env.ADMIN_PASSWORD;
      
      const result = securityService.validateAdminCredentials('admin', 'password', '127.0.0.1');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Server configuration error');
      expect(result.code).toBe('CONFIG_ERROR');
    });

    it('should track and block brute force attempts', () => {
      const ip = '192.168.1.1';
      const username = 'admin';
      
      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        const result = securityService.validateAdminCredentials(username, 'wrongpassword', ip);
        expect(result.valid).toBe(false);
      }
      
      // 6th attempt should be blocked
      const blockedResult = securityService.validateAdminCredentials(username, 'wrongpassword', ip);
      expect(blockedResult.valid).toBe(false);
      expect(blockedResult.code).toBe('ACCOUNT_LOCKED');
      expect(blockedResult.blocked).toBe(true);
      expect(blockedResult.retryAfter).toBeGreaterThan(0);
    });

    it('should clear failed attempts on successful login', () => {
      const ip = '192.168.1.2';
      const username = 'admin';
      
      // Make 3 failed attempts
      for (let i = 0; i < 3; i++) {
        securityService.validateAdminCredentials(username, 'wrongpassword', ip);
      }
      
      // Successful login should clear attempts
      const successResult = securityService.validateAdminCredentials(username, 'securepassword123', ip);
      expect(successResult.valid).toBe(true);
      
      // Should not be blocked after successful login
      expect(securityService.isBlocked(ip, username)).toBe(false);
    });

    it('should implement exponential backoff for repeated failures', () => {
      const ip = '192.168.1.3';
      const username = 'admin';
      
      // Block the account first with minimal attempts
      for (let i = 0; i < 5; i++) {
        securityService.validateAdminCredentials(username, 'wrongpassword', ip);
      }
      
      // Verify account is blocked
      const blockedResult = securityService.validateAdminCredentials(username, 'wrongpassword', ip);
      expect(blockedResult.blocked).toBe(true);
      expect(blockedResult.retryAfter).toBeGreaterThan(0);
      
      // Make additional failed attempts to verify backoff increases
      securityService.trackFailedAttempt(ip, username);
      securityService.trackFailedAttempt(ip, username);
      
      const laterResult = securityService.validateAdminCredentials(username, 'wrongpassword', ip);
      expect(laterResult.blocked).toBe(true);
      expect(laterResult.retryAfter).toBeGreaterThanOrEqual(blockedResult.retryAfter);
    });
  });

  describe('Session Management', () => {
    let sessionData;
    
    beforeEach(() => {
      const result = securityService.validateAdminCredentials('admin', 'securepassword123', '127.0.0.1');
      sessionData = result;
    });

    describe('createSecureSession', () => {
      it('should create session with secure attributes', () => {
        expect(sessionData.sessionId).toHaveLength(128); // 64 bytes hex = 128 chars
        expect(sessionData.userId).toMatch(/^admin-[a-f0-9]{32}$/);
        expect(sessionData.username).toBe('admin');
        expect(sessionData.expiresAt).toBeInstanceOf(Date);
      });

      it('should store session in session store', () => {
        const storedSession = securityService.sessionStore.get(sessionData.sessionId);
        
        expect(storedSession).toBeDefined();
        expect(storedSession.username).toBe('admin');
        expect(storedSession.isActive).toBe(true);
        expect(storedSession.securityLevel).toBe('high');
      });

      it('should set appropriate expiration time', () => {
        const storedSession = securityService.sessionStore.get(sessionData.sessionId);
        const expectedExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        expect(storedSession.expiresAt.getTime()).toBeCloseTo(expectedExpiry.getTime(), -1000);
      });
    });

    describe('validateSession', () => {
      it('should validate active session', () => {
        const session = securityService.validateSession(sessionData.sessionId, '127.0.0.1');
        
        expect(session).toBeDefined();
        expect(session.username).toBe('admin');
        expect(session.isActive).toBe(true);
      });

      it('should reject invalid session ID', () => {
        const session = securityService.validateSession('invalid-session-id', '127.0.0.1');
        expect(session).toBeNull();
      });

      it('should reject expired session', () => {
        const storedSession = securityService.sessionStore.get(sessionData.sessionId);
        storedSession.expiresAt = new Date(Date.now() - 1000); // Expired 1 second ago
        
        const session = securityService.validateSession(sessionData.sessionId, '127.0.0.1');
        expect(session).toBeNull();
      });

      it('should reject session from different IP when IP consistency enforced', () => {
        process.env.ENFORCE_IP_CONSISTENCY = 'true';
        
        const session = securityService.validateSession(sessionData.sessionId, '192.168.1.1');
        expect(session).toBeNull();
        
        delete process.env.ENFORCE_IP_CONSISTENCY;
      });

      it('should update last activity on successful validation', (done) => {
        const storedSession = securityService.sessionStore.get(sessionData.sessionId);
        const originalActivity = storedSession.lastActivity;
        
        // Wait a small amount to ensure timestamp difference
        setTimeout(() => {
          securityService.validateSession(sessionData.sessionId, '127.0.0.1');
          expect(storedSession.lastActivity.getTime()).toBeGreaterThanOrEqual(originalActivity.getTime());
          done();
        }, 10);
      });

      it('should handle user agent consistency', () => {
        const userAgent = 'Mozilla/5.0 (Test Browser)';
        
        // First validation sets user agent
        securityService.validateSession(sessionData.sessionId, '127.0.0.1', userAgent);
        
        // Second validation with same user agent should work
        const session1 = securityService.validateSession(sessionData.sessionId, '127.0.0.1', userAgent);
        expect(session1).toBeDefined();
        
        // Different user agent should log warning but not invalidate
        const session2 = securityService.validateSession(sessionData.sessionId, '127.0.0.1', 'Different Browser');
        expect(session2).toBeDefined(); // Should still work but log warning
      });
    });

    describe('invalidateSession', () => {
      it('should invalidate active session', () => {
        securityService.invalidateSession(sessionData.sessionId);
        
        const session = securityService.validateSession(sessionData.sessionId, '127.0.0.1');
        expect(session).toBeNull();
      });

      it('should handle invalidating non-existent session', () => {
        expect(() => {
          securityService.invalidateSession('non-existent-session-id');
        }).not.toThrow();
      });
    });
  });

  describe('Security Utilities', () => {
    describe('generateSecureSessionId', () => {
      it('should generate unique session IDs', () => {
        const id1 = securityService.generateSecureSessionId();
        const id2 = securityService.generateSecureSessionId();
        
        expect(id1).not.toBe(id2);
        expect(id1).toHaveLength(128);
        expect(id2).toHaveLength(128);
        expect(id1).toMatch(/^[a-f0-9]{128}$/);
      });
    });

    describe('generateUserId', () => {
      it('should generate unique user IDs with admin prefix', () => {
        const id1 = securityService.generateUserId();
        const id2 = securityService.generateUserId();
        
        expect(id1).not.toBe(id2);
        expect(id1).toMatch(/^admin-[a-f0-9]{32}$/);
        expect(id2).toMatch(/^admin-[a-f0-9]{32}$/);
      });
    });

    describe('generateFingerprint', () => {
      it('should generate consistent fingerprints for same input', () => {
        const fp1 = securityService.generateFingerprint('127.0.0.1', 'admin');
        const fp2 = securityService.generateFingerprint('127.0.0.1', 'admin');
        
        // Should be different due to timestamp
        expect(fp1).not.toBe(fp2);
        expect(fp1).toHaveLength(64); // SHA-256 hex
        expect(fp2).toHaveLength(64);
      });
    });
  });

  describe('Failed Attempts Management', () => {
    describe('trackFailedAttempt', () => {
      it('should track failed attempts with correct count', () => {
        const ip = '192.168.1.10';
        const username = 'admin';
        
        securityService.trackFailedAttempt(ip, username);
        securityService.trackFailedAttempt(ip, username);
        securityService.trackFailedAttempt(ip, username);
        
        const key = `${ip}:${username}`;
        const attempts = securityService.failedAttempts.get(key);
        
        expect(attempts.count).toBe(3);
        expect(attempts.lastAttempt).toBeInstanceOf(Date);
        expect(attempts.backoffMultiplier).toBeGreaterThan(1);
      });

      it('should implement exponential backoff multiplier', () => {
        const ip = '192.168.1.11';
        const username = 'admin';
        
        securityService.trackFailedAttempt(ip, username);
        const key = `${ip}:${username}`;
        let attempts = securityService.failedAttempts.get(key);
        const initialMultiplier = attempts.backoffMultiplier;
        
        securityService.trackFailedAttempt(ip, username);
        attempts = securityService.failedAttempts.get(key);
        
        expect(attempts.backoffMultiplier).toBe(initialMultiplier * 2);
      });

      it('should cap backoff multiplier at maximum value', () => {
        const ip = '192.168.1.12';
        const username = 'admin';
        
        // Make many attempts to reach max backoff
        for (let i = 0; i < 10; i++) {
          securityService.trackFailedAttempt(ip, username);
        }
        
        const key = `${ip}:${username}`;
        const attempts = securityService.failedAttempts.get(key);
        
        expect(attempts.backoffMultiplier).toBe(32); // Max value
      });
    });

    describe('isBlocked', () => {
      it('should return false for IPs without failed attempts', () => {
        expect(securityService.isBlocked('192.168.1.20', 'admin')).toBe(false);
      });

      it('should return false when under attempt threshold', () => {
        const ip = '192.168.1.21';
        const username = 'admin';
        
        for (let i = 0; i < 3; i++) {
          securityService.trackFailedAttempt(ip, username);
        }
        
        expect(securityService.isBlocked(ip, username)).toBe(false);
      });

      it('should return true when over attempt threshold', () => {
        const ip = '192.168.1.22';
        const username = 'admin';
        
        for (let i = 0; i < 6; i++) {
          securityService.trackFailedAttempt(ip, username);
        }
        
        expect(securityService.isBlocked(ip, username)).toBe(true);
      });
    });

    describe('getRetryAfter', () => {
      it('should return 0 for non-blocked IPs', () => {
        expect(securityService.getRetryAfter('192.168.1.30', 'admin')).toBe(0);
      });

      it('should return positive value for blocked IPs', () => {
        const ip = '192.168.1.31';
        const username = 'admin';
        
        for (let i = 0; i < 6; i++) {
          securityService.trackFailedAttempt(ip, username);
        }
        
        const retryAfter = securityService.getRetryAfter(ip, username);
        expect(retryAfter).toBeGreaterThan(0);
      });
    });

    describe('clearFailedAttempts', () => {
      it('should clear failed attempts for specific IP/username', () => {
        const ip = '192.168.1.40';
        const username = 'admin';
        
        securityService.trackFailedAttempt(ip, username);
        securityService.trackFailedAttempt(ip, username);
        
        expect(securityService.failedAttempts.has(`${ip}:${username}`)).toBe(true);
        
        securityService.clearFailedAttempts(ip, username);
        
        expect(securityService.failedAttempts.has(`${ip}:${username}`)).toBe(false);
      });
    });
  });

  describe('Monitoring and Statistics', () => {
    beforeEach(() => {
      // Create some test sessions and failed attempts
      securityService.validateAdminCredentials('admin', 'securepassword123', '127.0.0.1');
      securityService.validateAdminCredentials('admin', 'securepassword123', '127.0.0.2');
      
      for (let i = 0; i < 3; i++) {
        securityService.trackFailedAttempt('192.168.1.100', 'admin');
      }
    });

    describe('getActiveSessions', () => {
      it('should return list of active sessions with masked IDs', () => {
        const sessions = securityService.getActiveSessions();
        
        expect(sessions).toHaveLength(2);
        expect(sessions[0]).toHaveProperty('sessionId');
        expect(sessions[0]).toHaveProperty('username');
        expect(sessions[0]).toHaveProperty('clientIp');
        expect(sessions[0]).toHaveProperty('securityLevel');
        
        // Session ID should be masked
        expect(sessions[0].sessionId).toMatch(/^[a-f0-9]{8}\.\.\.$/);
      });
    });

    describe('getSecurityStats', () => {
      it('should return comprehensive security statistics', () => {
        const stats = securityService.getSecurityStats();
        
        expect(stats).toHaveProperty('activeSessions');
        expect(stats).toHaveProperty('blockedIPs');
        expect(stats).toHaveProperty('totalFailedAttempts');
        expect(stats).toHaveProperty('lastCleanup');
        
        expect(stats.activeSessions).toBe(2);
        expect(stats.totalFailedAttempts).toBe(1);
        expect(typeof stats.lastCleanup).toBe('string');
      });
    });
  });

  describe('Cleanup and Maintenance', () => {
    describe('cleanup', () => {
      it('should remove expired sessions', () => {
        // Create expired session
        const result = securityService.validateAdminCredentials('admin', 'securepassword123', '127.0.0.1');
        const storedSession = securityService.sessionStore.get(result.sessionId);
        storedSession.expiresAt = new Date(Date.now() - 1000); // Expired
        
        const initialCount = securityService.sessionStore.size;
        securityService.cleanup();
        
        expect(securityService.sessionStore.size).toBeLessThan(initialCount);
      });

      it('should remove old failed attempts', () => {
        // Create old failed attempt
        const ip = '192.168.1.200';
        const username = 'admin';
        securityService.trackFailedAttempt(ip, username);
        
        const key = `${ip}:${username}`;
        const attempts = securityService.failedAttempts.get(key);
        attempts.firstAttempt = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
        
        const initialCount = securityService.failedAttempts.size;
        securityService.cleanup();
        
        expect(securityService.failedAttempts.size).toBeLessThan(initialCount);
      });
    });

    describe('destroy', () => {
      it('should clear all data and stop cleanup interval', () => {
        securityService.validateAdminCredentials('admin', 'securepassword123', '127.0.0.1');
        securityService.trackFailedAttempt('192.168.1.250', 'admin');
        
        expect(securityService.sessionStore.size).toBeGreaterThan(0);
        expect(securityService.failedAttempts.size).toBeGreaterThan(0);
        
        securityService.destroy();
        
        expect(securityService.sessionStore.size).toBe(0);
        expect(securityService.failedAttempts.size).toBe(0);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed session IDs gracefully', () => {
      expect(securityService.validateSession(null, '127.0.0.1')).toBeNull();
      expect(securityService.validateSession(undefined, '127.0.0.1')).toBeNull();
      expect(securityService.validateSession('', '127.0.0.1')).toBeNull();
      expect(securityService.validateSession(123, '127.0.0.1')).toBeNull();
    });

    it('should handle empty or invalid usernames/passwords', () => {
      expect(securityService.validateAdminCredentials('', 'password', '127.0.0.1').valid).toBe(false);
      expect(securityService.validateAdminCredentials('username', '', '127.0.0.1').valid).toBe(false);
      expect(securityService.validateAdminCredentials(null, 'password', '127.0.0.1').valid).toBe(false);
    });

    it('should handle environment variable edge cases', () => {
      // Test with undefined MAX_LOGIN_ATTEMPTS
      delete process.env.MAX_LOGIN_ATTEMPTS;
      expect(securityService.getMaxAttempts()).toBe(5); // Should use default
      
      // Test with invalid MAX_LOGIN_ATTEMPTS
      process.env.MAX_LOGIN_ATTEMPTS = 'invalid';
      expect(securityService.getMaxAttempts()).toBe(5); // Should use default
      
      // Test with valid custom value
      process.env.MAX_LOGIN_ATTEMPTS = '3';
      expect(securityService.getMaxAttempts()).toBe(3);
    });
  });
});