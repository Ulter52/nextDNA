import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, StatusBar, Alert, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, User, ArrowRight, Eye, EyeOff, Fingerprint, LogOut, UserCircle } from 'lucide-react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as Keychain from 'react-native-keychain';
import ReactNativeBiometrics from 'react-native-biometrics';
import { authService } from '../services/authService';
import { colors } from '@theme';

const rnBiometrics = new ReactNativeBiometrics();

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginScreenProps {
  onLoginSuccess: (user: string) => void;
}

const DISPLAY_NAME_SERVICE = 'erp_display_name';

/**
 * Separated Manual Form Component to prevent Hook Order issues
 */
const ManualLoginForm = ({ 
  control, 
  errors, 
  loading, 
  error, 
  onSubmit, 
  biometryType, 
  isBiometricEnabled, 
  setIsBiometricEnabled 
}: any) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.form}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Username</Text>
        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={[styles.inputWrapper, errors.username ? styles.inputError : null]}>
              <User style={styles.inputIcon} size={20} color={errors.username ? '#ef4444' : "#9ca3af"} />
              <TextInput
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="email@example.com"
                style={styles.input}
                autoCapitalize="none"
              />
            </View>
          )}
        />
        {errors.username && <Text style={styles.fieldErrorText}>{errors.username.message}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Password</Text>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={[styles.inputWrapper, errors.password ? styles.inputError : null]}>
              <Lock style={styles.inputIcon} size={20} color={errors.password ? '#ef4444' : "#9ca3af"} />
              <TextInput
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="••••••••"
                style={styles.input}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                {showPassword ? <EyeOff size={20} color="#9ca3af" /> : <Eye size={20} color="#9ca3af" />}
              </TouchableOpacity>
            </View>
          )}
        />
        {errors.password && <Text style={styles.fieldErrorText}>{errors.password.message}</Text>}
      </View>

      {biometryType && (
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Enable {biometryType} login</Text>
          <Switch
            value={isBiometricEnabled}
            onValueChange={setIsBiometricEnabled}
            trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
            thumbColor={isBiometricEnabled ? '#2563eb' : '#f3f4f6'}
          />
        </View>
      )}

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <TouchableOpacity
        onPress={onSubmit}
        disabled={loading}
        style={[styles.button, loading && styles.buttonDisabled]}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <View style={styles.buttonInner}>
            <Text style={styles.buttonText}>Sign In</Text>
            <ArrowRight color="#ffffff" size={20} />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [biometryType, setBiometryType] = useState<string | null>(null);
  const [savedUser, setSavedUser] = useState<{username: string, fullName: string} | null>(null);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const checkStatus = useCallback(async () => {
    try {
      // 1. Check if sensors are available
      const { available, biometryType: type } = await rnBiometrics.isSensorAvailable();
      if (available) setBiometryType(type);

      /** 
       * 2. IMPORTANT: We ONLY check for the DISPLAY_NAME_SERVICE entry here.
       * This entry is saved WITHOUT biometric protection, so it doesn't trigger a prompt.
       * If it exists, we know we have biometric-protected credentials ready in the default entry.
       */
      const displayNameEntry = await Keychain.getGenericPassword({ service: DISPLAY_NAME_SERVICE });
      
      if (displayNameEntry) {
        setSavedUser({ 
          username: 'PLACEHOLDER', // We don't need the actual username yet
          fullName: displayNameEntry.username 
        });
        setIsBiometricEnabled(true);
      }
    } catch (err) {
      console.log('Status check failed', err);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleBiometricLogin = async () => {
    try {
      setLoading(true);
      setError('');

      /**
       * 3. We call getGenericPassword WITHOUT options.
       * Since it was stored with accessControl: BIOMETRY_ANY_OR_DEVICE_PASSCODE,
       * the OS will automatically show the native biometric/PIN prompt.
       * We don't need rnBiometrics.simplePrompt here as it would be redundant.
       */
      const credentials = await Keychain.getGenericPassword({
        authenticationPrompt: {
          title: Platform.OS === 'ios' ? 'Login with Biometrics' : 'Authenticate to Login',
          subtitle: 'Use your Fingerprint, FaceID or PIN to continue',
          cancel: 'Cancel',
        }
      });

      if (credentials) {
        const result = await authService.login(credentials.username, credentials.password);
        if (result.success) {
          onLoginSuccess(result.full_name || credentials.username);
        } else {
          setError(result.message || 'Biometric login failed');
          setLoading(false);
        }
      } else {
        // User cancelled the OS prompt
        setLoading(false);
      }
    } catch (err) {
      console.log('Biometric Login Error:', err);
      setError('Biometric authentication failed or cancelled');
      setLoading(false);
    }
  };

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setError('');
    
    try {
      const result = await authService.login(data.username, data.password);
      if (result.success) {
        if (isBiometricEnabled) {
          /**
           * 4. Save actual credentials with Biometric Protection.
           * This will REQUIRE a prompt when we try to READ it later.
           */
          await Keychain.setGenericPassword(data.username, data.password, { 
            accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
            accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED
          });

          /**
           * 5. Save Display Name WITHOUT Biometric Protection.
           * This allows us to show the "Hello, [Name]" UI on app load without a prompt.
           */
          if (result.full_name) {
            await Keychain.setGenericPassword(result.full_name, 'DUMMY', { 
              service: DISPLAY_NAME_SERVICE,
              accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED
            });
          }
        } else {
          await Keychain.resetGenericPassword();
          await Keychain.resetGenericPassword({ service: DISPLAY_NAME_SERVICE });
        }
        onLoginSuccess(result.full_name || data.username);
      } else {
        setError(result.message || 'Authentication failed');
      }
    } catch (err: any) {
      setError('Connection error. Please check your internet.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchUser = async () => {
    // Clear everything from secure storage
    await Keychain.resetGenericPassword();
    await Keychain.resetGenericPassword({ service: DISPLAY_NAME_SERVICE });
    setSavedUser(null);
    reset({ username: '', password: '' });
  };

  const firstName = savedUser?.fullName.split(' ')[0];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              {savedUser ? (
                <UserCircle color="#ffffff" size={48} strokeWidth={1.5} />
              ) : (
                <Lock color="#ffffff" size={32} />
              )}
            </View>
            <Text style={styles.title}>{savedUser ? `Hello, ${firstName}` : 'Getting Started'}</Text>
            <Text style={styles.subtitle}>
              {savedUser ? 'Ready to continue your work?' : 'Sign in to access your ERP workspace'}
            </Text>
          </View>

          {savedUser ? (
            <View style={styles.biometricMode}>
              <TouchableOpacity
                onPress={handleBiometricLogin}
                disabled={loading}
                style={[styles.biometricLoginButton, loading && styles.buttonDisabled]}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Fingerprint color="#ffffff" size={24} />
                    <Text style={styles.buttonText}>
                      Login with {biometryType || 'Biometrics'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={handleSwitchUser} style={styles.switchUserButton}>
                <LogOut size={16} color={colors.text_secondary} />
                <Text style={styles.switchUserText}>Sign in as different user</Text>
              </TouchableOpacity>

              {error ? (
                <View style={[styles.errorContainer, { marginTop: 16, width: '100%' }]}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <ManualLoginForm 
              control={control}
              errors={errors}
              loading={loading}
              error={error}
              onSubmit={handleSubmit(onSubmit)}
              biometryType={biometryType}
              isBiometricEnabled={isBiometricEnabled}
              setIsBiometricEnabled={setIsBiometricEnabled}
            />
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Security managed by <Text style={styles.footerLink}>DNA Shield</Text>
            </Text>
          </View>
        </View>
        <Text style={styles.brandText}>Powered by DNA Tech</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 40,
    padding: 32,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  header: { alignItems: 'center', marginBottom: 32 },
  logoContainer: {
    width: 80, height: 80,
    backgroundColor: '#2563eb',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 26, fontWeight: '900', color: '#111827', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#9ca3af', fontWeight: '500', textAlign: 'center' },
  form: { gap: 16 },
  biometricMode: { width: '100%', alignItems: 'center', gap: 16 },
  biometricLoginButton: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    borderRadius: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    elevation: 4,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  switchUserButton: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, marginTop: 8 },
  switchUserText: { color: '#6b7280', fontSize: 14, fontWeight: '600' },
  inputGroup: { gap: 4 },
  label: { fontSize: 10, fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: 'transparent' },
  inputError: { borderColor: '#ef4444', backgroundColor: '#fff5f5' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 14, fontSize: 14, color: '#111827' },
  eyeIcon: { padding: 8 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4, marginTop: 4 },
  toggleLabel: { fontSize: 13, color: '#4b5563', fontWeight: '600' },
  fieldErrorText: { color: '#ef4444', fontSize: 10, marginLeft: 8, fontWeight: 'bold' },
  errorContainer: { backgroundColor: '#fef2f2', padding: 12, borderRadius: 12 },
  errorText: { color: '#ef4444', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  button: { backgroundColor: '#2563eb', borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { opacity: 0.7 },
  buttonInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  footer: { marginTop: 32, alignItems: 'center' },
  footerText: { fontSize: 12, color: '#9ca3af' },
  footerLink: { color: '#2563eb', fontWeight: 'bold' },
  brandText: { marginTop: 32, textAlign: 'center', fontSize: 10, color: '#d1d5db', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2 },
});
