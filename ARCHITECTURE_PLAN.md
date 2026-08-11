# AI Bookkeeper Pro - Architecture Plan

## App Overview

**Name:** AI Bookkeeper Pro
**Tagline:** Smart Expense Tracking & Tax Estimator
**Bundle ID:** ai.aibookkeeperpro.app
**ASC SKU:** aibookkeeperpro
**Platform:** React Native / Expo (iOS first, Android + Web later)
**Monetization:** Subscription via RevenueCat ($19.99/mo, $149.99/yr)
**Target Audience:** Freelancers, contractors, small business owners

---

## 5-Tab Navigation Structure

| Tab | Screen | Purpose |
|-----|--------|---------|
| 1. Dashboard | HomeScreen | P&L overview, income vs expense chart, recent transactions, tax estimate summary |
| 2. Transactions | TransactionsScreen | Add/edit/delete income & expenses, filter by category/date, search |
| 3. Scan | ScanScreen | Receipt scanner via camera, AI-powered OCR extraction, manual entry fallback |
| 4. Tax Center | TaxScreen | Quarterly tax estimates, Schedule C categories, deductions, profit/loss report |
| 5. Upgrade | UpgradeScreen | RevenueCat paywall, subscription tiers, feature comparison |

---

## Screen Architecture

### 1. Dashboard (HomeScreen)
- **Top card:** Net profit this month (income - expenses) with trend arrow
- **Chart:** Monthly income vs expenses bar chart (last 6 months, react-native-chart-kit)
- **Quick stats row:** Total income, total expenses, tax estimated
- **Recent transactions:** Last 5 transactions with category icons
- **Quick add FAB:** Floating action button to add a transaction
- Pull-to-refresh

### 2. Transactions (TransactionsScreen)
- **Search bar:** Filter by merchant name, category, amount
- **Filter chips:** All / Income / Expenses / This Month
- **Transaction list:** Date-grouped, swipe to delete, tap to edit
- **Add transaction modal:** Type (income/expense), amount, category, date, merchant, notes
- **AI auto-categorize:** When user enters a merchant name, AI suggests category
- Empty state with illustration

### 3. Scan (ScanScreen)
- **Camera viewfinder:** Capture receipt photo
- **Gallery picker:** Upload existing receipt image
- **AI extraction:** GPT-4o Vision API extracts: merchant, date, total amount, line items, tax amount
- **Review screen:** User confirms/edits extracted data before saving
- **Receipt storage:** Image saved to Base44 file storage, URL linked to transaction
- **AI consent dialog:** Shown before first scan (Apple 5.1.1/5.1.2 compliance)
- Scan history list at bottom

### 4. Tax Center (TaxScreen)
- **Tax profile setup:** Filing status, state, estimated annual income
- **Quarterly estimate card:** Q1-Q4 estimated tax payments with due dates
- **Schedule C breakdown:** Income, expenses by IRS category, net profit
- **Deduction finder:** AI suggests commonly missed deductions based on transaction history
- **P&L report:** Generate printable profit & loss statement (PDF export)
- **Tax bracket info:** Shows current bracket and effective rate

### 5. Upgrade (UpgradeScreen)
- **RevenueCat PaywallView** (react-native-purchases-ui)
- **Feature comparison:** Free vs Pro tiers
- **Free tier limits:** 25 transactions/month, no receipt scanning, no tax estimates
- **Pro tier:** Unlimited transactions, receipt scanning, AI categorization, tax estimates, P&L reports
- **Subscription products:**
  - `ai_aibookkeeper_pro_monthly` ($19.99/mo)
  - `ai_aibookkeeper_pro_yearly` ($149.99/yr)

---

## Data Model (Base44 Entities)

### Transaction Entity
```
{
  user_id: string,
  type: "income" | "expense",
  amount: number,
  category: string,          // IRS Schedule C category
  subcategory: string,
  merchant: string,
  date: string,              // ISO date
  notes: string,
  receipt_url: string,       // Base44 file storage URL
  receipt_image_uri: string, // Private file URI
  ai_categorized: boolean,   // Whether AI suggested the category
  is_tax_deductible: boolean,
  created_date: datetime,
  updated_date: datetime
}
```

### TaxProfile Entity
```
{
  user_id: string,
  filing_status: "single" | "married_joint" | "married_separate" | "head_of_household",
  state: string,
  business_name: string,
  business_type: string,     // "sole_proprietor" | "llc" | "partnership"
  estimated_annual_income: number,
  quarterly_payments: array,
  tax_year: number,
  created_date: datetime,
  updated_date: datetime
}
```

