import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import react from "eslint-plugin-react";
import globals from "globals";

// Lints fitness-corner-generator.jsx only. sandbox.html/index.html are HTML
// wrappers around the same component code -- run scripts/sync_jsx.py first
// to bring sandbox.html's changes into the .jsx, then lint, then
// scripts/build_html.py to carry it back into index.html. See CLAUDE.md.
export default [
  js.configs.recommended,
  {
    files: ["fitness-corner-generator.jsx"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser },
    },
    plugins: { "react-hooks": reactHooks, react },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // This app is plain React 18 UMD with no build step -- it never runs
      // through React Compiler, so its purity/set-state-in-effect rules
      // (which assume compiler-driven memoization) don't apply here and
      // would just flag long-standing, working patterns (e.g. useState(Date.now())
      // as a lazy initializer, setState-as-fallback inside a data-load effect).
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
      "react/jsx-uses-vars": "error",
      "no-unused-vars": ["warn", { varsIgnorePattern: "^[A-Z]" }],
      // Empty catch {} is a deliberate storage-degrades-gracefully pattern
      // used throughout (see CLAUDE.md: "missing storage degrades gracefully").
      "no-empty": ["error", { allowEmptyCatch: true }],
      // The exact bug class that caused a blank-page crash this session:
      // a hook referencing a const/let declared later in the same scope.
      "no-use-before-define": ["error", { functions: false, classes: true, variables: true }],
    },
  },
];
