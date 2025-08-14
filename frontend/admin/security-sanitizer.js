/**
 * RBCK CMS - Security Sanitizer System
 * XSS protection and input sanitization
 */

class SecuritySanitizer {
    constructor() {
        this.allowedTags = new Set([
            'p', 'br', 'strong', 'em', 'u', 'i', 'b', 
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li', 'blockquote', 'pre', 'code'
        ]);
        
        this.allowedAttributes = new Set([
            'class', 'id', 'title', 'alt', 'href', 'src'
        ]);
        
        this.urlProtocols = new Set(['http:', 'https:', 'mailto:']);
    }

    /**
     * Sanitize HTML content to prevent XSS
     */
    sanitizeHtml(input) {
        if (!input || typeof input !== 'string') return '';
        
        // Create temporary DOM element for parsing
        const temp = document.createElement('div');
        temp.innerHTML = input;
        
        // Recursively sanitize all elements
        this._sanitizeElement(temp);
        
        return temp.innerHTML;
    }

    /**
     * Sanitize plain text for HTML output
     */
    sanitizeText(input) {
        if (!input || typeof input !== 'string') return '';
        
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    /**
     * Sanitize and validate URL
     */
    sanitizeUrl(input) {
        if (!input || typeof input !== 'string') return '#';
        
        try {
            const url = new URL(input.trim());
            
            // Only allow safe protocols
            if (this.urlProtocols.has(url.protocol)) {
                return url.toString();
            } else {
                console.warn('🔒 [SECURITY] Blocked unsafe URL protocol:', url.protocol);
                return '#';
            }
        } catch (error) {
            console.warn('🔒 [SECURITY] Invalid URL blocked:', input);
            return '#';
        }
    }

    /**
     * Sanitize form input data
     */
    sanitizeFormData(formData) {
        const sanitized = {};
        
        for (const [key, value] of Object.entries(formData)) {
            // Sanitize key name
            const cleanKey = this._sanitizeKey(key);
            
            if (typeof value === 'string') {
                // Basic text sanitization for form inputs
                sanitized[cleanKey] = this._sanitizeInput(value);
            } else if (Array.isArray(value)) {
                sanitized[cleanKey] = value.map(item => 
                    typeof item === 'string' ? this._sanitizeInput(item) : item
                );
            } else {
                sanitized[cleanKey] = value;
            }
        }
        
        return sanitized;
    }

    /**
     * Sanitize CSS values to prevent CSS injection
     */
    sanitizeCss(input) {
        if (!input || typeof input !== 'string') return '';
        
        // Remove potentially dangerous CSS constructs
        return input
            .replace(/javascript:/gi, '') // Remove javascript: URLs
            .replace(/expression\s*\(/gi, '') // Remove IE expression()
            .replace(/url\s*\(/gi, '') // Remove url() for safety
            .replace(/@import/gi, '') // Remove @import
            .replace(/behavior\s*:/gi, '') // Remove IE behavior
            .trim();
    }

    /**
     * Validate and sanitize API parameters
     */
    sanitizeApiParams(params) {
        const sanitized = {};
        
        for (const [key, value] of Object.entries(params)) {
            const cleanKey = this._sanitizeKey(key);
            
            if (typeof value === 'string') {
                // More strict sanitization for API parameters
                sanitized[cleanKey] = this._sanitizeApiValue(value);
            } else if (typeof value === 'number' && isFinite(value)) {
                sanitized[cleanKey] = value;
            } else if (typeof value === 'boolean') {
                sanitized[cleanKey] = value;
            } else if (Array.isArray(value)) {
                sanitized[cleanKey] = value
                    .filter(item => typeof item === 'string' || typeof item === 'number')
                    .map(item => typeof item === 'string' ? this._sanitizeApiValue(item) : item);
            } else {
                console.warn('🔒 [SECURITY] Filtered out invalid API parameter:', key, typeof value);
            }
        }
        
        return sanitized;
    }

    /**
     * Check if content appears to be malicious
     */
    detectMalicious(input) {
        if (!input || typeof input !== 'string') return false;
        
        const maliciousPatterns = [
            /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi, // Event handlers like onclick=
            /data:text\/html/gi,
            /vbscript:/gi,
            /<iframe/gi,
            /<object/gi,
            /<embed/gi,
            /<form/gi,
            /eval\s*\(/gi,
            /expression\s*\(/gi
        ];
        
        for (const pattern of maliciousPatterns) {
            if (pattern.test(input)) {
                console.warn('🔒 [SECURITY] Malicious content detected:', pattern);
                return true;
            }
        }
        
        return false;
    }

    /**
     * Private method to sanitize DOM element recursively
     */
    _sanitizeElement(element) {
        const nodesToRemove = [];
        
        for (const child of element.childNodes) {
            if (child.nodeType === Node.ELEMENT_NODE) {
                const tagName = child.tagName.toLowerCase();
                
                // Remove disallowed tags
                if (!this.allowedTags.has(tagName)) {
                    nodesToRemove.push(child);
                    continue;
                }
                
                // Sanitize attributes
                this._sanitizeAttributes(child);
                
                // Recursively sanitize children
                this._sanitizeElement(child);
            } else if (child.nodeType === Node.TEXT_NODE) {
                // Text nodes are safe as-is
                continue;
            } else {
                // Remove comments and other node types
                nodesToRemove.push(child);
            }
        }
        
        // Remove flagged nodes
        nodesToRemove.forEach(node => node.remove());
    }

    /**
     * Private method to sanitize element attributes
     */
    _sanitizeAttributes(element) {
        const attributesToRemove = [];
        
        for (const attr of element.attributes) {
            const attrName = attr.name.toLowerCase();
            
            if (!this.allowedAttributes.has(attrName)) {
                attributesToRemove.push(attrName);
            } else if (attrName === 'href' || attrName === 'src') {
                // Sanitize URLs
                const cleanUrl = this.sanitizeUrl(attr.value);
                element.setAttribute(attrName, cleanUrl);
            } else {
                // Sanitize other attribute values
                const cleanValue = this._sanitizeInput(attr.value);
                element.setAttribute(attrName, cleanValue);
            }
        }
        
        // Remove flagged attributes
        attributesToRemove.forEach(attrName => {
            element.removeAttribute(attrName);
        });
    }

    /**
     * Private method to sanitize object keys
     */
    _sanitizeKey(key) {
        if (typeof key !== 'string') return 'invalid_key';
        
        // Only allow alphanumeric, underscore, and dash
        return key.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50);
    }

    /**
     * Private method for basic input sanitization
     */
    _sanitizeInput(input) {
        return String(input || '')
            .trim()
            .substring(0, 10000) // Limit length
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters
    }

    /**
     * Private method for API value sanitization (more strict)
     */
    _sanitizeApiValue(input) {
        return String(input || '')
            .trim()
            .substring(0, 1000) // Shorter limit for API params
            .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters
    }

    /**
     * Get sanitization statistics
     */
    getStats() {
        return {
            allowedTags: this.allowedTags.size,
            allowedAttributes: this.allowedAttributes.size,
            supportedProtocols: this.urlProtocols.size,
            initialized: true
        };
    }
}

// Create global instance
window.SecuritySanitizer = window.SecuritySanitizer || new SecuritySanitizer();

// Add to RBCK namespace if available
if (window.RBCK) {
    RBCK.security = RBCK.security || {};
    RBCK.security.sanitizer = window.SecuritySanitizer;
    
    // Convenient helper methods
    RBCK.security.sanitizeHtml = (input) => RBCK.security.sanitizer.sanitizeHtml(input);
    RBCK.security.sanitizeText = (input) => RBCK.security.sanitizer.sanitizeText(input);
    RBCK.security.sanitizeUrl = (input) => RBCK.security.sanitizer.sanitizeUrl(input);
}

console.log('✅ [SECURITY] Security sanitizer system loaded and ready');

// Override common DOM manipulation methods with sanitization
const originalInnerHTML = Element.prototype.__lookupSetter__('innerHTML');
if (originalInnerHTML) {
    Element.prototype.__defineSetter__('innerHTML', function(value) {
        if (typeof value === 'string' && window.SecuritySanitizer) {
            const sanitized = window.SecuritySanitizer.sanitizeHtml(value);
            if (sanitized !== value) {
                console.warn('🔒 [SECURITY] Sanitized innerHTML content');
            }
            originalInnerHTML.call(this, sanitized);
        } else {
            originalInnerHTML.call(this, value);
        }
    });
}