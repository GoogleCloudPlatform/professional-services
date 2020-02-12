module.exports = {
  'extends': [
    'airbnb-base',
  ],
  'globals': {
    'Atomics': 'readonly',
    'SharedArrayBuffer': 'readonly',
  },
  'parserOptions': {
    'sourceType': 'module'
  },
  'rules': {
  	'strict': ['error', 'global'],
    'no-use-before-define': ['error', 'nofunc'],
    'no-console': 'off',
    'import/no-unresolved': 'off',
    'import/order': 'off',
    'import/prefer-default-export': 'off',
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }]
  },
};
