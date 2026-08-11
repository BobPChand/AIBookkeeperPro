# AI Bookkeeper Pro

Smart expense tracking, receipt scanning, and tax estimation for freelancers and small businesses.

## Tech Stack
- React Native / Expo
- Base44 Backend (Entities + Functions)
- OpenAI GPT-4o (Receipt OCR, Auto-categorization, Tax estimates)
- RevenueCat (In-App Purchases)

## Features
- Dashboard with P&L overview and charts
- Transaction management (income/expenses) with IRS Schedule C categories
- AI receipt scanner (camera + GPT-4o Vision OCR)
- Tax Center with quarterly estimates and AI deduction finder
- Pro subscription ($19.99/mo, $149.99/yr)

## Project Structure
```
src/
  components/    Reusable UI components (AIConsentModal)
  constants/     Colors, Schedule C categories
  hooks/         Custom hooks (useTransactions)
  navigation/    Bottom tab navigator (5 tabs)
  screens/       5 main screens
  services/      RevenueCat integration
  utils/         API helpers, formatting, storage
functions/       Base44 backend functions (AI-powered)
```

## Setup
1. `npm install`
2. Configure RevenueCat SDK key in src/services/useRevenueCat.ts
3. Set EAS project ID in app.json
4. Set ASC app ID and app-specific password in eas.json
5. `eas build --platform ios --profile production --auto-submit`
