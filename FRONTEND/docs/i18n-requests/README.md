# Localization & Translation Guide

Nirmay supports English (`en`), Hindi (`hi`), and Kannada (`kn`).

## Adding Translations
All translations are stored in `public/locales/`:
- `public/locales/en.json`
- `public/locales/hi.json`
- `public/locales/kn.json`

## How to use in components:
```javascript
import { useI18n } from "@/context/I18nContext";

const { t, lang, setLang } = useI18n();

// Usage:
<h1>{t("app.name", "Nirmay")}</h1>
```

## Adding Keys
When you need new keys for features:
1. Add the English string to `public/locales/en.json`.
2. Provide Hindi and Kannada counterparts in `hi.json` and `kn.json`.
3. If pending translation, leave a request file in `docs/i18n-requests/<feature>.json`.
