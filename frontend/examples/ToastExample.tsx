import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useToast } from '../hooks/useToast';

/**
 * Example component demonstrating how to use toast notifications
 * This can be used as a reference for implementing toasts in other components
 */
export function ToastExample() {
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Toast Notification Examples</Text>
      
      <TouchableOpacity
        style={[styles.button, styles.successButton]}
        onPress={() => showSuccess('Success!', 'Operation completed successfully')}
      >
        <Text style={styles.buttonText}>Show Success Toast</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.errorButton]}
        onPress={() => showError('Error!', 'Something went wrong')}
      >
        <Text style={styles.buttonText}>Show Error Toast</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.warningButton]}
        onPress={() => showWarning('Warning!', 'Please check your input')}
      >
        <Text style={styles.buttonText}>Show Warning Toast</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.infoButton]}
        onPress={() => showInfo('Info', 'Here is some helpful information')}
      >
        <Text style={styles.buttonText}>Show Info Toast</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.customButton]}
        onPress={() => showSuccess('Custom Duration', 'This toast will show for 2 seconds', 2000)}
      >
        <Text style={styles.buttonText}>Custom Duration (2s)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#1C1C1E',
  },
  button: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  successButton: {
    backgroundColor: '#0C7C59',
  },
  errorButton: {
    backgroundColor: '#E74C3C',
  },
  warningButton: {
    backgroundColor: '#F39C12',
  },
  infoButton: {
    backgroundColor: '#3498DB',
  },
  customButton: {
    backgroundColor: '#9B59B6',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
