# Android NFC Compatibility Guide for Direla

## Table of Contents
1. [Android vs iOS NFC Differences](#android-vs-ios-nfc-differences)
2. [Android Configuration](#android-configuration)
3. [Cross-Platform NFC Hook](#cross-platform-nfc-hook)
4. [Android-Specific Features](#android-specific-features)
5. [Permissions & Runtime Handling](#permissions--runtime-handling)
6. [Testing on Android](#testing-on-android)
7. [Common Issues & Solutions](#common-issues--solutions)

---

## Android vs iOS NFC Differences

### Feature Comparison

| Feature | iOS | Android |
|---------|-----|---------|
| **NFC Read** | iPhone 7+ (iOS 11+) | Most devices with NFC chip (Android 4.4+) |
| **NFC Write** | iPhone XS+ (iOS 13+) | Android 4.4+ |
| **Background Reading** | iOS 12+ (limited) | Android 4.4+ (full support) |
| **Foreground Dispatch** | Session-based | Intent-based |
| **Tag Emulation** | ❌ Not supported | ✅ Host Card Emulation (HCE) |
| **P2P (Android Beam)** | ❌ Not supported | ✅ (Deprecated in Android 10+) |
| **Tag Discovery** | Manual scan session | Automatic intent dispatch |
| **Permissions** | Info.plist only | Runtime permissions (Android 12+) |

### Key Differences

1. **iOS**: Session-based, requires explicit user action to start scanning
2. **Android**: Intent-based, can automatically launch app when NFC tag is detected

---

## Android Configuration

### Step 1: Update app.json for Android

```json
{
  "expo": {
    "name": "bolt-expo-nativewind",
    "slug": "bolt-expo-nativewind",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "myapp",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.direla.app",
      "infoPlist": {
        "LSApplicationQueriesSchemes": ["whatsapp"],
        "NFCReaderUsageDescription": "This app uses NFC to read payment information from tags and other devices for quick and secure payments on the Hedera network.",
        "com.apple.developer.nfc.readersession.formats": [
          "NDEF",
          "TAG"
        ]
      },
      "entitlements": {
        "com.apple.developer.nfc.readersession.formats": [
          "NDEF"
        ]
      }
    },
    "android": {
      "package": "com.direla.app",
      "permissions": [
        "android.permission.NFC",
        "android.permission.VIBRATE",
        "android.permission.INTERNET"
      ],
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "intentFilters": [
        {
          "action": "android.nfc.action.NDEF_DISCOVERED",
          "category": ["android.intent.category.DEFAULT"],
          "data": {
            "mimeType": "text/plain"
          }
        },
        {
          "action": "android.nfc.action.TAG_DISCOVERED",
          "category": ["android.intent.category.DEFAULT"]
        }
      ]
    },
    "web": {
      "bundler": "metro",
      "output": "single",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      "expo-font",
      "expo-web-browser",
      [
        "react-native-nfc-manager",
        {
          "nfcPermission": "This app uses NFC to read payment information from tags and other devices."
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

### Step 2: Create AndroidManifest.xml Configuration

After running `npx expo prebuild`, update `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- NFC Permission -->
    <uses-permission android:name="android.permission.NFC" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <!-- Declare NFC hardware requirement (optional - allows devices without NFC to still install) -->
    <uses-feature
        android:name="android.hardware.nfc"
        android:required="false" />

    <application
        android:name=".MainApplication"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:allowBackup="false"
        android:theme="@style/AppTheme">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTask"
            android:configChanges="keyboard|keyboardHidden|orientation|screenSize|uiMode"
            android:windowSoftInputMode="adjustResize">

            <!-- Regular app launcher intent -->
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <!-- NFC NDEF Discovery - triggers when NDEF formatted tag is scanned -->
            <intent-filter>
                <action android:name="android.nfc.action.NDEF_DISCOVERED" />
                <category android:name="android.intent.category.DEFAULT" />
                <data android:mimeType="text/plain" />
            </intent-filter>

            <!-- NFC Tech Discovery - triggers for specific tag technologies -->
            <intent-filter>
                <action android:name="android.nfc.action.TECH_DISCOVERED" />
                <category android:name="android.intent.category.DEFAULT" />
            </intent-filter>

            <!-- NFC Tag Discovery - fallback for any NFC tag -->
            <intent-filter>
                <action android:name="android.nfc.action.TAG_DISCOVERED" />
                <category android:name="android.intent.category.DEFAULT" />
            </intent-filter>

        </activity>
    </application>
</manifest>
```

---

## Cross-Platform NFC Hook

### Updated useNFC.ts (iOS + Android)

Create `frontend/hooks/useNFC.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';
import NfcManager, { NfcTech, Ndef, NfcEvents } from 'react-native-nfc-manager';
import { Platform, Alert, PermissionsAndroid, Vibration } from 'react-native';

export interface NFCPaymentData {
  toAccountId: string;
  amount: number;
  currency: string;
  accountAlias?: string;
  memo?: string;
  merchant_user_id?: string;
  timestamp: string;
  fromCurrency?: string;
  toCurrency?: string;
  quoteId?: string;
}

export function useNFC() {
  const [isNFCSupported, setIsNFCSupported] = useState(false);
  const [isNFCEnabled, setIsNFCEnabled] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Android: Request NFC permission (Android 12+)
  const requestAndroidNFCPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    // Android 12+ requires runtime permission
    if (Platform.Version >= 31) {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.NFC,
          {
            title: 'NFC Permission',
            message: 'Direla needs access to NFC to read payment tags',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('NFC permission error:', err);
        return false;
      }
    }
    return true; // No permission needed for Android < 12
  };

  useEffect(() => {
    async function checkNFC() {
      try {
        // Check if NFC is supported
        const supported = await NfcManager.isSupported();
        setIsNFCSupported(supported);

        if (supported) {
          // Initialize NFC Manager
          await NfcManager.start();

          // Check if NFC is enabled
          const enabled = await NfcManager.isEnabled();
          setIsNFCEnabled(enabled);

          // Android: Request permission
          if (Platform.OS === 'android') {
            await requestAndroidNFCPermission();
          }
        }
      } catch (error) {
        console.error('NFC check error:', error);
        setIsNFCSupported(false);
      }
    }

    checkNFC();

    // Cleanup on unmount
    return () => {
      NfcManager.cancelTechnologyRequest().catch(() => {});
    };
  }, []);

  // Android: Listen for background NFC tag discovery
  useEffect(() => {
    if (Platform.OS === 'android' && isNFCSupported) {
      const handleAndroidNFCDiscovery = (tag: any) => {
        console.log('Android NFC tag discovered in background:', tag);
        // This will be handled by the app's deep linking mechanism
      };

      // Register listener for background NFC discovery
      NfcManager.setEventListener(NfcEvents.DiscoverTag, handleAndroidNFCDiscovery);

      return () => {
        NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
      };
    }
  }, [isNFCSupported]);

  const readNFCTag = async (
    onSuccess: (data: NFCPaymentData) => void,
    onError: (error: string) => void
  ) => {
    if (!isNFCSupported) {
      Alert.alert('NFC Not Supported', 'Your device does not support NFC reading.');
      return;
    }

    if (!isNFCEnabled) {
      Alert.alert(
        'NFC Disabled',
        'Please enable NFC in your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => {
              if (Platform.OS === 'android') {
                NfcManager.goToNfcSetting();
              }
            }
          }
        ]
      );
      return;
    }

    // Android: Check permissions
    if (Platform.OS === 'android') {
      const hasPermission = await requestAndroidNFCPermission();
      if (!hasPermission) {
        onError('NFC permission denied');
        return;
      }
    }

    try {
      setIsScanning(true);

      // Platform-specific alert messages
      const alertMessage = Platform.OS === 'ios'
        ? 'Hold your phone near an NFC payment tag'
        : 'Ready to scan - bring tag close to back of phone';

      // Request NFC technology
      await NfcManager.requestTechnology(NfcTech.Ndef, {
        alertMessage,
        invalidateAfterFirstRead: true, // iOS: auto-close after read
      });

      // Read NDEF message
      const tag = await NfcManager.getTag();
      console.log('NFC Tag read:', tag);

      if (tag && tag.ndefMessage && tag.ndefMessage.length > 0) {
        // Parse NDEF records
        const ndefRecords = tag.ndefMessage;

        for (const record of ndefRecords) {
          try {
            // Decode the payload
            let payloadText: string;

            // Try decoding as text
            try {
              payloadText = Ndef.text.decodePayload(record.payload);
            } catch (e) {
              // If text decode fails, try URI
              try {
                payloadText = Ndef.uri.decodePayload(record.payload);
              } catch (e2) {
                // Last resort: convert bytes to string
                const bytes = new Uint8Array(record.payload);
                payloadText = String.fromCharCode.apply(null, Array.from(bytes));
              }
            }

            console.log('Decoded payload:', payloadText);

            // Try to parse as JSON
            const paymentData: NFCPaymentData = JSON.parse(payloadText);

            // Validate required fields
            if (paymentData.toAccountId && paymentData.amount && paymentData.currency) {
              // Vibrate on successful read
              Vibration.vibrate(100);

              await NfcManager.cancelTechnologyRequest();
              setIsScanning(false);
              onSuccess(paymentData);
              return;
            }
          } catch (parseError) {
            console.error('Failed to parse NDEF record:', parseError);
            continue;
          }
        }

        // No valid payment data found
        await NfcManager.cancelTechnologyRequest();
        setIsScanning(false);
        onError('NFC tag does not contain valid payment information');
      } else {
        await NfcManager.cancelTechnologyRequest();
        setIsScanning(false);
        onError('NFC tag is empty or unreadable');
      }
    } catch (error: any) {
      console.error('NFC read error:', error);
      await NfcManager.cancelTechnologyRequest();
      setIsScanning(false);

      if (error.message?.includes('cancelled') || error.message?.includes('canceled')) {
        // User cancelled, don't show error
        return;
      }

      onError(error.message || 'Failed to read NFC tag');
    }
  };

  const writeNFCTag = async (
    paymentData: NFCPaymentData,
    onSuccess: () => void,
    onError: (error: string) => void
  ) => {
    if (!isNFCSupported) {
      Alert.alert('NFC Not Supported', 'Your device does not support NFC writing.');
      return;
    }

    // iOS: Check version for write support
    if (Platform.OS === 'ios' && parseInt(Platform.Version as string) < 13) {
      Alert.alert(
        'NFC Writing Not Supported',
        'NFC writing requires iOS 13 or later. Your device can only read NFC tags.'
      );
      return;
    }

    // Android: Check permissions
    if (Platform.OS === 'android') {
      const hasPermission = await requestAndroidNFCPermission();
      if (!hasPermission) {
        onError('NFC permission denied');
        return;
      }
    }

    try {
      setIsScanning(true);

      const alertMessage = Platform.OS === 'ios'
        ? 'Hold your phone near a writable NFC tag'
        : 'Ready to write - bring writable tag close to phone';

      // Request NFC technology for writing
      await NfcManager.requestTechnology(NfcTech.Ndef, {
        alertMessage,
      });

      // Convert payment data to JSON string
      const paymentJson = JSON.stringify(paymentData);
      console.log('Writing to NFC tag:', paymentJson);

      // Create NDEF text record
      const textRecord = Ndef.textRecord(paymentJson);

      // Android: Additional record types for better compatibility
      const records = [textRecord];

      if (Platform.OS === 'android') {
        // Add MIME type record for Android
        const mimeRecord = Ndef.mimeRecord('application/json', paymentJson);
        records.push(mimeRecord);
      }

      // Write to tag
      await NfcManager.ndefHandler.writeNdefMessage(records);

      // Vibrate on successful write
      Vibration.vibrate([100, 50, 100]);

      await NfcManager.cancelTechnologyRequest();
      setIsScanning(false);
      onSuccess();
    } catch (error: any) {
      console.error('NFC write error:', error);
      await NfcManager.cancelTechnologyRequest();
      setIsScanning(false);

      if (error.message?.includes('cancelled') || error.message?.includes('canceled')) {
        return;
      }

      onError(error.message || 'Failed to write to NFC tag');
    }
  };

  const cancelNFCScan = async () => {
    try {
      await NfcManager.cancelTechnologyRequest();
      setIsScanning(false);
    } catch (error) {
      console.error('Error cancelling NFC scan:', error);
    }
  };

  // Android: Open NFC settings
  const openNFCSettings = () => {
    if (Platform.OS === 'android') {
      NfcManager.goToNfcSetting();
    }
  };

  return {
    isNFCSupported,
    isNFCEnabled,
    isScanning,
    readNFCTag,
    writeNFCTag,
    cancelNFCScan,
    openNFCSettings,
  };
}
```

---

## Android-Specific Features

### 1. Foreground Dispatch System

Android can automatically launch your app when an NFC tag is detected, even when the app is closed. This is configured via intent filters in AndroidManifest.xml.

### 2. Background Tag Reading

```typescript
// In your main App component or pay.tsx
useEffect(() => {
  if (Platform.OS === 'android') {
    // Handle NFC tag discovered while app was in background
    const handleBackgroundNFC = async () => {
      try {
        const tag = await NfcManager.getBackgroundTag();
        if (tag) {
          console.log('Background NFC tag:', tag);
          // Process the tag data
          // ... parse and handle payment data
        }
      } catch (error) {
        console.error('Background NFC error:', error);
      }
    };

    handleBackgroundNFC();
  }
}, []);
```

### 3. NFC Settings Navigation

```typescript
// Android: Direct user to NFC settings
const enableNFC = () => {
  if (Platform.OS === 'android') {
    Alert.alert(
      'Enable NFC',
      'NFC is currently disabled. Would you like to enable it in settings?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => NfcManager.goToNfcSetting()
        }
      ]
    );
  }
};
```

### 4. Multiple Tag Format Support

```typescript
// Read different NFC tag formats (Android)
const readMultiFormatTag = async () => {
  try {
    // Try NDEF first
    await NfcManager.requestTechnology(NfcTech.Ndef);
    const tag = await NfcManager.getTag();

    if (!tag.ndefMessage) {
      // Try NfcA (ISO 14443-3A)
      await NfcManager.cancelTechnologyRequest();
      await NfcManager.requestTechnology(NfcTech.NfcA);
      // ... handle NfcA tag
    }
  } catch (error) {
    console.error('Multi-format read error:', error);
  }
};
```

---

## Permissions & Runtime Handling

### Android 12+ Runtime Permissions

```typescript
// Check and request NFC permission (Android 12+)
const checkNFCPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android' || Platform.Version < 31) {
    return true; // No permission needed
  }

  try {
    const granted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.NFC
    );

    if (granted) {
      return true;
    }

    // Request permission
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.NFC,
      {
        title: 'NFC Permission Required',
        message: 'Direla needs NFC access to read payment tags and process transactions',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      }
    );

    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
};
```

### Permission State Monitoring

```typescript
// Monitor NFC state changes (Android)
useEffect(() => {
  if (Platform.OS === 'android') {
    const stateListener = NfcManager.setEventListener(
      NfcEvents.StateChanged,
      (state) => {
        console.log('NFC State changed:', state);
        if (state === 'off') {
          setIsNFCEnabled(false);
          Alert.alert('NFC Disabled', 'NFC has been turned off');
        } else if (state === 'on') {
          setIsNFCEnabled(true);
        }
      }
    );

    return () => {
      NfcManager.setEventListener(NfcEvents.StateChanged, null);
    };
  }
}, []);
```

---

## Testing on Android

### Device Requirements

| Android Version | NFC Read | NFC Write | Notes |
|----------------|----------|-----------|-------|
| Android 4.4 - 11 | ✅ | ✅ | No runtime permission needed |
| Android 12+ | ✅ | ✅ | Runtime NFC permission required |

### Common Android Devices with NFC

- Google Pixel (all models)
- Samsung Galaxy S/Note series (S6+)
- OnePlus (most models)
- Xiaomi (most models)
- Motorola (most models)

### Testing Steps

1. **Enable Developer Options**
   ```
   Settings → About Phone → Tap "Build Number" 7 times
   ```

2. **Enable USB Debugging**
   ```
   Settings → Developer Options → USB Debugging
   ```

3. **Install and Run**
   ```bash
   cd frontend
   npx expo prebuild --clean
   npx expo run:android --device
   ```

4. **Test NFC Reading**
   - Open app
   - Tap "Tap to Pay"
   - Bring NFC tag to back of phone (near camera)
   - Should feel vibration when read successful

5. **Test NFC Writing**
   - Open app → Request Payment
   - Enter amount
   - Tap "Request via NFC"
   - Bring writable NFC tag to back of phone
   - Should feel double vibration when write successful

### ADB Commands for Testing

```bash
# Check if device has NFC
adb shell pm list features | grep nfc

