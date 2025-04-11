module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true
    },
    project: './tsconfig.json'
  },
  plugins: ["@typescript-eslint", "react", "react-hooks"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended"
  ],
  settings: {
    react: {
      version: "detect"
    }
  },
  rules: {
    // TypeScript specific rules
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["warn", { 
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_" 
    }],
    "@typescript-eslint/ban-ts-comment": "warn",
    "@typescript-eslint/no-non-null-assertion": "warn",
    
    // React specific rules
    "react/prop-types": "off", // Not needed with TypeScript
    "react/react-in-jsx-scope": "off", // Not needed with modern React
    "react/display-name": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    
    // General rules
    "no-console": "warn",
    "no-debugger": "warn"
  }
};