### ReceiptScan Entity
```
{
  user_id: string,
  transaction_id: string,    // Link to Transaction entity
  merchant: string,
  date: string,
  total_amount: number,
  tax_amount: number,
  line_items: array,         // [{description, amount, quantity}]
  raw_extraction: string,     // Full GPT-4o response
  image_url: string,
  status: "pending" | "reviewed" | "saved",
  created_date: datetime,
  updated_date: datetime
}
```

---

## Backend Functions

### 1. extractReceiptData (POST)
- Accepts: receipt image (base64 or file URL)
- Calls: GPT-4o Vision API with structured prompt
- Returns: merchant, date, total, tax, line items
- Uses: $OPENAI_PROJECT_KEY

### 2. categorizeTransaction (POST)
- Accepts: merchant name, amount, existing categories
- Calls: GPT-4o with transaction context
- Returns: suggested category + subcategory + tax deductible flag
- Uses: $OPENAI_PROJECT_KEY

### 3. generateTaxEstimate (POST)
- Accepts: YTD income, YTD expenses, filing status, state
- Calls: GPT-4o with tax calculation prompt + current tax brackets
- Returns: quarterly estimate, effective rate, deductions found
- Uses: $OPENAI_PROJECT_KEY

### 4. generatePLReport (POST)
- Accepts: date range, user_id
- Queries: Transaction entity for all transactions in range
- Returns: formatted P&L data (income by category, expenses by category, net profit)
- Generates: PDF URL stored in Base44 file storage

### 5. findDeductions (POST)
- Accepts: user_id, transaction history
- Calls: GPT-4o with transaction data + common deduction rules
- Returns: list of potential missed deductions with explanations
- Uses: $OPENAI_PROJECT_KEY

---

## AI Integration

### Model: GPT-4o (via OpenAI API)
- All AI calls go through Base44 backend functions (never direct from app)
- $OPENAI_PROJECT_KEY stored as environment variable
- Rate limiting: 50 AI calls/day per user (enforced in backend)

### AI Consent Dialog (Apple 5.1.1/5.1.2)
- Shown before first AI action (scan or auto-categorize)
- Text: "AI Bookkeeper Pro uses AI to scan receipts and categorize transactions. Your data is sent to our AI provider (OpenAI) for processing. Do you consent to this data sharing?"
- Buttons: "I Consent" / "Not Now"
- Consent stored in AsyncStorage + Base44 entity
- If declined: AI features disabled, manual entry still works

### Receipt OCR Prompt (GPT-4o Vision)
```
Extract the following from this receipt image:
- Merchant/business name
- Transaction date (ISO format)
- Total amount (number only)
- Tax amount (number only, if visible)
- Line items: array of {description, amount, quantity}
- Payment method (if visible)
Return as JSON.
```

### Category Suggestion Prompt (GPT-4o)
```
Based on the merchant name "{merchant}" and amount ${amount},
suggest the most appropriate IRS Schedule C expense category.
Categories: advertising, car/truck, commissions, contract labor,
depletion, depreciation, employee benefits, insurance, interest,
legal/professional services, office expense, pension/retirement,
rent/lease, repairs, supplies, taxes/licenses, travel, meals,
utilities, wages, other.
Return: {category, subcategory, is_deductible, confidence}
```

---

## RevenueCat Configuration

- **Bundle ID:** ai.aibookkeeperpro.app
- **RevenueCat SDK Key:** (to be created)
- **Entitlement:** "pro"
- **Products:**
  - `ai_aibookkeeper_pro_monthly` — $19.99/month
  - `ai_aibookkeeper_pro_yearly` — $149.99/year
- **Default offering:** $rc_monthly + $rc_annual packages
- **IAP Key:** Reuse OEZJ8NQ6GLPB (existing .p8 key)
- **App-specific password:** jpmg-ccnq-tjzq-bsig

---

## App Store Connect Configuration

- **App Name:** AI Bookkeeper Pro: Expense Tax
- **Subtitle:** Receipt Scanner & Profit Tracker
- **Keywords:** bookkeeping,expense,tax,receipt,tracker,finance,deduction,schedule,cash,profit,loss,accountant
- **Category:** Finance
- **Pricing:** Free with In-App Purchases
- **China mainland:** Excluded
- **iOS SDK:** 26.0 (macos-sequoia-15.6-xcode-26.0 build image)
- **EULA link in description:** https://aibookkeeperpro.com/terms (to be created)
- **Support URL:** https://aibookkeeperpro.com/support (to be created)
- **Privacy Policy URL:** https://aibookkeeperpro.com/privacy (to be created)

