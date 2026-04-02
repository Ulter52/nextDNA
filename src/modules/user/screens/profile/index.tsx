import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Save, 
  LogOut, 
  ChevronRight, 
  Camera,
  CheckCircle2,
  AlertCircle,
  Calendar,
  MapPin,
  UserCircle2
} from 'lucide-react-native';
import { userService } from '../../services/userService';
import { authService } from '@auth/services/authService';
import { getInitials } from '@utils/formatters';
import { ModuleLayout } from '@components/ModuleLayout';
import styles from './styles';

interface ProfileScreenProps {
  onLogout: () => void;
}

export function ProfileScreen({ onLogout }: ProfileScreenProps) {
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    gender: '',
    birth_date: '',
    mobile_no: '',
    location: '', // Address
  });

  // Password states
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const email = await authService.getLoggedUser();
      const details = await userService.getUserDetails(email);
      setUserDetails(details);
      setFormData({
        first_name: details.first_name || '',
        last_name: details.last_name || '',
        gender: details.gender || '',
        birth_date: details.birth_date || '',
        mobile_no: details.mobile_no || '',
        location: details.location || '',
      });
    } catch (err) {
      setError('Failed to load profile details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      await userService.updateUserDetails(userDetails.name, formData);
      setSuccess('Profile updated successfully');
      setIsEditing(false);
      fetchProfile();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update profile');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('Passwords do not match');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await userService.updatePassword(passwordData.old_password, passwordData.new_password);
      setSuccess('Password changed successfully');
      setIsChangingPassword(false);
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  return (
    <ModuleLayout title="Profile" showBack>
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(userDetails?.full_name)}</Text>
          </View>
          <TouchableOpacity style={styles.cameraButton} activeOpacity={0.7}>
            <Camera size={16} color="#6b7280" />
          </TouchableOpacity>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.fullName}>{userDetails?.full_name}</Text>
          <Text style={styles.email}>{userDetails?.email}</Text>
        </View>
      </View>

      {/* Notifications */}
      {success && (
        <View style={styles.successBox}>
          <CheckCircle2 size={18} color="#059669" />
          <Text style={styles.successText}>{success}</Text>
        </View>
      )}
      {error && (
        <View style={styles.errorBox}>
          <AlertCircle size={18} color="#dc2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Personal Info Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTag}>Personal Info</Text>
          {!isEditing && (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>First Name</Text>
          <View style={styles.inputWrapper}>
            <User style={styles.inputIcon} size={18} color="#9ca3af" />
            <TextInput 
              editable={isEditing}
              value={formData.first_name}
              onChangeText={(text) => setFormData({ ...formData, first_name: text })}
              style={[styles.input, !isEditing && styles.inputDisabled]}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Last Name</Text>
          <View style={styles.inputWrapper}>
            <User style={styles.inputIcon} size={18} color="#9ca3af" />
            <TextInput 
              editable={isEditing}
              value={formData.last_name}
              onChangeText={(text) => setFormData({ ...formData, last_name: text })}
              style={[styles.input, !isEditing && styles.inputDisabled]}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.inputWrapper}>
            <UserCircle2 style={styles.inputIcon} size={18} color="#9ca3af" />
            <TextInput 
              editable={isEditing}
              value={formData.gender}
              onChangeText={(text) => setFormData({ ...formData, gender: text })}
              style={[styles.input, !isEditing && styles.inputDisabled]}
              placeholder="Male / Female / Other"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Birth Date</Text>
          <View style={styles.inputWrapper}>
            <Calendar style={styles.inputIcon} size={18} color="#9ca3af" />
            <TextInput 
              editable={isEditing}
              value={formData.birth_date}
              onChangeText={(text) => setFormData({ ...formData, birth_date: text })}
              style={[styles.input, !isEditing && styles.inputDisabled]}
              placeholder="YYYY-MM-DD"
            />
          </View>
        </View>
      </View>

      {/* Contact Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardTag}>Contact Info</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Email ID</Text>
          <View style={styles.inputWrapper}>
            <Mail style={styles.inputIcon} size={18} color="#9ca3af" />
            <TextInput 
              editable={false}
              value={userDetails?.email || ''}
              style={[styles.input, styles.inputDisabled]}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Mobile No</Text>
          <View style={styles.inputWrapper}>
            <Phone style={styles.inputIcon} size={18} color="#9ca3af" />
            <TextInput 
              editable={false}
              value={formData.mobile_no}
              style={[styles.input, styles.inputDisabled]}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Address</Text>
          <View style={[styles.inputWrapper, { alignItems: 'flex-start', paddingVertical: 12 }]}>
            <MapPin style={{ marginTop: 2, marginRight: 12 }} size={18} color="#9ca3af" />
            <TextInput 
              editable={isEditing}
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              multiline
              numberOfLines={3}
              style={[styles.input, !isEditing && styles.inputDisabled, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Enter your address"
            />
          </View>
        </View>
      </View>

      {isEditing && (
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            onPress={() => setIsEditing(false)}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleUpdateProfile}
            disabled={saving}
            style={styles.saveButton}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Save size={18} color="#fff" />}
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Security Section */}
      <View style={styles.card}>
        <Text style={styles.cardTag}>Security</Text>
        
        {!isChangingPassword ? (
          <TouchableOpacity 
            onPress={() => setIsChangingPassword(true)}
            style={styles.menuItem}
          >
            <View style={styles.menuIconContainer}>
              <Lock size={20} color="#f97316" />
            </View>
            <Text style={styles.menuLabel}>Change Password</Text>
            <ChevronRight size={16} color="#d1d5db" />
          </TouchableOpacity>
        ) : (
          <View style={styles.passwordForm}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Current Password</Text>
              <TextInput 
                secureTextEntry
                value={passwordData.old_password}
                onChangeText={(text) => setPasswordData({ ...passwordData, old_password: text })}
                style={styles.passwordInput}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>New Password</Text>
              <TextInput 
                secureTextEntry
                value={passwordData.new_password}
                onChangeText={(text) => setPasswordData({ ...passwordData, new_password: text })}
                style={styles.passwordInput}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput 
                secureTextEntry
                value={passwordData.confirm_password}
                onChangeText={(text) => setPasswordData({ ...passwordData, confirm_password: text })}
                style={styles.passwordInput}
              />
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                onPress={() => setIsChangingPassword(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleChangePassword}
                disabled={saving}
                style={[styles.saveButton, { backgroundColor: '#ea580c' }]}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Lock size={18} color="#fff" />}
                <Text style={styles.saveButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Sign Out */}
      <TouchableOpacity 
        onPress={() => {
          Alert.alert("Logout", "Are you sure you want to logout?", [
            { text: "Cancel", style: "cancel" },
            { text: "Logout", onPress: onLogout, style: "destructive" }
          ]);
        }}
        style={styles.logoutButton}
      >
        <LogOut size={18} color="#ef4444" />
        <Text style={styles.logoutButtonText}>Sign Out of Account</Text>
      </TouchableOpacity>
    </ScrollView>
    </ModuleLayout>
  );
}

