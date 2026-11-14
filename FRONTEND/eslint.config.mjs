import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default [
  ...nextCoreWebVitals,
  {
    rules: {
      // The existing UI intentionally sets initial/loading state when effects
      // start data requests and when restoring browser-persisted preferences.
      "react-hooks/set-state-in-effect": "off",
    },
  },
];
