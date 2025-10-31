# 🇿🇦 Direla - South African Payment Solution

> **Dual-Mode Financial Platform** - Seamlessly switch between Consumer and Business experiences

A comprehensive React Native mobile application built for the **Interledger Hackathon**, leveraging **Hedera Hashgraph** technology to provide secure, efficient payment and lending solutions for South African users.

---

## 🚀 **Overview**

Direla is a revolutionary dual-mode financial platform that adapts to your needs:

- **🛒 Consumer Mode**: Personal wallet, payments, and peer-to-peer lending
- **🏢 Business Mode**: Business hub, sales management, and commercial lending
- **🔄 Seamless Switching**: Toggle between modes with persistent preferences
- **🔐 Blockchain-Powered**: Built on Hedera Hashgraph for security and transparency

---

## ✨ **Key Features**

### 🛒 **Consumer Experience**
- **Digital Wallet**: Secure balance management and transaction history
- **Quick Pay**: Multiple payment methods with QR code scanning
- **P2P Lending**: Community-driven lending with transparent credit scoring
- **Apple/Google Pay Integration**: Native wallet integration

### 🏢 **Business Experience**
- **Business Hub**: Real-time revenue tracking and inventory alerts
- **Sales Management**: Point-of-sale system with multiple payment options
- **Money Management**: Payout tracking and instant transfers
- **Business Lending**: Commercial loans based on transaction history
- **New Sale Flow**: Intuitive modal-based sales process

### 🔧 **Technical Features**
- **Dual Navigation**: Dynamic tab bars based on selected mode
- **Persistent State**: Mode preferences saved across app sessions
- **Biometric Security**: Fingerprint and Face ID authentication
- **Offline Support**: Core functionality available without internet
- **Real-time Updates**: Live transaction and balance updates

---

## 🛠 **Technology Stack**

### **Frontend**
- **React Native 0.81.4** - Cross-platform mobile development
- **Expo 54.0.7** - Development platform and build tools
- **Expo Router** - File-system based navigation
- **TypeScript** - Type-safe development
- **Lucide React Native** - Modern icon library

### **State Management**
- **React Context API** - Global state management
- **AsyncStorage** - Persistent local storage
- **React Hooks** - Component state management

### **Blockchain & Payments**
- **Hedera Hashgraph** - Distributed ledger technology
- **Smart Contracts** - Automated loan agreements
- **Apple Pay/Google Pay** - Native payment integration

### **UI/UX**
- **iOS Design Language** - Native-feeling interface
- **Safe Area Context** - Device-aware layouts
- **Linear Gradients** - Modern visual effects
- **Haptic Feedback** - Tactile user interactions

---

## 📱 **App Structure**

### **Consumer Mode Tabs**
```
├── 💳 Wallet (index)     - Balance, transactions, cards
├── 🛒 Pay               - Payment methods, QR scanner
├── 👥 Lending           - P2P loans, credit score
└── ⚙️ Settings          - Profile, security, mode toggle
```

### **Business Mode Tabs**
```
├── 🏢 Hub               - Dashboard, revenue, alerts
├── 📊 Sales             - POS system, transaction history
├── 💰 Money             - Payouts, fees, instant transfers
├── 🏦 Lending           - Business loans, capital
└── ⚙️ Settings          - Profile, security, mode toggle
```

---

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator
- Physical device (recommended for testing)

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/direla-payment-solution.git
   cd direla-payment-solution
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Run on device/simulator**
   - **iOS**: Press `i` in the terminal or scan QR code with Camera app
   - **Android**: Press `a` in the terminal or scan QR code with Expo Go app
   - **Web**: Press `w` in the terminal

### **Build for Production**

```bash
# Web build
npm run build:web

# iOS build
expo build:ios

# Android build
expo build:android
```

---

## 🏗 **Architecture**

### **Project Structure**
```
project-root/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab-based navigation
│   │   ├── index.tsx      # Consumer wallet
│   │   ├── pay.tsx        # Payment methods
│   │   ├── lending.tsx    # Lending hub
│   │   ├── hub.tsx        # Business dashboard
│   │   ├── sales.tsx      # Business sales
│   │   ├── money.tsx      # Business money
│   │   └── settings.tsx   # App settings
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
│   ├── ConsumerTabLayout.tsx
│   ├── BusinessTabLayout.tsx
│   ├── NewSaleModal.tsx
│   └── [other-modals].tsx
├── contexts/              # React contexts
│   └── AppContext.tsx     # Global app state
├── assets/                # Images, fonts, icons
└── [config-files]         # package.json, app.json, etc.
```

### **Key Components**

#### **AppContext** (`contexts/AppContext.tsx`)
- Global state management for app mode
- Persistent storage with AsyncStorage
- Mode switching logic

#### **Dynamic Tab Layouts**
- `ConsumerTabLayout.tsx` - 4 tabs for personal use
- `BusinessTabLayout.tsx` - 5 tabs for business use
- Automatic switching based on app mode

#### **New Sale Modal** (`components/NewSaleModal.tsx`)
- Two-step sales process
- Custom numpad with amount entry
- Payment method selection
- Success handling and data updates

---

## 🔐 **Security Features**

- **🔒 Biometric Authentication**: Fingerprint and Face ID support
- **🛡 Hedera Blockchain**: Immutable transaction records
- **🔐 Smart Contracts**: Automated, trustless loan agreements
- **💾 Local Storage**: Secure credential storage
- **🔄 Session Management**: Automatic logout and re-authentication

---

## 💳 **Payment Integration**

