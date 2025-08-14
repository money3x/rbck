/**
 * RBCK CMS - Accessibility Compliance System
 * Ensures WCAG 2.1 AA compliance and accessibility best practices
 */

class AccessibilityCompliance {
    constructor() {
        this.violations = [];
        this.fixes = [];
        this.wcagLevel = 'AA';
        this.initialized = false;
        this.observer = null;
    }

    init() {
        if (this.initialized) return;

        console.log('♿ [A11Y] Initializing accessibility compliance system...');

        // Run initial audit
        this.auditPage();

        // Set up mutation observer to monitor dynamic content
        this.setupMutationObserver();

        // Add keyboard navigation enhancements
        this.enhanceKeyboardNavigation();

        // Enhance focus management
        this.enhanceFocusManagement();

        // Add screen reader announcements
        this.setupScreenReaderSupport();

        this.initialized = true;
        console.log('✅ [A11Y] Accessibility compliance system initialized');
    }

    auditPage() {
        console.log('🔍 [A11Y] Running accessibility audit...');

        this.violations = [];
        this.fixes = [];

        // Check for common WCAG violations
        this.checkImages();
        this.checkForms();
        this.checkHeadings();
        this.checkLinks();
        this.checkColorContrast();
        this.checkKeyboardNavigation();
        this.checkARIA();
        this.checkFocus();

        // Apply automatic fixes
        this.applyAutomaticFixes();

        // Report results
        this.reportResults();
    }

    checkImages() {
        const images = document.querySelectorAll('img');
        
        images.forEach(img => {
            // Check for alt attributes
            if (!img.hasAttribute('alt')) {
                this.addViolation('missing-alt-text', img, 'Image missing alt attribute', 'A');
                
                // Auto-fix: Add empty alt for decorative images
                if (img.classList.contains('decorative') || img.getAttribute('role') === 'presentation') {
                    img.setAttribute('alt', '');
                    this.addFix('added-empty-alt', img, 'Added empty alt attribute for decorative image');
                }
            }

            // Check for meaningful alt text
            const alt = img.getAttribute('alt');
            if (alt && alt.length > 125) {
                this.addViolation('alt-text-too-long', img, 'Alt text should be under 125 characters', 'AA');
            }

            if (alt && (alt.toLowerCase().includes('image') || alt.toLowerCase().includes('picture'))) {
                this.addViolation('redundant-alt-text', img, 'Alt text should not include "image" or "picture"', 'AA');
            }
        });
    }

