module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
    browser: true,
  },
  extends: [
    "eslint:recommended", // Use recommended ESLint rules
    "plugin:react/recommended", // Use recommended React-specific rules
  ],
  overrides: [],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: [
    "react", // Add the ESLint plugin for React
  ],
  rules: {
    // Add your custom ESLint rules here
    "no-unused-vars": "warn", // Example: Warn about unused variables
    "react/prop-types": "off", // Example: Turn off prop-types validation
  },
};
