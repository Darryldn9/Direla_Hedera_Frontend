import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, User, Phone, Mail, MapPin, Calendar, Briefcase, Hash } from 'lucide-react-native';
import { useKYC } from '../hooks/useKYC';

interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  occupation: string;
  idNumber: string;
}

interface PersonalInfoModalProps {
  visible: boolean;
  onClose: () => void;
}

interface InputFieldProps {
  label: string;
  field: keyof PersonalInfo;
  icon: React.ReactNode;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
  value: string;
  error?: string;
  isEditing: boolean;
  onTextChange: (value: string) => void;
}

const InputField = React.memo(({ 
  label, 
  field, 
  icon, 
  placeholder,
  keyboardType = 'default' as any,
  multiline = false,
  value,
  error,
  isEditing,
  onTextChange
}: InputFieldProps) => {
  return (
    <View style={styles.inputContainer}>
      <View style={styles.inputLabel}>
        {icon}
        <Text style={styles.labelText}>{label}</Text>
      </View>
      <TextInput
        key={`${field}-input`}
        style={[
          styles.input,
          multiline && styles.multilineInput,
          error && styles.inputError,
          !isEditing && styles.inputDisabled
        ]}
        value={value}
        onChangeText={onTextChange}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        editable={isEditing}
        numberOfLines={multiline ? 3 : 1}
        autoCorrect={false}
        autoCapitalize="none"
        selectTextOnFocus={false}
        blurOnSubmit={false}
      />
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
});

export default function PersonalInfoModal({ visible, onClose }: PersonalInfoModalProps) {
  const { kycData, loading, error, upsertKYC } = useKYC();
  
  // Debug logging to see what's causing re-renders
  console.log('PersonalInfoModal render - visible:', visible, 'loading:', loading, 'error:', error);
  
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    occupation: '',
    idNumber: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Partial<PersonalInfo>>({});
  const [saving, setSaving] = useState(false);
  const hasLoadedKYCData = useRef(false);

  // Load KYC data when modal opens (only once)
  useEffect(() => {
    if (visible && kycData && !hasLoadedKYCData.current) {
      setPersonalInfo({
        firstName: kycData.first_name || '',
        lastName: kycData.last_name || '',
        email: kycData.email || '',
        phone: kycData.phone || '',
        address: kycData.address || '',
        dateOfBirth: kycData.date_of_birth || '',
        occupation: kycData.occupation || '',
        idNumber: kycData.id_number || '',
      });
      hasLoadedKYCData.current = true;
    }
  }, [visible, kycData?.user_id]); // Only depend on user_id, not the entire kycData object

  // Reset the loaded flag when modal closes
  useEffect(() => {
    if (!visible) {
      hasLoadedKYCData.current = false;
    }
  }, [visible]);

  const validateField = (field: keyof PersonalInfo, value: string): string | null => {
    switch (field) {
      case 'firstName':
      case 'lastName':
        return value.trim().length < 2 ? 'Must be at least 2 characters' : null;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? 'Invalid email format' : null;
      case 'phone':
        const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
        return !phoneRegex.test(value) || value.length < 10 ? 'Invalid phone number' : null;
      case 'address':
        return value.trim().length < 5 ? 'Address too short' : null;
      case 'dateOfBirth':
        const date = new Date(value);
        const today = new Date();
        return date > today ? 'Invalid date' : null;
      case 'occupation':
        return value.trim().length < 2 ? 'Must be at least 2 characters' : null;
      case 'idNumber':
        const idRegex = /^\d{13}$/;
        return value && !idRegex.test(value.replace(/\s/g, '')) ? 'ID number must be 13 digits' : null;
      default:
        return null;
    }
  };

  const handleFieldChange = useCallback((field: keyof PersonalInfo, value: string) => {
    setPersonalInfo(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    setErrors(prev => {
      if (prev[field]) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return prev;
    });
  }, []);

  const handleSave = useCallback(async () => {
    // Validate all fields
    const newErrors: Partial<PersonalInfo> = {};
    let hasErrors = false;

    (Object.keys(personalInfo) as Array<keyof PersonalInfo>).forEach(field => {
      const error = validateField(field, personalInfo[field]);
      if (error) {
        newErrors[field] = error;
        hasErrors = true;
      }
    });

    setErrors(newErrors);

    if (hasErrors) {
      Alert.alert('Validation Error', 'Please fix the errors before saving.');
      return;
    }

    setSaving(true);

    try {
      // Save to KYC API
      const success = await upsertKYC({
        user_id: '', // Will be set by the hook
        first_name: personalInfo.firstName || null,
        last_name: personalInfo.lastName || null,
        email: personalInfo.email || null,
        phone: personalInfo.phone || null,
        address: personalInfo.address || null,
        date_of_birth: personalInfo.dateOfBirth || null,
        occupation: personalInfo.occupation || null,
        id_number: personalInfo.idNumber || null,
      });

      if (success) {
        Alert.alert(
          'Success',
          'Personal information updated successfully!',
          [{ text: 'OK', onPress: () => setIsEditing(false) }]
        );
      } else {
        Alert.alert('Error', 'Failed to save personal information. Please try again.');
      }
    } catch (error) {
      console.error('Error saving personal info:', error);
      Alert.alert('Error', 'Failed to save personal information. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [personalInfo, upsertKYC]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setErrors({});
    // Reset to original values if needed
  }, []);

  // Create stable callback functions for each field
  const handleFirstNameChange = useCallback((value: string) => {
    handleFieldChange('firstName', value);
  }, [handleFieldChange]);

  const handleLastNameChange = useCallback((value: string) => {
    handleFieldChange('lastName', value);
  }, [handleFieldChange]);

  const handleEmailChange = useCallback((value: string) => {
    handleFieldChange('email', value);
  }, [handleFieldChange]);

  const handlePhoneChange = useCallback((value: string) => {
    handleFieldChange('phone', value);
  }, [handleFieldChange]);

  const handleAddressChange = useCallback((value: string) => {
    handleFieldChange('address', value);
  }, [handleFieldChange]);

  const handleDateOfBirthChange = useCallback((value: string) => {
    handleFieldChange('dateOfBirth', value);
  }, [handleFieldChange]);

  const handleOccupationChange = useCallback((value: string) => {
    handleFieldChange('occupation', value);
  }, [handleFieldChange]);

  const handleIdNumberChange = useCallback((value: string) => {
    handleFieldChange('idNumber', value);
  }, [handleFieldChange]);


  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#2C3E50" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Personal Information</Text>
            <TouchableOpacity 
              onPress={isEditing ? handleSave : () => setIsEditing(true)}
              style={styles.actionButton}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.actionButtonText}>
                  {isEditing ? 'Save' : 'Edit'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={false}
          >
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0C7C59" />
                <Text style={styles.loadingText}>Loading personal information...</Text>
              </View>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {!loading && (
              <>
            <InputField
              key="firstName"
              label="First Name"
              field="firstName"
              icon={<User size={20} color="#0C7C59" />}
              placeholder="Enter first name"
              value={personalInfo.firstName}
              error={errors.firstName}
              isEditing={isEditing}
              onTextChange={handleFirstNameChange}
            />

            <InputField
              key="lastName"
              label="Last Name"
              field="lastName"
              icon={<User size={20} color="#0C7C59" />}
              placeholder="Enter last name"
              value={personalInfo.lastName}
              error={errors.lastName}
              isEditing={isEditing}
              onTextChange={handleLastNameChange}
            />

            <InputField
              key="email"
              label="Email Address"
              field="email"
              icon={<Mail size={20} color="#0C7C59" />}
              placeholder="Enter email address"
              keyboardType="email-address"
              value={personalInfo.email}
              error={errors.email}
              isEditing={isEditing}
              onTextChange={handleEmailChange}
            />

            <InputField
              key="phone"
              label="Phone Number"
              field="phone"
              icon={<Phone size={20} color="#0C7C59" />}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              value={personalInfo.phone}
              error={errors.phone}
              isEditing={isEditing}
              onTextChange={handlePhoneChange}
            />

            <InputField
              key="address"
              label="Address"
              field="address"
              icon={<MapPin size={20} color="#0C7C59" />}
              placeholder="Enter full address"
              multiline
              value={personalInfo.address}
              error={errors.address}
              isEditing={isEditing}
              onTextChange={handleAddressChange}
            />

            <InputField
              key="dateOfBirth"
              label="Date of Birth"
              field="dateOfBirth"
              icon={<Calendar size={20} color="#0C7C59" />}
              placeholder="YYYY-MM-DD"
              value={personalInfo.dateOfBirth}
              error={errors.dateOfBirth}
              isEditing={isEditing}
              onTextChange={handleDateOfBirthChange}
            />

            <InputField
              key="occupation"
              label="Occupation"
              field="occupation"
              icon={<Briefcase size={20} color="#0C7C59" />}
              placeholder="Enter occupation"
              value={personalInfo.occupation}
              error={errors.occupation}
              isEditing={isEditing}
              onTextChange={handleOccupationChange}
            />

            <InputField
              key="idNumber"
              label="ID Number"
              field="idNumber"
              icon={<Hash size={20} color="#0C7C59" />}
              placeholder="Enter 13-digit ID number"
              keyboardType="numeric"
              value={personalInfo.idNumber}
              error={errors.idNumber}
              isEditing={isEditing}
              onTextChange={handleIdNumberChange}
            />

            {isEditing && (
              <View style={styles.buttonContainer}>
                <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={saving}>
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#2C3E50',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0C7C59',
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  labelText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2C3E50',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#2C3E50',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputDisabled: {
    backgroundColor: '#F8F9FA',
    color: '#7F8C8D',
  },
  inputError: {
    borderColor: '#E74C3C',
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#E74C3C',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 40,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#7F8C8D',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#0C7C59',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
    marginTop: 12,
  },
  errorContainer: {
    backgroundColor: '#FDF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
});