# Check NFC status
adb shell dumpsys nfc

# Simulate NFC tag (requires rooted device)
adb shell am start -a android.nfc.action.NDEF_DISCOVERED -t text/plain
```

---

## Common Issues & Solutions

### Issue 1: "NFC not supported" on Android device with NFC

**Cause**: App doesn't have NFC permission in manifest

**Solution**:
```xml
<!-- Add to AndroidManifest.xml -->
<uses-permission android:name="android.permission.NFC" />
<uses-feature android:name="android.hardware.nfc" android:required="false" />
```

### Issue 2: App doesn't launch when NFC tag is scanned (Android)

**Cause**: Missing or incorrect intent filters

**Solution**:
```xml
<!-- Add to MainActivity in AndroidManifest.xml -->
<intent-filter>
    <action android:name="android.nfc.action.NDEF_DISCOVERED" />
    <category android:name="android.intent.category.DEFAULT" />
    <data android:mimeType="text/plain" />
</intent-filter>
```

### Issue 3: "Read failed" when scanning tag

**Cause**: Tag may not be NDEF formatted, or phone not positioned correctly

**Solution**:
- Ensure tag is NDEF formatted
- Hold phone flat against tag for 2-3 seconds
- Try different NFC tag types (NTAG213/215/216)
- On Android, try scanning different parts of phone back

### Issue 4: Write fails on Android

**Cause**: Tag may be locked or read-only

**Solution**:
- Use brand new writable NFC tags
- Check tag isn't write-protected
- Try NTAG215 or NTAG216 (more storage)

### Issue 5: Permission denied error (Android 12+)

**Cause**: NFC runtime permission not granted

**Solution**:
```typescript
// Request permission before NFC operations
await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.NFC);
```

### Issue 6: NFC works in foreground but not background (Android)

**Cause**: App not registered for background NFC discovery

**Solution**:
- Ensure intent filters are in AndroidManifest.xml
- Use `launchMode="singleTask"` in MainActivity
- Handle getBackgroundTag() in app startup

---

## Platform-Specific UI Considerations

### Different User Experiences

**iOS**:
- Session-based: User taps button, then scans
- Alert dialog appears during scanning
- Automatic timeout after 60 seconds
- Clear "Ready to Scan" / "Scanning..." states

**Android**:
- Can work without opening app (background)
- No blocking dialog (more seamless)
- No timeout (stays active until cancelled)
- Can multi-task while NFC is active

### Recommended UI Flow

```typescript
// Show platform-appropriate instructions
const getNFCInstructions = () => {
  if (Platform.OS === 'ios') {
    return 'Tap the button below, then hold your iPhone near the NFC tag';
  } else {
    return 'Hold the back of your phone near the NFC tag';
  }
};

