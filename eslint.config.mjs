import eslint from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import stylistic from "@stylistic/eslint-plugin";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";
import globals from "globals";

export default defineConfig(
    globalIgnores(["dist/", ".astro/", "public/", "astro.config.mjs", "eslint.config.mjs"]),

    eslint.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    ...astro.configs.recommended,

    {
        files: ["**/*.ts", "**/*.astro"],
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.browser,
            },
            parserOptions: {
                projectService: {
                    allowDefaultProject: ["*.astro", "*.ts", "*.mts", "*.js", "*.mjs"],
                },
                tsconfigRootDir: import.meta.dirname,
            },
        },
        plugins: {
            "@stylistic": stylistic,
        },
        rules: {
            // --- Type safety ---
            "@typescript-eslint/no-unsafe-argument": "error",
            "@typescript-eslint/no-unsafe-assignment": "error",
            "@typescript-eslint/no-unsafe-call": "error",
            "@typescript-eslint/no-unsafe-member-access": "error",
            "@typescript-eslint/no-unsafe-return": "error",
            "@typescript-eslint/require-await": "error",
            "@typescript-eslint/no-misused-promises": [
                "error",
                { checksVoidReturn: { attributes: false } },
            ],
            "@typescript-eslint/no-floating-promises": "error",
            "@typescript-eslint/await-thenable": "error",
            "@typescript-eslint/no-unnecessary-type-assertion": "error",
            "@typescript-eslint/no-unnecessary-template-expression": "error",
            "@typescript-eslint/restrict-template-expressions": [
                "error",
                { allowNumber: true, allowBoolean: true },
            ],
            "@typescript-eslint/restrict-plus-operands": "error",
            "@typescript-eslint/prefer-nullish-coalescing": "error",
            "@typescript-eslint/no-unnecessary-condition": "error",
            "@typescript-eslint/no-confusing-void-expression": [
                "error",
                { ignoreArrowShorthand: true },
            ],
            "@typescript-eslint/switch-exhaustiveness-check": "error",
            "@typescript-eslint/no-dynamic-delete": "error",
            "@typescript-eslint/no-non-null-asserted-optional-chain": "error",
            "@typescript-eslint/no-non-null-assertion": "error",
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_",
                },
            ],

            // --- Code quality ---
            eqeqeq: ["error", "always", { null: "ignore" }],
            "no-throw-literal": "off",
            "@typescript-eslint/only-throw-error": "error",
            "no-self-compare": "error",
            "no-case-declarations": "error",
            "no-constructor-return": "error",
            "no-promise-executor-return": "error",
            "no-template-curly-in-string": "error",
            "no-unmodified-loop-condition": "error",
            "no-unreachable-loop": "error",
            "no-unused-private-class-members": "error",
            "no-useless-concat": "error",
            "no-useless-assignment": "error",
            "no-constant-condition": ["error", { checkLoops: false }],
            "symbol-description": "error",
            "no-console": ["warn", { allow: ["warn", "error"] }],

            // --- Code Style ---
            "@stylistic/semi": ["error", "never"],
            "@stylistic/quotes": ["error", "double", { avoidEscape: true, allowTemplateLiterals: "always" }],
            "@stylistic/indent": ["error", 4],
            "@stylistic/no-trailing-spaces": "error",
            "@stylistic/eol-last": "error",
            "@stylistic/no-multiple-empty-lines": ["error", { max: 1, maxBOF: 0 }],
            "@stylistic/comma-dangle": ["error", "always-multiline"],
            "@stylistic/comma-spacing": ["error", { before: false, after: true }],
            "@stylistic/object-curly-spacing": ["error", "always"],
            "@stylistic/array-bracket-spacing": ["error", "never"],
            "@stylistic/keyword-spacing": ["error", { before: true, after: true }],
            "@stylistic/space-before-blocks": "error",
            "@stylistic/space-infix-ops": "error",
            "@stylistic/space-before-function-paren": [
                "error",
                { anonymous: "always", named: "never", asyncArrow: "always" },
            ],
            "@stylistic/arrow-spacing": "error",
            "@stylistic/brace-style": ["error", "1tbs", { allowSingleLine: true }],
            "@stylistic/member-delimiter-style": [
                "error",
                { multiline: { delimiter: "none" }, singleline: { delimiter: "comma" } },
            ],
            "@stylistic/type-annotation-spacing": "error",
            "@stylistic/block-spacing": ["error", "always"],
            "@stylistic/switch-colon-spacing": "error",
            "@stylistic/operator-linebreak": ["error", "before"],
            "@stylistic/multiline-ternary": ["error", "always-multiline"],
            "@stylistic/no-mixed-operators": "error",
            "@stylistic/wrap-iife": ["error", "inside"],
            "@stylistic/no-multi-spaces": ["error", { ignoreEOLComments: true }],
            "@stylistic/rest-spread-spacing": ["error", "never"],
            "@stylistic/template-curly-spacing": ["error", "never"],
            "@stylistic/jsx-quotes": ["error", "prefer-double"],
        },
    },

    {
        files: ["**/*.astro"],
        languageOptions: {
            parserOptions: {
                parser: tseslint.parser,
                extraFileExtensions: [".astro"],
                projectService: false,
                project: true,
            },
        },
        rules: {
            "astro/no-set-html-directive": "error",
            "astro/no-unused-define-vars-in-style": "error",
            "astro/no-conflict-set-directives": "error",
            "@typescript-eslint/no-unsafe-return": "off",
        },
    },

    {
        files: ["**/*.test.ts"],
        rules: {
            "@typescript-eslint/no-floating-promises": "off",
            "no-console": "off",
        },
    },

    {
        files: ["scripts/**/*.ts"],
        rules: {
            "no-console": "off",
        },
    },
);
