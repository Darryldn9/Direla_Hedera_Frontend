# WhatsApp Payment Integration - Project Structure

## Overview

This document outlines the complete file structure for implementing WhatsApp payment integration into your existing Hedera payment system. The structure shows both existing files and new files that need to be created.

## Complete Project Structure

```
Direla_Hedera_Frontend/
├── README.md
├── package.json
├── WhatsApp_Payment_Integration_Guide.md
├── WhatsApp_Project_Structure.md (this file)
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env
│   ├── API_DOCUMENTATION.md
│   ├── examples/
│   │   └── payment-demo.md
│   │
│   ├── src/
│   │   ├── index.ts
│   │   ├── app.ts
│   │   │
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── hedera.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   └── whatsapp.controller.ts                    # 🆕 NEW
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── hedera.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   └── whatsapp.routes.ts                        # 🆕 NEW
│   │   │
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── cache-scheduler.service.ts
│   │   │   ├── cached-transaction.service.ts
│   │   │   ├── did.service.ts
│   │   │   ├── hedera-account.service.ts
│   │   │   ├── hedera.service.ts
│   │   │   ├── redis-cached-transaction.service.ts
│   │   │   ├── transaction-cache-manager.service.ts
│   │   │   ├── user.service.ts
│   │   │   ├── whatsapp.service.ts                       # 🆕 NEW
│   │   │   ├── whatsapp-auth.service.ts                  # 🆕 NEW
│   │   │   ├── whatsapp-validator.service.ts             # 🆕 NEW
│   │   │   ├── whatsapp-monitoring.service.ts            # 🆕 NEW
│   │   │   ├── qrcode.service.ts                         # 🆕 NEW
│   │   │   └── scheduled-payment.service.ts              # 🆕 NEW
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── cors.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   ├── rate-limit.middleware.ts
│   │   │   └── whatsapp-rate-limit.middleware.ts         # 🆕 NEW
│   │   │
│   │   ├── types/
│   │   │   ├── api.types.ts
│   │   │   ├── hedera.types.ts
│   │   │   ├── user.types.ts
│   │   │   └── whatsapp.types.ts                         # 🆕 NEW
│   │   │
│   │   ├── utils/
│   │   │   ├── database.util.ts
│   │   │   ├── validation.util.ts
│   │   │   ├── crypto.util.ts
│   │   │   └── whatsapp.util.ts                          # 🆕 NEW
│   │   │
│   │   ├── database/
│   │   │   ├── migrations/
│   │   │   │   ├── 001_initial_setup.sql
│   │   │   │   ├── 002_hedera_accounts.sql
│   │   │   │   ├── 003_whatsapp_users.sql                # 🆕 NEW
│   │   │   │   ├── 004_whatsapp_messages.sql             # 🆕 NEW
│   │   │   │   ├── 005_whatsapp_sessions.sql             # 🆕 NEW
│   │   │   │   └── 006_scheduled_payments.sql            # 🆕 NEW
│   │   │   │
│   │   │   └── models/
│   │   │       ├── user.model.ts
│   │   │       ├── hedera-account.model.ts
│   │   │       ├── whatsapp-user.model.ts                # 🆕 NEW
│   │   │       ├── whatsapp-message.model.ts             # 🆕 NEW
│   │   │       ├── whatsapp-session.model.ts             # 🆕 NEW
│   │   │       └── scheduled-payment.model.ts            # 🆕 NEW
│   │   │
│   │   ├── infrastructure/
│   │   │   ├── external-api.ts
│   │   │   ├── redis.ts
│   │   │   └── twilio.ts                                 # 🆕 NEW
│   │   │
│   │   └── __tests__/
│   │       ├── controllers/
│   │       │   └── whatsapp.controller.test.ts           # 🆕 NEW
│   │       │
│   │       ├── services/
│   │       │   ├── whatsapp.service.test.ts              # 🆕 NEW
│   │       │   ├── whatsapp-validator.test.ts            # 🆕 NEW
│   │       │   └── qrcode.service.test.ts                # 🆕 NEW
│   │       │
│   │       └── integration/
│   │           ├── whatsapp-webhook.test.ts              # 🆕 NEW
│   │           └── whatsapp-e2e.test.ts                  # 🆕 NEW
│   │
│   └── dist/                                             # Compiled JavaScript
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   │
│   ├── components/
│   │   ├── PaymentMethodsModal.tsx
│   │   ├── whatsapp/                                     # 🆕 NEW
│   │   │   ├── WhatsAppQRCode.tsx                        # 🆕 NEW
│   │   │   ├── WhatsAppSetup.tsx                         # 🆕 NEW
│   │   │   ├── WhatsAppStatus.tsx                        # 🆕 NEW
│   │   │   └── WhatsAppIntegration.tsx                   # 🆕 NEW
│   │   │
│   │   └── ui/
│   │       ├── button.tsx
│   │       ├── modal.tsx
│   │       └── qr-code.tsx                               # 🆕 NEW
│   │
│   ├── hooks/
│   │   ├── useApi.ts
│   │   ├── usePaymentPolling.ts
│   │   ├── usePaymentPollingWithToast.ts
│   │   ├── usePayments.ts
│   │   ├── useWhatsApp.ts                                # 🆕 NEW
│   │   └── useWhatsAppStatus.ts                          # 🆕 NEW
│   │
│   ├── services/
│   │   └── api/
│   │       ├── auth.service.ts
│   │       ├── base.ts
│   │       ├── cached-transaction.service.ts
│   │       ├── config.ts
│   │       ├── did.service.ts
│   │       ├── hedera.service.ts
│   │       ├── metrics.service.ts
│   │       ├── payment.service.ts
│   │       ├── transaction.service.ts
│   │       └── whatsapp.service.ts                       # 🆕 NEW
│   │
│   ├── types/
│   │   ├── api.ts
│   │   └── whatsapp.ts                                   # 🆕 NEW
│   │
│   ├── examples/
│   │   ├── PaymentExample.tsx
│   │   └── WhatsAppExample.tsx                           # 🆕 NEW
│   │
│   ├── pages/ (or app/ if using App Router)
│   │   ├── api/
│   │   │   └── whatsapp/
│   │   │       ├── webhook.ts                            # 🆕 NEW (if using Next.js API routes)
│   │   │       └── send-message.ts                       # 🆕 NEW (if using Next.js API routes)
│   │   │
│   │   ├── dashboard/
│   │   │   ├── index.tsx
│   │   │   ├── payments.tsx
│   │   │   └── whatsapp.tsx                              # 🆕 NEW
│   │   │
│   │   └── settings/
│   │       ├── index.tsx
│   │       └── whatsapp.tsx                              # 🆕 NEW
│   │
│   ├── styles/
│   │   ├── globals.css
│   │   └── whatsapp.css                                  # 🆕 NEW
│   │
│   └── public/
│       ├── icons/
│       │   └── whatsapp.svg                              # 🆕 NEW
│       │
│       └── images/
│           └── whatsapp-setup-guide.png                  # 🆕 NEW
│
├── docs/                                                 # 🆕 NEW
│   ├── whatsapp/
│   │   ├── setup-guide.md                                # 🆕 NEW
│   │   ├── api-reference.md                              # 🆕 NEW
│   │   ├── troubleshooting.md                            # 🆕 NEW
│   │   └── examples.md                                   # 🆕 NEW
│   │
│   └── deployment/
│       ├── twilio-setup.md                               # 🆕 NEW
│       └── production-checklist.md                       # 🆕 NEW
│
├── scripts/                                              # 🆕 NEW
│   ├── setup-whatsapp.sh                                 # 🆕 NEW
│   ├── deploy-webhooks.sh                                # 🆕 NEW
│   └── test-whatsapp.sh                                  # 🆕 NEW
│
└── config/
    ├── database.config.ts
    ├── redis.config.ts
    └── whatsapp.config.ts                                # 🆕 NEW
```

