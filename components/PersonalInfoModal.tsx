import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, User, Phone, Mail, MapPin, Calendar, Briefcase } from 'lucide-react-native';

interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  occupation: string;
}

interface PersonalInfoModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PersonalInfoModal({ visible, onClose }: PersonalInfoModalProps) {
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    firstName: 'Chief',
    lastName: 'Dreamer',
    email: 'chief.dreamer@direla.com',
    phone: '+27 123 456 789',
    address: '123 Innovation Street, Cape Town, South Africa',
    dateOfBirth: '1990-01-01',
    occupation: 'Entrepreneur',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Partial<PersonalInfo>>({});

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
      default:
        return null;
    }
  };

  const handleFieldChange = (field: keyof PersonalInfo, value: string) => {
    setPersonalInfo(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSave = () => {
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

    // Save locally (simulate API call)
    Alert.alert(
      'Success',
      'Personal information updated successfully!',
      [{ text: 'OK', onPress: () => setIsEditing(false) }]
    );
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    // Reset to original values if needed
  };

  const InputField = ({ 
    label, 
    field, 
    icon, 
    placeholder,
    keyboardType = 'default' as any,
    multiline = false 
  }: {
    label: string;
    field: keyof PersonalInfo;
    icon: React.ReactNode;
    placeholder?: string;
    keyboardType?: any;
    multiline?: boolean;
  }) => (
    <View style={styles.inputContainer}>
      <View style={styles.inputLabel}>
        {icon}
        <Text style={styles.labelText}>{label}</Text>
      </View>
      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput,
          errors[field] && styles.inputError,
          !isEditing && styles.inputDisabled
        ]}
        value={personalInfo[field]}
        onChangeText={(value) => handleFieldChange(field, value)}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        editable={isEditing}
        numberOfLines={multiline ? 3 : 1}
      />
      {errors[field] && (
        <Text style={styles.errorText}>{errors[field]}</Text>
      )}
    </View>
  );

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
            >
              <Text style={styles.actionButtonText}>
                {isEditing ? 'Save' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <InputField
              label="First Name"
              field="firstName"
              icon={<User size={20} color="#0C7C59" />}
              placeholder="Enter first name"
            />

            <InputField
              label="Last Name"
              field="lastName"
              icon={<User size={20} color="#0C7C59" />}
              placeholder="Enter last name"
            />

            <InputField
              label="Email Address"
              field="email"
              icon={<Mail size={20} color="#0C7C59" />}
              placeholder="Enter email address"
              keyboardType="email-address"
            />

            <InputField
              label="Phone Number"
              field="phone"
              icon={<Phone size={20} color="#0C7C59" />}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />

            <InputField
              label="Address"
              field="address"
              icon={<MapPin size={20} color="#0C7C59" />}
              placeholder="Enter full address"
              multiline
            />

            <InputField
              label="Date of Birth"
              field="dateOfBirth"
              icon={<Calendar size={20} color="#0C7C59" />}
              placeholder="YYYY-MM-DD"
            />

            <InputField
              label="Occupation"
              field="occupation"
              icon={<Briefcase size={20} color="#0C7C59" />}
              placeholder="Enter occupation"
            />

            {isEditing && (
              <View style={styles.buttonContainer}>
                <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
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
});
