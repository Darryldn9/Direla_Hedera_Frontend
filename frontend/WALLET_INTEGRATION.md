# Direla Wallet Integration

This document explains the integration of Apple Wallet and Google Pay functionality into the Direla app using the `@giulio987/expo-wallet` package.

## Features

### ✅ **Platform Support**
- **iOS**: Apple Wallet integration with .pkpass files
- **Android**: Google Pay integration with JWT tokens
- **Cross-platform**: Automatic platform detection and appropriate wallet handling

### ✅ **Wallet Availability Detection**
- Checks if Apple Wallet (iOS) or Google Pay (Android) is available on the device
- Displays appropriate status messages and disables functionality if not available
- Real-time availability checking when modal opens

### ✅ **Enhanced User Experience**
- **Loading states**: Shows progress while adding card to wallet
- **Success feedback**: Confirms successful addition to wallet
- **Error handling**: Graceful error handling with retry options
- **Platform-aware UI**: Adapts text and icons based on iOS/Android

### ✅ **Security & Best Practices**
- Mock pass generation (ready for production certificate integration)
- Proper error handling and user feedback
- Platform-specific wallet pass formats

## How It Works

### 1. **User Flow**
1. User taps "Add to Apple Wallet" button in the app
2. Modal opens and checks wallet availability
3. User confirms adding their Direla card to wallet
4. App generates appropriate pass data (iOS: .pkpass, Android: JWT token)
5. `expo-wallet` module adds the pass to the native wallet
6. Success confirmation and automatic modal dismissal

### 2. **Technical Implementation**

#### **Wallet Availability Check**
```typescript
const checkWalletAvailability = async () => {
  try {
    const isAvailable = await ExpoWallet.isAvailable();
    setWalletAvailable(isAvailable);
  } catch (error) {
    setWalletAvailable(false);
  }
};
```

#### **Adding Pass to Wallet**
```typescript
const handleAddToWallet = async () => {
  try {
    const passData = generateWalletPass({
      cardNumber,
      holderName,
      balance,
      expiryDate: '12/28'
    });

    const result = await ExpoWallet.addPass(passData);
    setStep('success');
  } catch (error) {
    setStep('error');
  }
};
```

#### **Platform-Specific Pass Generation**
```typescript
// iOS: Base64 encoded .pkpass file
export const generateIOSPass = (cardData: CardData): string => {
  // Creates mock .pkpass structure with proper PassKit format
  // In production: actual certificate signing and zip creation
}

// Android: Google Pay JWT token
export const generateGooglePayToken = (cardData: CardData): string => {
  // Creates mock JWT token for Google Pay API
  // In production: proper JWT signing with service account
}
```

## Current Status: Development Mode

⚠️ **Important**: The current implementation includes **Expo Go compatibility** with fallback simulation when the native module isn't available.

### **Expo Go Compatibility**
The app now works in both environments:
- **Expo Go**: Uses simulated wallet functionality for testing the UI flow
- **Custom Development Build**: Uses real `@giulio987/expo-wallet` native module

### **How It Works**
```typescript
// Automatic fallback detection
let ExpoWallet: any = null;
try {
  ExpoWallet = require('@giulio987/expo-wallet').default;
} catch (error) {
  // Fallback for Expo Go - simulate wallet functionality
  ExpoWallet = {
    isAvailable: async () => Platform.OS === 'ios' || Platform.OS === 'android',
    addPass: async (passData: string) => {
      // Simulated 2-second delay with 90% success rate
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (Math.random() > 0.1) {
        return { success: true, message: 'Pass added successfully' };
      } else {
        throw new Error('Failed to add pass to wallet');
      }
    }
  };
}
```

### **What's Working Now:**
- ✅ **Expo Go compatibility** with automatic fallback detection
- ✅ **Demo mode indicator** showing when using simulated functionality  
- ✅ Wallet availability detection
- ✅ Complete user interface flow
- ✅ Platform detection (iOS/Android)
- ✅ Error handling and retry mechanisms
- ✅ Loading states and success feedback
- ✅ Mock pass data generation
- ✅ **90% simulated success rate** for realistic testing

### **What's Needed for Production:**

#### **For iOS (Apple Wallet):**
1. **Apple Developer Account** - Required for PassKit certificates
2. **Pass Type ID** - Register in Apple Developer portal
3. **Signing Certificates** - Generate and download from Apple
4. **Web Service** - Backend endpoint for pass updates
5. **Real .pkpass Files** - Properly signed pass bundles

#### **For Android (Google Pay):**
1. **Google Cloud Project** - Enable Google Pay API for Passes
2. **Service Account** - Create with proper permissions
3. **JWT Signing** - Implement proper cryptographic signing
4. **Pass Classes** - Define pass templates in Google Pay console
5. **Real JWT Tokens** - Properly signed and structured

## File Structure

```
components/
├── AppleWalletModal.tsx          # Main wallet integration UI
utils/
├── walletPassGenerator.ts        # Pass generation utilities
```

## Dependencies

- `@giulio987/expo-wallet` - Native wallet integration
- **Custom base64 implementation** - Built-in base64 encoding that works in Expo Go
- `expo-linear-gradient` - UI gradients
- `lucide-react-native` - Icons
- `react-native-safe-area-context` - Safe area handling

## Usage Example

```typescript
import AppleWalletModal from '../components/AppleWalletModal';

const [showWalletModal, setShowWalletModal] = useState(false);

<AppleWalletModal
  visible={showWalletModal}
  onClose={() => setShowWalletModal(false)}
  cardNumber="4532 1234 5678 9012"
  holderName="Chief Dreamer"
  balance={2847.50}
/>
```

## Production Deployment Steps

### Phase 1: Backend Integration
1. Set up pass generation backend service
2. Implement proper certificate management
3. Create secure pass signing infrastructure

### Phase 2: Apple Wallet Production
1. Register Apple Developer account
2. Create Pass Type IDs
3. Generate and install signing certificates
4. Implement web service for pass updates

### Phase 3: Google Pay Production
1. Set up Google Cloud project
2. Configure Google Pay API for Passes
3. Create service account and credentials
4. Implement JWT signing infrastructure

### Phase 4: Testing & Deployment
1. Test with real wallet passes
2. Validate across different devices
3. Monitor error rates and user feedback
4. Deploy to production with monitoring

## Resources

- [Apple PassKit Documentation](https://developer.apple.com/documentation/passkit)
- [Google Pay API for Passes](https://developers.google.com/pay/passes)
- [expo-wallet GitHub Repository](https://github.com/Giulio987/expo-wallet)
- [Hedera Hashgraph Documentation](https://docs.hedera.com/)

## Support

For technical issues with the wallet integration:
1. Check device wallet availability
2. Verify platform-specific requirements
3. Review error logs for specific failure points
4. Test on different devices and OS versions

---

**Note**: This integration provides the foundation for adding Direla virtual cards to Apple Wallet and Google Pay. The mock implementation allows for complete testing of the user experience while the production infrastructure is being developed.