// Platform-specific scanning states
{isScanning && (
  <View style={styles.scanningIndicator}>
    {Platform.OS === 'ios' ? (
      <Text>Scanning... Hold near tag</Text>
    ) : (
      <Text>Ready to scan - bring tag close</Text>
    )}
  </View>
)}
```

---

## Summary: Android Compatibility Checklist

- [x] Update `app.json` with Android NFC permissions
- [x] Configure `AndroidManifest.xml` with intent filters
- [x] Handle Android runtime permissions (Android 12+)
- [x] Add vibration feedback for better UX
- [x] Support background NFC tag discovery
- [x] Add NFC settings navigation for Android
- [x] Handle multiple NFC record types (text + MIME)
- [x] Test on physical Android devices (emulator doesn't support NFC)
- [x] Handle NFC state changes (on/off)
- [x] Support different tag positioning (Android NFC antenna location varies)

### Next Steps

1. Run `npx expo prebuild --clean` to generate Android native files
2. Update `app.json` with Android configuration
3. Update `useNFC.ts` hook with cross-platform code
4. Test on both iOS and Android devices
5. Purchase NFC tags for testing (NTAG213/215/216 recommended)

### Recommended NFC Tags

- **NTAG213**: 144 bytes, best for simple payment data
- **NTAG215**: 504 bytes, good for payment data + metadata
- **NTAG216**: 888 bytes, best for complex data structures

All available on Amazon/AliExpress for ~$0.50-1.00 per tag.
