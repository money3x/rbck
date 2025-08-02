/**
 * 🔍 ESLint Configuration with TypeScript Support
 * Enhanced linting for JavaScript with TypeScript checking
 */

module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // TypeScript-style rules for JavaScript
    'no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    'no-console': ['warn', { 
      allow: ['warn', 'error', 'info'] 
    }],
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-arrow-callback': 'error',
    'arrow-spacing': 'error',
    'no-duplicate-imports': 'error',
    'no-useless-constructor': 'error',
    'no-useless-rename': 'error',
    'no-useless-computed-key': 'error',
    'prefer-template': 'error',
    'template-curly-spacing': 'error',
    'rest-spread-spacing': 'error',
    
    // JSDoc validation for type safety
    'valid-jsdoc': ['error', {
      requireReturn: false,
      requireReturnDescription: false,
      requireParamDescription: false,
      prefer: {
        return: 'returns'
      },
      preferType: {
        Boolean: 'boolean',
        Number: 'number',
        String: 'string',
        Object: 'object',
        Function: 'function'
      }
    }],
    'require-jsdoc': ['error', {
      require: {
        FunctionDeclaration: true,
        MethodDefinition: true,
        ClassDeclaration: true,
        ArrowFunctionExpression: false,
        FunctionExpression: false
      }
    }],
    
    // Code quality
    'complexity': ['warn', 10],
    'max-depth': ['warn', 4],
    'max-lines-per-function': ['warn', 50],
    'max-params': ['warn', 5],
    'no-magic-numbers': ['warn', { 
      ignore: [-1, 0, 1, 2, 100, 1000],
      ignoreArrayIndexes: true 
    }],
    
    // Security
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    
    // Best practices
    'eqeqeq': ['error', 'always'],
    'no-throw-literal': 'error',
    'prefer-promise-reject-errors': 'error',
    'no-return-assign': 'error',
    'no-self-compare': 'error',
    'no-unmodified-loop-condition': 'error',
    'no-useless-call': 'error',
    'yoda': 'error'
  },
  overrides: [
    {
      files: ['tests/**/*.js', '**/*.test.js', '**/*.spec.js'],
      env: {
        jest: true
      },
      rules: {
        'no-magic-numbers': 'off',
        'max-lines-per-function': 'off',
        'require-jsdoc': 'off'
      }
    },
    {
      files: ['webpack.*.js', '*.config.js'],
      env: {
        node: true
      },
      rules: {
        'no-console': 'off',
        'require-jsdoc': 'off'
      }
    }
  ],
  globals: {
    // Browser globals
    'window': 'readonly',
    'document': 'readonly',
    'console': 'readonly',
    'fetch': 'readonly',
    'localStorage': 'readonly',
    'sessionStorage': 'readonly',
    'performance': 'readonly',
    'navigator': 'readonly',
    'location': 'readonly',
    'history': 'readonly',
    
    // Module Federation
    '__webpack_share_scopes__': 'readonly',
    
    // PWA
    'BeforeInstallPromptEvent': 'readonly',
    'ServiceWorkerRegistration': 'readonly',
    
    // Testing
    'jest': 'readonly',
    'describe': 'readonly',
    'test': 'readonly',
    'expect': 'readonly',
    'beforeEach': 'readonly',
    'afterEach': 'readonly',
    'beforeAll': 'readonly',
    'afterAll': 'readonly'
  }
};