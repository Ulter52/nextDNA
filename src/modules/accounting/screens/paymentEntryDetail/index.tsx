import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import {
  Edit, Calendar, User, CreditCard, Landmark,
  CheckCircle2, XCircle, Clock, FileText,
  ArrowRightLeft, CheckCircle, Mail, Phone
} from 'lucide-react-native';

import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { colors, spacing } from '../../../../core/theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { accountingApi } from '../../services/accountingApi';
import { formatCurrency } from '../../../../core/utils/formatters';
import { styles } from './styles';


// STATUS CONFIG (no functions per render)
const STATUS_CONFIG: any = {
  Submitted: {
    color: colors.success,
    Icon: CheckCircle2,
    badgeStyle: 'badgeSuccess',
  },
  Cancelled: {
    color: colors.error,
    Icon: XCircle,
    badgeStyle: 'badgeError',
  },
  default: {
    color: colors.neutral_600,
    Icon: Clock,
    badgeStyle: 'badgeDefault',
  },
};

export function PaymentEntryDetail() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { entryId } = route.params;

  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await accountingApi.getPaymentEntryDetail(entryId);
      if (res?.data) setEntry(res.data);
    } catch (err) {
      console.error("Failed to fetch payment entry details", err);
    } finally {
      setLoading(false);
    }
  }, [entryId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleSubmit = useCallback(async () => {
    if (!entry) return;
    setSubmitting(true);
    try {
      await accountingApi.submitPaymentEntry(entry.name);
      Alert.alert("Success", "Payment Entry submitted successfully");
      fetchDetail();
    } catch {
      Alert.alert("Error", "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }, [entry, fetchDetail]);

  // memoized status config
  const statusConfig = useMemo(() => {
    return STATUS_CONFIG[entry?.status] || STATUS_CONFIG.default;
  }, [entry?.status]);

  // memoized reference list
  const referenceList = useMemo(() => {
    if (!entry?.references?.length) return null;

    return entry.references.map((ref: any, idx: number) => (
      <View
        key={idx}
        style={[
          styles.referenceCard,
          idx < entry.references.length - 1 && styles.borderBottom
        ]}
      >
        <View style={styles.flex1}>
          <Text style={styles.refName}>{ref.reference_name}</Text>
          <Text style={styles.refMeta}>{ref.reference_doctype}</Text>
        </View>

        <View style={styles.alignEnd}>
          <Text style={styles.refValue}>
            {formatCurrency(ref.allocated_amount, 'INR')}
          </Text>
          <Text style={styles.refMeta}>Allocated</Text>
        </View>
      </View>
    ));
  }, [entry?.references]);

  if (loading) {
    return (
      <ModuleLayout title="Payment Detail" showBack>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ModuleLayout>
    );
  }

  if (!entry) {
    return (
      <ModuleLayout title="Payment Detail" showBack>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Entry not found</Text>
        </View>
      </ModuleLayout>
    );
  }

  const StatusIcon = statusConfig.Icon;

  return (
    <ModuleLayout title={entry.name} showBack>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.heroCard}>
          <View style={styles.headerRow}>

            <View style={[styles.badge, styles[statusConfig.badgeStyle]]}>
              <StatusIcon size={14} color={statusConfig.color} />
              <Text style={[styles.badgeText, { color: statusConfig.color }]}>
                {entry.status}
              </Text>
            </View>

            <View style={[styles.badge, styles.badgeBlue]}>
              <ArrowRightLeft size={14} color={colors.primary} />
              <Text style={[styles.badgeText, styles.primaryText]}>
                {entry.payment_type}
              </Text>
            </View>
          </View>

          <Text style={styles.amountHero}>
            {formatCurrency(entry.paid_amount, 'INR')}
          </Text>
          <Text style={styles.metaText}>Total Amount</Text>

          {entry.docstatus === 0 && (
            <TouchableOpacity
              style={styles.editIconBtn}
              onPress={() => navigation.navigate('PaymentEntryEdit', { entryId: entry.name })}
            >
              <Edit size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Details */}
        <View style={styles.detailsContainer}>
          <VerticalField label="Posting Date" value={entry.posting_date} icon={Calendar} />
          <VerticalField label="Payment Type" value={entry.payment_type} icon={ArrowRightLeft} />
          <VerticalField label="Mode of Payment" value={entry.mode_of_payment} icon={CreditCard} />

          {entry.reference_no && (
            <>
              <VerticalField label="Cheque/Reference No" value={entry.reference_no} icon={FileText} />
              <VerticalField label="Cheque/Reference Date" value={entry.reference_date} icon={Calendar} />
            </>
          )}

          <VerticalField label="Party Type" value={entry.party_type} icon={User} />
          <VerticalField label="Party" value={entry.party || 'Internal Transfer'} icon={User} />

          {entry.party_type !== 'Internal Transfer' && (
            <>
              <VerticalField label="Contact Person" value={entry.contact_person} icon={User} />
              <VerticalField label="Email" value={entry.contact_email} icon={Mail} />
              <VerticalField label="Mobile" value={entry.custom_mobile} icon={Phone} />
            </>
          )}

          <View style={styles.divider} />

          <VerticalField label="Account Paid From" value={entry.paid_from} icon={Landmark} />
          <VerticalField label="Account Paid To" value={entry.paid_to} icon={Landmark} />
        </View>

        {/* References */}
        {referenceList && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Payment Reference</Text>
            <View style={styles.referenceList}>{referenceList}</View>
          </View>
        )}

        {/* Remarks */}
        {entry.remarks && entry.remarks !== "No Remarks" && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Remarks</Text>
            <View style={styles.remarksBox}>
              <Text style={styles.remarksContent}>{entry.remarks}</Text>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {entry.docstatus === 0 ? (
          <TouchableOpacity
            style={[styles.primaryButton, submitting && styles.disabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <CheckCircle size={18} color={colors.white} />
                <Text style={styles.buttonText}>Submit Payment</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.submittedBox}>
            <CheckCircle size={20} color={colors.success} />
            <Text style={styles.submittedText}>Document is Submitted</Text>
          </View>
        )}
      </View>
    </ModuleLayout>
  );
}


// MEMOIZED FIELD COMPONENT
const VerticalField = React.memo(({ label, value, icon: Icon }: any) => (
  <View style={styles.fieldWrapper}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.fieldValueRow}>
      {Icon && <Icon size={16} color={colors.text_tertiary} style={{ marginRight: spacing.xs }} />}
      <Text style={styles.fieldValue}>{value || '—'}</Text>
    </View>
  </View>
));
