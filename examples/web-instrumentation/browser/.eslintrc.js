module.exports = {
  'env': {
    'browser': true,
    'es6': true,
  },
  'extends': [
    'airbnb-base',
  ],
  'globals': {
    'Atomics': 'readonly',
    'SharedArrayBuffer': 'readonly',
  },
  'parserOptions': {
    'ecmaVersion': 2018,
    'sourceType': 'module'
  },
  'rules': {
  	'strict': ['error', 'global'],
    'no-use-before-define': ['error', 'nofunc'],
    'no-console': 'off',
    'import/no-unresolved': 'off',
    'import/prefer-default-export': 'off',
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }]
  },
};