### **Supported Payment Methods**
- **Credit/Debit Cards**: Visa, Mastercard, American Express
- **Mobile Wallets**: Apple Pay, Google Pay, Samsung Pay
- **Bank Transfers**: EFT, instant transfers
- **Cash**: In-person transactions
- **QR Codes**: Quick payment scanning
- **NFC**: Tap-to-pay functionality

### **Business Payment Options**
- **Card Sales**: Integrated POS system
- **Payment Links**: Send payment requests
- **Invoicing**: Professional invoice generation
- **WhatsApp Pay**: Social payment integration

---

## 📊 **Business Features**

### **Dashboard Metrics**
- **📈 Real-time Revenue**: Daily/monthly earnings tracking
- **⚠️ Inventory Alerts**: Stock level notifications
- **📊 Sales Analytics**: Transaction volume and trends
- **🌐 Online Status**: Business availability indicator

### **Sales Management**
- **🛒 Point of Sale**: Quick transaction processing
- **📱 Mobile POS**: Turn any device into a register
- **📊 Sales History**: Complete transaction records
- **📄 Invoice Management**: Professional billing system

### **Money Management**
- **💰 Instant Payouts**: Same-day fund transfers
- **📊 Payout History**: Complete financial records
- **💳 Fee Transparency**: Clear fee breakdown
- **🏦 Multiple Accounts**: Support for multiple bank accounts

---

## 🏦 **Lending Platform**

### **Consumer Lending**
- **👥 Peer-to-Peer**: Community-based lending
- **📊 Credit Scoring**: Transparent credit assessment
- **🔒 Smart Contracts**: Automated loan agreements
- **💰 Competitive Rates**: Market-driven interest rates

### **Business Lending**
- **🏢 Commercial Loans**: Business expansion capital
- **📊 Performance-Based**: Qualification based on sales data
- **⚡ Quick Approval**: Instant decisions for qualified businesses
- **💼 Flexible Terms**: Customizable repayment schedules

---

## 🎨 **Design System**

### **Color Palette**
- **Primary Green**: `#006A4E` - Main brand color
- **Accent Yellow**: `#FFD403` - Secondary brand color
- **Light Grey**: `#F6F6F6` - Background color (instead of white)
- **Dark Grey**: `#1E1E1E` - Primary text color (instead of black)
- **Success**: `#006A4E` - Positive actions (brand green)
- **Warning**: `#FFD403` - Caution states (brand yellow)
- **Error**: `#FF3B30` - Error states
- **Info**: `#007AFF` - Information states

**Usage**: Import colors from `lib/colors.ts` for consistent theming across the app.

### **Typography**
- **Headers**: 32px bold for page titles
- **Subheaders**: 18px semi-bold for section titles
- **Body**: 16px regular for main content
- **Caption**: 14px regular for secondary text

### **Components**
- **Cards**: 16px radius with subtle shadows
- **Buttons**: 16px radius with proper touch targets
- **Icons**: 20-24px from Lucide React Native
- **Spacing**: 8px grid system for consistent layouts

---

## 🧪 **Testing**

### **Development Testing**
```bash
# Lint code
npm run lint

# Type checking
npx tsc --noEmit

# Test on different devices
expo start --tunnel
```

### **Recommended Testing**
- **iOS Devices**: iPhone 12+, iPad
- **Android Devices**: Samsung Galaxy, Google Pixel
- **Different Screen Sizes**: Test responsive layouts
- **Network Conditions**: Test offline functionality

---

## 🚀 **Deployment**

### **Expo Application Services (EAS)**
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure EAS
eas configure

# Build for app stores
eas build --platform all

# Submit to stores
eas submit --platform all
```

### **Environment Variables**
Create `.env` file with:
```env
HEDERA_NETWORK=testnet
HEDERA_ACCOUNT_ID=your_account_id
HEDERA_PRIVATE_KEY=your_private_key
API_BASE_URL=https://api.direla.co.za
```

---

## 🤝 **Contributing**

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Test thoroughly**
5. **Commit with clear messages**
   ```bash
   git commit -m "Add amazing feature"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### **Development Guidelines**
- Follow TypeScript best practices
- Use consistent naming conventions
- Add comments for complex logic
- Test on both iOS and Android
- Maintain the existing design system

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🏆 **Hackathon Context**

Built for the **Interledger Hackathon** with focus on:
- **🌍 Financial Inclusion**: Bridging the gap in South African financial services
- **🔗 Interoperability**: Seamless cross-platform payments
- **🏢 SME Empowerment**: Tools for small business growth
- **🤝 Community Finance**: Peer-to-peer lending solutions

---

## 📞 **Support**

- **📧 Email**: support@direla.co.za
- **🐛 Issues**: [GitHub Issues](https://github.com/yourusername/direla-payment-solution/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/yourusername/direla-payment-solution/discussions)
- **📱 WhatsApp**: +27 12 345 6789

---

## 🙏 **Acknowledgments**

- **Hedera Hashgraph** - Blockchain infrastructure
- **Expo Team** - Development platform
- **React Native Community** - Framework and ecosystem
- **Lucide Icons** - Beautiful icon library
- **South African Fintech Community** - Inspiration and feedback

---

<div align="center">

**Made with ❤️ in South Africa 🇿🇦**

[⭐ Star this repo](https://github.com/yourusername/direla-payment-solution) • [🍴 Fork it](https://github.com/yourusername/direla-payment-solution/fork) • [📝 Report Bug](https://github.com/yourusername/direla-payment-solution/issues)

</div>
