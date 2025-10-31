import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Eye, EyeOff, User, Lock, Smartphone, Mail, CheckCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppMode } from '../contexts/AppContext';
import { useUserManagement } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { Colors } from '../lib/colors';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [errors, setErrors] = useState<{email?: string; password?: string}>({});
  const [isSignUp, setIsSignUp] = useState(false);
  
  const { mode, setMode } = useAppMode();
  const { login, signup } = useUserManagement();
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const validateForm = () => {
    const newErrors: {email?: string; password?: string} = {};
    
    if (!email.trim()) {
      newErrors.email = 'This field is required';
    } else if (loginMethod === 'email' && !validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (loginMethod === 'phone' && !validatePhone(email)) {
      newErrors.email = 'Please enter a valid phone number';
    }
    
    if (!password.trim()) {
      newErrors.password = 'This field is required';
    } else if (!validatePassword(password)) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    
    // Show toast for validation errors
    if (Object.keys(newErrors).length > 0) {
      const errorMessages = Object.values(newErrors).filter(Boolean);
      showError(
        'Validation Error',
        errorMessages.join(', ')
      );
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const credentials = {
        email: email.trim(),
        password: password.trim()
      };
      
      console.log('🚀 Starting login process with credentials:', credentials);
      const result = await login(credentials);
      console.log('🎯 Login result in handleLogin:', result);
      
      if (result) {
        console.log('🎉 Login successful, navigating to tabs');
        showSuccess('Login Successful', 'Welcome back!');
        router.replace('/(tabs)');
      } else {
        console.log('💔 Login failed, showing error');
        showError('Login Failed', 'Invalid credentials. Please try again.');
      }
    } catch (error) {
      console.error('💥 Login error:', error);
      showError('Login Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const credentials = {
        email: email.trim(),
        password: password.trim()
      };
      
      const result = await signup(credentials);
      
      if (result) {
        showSuccess('Account Created', 'Welcome to Direla!');
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 1500); // Small delay to show the success toast
      } else {
        showError('Sign Up Failed', 'Failed to create account. Please try again.');
      }
    } catch (error) {
      console.error('Sign up error:', error);
      showError('Sign Up Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeToggle = () => {
    const newMode = mode === 'consumer' ? 'business' : 'consumer';
    setMode(newMode);
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]} edges={[]}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 34) + 20 }]}
          showsVerticalScrollIndicator={false}
        >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>Welcome Back</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Page Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.pageTitle}>
            {isSignUp ? 'Create Account' : (mode === 'business' ? 'Business Login' : 'Personal Login')}
          </Text>
          <Text style={styles.pageSubtitle}>
            {isSignUp ? 'Join Direla and start your digital wallet journey' : `Access your ${mode === 'business' ? 'business' : 'personal'} wallet`}
          </Text>
        </View>

        {/* Mode Toggle */}
        <View style={styles.modeToggleContainer}>
          <TouchableOpacity 
            style={[styles.modeToggle, mode === 'consumer' && styles.modeToggleActive]}
            onPress={() => setMode('consumer')}
          >
            <Text style={[styles.modeToggleText, mode === 'consumer' && styles.modeToggleTextActive]}>
              Personal
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.modeToggle, mode === 'business' && styles.modeToggleActive]}
            onPress={() => setMode('business')}
          >
            <Text style={[styles.modeToggleText, mode === 'business' && styles.modeToggleTextActive]}>
              Business
            </Text>
          </TouchableOpacity>
        </View>

        {/* Login Method Toggle */}
        <View style={styles.loginMethodContainer}>
          <TouchableOpacity 
            style={[styles.loginMethodButton, loginMethod === 'email' && styles.loginMethodButtonActive]}
            onPress={() => setLoginMethod('email')}
          >
            <User size={20} color={loginMethod === 'email' ? Colors.utility.white : Colors.semantic.textSecondary} />
            <Text style={[styles.loginMethodText, loginMethod === 'email' && styles.loginMethodTextActive]}>
              Email
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.loginMethodButton, loginMethod === 'phone' && styles.loginMethodButtonActive]}
            onPress={() => setLoginMethod('phone')}
          >
            <Smartphone size={20} color={loginMethod === 'phone' ? Colors.utility.white : Colors.semantic.textSecondary} />
            <Text style={[styles.loginMethodText, loginMethod === 'phone' && styles.loginMethodTextActive]}>
              Phone
            </Text>
          </TouchableOpacity>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              {loginMethod === 'email' ? 'Email Address' : 'Phone Number'}
            </Text>
            <View style={[styles.inputWrapper, errors.email && styles.inputWrapperError]}>
              {loginMethod === 'email' ? (
                <Mail size={20} color={errors.email ? Colors.semantic.error : Colors.semantic.textSecondary} style={styles.inputIcon} />
              ) : (
                <Smartphone size={20} color={errors.email ? Colors.semantic.error : Colors.semantic.textSecondary} style={styles.inputIcon} />
              )}
              <TextInput
                style={styles.textInput}
                placeholder={loginMethod === 'email' ? 'Enter your email' : 'Enter your phone number'}
                placeholderTextColor={Colors.semantic.textSecondary}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) {
                    setErrors({...errors, email: undefined});
                  }
                }}
                keyboardType={loginMethod === 'email' ? 'email-address' : 'phone-pad'}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={[styles.inputWrapper, errors.password && styles.inputWrapperError]}>
              <Lock size={20} color={errors.password ? Colors.semantic.error : Colors.semantic.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your password"
                placeholderTextColor={Colors.semantic.textSecondary}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) {
                    setErrors({...errors, password: undefined});
                  }
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity 
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color={Colors.semantic.textSecondary} />
                ) : (
                  <Eye size={20} color={Colors.semantic.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Login/Sign Up Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={isSignUp ? handleSignUp : handleLogin}
            disabled={isLoading}
          >
            <Text style={[styles.loginButtonText, isLoading && styles.loginButtonTextDisabled]}>
              {isLoading ? (isSignUp ? 'Creating Account...' : 'Signing In...') : (isSignUp ? 'Create Account' : 'Sign In')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Toggle Sign Up/Login */}
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleText}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          </Text>
        <TouchableOpacity onPress={() => {
          setIsSignUp(!isSignUp);
          showInfo(
            isSignUp ? 'Switched to Sign In' : 'Switched to Sign Up',
            isSignUp ? 'Enter your credentials to sign in' : 'Create a new account'
          );
        }}>
          <Text style={styles.toggleButtonText}>
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </Text>
        </TouchableOpacity>
        </View>

        {/* Demo Credentials */}
        <View style={styles.demoContainer}>
          <Text style={styles.demoTitle}>Demo Credentials</Text>
          <View style={styles.demoItem}>
            <Text style={styles.demoLabel}>Email:</Text>
            <Text style={styles.demoValue}>demo@direla.com</Text>
          </View>
          <View style={styles.demoItem}>
            <Text style={styles.demoLabel}>Password:</Text>
            <Text style={styles.demoValue}>password123</Text>
          </View>
          <TouchableOpacity 
            style={styles.demoButton}
            onPress={() => {
              setEmail('demo@direla.com');
              setPassword('password123');
              showInfo('Demo Credentials Loaded', 'You can now sign in with the demo account');
            }}
          >
            <Text style={styles.demoButtonText}>Use Demo Credentials</Text>
          </TouchableOpacity>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>🔒</Text>
            <Text style={styles.featureTitle}>Secured by Hedera Hashgraph</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>⚡</Text>
            <Text style={styles.featureTitle}>Instant transactions</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>🌍</Text>
            <Text style={styles.featureTitle}>Global accessibility</Text>
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.semantic.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: Colors.semantic.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.semantic.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.semantic.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  placeholder: {
    width: 40,
  },
  titleContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#8E8E93',
  },
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  modeToggle: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modeToggleActive: {
    backgroundColor: '#0C7C59',
  },
  modeToggleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
  },
  modeToggleTextActive: {
    color: '#FFFFFF',
  },
  loginMethodContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  loginMethodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  loginMethodButtonActive: {
    backgroundColor: '#0C7C59',
  },
  loginMethodText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
  },
  loginMethodTextActive: {
    color: '#FFFFFF',
  },
  formContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
  },
  passwordToggle: {
    padding: 4,
  },
  inputWrapperError: {
    borderColor: '#E74C3C',
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
    color: '#E74C3C',
    marginTop: 4,
    marginLeft: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0C7C59',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: '#0C7C59',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonDisabled: {
    backgroundColor: '#8E8E93',
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loginButtonTextDisabled: {
    color: '#FFFFFF',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  toggleText: {
    fontSize: 16,
    color: '#8E8E93',
    marginRight: 8,
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C7C59',
  },
  demoContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  demoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  demoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  demoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  demoButton: {
    backgroundColor: '#0C7C59',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  demoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  features: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  featureEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  featureTitle: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
    flex: 1,
  },
});