### App Store Description (with EULA)
```
AI Bookkeeper Pro is the smart expense tracker and tax estimator
for freelancers, contractors, and small business owners.

SCAN RECEIPTS INSTANTLY
Snap a photo of any receipt and our AI extracts the merchant,
date, total, and line items automatically. No manual data entry.

AUTO-CATEGORIZE TRANSACTIONS
AI suggests the right IRS Schedule C category for every expense.
Maximize your deductions without hiring an accountant.

REAL-TIME PROFIT & LOSS
See your income vs expenses at a glance. Monthly charts show
exactly where your money goes and what you're earning.

TAX ESTIMATES
Get quarterly tax estimates based on your actual income and
deductions. Never get surprised by a big tax bill again.

SUBSCRIPTIONS:
- Monthly Pro: $19.99/month
- Yearly Pro: $149.99/year

Terms of Use (EULA): https://aibookkeeperpro.com/terms
```

---

## EAS Build Configuration

### eas.json
```json
{
  "cli": {
    "version": ">= 15.0.0"
  },
  "build": {
    "production": {
      "env": {
        "OPENAI_PROJECT_KEY": "REPLACE_AT_BUILD_TIME"
      },
      "ios": {
        "buildImage": {
          "image": "macos-sequoia-15.6",
          "version": "26.0"
        }
      },
      "autoSubmit": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "NEW_APP_ID",
        "appleId": "bobchandroyalpacific@gmail.com",
        "appSpecificPassword": "REPLACE_WITH_APP_SPECIFIC_PASSWORD",
        "teamId": "57NFB744L7"
      }
    }
  }
}
```

### app.json
```json
{
  "expo": {
    "name": "AI Bookkeeper Pro",
    "slug": "ai-bookkeeper-pro",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "aibookkeeperpro",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0F172A"
    },
    "ios": {
      "bundleIdentifier": "ai.aibookkeeperpro.app",
      "supportsTablet": true,
      "infoPlist": {
        "NSCameraUsageDescription": "AI Bookkeeper Pro needs camera access to scan and digitize your receipts.",
        "NSPhotoLibraryUsageDescription": "AI Bookkeeper Pro needs photo library access to import receipt images."
      },
      "storeUrl": "REPLACE_WITH_APP_STORE_URL"
    },
    "android": {
      "package": "ai.aibookkeeperpro.app",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0F172A"
      }
    },
    "extra": {
      "eas": {
        "projectId": "REPLACE_WITH_EAS_PROJECT_ID"
      }
    },
    "plugins": ["expo-camera", "expo-image-picker"]
  }
}
```

---

## Design System

### Colors
- **Primary:** #0F172A (dark navy)
- **Accent:** #10B981 (emerald green — money/finance)
- **Income:** #10B981 (green)
- **Expense:** #EF4444 (red)
- **Neutral:** #64748B (slate gray)
- **Background:** #F8FAFC (light gray)
- **Card:** #FFFFFF (white)

### Typography
- **Headings:** System bold, 24px
- **Body:** System regular, 16px
- **Caption:** System regular, 12px
- **Numbers/Amounts:** System semibold, monospaced fallback

---

## Security & Privacy

- All AI data calls go through Base44 backend (never expose API key in app)
- User data scoped by user_id (row-level security)
- Receipt images stored as private files in Base44
- No data sold to third parties
- AI consent required before any data leaves device
- GDPR/CCPA compliant data handling
- Data export capability (CSV/PDF)

---

## Build & Deploy Timeline

1. **Phase 1 — Scaffold & Core (Now)**
   - GitHub repo, Expo project, 5-tab nav, design system
   - Transaction CRUD with Base44 entities
   - Dashboard with charts

2. **Phase 2 — AI Features**
   - Receipt scanner with GPT-4o Vision
   - Auto-categorization backend function
   - AI consent dialog

3. **Phase 3 — Tax Center**
   - Tax profile entity
   - Quarterly estimate calculator
   - Deduction finder
   - P&L report generation

4. **Phase 4 — Monetization**
   - RevenueCat setup (new project, products, entitlement)
   - PaywallView in Upgrade tab
   - Free tier gating (25 transaction limit)

5. **Phase 5 — App Store Prep**
   - App icon, splash screen, screenshots
   - Support page + privacy policy + terms URLs
   - ASC app creation, metadata, ASO keywords
   - EAS build + auto-submit

6. **Phase 6 — Submit**
   - EAS production build with iOS 26 SDK
   - Auto-submit to App Store Connect
   - Review notes with AI consent + China exclusion details