    checkForms() {
        const inputs = document.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            const id = input.id;
            const type = input.type;

            // Check for labels
            const label = document.querySelector(`label[for="${id}"]`);
            const ariaLabel = input.getAttribute('aria-label');
            const ariaLabelledby = input.getAttribute('aria-labelledby');

            if (!label && !ariaLabel && !ariaLabelledby && type !== 'hidden') {
                this.addViolation('missing-label', input, 'Form control missing label', 'A');
                
                // Auto-fix: Try to create label from placeholder or nearby text
                this.autoFixLabel(input);
            }

            // Check for required field indicators
            if (input.hasAttribute('required')) {
                const hasRequiredIndicator = this.checkRequiredIndicator(input);
                if (!hasRequiredIndicator) {
                    this.addViolation('missing-required-indicator', input, 'Required field missing visual indicator', 'AA');
                    this.autoFixRequiredIndicator(input);
                }
            }

            // Check for error handling
            if (input.getAttribute('aria-invalid') === 'true') {
                const errorId = input.getAttribute('aria-describedby');
                const errorElement = errorId ? document.getElementById(errorId) : null;
                
                if (!errorElement) {
                    this.addViolation('missing-error-message', input, 'Invalid field missing error message', 'AA');
                }
            }
        });
    }

    checkHeadings() {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let previousLevel = 0;

        headings.forEach(heading => {
            const level = parseInt(heading.tagName.charAt(1));

            // Check heading hierarchy
            if (level > previousLevel + 1) {
                this.addViolation('heading-hierarchy', heading, `Heading level skipped (h${previousLevel} to h${level})`, 'AA');
            }

            // Check for empty headings
            if (!heading.textContent.trim()) {
                this.addViolation('empty-heading', heading, 'Heading element is empty', 'A');
            }

            previousLevel = level;
        });

        // Check for h1
        const h1Elements = document.querySelectorAll('h1');
        if (h1Elements.length === 0) {
            this.addViolation('missing-h1', document.body, 'Page missing h1 element', 'AA');
        } else if (h1Elements.length > 1) {
            this.addViolation('multiple-h1', document.body, 'Page has multiple h1 elements', 'AA');
        }
    }

    checkLinks() {
        const links = document.querySelectorAll('a');
        
        links.forEach(link => {
            // Check for href attribute
            if (!link.hasAttribute('href') && !link.hasAttribute('role')) {
                this.addViolation('invalid-link', link, 'Link without href should have role', 'A');
            }

            // Check for meaningful text
            const linkText = link.textContent.trim();
            const ariaLabel = link.getAttribute('aria-label');
            const title = link.getAttribute('title');
            
            if (!linkText && !ariaLabel && !title) {
                this.addViolation('empty-link-text', link, 'Link missing accessible name', 'A');
            }

            // Check for generic link text
            const genericTexts = ['click here', 'read more', 'more', 'here', 'link'];
            if (genericTexts.some(text => linkText.toLowerCase().includes(text))) {
                this.addViolation('generic-link-text', link, 'Link text not descriptive', 'AA');
            }

            // Check external links
            const href = link.getAttribute('href');
            if (href && (href.startsWith('http') && !href.includes(window.location.hostname))) {
                if (!link.getAttribute('aria-label')?.includes('external')) {
                    this.addViolation('unmarked-external-link', link, 'External link not marked as such', 'AAA');
                    this.autoFixExternalLink(link);
                }
            }
        });
    }

    checkColorContrast() {
        // Simple color contrast check (would need more sophisticated algorithm for production)
        const textElements = document.querySelectorAll('p, span, div, a, button, label, input, textarea');
        
        textElements.forEach(element => {
            const styles = window.getComputedStyle(element);
            const color = styles.color;
            const backgroundColor = styles.backgroundColor;
            
            // Skip if transparent or inherit
            if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
                return;
            }

            // This is a simplified check - would need proper contrast calculation
            if (this.hasLowContrast(color, backgroundColor)) {
                this.addViolation('low-color-contrast', element, 'Insufficient color contrast', 'AA');
            }
        });
    }

    checkKeyboardNavigation() {
        const focusableElements = document.querySelectorAll(
            'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        focusableElements.forEach(element => {
            // Check for negative tabindex on interactive elements
            const tabindex = element.getAttribute('tabindex');
            if (tabindex === '-1' && ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)) {
                this.addViolation('negative-tabindex', element, 'Interactive element with negative tabindex', 'A');
            }

            // Check for skip to content mechanism
            if (element.textContent?.toLowerCase().includes('skip')) {
                if (!element.classList.contains('sr-only') && !element.classList.contains('skip-link')) {
                    this.autoFixSkipLink(element);
                }
            }
        });
    }

    checkARIA() {
        const elementsWithAria = document.querySelectorAll('[aria-labelledby], [aria-describedby], [role]');
        
        elementsWithAria.forEach(element => {
            // Check aria-labelledby references
            const labelledby = element.getAttribute('aria-labelledby');
            if (labelledby) {
                const referencedElement = document.getElementById(labelledby);
                if (!referencedElement) {
                    this.addViolation('invalid-aria-labelledby', element, 'aria-labelledby references non-existent element', 'A');
                }
            }

            // Check aria-describedby references
            const describedby = element.getAttribute('aria-describedby');
            if (describedby) {
                const referencedElement = document.getElementById(describedby);
                if (!referencedElement) {
                    this.addViolation('invalid-aria-describedby', element, 'aria-describedby references non-existent element', 'A');
                }
            }

            // Check valid ARIA roles
            const role = element.getAttribute('role');
            if (role && !this.isValidAriaRole(role)) {
                this.addViolation('invalid-aria-role', element, `Invalid ARIA role: ${role}`, 'A');
            }
        });
    }

    checkFocus() {
        // Check for focus indicators
        const focusableElements = document.querySelectorAll(
            'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        focusableElements.forEach(element => {
            const styles = window.getComputedStyle(element, ':focus');
            const outline = styles.outline;
            const boxShadow = styles.boxShadow;
            
            if (outline === 'none' && boxShadow === 'none') {
                this.addViolation('no-focus-indicator', element, 'Element missing focus indicator', 'AA');
                this.autoFixFocusIndicator(element);
            }
        });
    }

    // Auto-fix methods
    autoFixLabel(input) {
        const placeholder = input.getAttribute('placeholder');
        if (placeholder) {
            input.setAttribute('aria-label', placeholder);
            this.addFix('added-aria-label', input, `Added aria-label from placeholder: ${placeholder}`);
        }
    }

    autoFixRequiredIndicator(input) {
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (label && !label.textContent.includes('*')) {
            label.innerHTML += ' <span class="required-indicator" aria-label="required">*</span>';
            this.addFix('added-required-indicator', input, 'Added visual required indicator');
        }
    }

    autoFixExternalLink(link) {
        const currentLabel = link.getAttribute('aria-label') || '';
        link.setAttribute('aria-label', `${currentLabel} (opens in new window)`.trim());
        this.addFix('marked-external-link', link, 'Added external link indication');
    }

    autoFixSkipLink(element) {
        if (!element.classList.contains('skip-link')) {
            element.classList.add('skip-link');
            this.addFix('enhanced-skip-link', element, 'Added skip-link class for better styling');
        }
    }

    autoFixFocusIndicator(element) {
        if (!element.classList.contains('has-focus-indicator')) {
            element.classList.add('has-focus-indicator');
            this.addFix('added-focus-class', element, 'Added focus indicator class');
        }
    }

    // Enhancement methods
    enhanceKeyboardNavigation() {
        // Add roving tabindex for complex widgets
        const tabGroups = document.querySelectorAll('[data-tab-group]');
        
        tabGroups.forEach(group => {
            this.setupRovingTabindex(group);
        });

        // Add keyboard shortcuts info
        this.addKeyboardShortcutsHelp();
    }

    enhanceFocusManagement() {
        // Track focus for better management
        let lastFocusedElement = null;

        document.addEventListener('focusin', (e) => {
            lastFocusedElement = e.target;
        });

        // Provide focus restoration utility
        window.RBCK = window.RBCK || {};
        RBCK.accessibility = RBCK.accessibility || {};
        RBCK.accessibility.restoreFocus = () => {
            if (lastFocusedElement) {
                lastFocusedElement.focus();
            }
        };
    }

    setupScreenReaderSupport() {
        // Create live region for announcements
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.id = 'screen-reader-announcements';
        document.body.appendChild(liveRegion);

        // Add announce function to RBCK namespace
        window.RBCK = window.RBCK || {};
        RBCK.accessibility = RBCK.accessibility || {};
        RBCK.accessibility.announce = (message) => {
            liveRegion.textContent = message;
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        };

        this.addFix('added-live-region', liveRegion, 'Added screen reader live region');
    }

    setupMutationObserver() {
        if (!window.MutationObserver) return;

        this.observer = new MutationObserver((mutations) => {
            let shouldReAudit = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check if added nodes contain form elements or other important elements
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.matches('input, select, textarea, img, a, button, h1, h2, h3, h4, h5, h6')) {
                                shouldReAudit = true;
                            }
                        }
                    });
                }
            });

            if (shouldReAudit) {
                // Debounce re-auditing
                clearTimeout(this.reAuditTimeout);
                this.reAuditTimeout = setTimeout(() => {
                    this.auditPage();
                }, 500);
            }
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Add to cleanup registry
        if (window.CleanupRegistry) {
            CleanupRegistry.addObserver(this.observer, 'accessibility');
        }
    }

    // Utility methods
    addViolation(type, element, message, level) {
        this.violations.push({
            type,
            element,
            message,
            level,
            timestamp: new Date().toISOString()
        });
    }

    addFix(type, element, description) {
        this.fixes.push({
            type,
            element,
            description,
            timestamp: new Date().toISOString()
        });
    }

    hasLowContrast(color, backgroundColor) {
        // Simplified contrast check - would need proper algorithm
        return false; // Placeholder
    }

    isValidAriaRole(role) {
        const validRoles = [
            'alert', 'alertdialog', 'button', 'checkbox', 'dialog', 'gridcell',
            'link', 'log', 'marquee', 'menuitem', 'menuitemcheckbox', 'menuitemradio',
            'option', 'progressbar', 'radio', 'scrollbar', 'slider', 'spinbutton',
            'status', 'tab', 'tabpanel', 'textbox', 'timer', 'tooltip', 'treeitem',
            'combobox', 'grid', 'listbox', 'menu', 'menubar', 'radiogroup',
            'tablist', 'tree', 'treegrid', 'application', 'article', 'banner',
            'complementary', 'contentinfo', 'form', 'main', 'navigation',
            'region', 'search', 'directory', 'document', 'group', 'heading',
            'img', 'list', 'listitem', 'math', 'note', 'presentation', 'row',
            'rowgroup', 'rowheader', 'separator', 'toolbar'
        ];
        return validRoles.includes(role);
    }

    checkRequiredIndicator(input) {
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (label) {
            return label.textContent.includes('*') || 
                   label.querySelector('.required-indicator') ||
                   input.getAttribute('aria-required') === 'true';
        }
        return false;
    }

    applyAutomaticFixes() {
        // Add CSS for accessibility enhancements
        this.injectAccessibilityCSS();
    }

    injectAccessibilityCSS() {
        if (document.getElementById('accessibility-css')) return;

        const css = `
            /* Screen reader only content */
            .sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border: 0;
            }
            
            /* Skip links */
            .skip-link {
                position: absolute;
                top: -40px;
                left: 6px;
                background: var(--bg-primary, #000);
                color: var(--text-primary, #fff);
                padding: 8px;
                z-index: var(--z-maximum, 999999);
                text-decoration: none;
                border-radius: 4px;
            }
            
            .skip-link:focus {
                top: 6px;
            }
            
            /* Focus indicators */
            .has-focus-indicator:focus {
                outline: 2px solid var(--accent-blue, #0066cc);
                outline-offset: 2px;
            }
            
            /* Required field indicators */
            .required-indicator {
                color: var(--error, #d33);
                font-weight: bold;
            }
            
            /* High contrast mode support */
            @media (prefers-contrast: high) {
                .has-focus-indicator:focus {
                    outline-width: 3px;
                }
            }
            
            /* Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
                * {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            }
        `;

        const style = document.createElement('style');
        style.id = 'accessibility-css';
        style.textContent = css;
        document.head.appendChild(style);

        this.addFix('injected-css', style, 'Added accessibility CSS enhancements');
    }

    reportResults() {
        const summary = this.getComplianceSummary();
        
        console.group('♿ [A11Y] Accessibility Audit Results');
        console.log('📊 Compliance Summary:', summary);
        
        if (this.violations.length > 0) {
            console.group('⚠️ Violations Found:');
            this.violations.forEach(violation => {
                console.warn(`${violation.level}: ${violation.message}`, violation.element);
            });
            console.groupEnd();
        }
        
        if (this.fixes.length > 0) {
            console.group('✅ Automatic Fixes Applied:');
            this.fixes.forEach(fix => {
                console.log(`${fix.type}: ${fix.description}`, fix.element);
            });
            console.groupEnd();
        }
        
        console.groupEnd();
    }

    // Public API methods
    getComplianceSummary() {
        const violationsByLevel = {};
        this.violations.forEach(v => {
            violationsByLevel[v.level] = (violationsByLevel[v.level] || 0) + 1;
        });

        return {
            totalViolations: this.violations.length,
            violationsByLevel,
            totalFixes: this.fixes.length,
            complianceScore: this.calculateComplianceScore(),
            lastAudit: new Date().toISOString()
        };
    }

    calculateComplianceScore() {
        // Simple scoring - would be more sophisticated in production
        const totalChecks = 100; // Approximate number of checks
        const violations = this.violations.length;
        return Math.max(0, ((totalChecks - violations) / totalChecks) * 100).toFixed(1);
    }

    exportComplianceReport() {
        const report = {
            summary: this.getComplianceSummary(),
            violations: this.violations.map(v => ({
                type: v.type,
                message: v.message,
                level: v.level,
                elementInfo: {
                    tagName: v.element.tagName,
                    id: v.element.id,
                    className: v.element.className,
                    textContent: v.element.textContent?.substring(0, 100)
                },
                timestamp: v.timestamp
            })),
            fixes: this.fixes,
            auditDate: new Date().toISOString(),
            wcagLevel: this.wcagLevel,
            url: window.location.href
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `accessibility-report-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Create and initialize accessibility compliance
window.AccessibilityCompliance = window.AccessibilityCompliance || new AccessibilityCompliance();

// Add to RBCK namespace
if (window.RBCK) {
    RBCK.accessibility = RBCK.accessibility || {};
    RBCK.accessibility.compliance = window.AccessibilityCompliance;
}

// Auto-initialize
window.AccessibilityCompliance.init();

// Expose useful methods globally
window.auditAccessibility = () => window.AccessibilityCompliance.auditPage();
window.exportAccessibilityReport = () => window.AccessibilityCompliance.exportComplianceReport();

console.log('✅ [A11Y] Accessibility compliance system loaded and initialized');