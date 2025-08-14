/**
 * RBCK CMS - Form Validation System
 * Comprehensive client-side validation with security focus
 */

class FormValidator {
    /**
     * Email validation with RFC 5322 compliance
     */
    static validateEmail(email) {
        if (!email || typeof email !== 'string') return false;
        
        // More comprehensive email regex
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return emailRegex.test(email.trim());
    }

    /**
     * Password validation with strength requirements
     */
    static validatePassword(password) {
        if (!password || typeof password !== 'string') return { valid: false, message: 'Password is required' };
        
        const rules = {
            minLength: password.length >= 8,
            hasUpper: /[A-Z]/.test(password),
            hasLower: /[a-z]/.test(password),
            hasNumber: /\d/.test(password),
            hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
        };
        
        const failedRules = [];
        if (!rules.minLength) failedRules.push('at least 8 characters');
        if (!rules.hasUpper) failedRules.push('an uppercase letter');
        if (!rules.hasLower) failedRules.push('a lowercase letter');
        if (!rules.hasNumber) failedRules.push('a number');
        if (!rules.hasSpecial) failedRules.push('a special character');
        
        if (failedRules.length > 0) {
            return {
                valid: false,
                message: `Password must contain ${failedRules.join(', ')}`
            };
        }
        
        return { valid: true, message: 'Strong password' };
    }

    /**
     * URL validation
     */
    static validateUrl(url) {
        if (!url || typeof url !== 'string') return false;
        
        try {
            const urlObj = new URL(url);
            return ['http:', 'https:'].includes(urlObj.protocol);
        } catch {
            return false;
        }
    }

    /**
     * Required field validation
     */
    static validateRequired(value, fieldName = 'Field') {
        if (!value || (typeof value === 'string' && value.trim() === '')) {
            return { valid: false, message: `${fieldName} is required` };
        }
        return { valid: true, message: '' };
    }

    /**
     * Minimum length validation
     */
    static validateMinLength(value, minLength, fieldName = 'Field') {
        if (!value || value.length < minLength) {
            return { 
                valid: false, 
                message: `${fieldName} must be at least ${minLength} characters long` 
            };
        }
        return { valid: true, message: '' };
    }

    /**
     * Maximum length validation
     */
    static validateMaxLength(value, maxLength, fieldName = 'Field') {
        if (value && value.length > maxLength) {
            return { 
                valid: false, 
                message: `${fieldName} must not exceed ${maxLength} characters` 
            };
        }
        return { valid: true, message: '' };
    }

    /**
     * Number validation with range
     */
    static validateNumber(value, min = null, max = null, fieldName = 'Field') {
        const num = parseFloat(value);
        
        if (isNaN(num)) {
            return { valid: false, message: `${fieldName} must be a valid number` };
        }
        
        if (min !== null && num < min) {
            return { valid: false, message: `${fieldName} must be at least ${min}` };
        }
        
        if (max !== null && num > max) {
            return { valid: false, message: `${fieldName} must not exceed ${max}` };
        }
        
        return { valid: true, message: '' };
    }

    /**
     * Show error message for a field
     */
    static showError(fieldId, message) {
        const errorEl = document.getElementById(`${fieldId}-error`);
        const fieldEl = document.getElementById(fieldId);
        
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
            errorEl.setAttribute('role', 'alert');
        }
        
