import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';

export default [
  {
    ignores: [
      '**/node_modules/**',
      'build/**',
      'dist/**',
      'main.js'
    ]
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
  },
  // add more generic rule sets here, such as:
  // js.configs.recommended,
  eslintPluginUnicorn.configs.recommended,
  {
    rules: {
      "unicorn/better-regex": 'warn',
      "unicorn/filename-case": [ "warn", { "case": "camelCase" } ]
    },
  },
];