## File Details and Purposes

### 🆕 New Backend Files

#### Controllers
- **`whatsapp.controller.ts`** - Handles WhatsApp webhook endpoints and message processing
- **Purpose**: Receive and respond to Twilio webhooks, manage WhatsApp message routing

#### Services
- **`whatsapp.service.ts`** - Core WhatsApp business logic and message handling
- **`whatsapp-auth.service.ts`** - Phone number verification and user authentication
- **`whatsapp-validator.service.ts`** - Input validation and sanitization for WhatsApp messages
- **`whatsapp-monitoring.service.ts`** - Analytics, logging, and monitoring for WhatsApp interactions
- **`qrcode.service.ts`** - QR code generation for payments
- **`scheduled-payment.service.ts`** - Recurring and scheduled payment management

#### Routes
- **`whatsapp.routes.ts`** - Express routes for WhatsApp endpoints (/api/whatsapp/*)

#### Middleware
- **`whatsapp-rate-limit.middleware.ts`** - Rate limiting specific to WhatsApp operations

#### Types
- **`whatsapp.types.ts`** - TypeScript interfaces for WhatsApp-related data structures

#### Database
- **`003_whatsapp_users.sql`** - Links WhatsApp phone numbers to user accounts
- **`004_whatsapp_messages.sql`** - Logs WhatsApp messages for debugging and analytics
- **`005_whatsapp_sessions.sql`** - Stores temporary session data for multi-step flows
- **`006_scheduled_payments.sql`** - Stores scheduled and recurring payment configurations

#### Models
- **`whatsapp-user.model.ts`** - Database model for WhatsApp user relationships
- **`whatsapp-message.model.ts`** - Database model for message logging
- **`whatsapp-session.model.ts`** - Database model for session management
- **`scheduled-payment.model.ts`** - Database model for scheduled payments

#### Infrastructure
- **`twilio.ts`** - Twilio client configuration and initialization

#### Tests
- **`whatsapp.controller.test.ts`** - Unit tests for WhatsApp controller
- **`whatsapp.service.test.ts`** - Unit tests for WhatsApp service logic
- **`whatsapp-validator.test.ts`** - Tests for input validation
- **`qrcode.service.test.ts`** - Tests for QR code generation
- **`whatsapp-webhook.test.ts`** - Integration tests for webhook endpoints
- **`whatsapp-e2e.test.ts`** - End-to-end tests for complete WhatsApp flows

### 🆕 New Frontend Files

#### Components
- **`WhatsAppQRCode.tsx`** - Component for displaying payment QR codes
- **`WhatsAppSetup.tsx`** - Component for WhatsApp account setup and linking
- **`WhatsAppStatus.tsx`** - Component showing WhatsApp connection status
- **`WhatsAppIntegration.tsx`** - Main WhatsApp integration management component
- **`qr-code.tsx`** - Reusable QR code display component

#### Hooks
- **`useWhatsApp.ts`** - Hook for WhatsApp integration state management
- **`useWhatsAppStatus.ts`** - Hook for monitoring WhatsApp connection status

#### Services
- **`whatsapp.service.ts`** - Frontend API client for WhatsApp endpoints

#### Types
- **`whatsapp.ts`** - Frontend TypeScript interfaces for WhatsApp features

#### Pages
- **`whatsapp.tsx`** - WhatsApp management dashboard page
- **`settings/whatsapp.tsx`** - WhatsApp settings and configuration page

#### Examples
- **`WhatsAppExample.tsx`** - Example implementation of WhatsApp payment flow

### 🆕 Documentation Files

#### WhatsApp Documentation
- **`setup-guide.md`** - Step-by-step setup instructions
- **`api-reference.md`** - API documentation for WhatsApp endpoints
- **`troubleshooting.md`** - Common issues and solutions
- **`examples.md`** - Code examples and usage patterns

#### Deployment Documentation
- **`twilio-setup.md`** - Twilio account and WhatsApp Business API setup
- **`production-checklist.md`** - Pre-deployment checklist and requirements

### 🆕 Scripts

- **`setup-whatsapp.sh`** - Automated setup script for WhatsApp integration
- **`deploy-webhooks.sh`** - Script to configure Twilio webhooks
- **`test-whatsapp.sh`** - Automated testing script for WhatsApp functionality

### 🆕 Configuration

- **`whatsapp.config.ts`** - WhatsApp-specific configuration and environment variables

## Implementation Order

### Phase 1: Backend Foundation (Week 1)
1. Create database migrations (`003_whatsapp_users.sql` through `006_scheduled_payments.sql`)
2. Implement core services (`whatsapp.service.ts`, `whatsapp-validator.service.ts`)
3. Create controllers and routes (`whatsapp.controller.ts`, `whatsapp.routes.ts`)
4. Set up Twilio infrastructure (`infrastructure/twilio.ts`)

### Phase 2: Core Functionality (Week 2)
1. Implement authentication service (`whatsapp-auth.service.ts`)
2. Add QR code generation (`qrcode.service.ts`)
3. Create monitoring and analytics (`whatsapp-monitoring.service.ts`)
4. Add rate limiting middleware (`whatsapp-rate-limit.middleware.ts`)

### Phase 3: Frontend Integration (Week 3)
1. Create frontend API service (`frontend/services/api/whatsapp.service.ts`)
2. Implement React components (`components/whatsapp/`)
3. Add hooks for state management (`useWhatsApp.ts`, `useWhatsAppStatus.ts`)
4. Create dashboard pages (`pages/dashboard/whatsapp.tsx`)

### Phase 4: Advanced Features (Week 4)
1. Implement scheduled payments (`scheduled-payment.service.ts`)
2. Add comprehensive testing (all test files)
3. Create documentation (`docs/whatsapp/`)
4. Set up deployment scripts (`scripts/`)

### Phase 5: Production Deployment (Week 5)
1. Security hardening and review
2. Production environment setup
3. Twilio WhatsApp Business API approval
4. Monitoring and alerting setup
5. Go-live and user onboarding

## Environment Variables

Add these to your `.env` files:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
TWILIO_WEBHOOK_URL=https://yourdomain.com/api/whatsapp/webhook

# WhatsApp Bot Configuration
WHATSAPP_SESSION_TIMEOUT=1800000
WHATSAPP_MAX_AMOUNT=1000
WHATSAPP_ADMIN_NUMBERS=+1234567890,+0987654321
WHATSAPP_RATE_LIMIT_MESSAGES=20
WHATSAPP_RATE_LIMIT_PAYMENTS=3
WHATSAPP_RATE_LIMIT_REGISTRATION=3

# Feature Flags
WHATSAPP_ENABLED=true
WHATSAPP_QR_ENABLED=true
WHATSAPP_SCHEDULED_PAYMENTS_ENABLED=true
WHATSAPP_MONITORING_ENABLED=true
```

## Dependencies to Add

### Backend Dependencies
```json
{
  "dependencies": {
    "twilio": "^4.19.0",
    "@types/twilio": "^1.0.0",
    "express-rate-limit": "^7.1.0",
    "qrcode": "^1.5.3",
    "@types/qrcode": "^1.5.2",
    "node-cron": "^3.0.2",
    "@types/node-cron": "^3.0.8"
  }
}
```

### Frontend Dependencies
```json
{
  "dependencies": {
    "react-qr-code": "^2.0.11",
    "qrcode.react": "^3.1.0",
    "@types/qrcode.react": "^1.0.2"
  }
}
```

This structure provides a complete roadmap for implementing WhatsApp payment integration while maintaining clean separation of concerns and following your existing project patterns.