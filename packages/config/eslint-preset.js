import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

/**
 * Base ESLint flat config for all EOP workspaces.
 * Includes recommended rules + TypeScript support.
 */
export const base = tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.recommended,
    {
        rules: {
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/consistent-type-imports': [
                'error',
                { prefer: 'type-imports' },
            ],
        },
    },
    {
        ignores: [
            'dist/**',
            'node_modules/**',
            '.next/**',
            '.expo/**',
            '.turbo/**',
        ],
    },
);

/**
 * Import boundary for UI packages.
 * UI cannot import from @eop/db (direct or server).
 */
export const uiPackageBoundary = {
    rules: {
        'no-restricted-imports': [
            'error',
            {
                patterns: [
                    {
                        group: ['@eop/db', '@eop/db/*'],
                        message: 'UI package cannot depend on the database package.',
                    },
                ],
            },
        ],
    },
};

/**
 * Import boundary for client-side code.
 * Client code cannot import server-only modules.
 */
export const clientBoundary = {
    rules: {
        'no-restricted-imports': [
            'error',
            {
                patterns: [
                    {
                        group: ['@eop/db/server', '@eop/db/server/*'],
                        message: 'Cannot import server-only modules from client code.',
                    },
                ],
            },
        ],
    },
};