        if (fieldEl) {
            fieldEl.classList.add('is-invalid');
            fieldEl.setAttribute('aria-invalid', 'true');
        }
    }

    /**
     * Clear error message for a field
     */
    static clearError(fieldId) {
        const errorEl = document.getElementById(`${fieldId}-error`);
        const fieldEl = document.getElementById(fieldId);
        
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.style.display = 'none';
            errorEl.removeAttribute('role');
        }
        
        if (fieldEl) {
            fieldEl.classList.remove('is-invalid');
            fieldEl.classList.add('is-valid');
            fieldEl.setAttribute('aria-invalid', 'false');
        }
    }

    /**
     * Show success state for a field
     */
    static showSuccess(fieldId, message = '') {
        const errorEl = document.getElementById(`${fieldId}-error`);
        const fieldEl = document.getElementById(fieldId);
        
        if (errorEl && message) {
            errorEl.textContent = message;
            errorEl.className = 'success-message';
            errorEl.style.display = 'block';
            errorEl.style.color = 'var(--success)';
        }
        
        if (fieldEl) {
            fieldEl.classList.remove('is-invalid');
            fieldEl.classList.add('is-valid');
            fieldEl.setAttribute('aria-invalid', 'false');
        }
    }

    /**
     * Validate entire form
     */
    static validateForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return false;
        
        const fields = form.querySelectorAll('[data-validate]');
        let isValid = true;
        
        fields.forEach(field => {
            const validationType = field.dataset.validate;
            const fieldId = field.id;
            const value = field.value;
            const fieldName = field.dataset.fieldName || fieldId.replace(/([A-Z])/g, ' $1').toLowerCase();
            
            // Clear previous validation state
            FormValidator.clearError(fieldId);
            
            let validation = { valid: true, message: '' };
            
            // Required validation
            if (field.hasAttribute('required')) {
                validation = FormValidator.validateRequired(value, fieldName);
                if (!validation.valid) {
                    FormValidator.showError(fieldId, validation.message);
                    isValid = false;
                    return;
                }
            }
            
            // Skip other validations if field is empty and not required
            if (!value && !field.hasAttribute('required')) return;
            
            // Type-specific validation
            switch (validationType) {
                case 'email':
                    if (!FormValidator.validateEmail(value)) {
                        FormValidator.showError(fieldId, 'Please enter a valid email address');
                        isValid = false;
                    } else {
                        FormValidator.showSuccess(fieldId);
                    }
                    break;
                    
                case 'password':
                    validation = FormValidator.validatePassword(value);
                    if (!validation.valid) {
                        FormValidator.showError(fieldId, validation.message);
                        isValid = false;
                    } else {
                        FormValidator.showSuccess(fieldId, validation.message);
                    }
                    break;
                    
                case 'url':
                    if (!FormValidator.validateUrl(value)) {
                        FormValidator.showError(fieldId, 'Please enter a valid URL (http:// or https://)');
                        isValid = false;
                    } else {
                        FormValidator.showSuccess(fieldId);
                    }
                    break;
                    
                case 'number':
                    const min = field.getAttribute('min');
                    const max = field.getAttribute('max');
                    validation = FormValidator.validateNumber(value, min, max, fieldName);
                    if (!validation.valid) {
                        FormValidator.showError(fieldId, validation.message);
                        isValid = false;
                    } else {
                        FormValidator.showSuccess(fieldId);
                    }
                    break;
            }
            
            // Length validations
            if (field.hasAttribute('minlength')) {
                const minLength = parseInt(field.getAttribute('minlength'));
                validation = FormValidator.validateMinLength(value, minLength, fieldName);
                if (!validation.valid) {
                    FormValidator.showError(fieldId, validation.message);
                    isValid = false;
                }
            }
            
            if (field.hasAttribute('maxlength')) {
                const maxLength = parseInt(field.getAttribute('maxlength'));
                validation = FormValidator.validateMaxLength(value, maxLength, fieldName);
                if (!validation.valid) {
                    FormValidator.showError(fieldId, validation.message);
                    isValid = false;
                }
            }
        });
        
        return isValid;
    }

    /**
     * Initialize form validation for a form
     */
    static initializeForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return;
        
        // Add event listeners for real-time validation
        const fields = form.querySelectorAll('[data-validate]');
        
        fields.forEach(field => {
            // Validate on blur (when user leaves field)
            field.addEventListener('blur', () => {
                const fieldId = field.id;
                const value = field.value;
                const validationType = field.dataset.validate;
                const fieldName = field.dataset.fieldName || fieldId.replace(/([A-Z])/g, ' $1').toLowerCase();
                
                FormValidator.clearError(fieldId);
                
                if (field.hasAttribute('required') && !value) {
                    FormValidator.showError(fieldId, `${fieldName} is required`);
                    return;
                }
                
                if (!value) return;
                
                // Validate based on type
                let validation = { valid: true, message: '' };
                
                switch (validationType) {
                    case 'email':
                        if (!FormValidator.validateEmail(value)) {
                            FormValidator.showError(fieldId, 'Please enter a valid email address');
                        } else {
                            FormValidator.showSuccess(fieldId);
                        }
                        break;
                        
                    case 'password':
                        validation = FormValidator.validatePassword(value);
                        if (!validation.valid) {
                            FormValidator.showError(fieldId, validation.message);
                        } else {
                            FormValidator.showSuccess(fieldId, validation.message);
                        }
                        break;
                        
                    case 'url':
                        if (!FormValidator.validateUrl(value)) {
                            FormValidator.showError(fieldId, 'Please enter a valid URL');
                        } else {
                            FormValidator.showSuccess(fieldId);
                        }
                        break;
                }
            });
            
            // Clear validation state when user starts typing
            field.addEventListener('input', () => {
                if (field.classList.contains('is-invalid')) {
                    FormValidator.clearError(field.id);
                }
            });
        });
        
        // Prevent form submission if invalid
        form.addEventListener('submit', (e) => {
            if (!FormValidator.validateForm(formId)) {
                e.preventDefault();
                e.stopPropagation();
                
                // Focus first invalid field
                const firstInvalid = form.querySelector('.is-invalid');
                if (firstInvalid) {
                    firstInvalid.focus();
                }
                
                // Show notification
                if (typeof showNotification === 'function') {
                    showNotification('Please fix the errors before submitting', 'error');
                }
            }
        });
    }
}

// Export for use in other scripts
window.FormValidator = FormValidator;

console.log('✅ [VALIDATION] Form validation system loaded');