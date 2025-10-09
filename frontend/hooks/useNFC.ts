import { useState, useEffect } from 'react';
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';
import { Platform, Alert } from 'react-native';

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

  useEffect(() => {
    async function checkNFC() {
      if (Platform.OS === 'ios') {
        try {
          const supported = await NfcManager.isSupported();
          console.log('NFC Supported:', supported);
          setIsNFCSupported(supported);

          if (supported) {
            await NfcManager.start();
            console.log('NFC Manager started');
            const enabled = await NfcManager.isEnabled();
            console.log('NFC Enabled:', enabled);
            setIsNFCEnabled(enabled);
          }
        } catch (error) {
          console.error('NFC check error:', error);
          setIsNFCSupported(false);
        }
      }
    }

    checkNFC();

    return () => {
      NfcManager.cancelTechnologyRequest().catch(() => {});
    };
  }, []);

  const writeNFCTag = async (
    paymentData: NFCPaymentData,
    onSuccess: () => void,
    onError: (error: string) => void
  ) => {
    if (!isNFCSupported) {
      Alert.alert('NFC Not Supported', 'Your device does not support NFC writing.');
      return;
    }

    // Check iOS version for write support
    if (Platform.OS === 'ios') {
      const iosVersion = parseInt(String(Platform.Version), 10);
      if (iosVersion < 13) {
        Alert.alert(
          'NFC Writing Not Supported',
          'NFC writing requires iOS 13 or later. Your device can only read NFC tags.'
        );
        return;
      }
    }

    try {
      setIsScanning(true);
      console.log('Starting NFC write session...');
      console.log('Payment data to write:', paymentData);

      // Request NFC technology for writing
      await NfcManager.requestTechnology(NfcTech.Ndef, {
        alertMessage: 'Hold your iPhone near a writable NFC tag to write payment request',
      });

      console.log('NFC session started, waiting for tag...');

      // Convert payment data to JSON string
      const paymentJson = JSON.stringify(paymentData);
      console.log('JSON payload length:', paymentJson.length);

      // Create NDEF text record with proper byte array conversion
      const bytes = Ndef.encodeMessage([Ndef.textRecord(paymentJson)]);
      console.log('NDEF record created');

      // Write to tag
      await NfcManager.ndefHandler.writeNdefMessage(bytes);
      console.log('Write successful!');

      await NfcManager.cancelTechnologyRequest();
      setIsScanning(false);
      onSuccess();
    } catch (error: any) {
      console.error('NFC write error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      await NfcManager.cancelTechnologyRequest().catch(() => {});
      setIsScanning(false);

      if (error.message?.includes('cancelled') || error.message?.includes('Session')) {
        console.log('User cancelled NFC session');
        return;
      }

      onError(error.message || 'Failed to write to NFC tag');
    }
  };

  const cancelNFCScan = async () => {
    try {
      await NfcManager.cancelTechnologyRequest();
      setIsScanning(false);
      console.log('NFC session cancelled');
    } catch (error) {
      console.error('Error cancelling NFC scan:', error);
    }
  };

  return {
    isNFCSupported,
    isNFCEnabled,
    isScanning,
    writeNFCTag,
    cancelNFCScan,
  };
}