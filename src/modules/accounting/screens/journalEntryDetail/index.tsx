import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import {
  Edit, Calendar, Landmark, CheckCircle2, XCircle,
  Clock, FileText, User, Hash, CheckCircle, Tag
} from 'lucide-react-native';

import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { colors, spacing } from '../../../../core/theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { accountingApi } from '../../services/accountingApi';
import { useJournalEntryDetail } from '../../hooks/journalEntryQueries';
import { formatCurrency } from '../../../../core/utils/formatters';
import { styles } from './styles';

// STATUS CONFIG mapping
const STATUS_CONFIG: any = {
  1: {
    label: 'Submitted',
    color: colors.success,
    Icon: CheckCircle2,
    badgeStyle: 'badgeSuccess',
  },
  2: {
    label: 'Cancelled',
    color: colors.error,
    Icon: XCircle,
    badgeStyle: 'badgeError',
  },
  0: {
    label: 'Draft',
    color: colors.neutral_600,
    Icon: Clock,
    badgeStyle: 'badgeDefault',
  },
  default: {
    label: 'Unknown',
    color: colors.neutral_600,
    Icon: Tag,
    badgeStyle: 'badgeDefault',
  },
};

export function JournalEntryDetail() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { entryId } = route.params;

  const [submitting, setSubmitting] = useState(false);

  const {
    data: entry,
    isLoading,
    refetch
  } = useJournalEntryDetail(entryId);

  const handleSubmit = useCallback(async () => {
    if (!entry) return;
    setSubmitting(true);
    try {
      await accountingApi.submitJournalEntry(entry.name);
      Alert.alert("Success", "Journal Entry submitted successfully");
      refetch();
    } catch {
      Alert.alert("Error", "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }, [entry, refetch]);

  const statusConfig = useMemo(() => {
    return STATUS_CONFIG[entry?.docstatus] || STATUS_CONFIG[0];
  }, [entry?.docstatus]);

  const referenceNo = useMemo(() => 
    entry?.cheque_no || entry?.bill_no || entry?.reference_no, 
    [entry]
  );
  
  const referenceDate = useMemo(() => 
    entry?.cheque_date || entry?.bill_date || entry?.reference_date, 
    [entry]
  );

  const accountList = useMemo(() => {
    if (!entry?.accounts?.length) return null;

    return entry.accounts.map((acc: any, idx: number) => (
      <View 
        key={idx} 
        style={[styles.accountCard, idx < entry.accounts.length - 1 && styles.borderBottom]}
      >
        <View style={styles.flex1}>
          <Text style={styles.accName} numberOfLines={1}>{acc.account}</Text>
          {acc.party && (
            <View style={styles.partyRow}>
              <User size={10} color={colors.text_tertiary} />
              <Text style={styles.accParty}>
                {acc.party_type ? `${acc.party_type}: ` : ''}{acc.party}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.alignEnd}>
          <Text style={[styles.accValue, { color: acc.debit > 0 ? colors.success : colors.error }]}>
            {acc.debit > 0 
              ? `Dr ${formatCurrency(acc.debit, 'INR')}` 
              : `Cr ${formatCurrency(acc.credit, 'INR')}`}
          </Text>
        </View>
      </View>
    ));
  }, [entry?.accounts]);

  if (isLoading) {
    return (
      <ModuleLayout title="Journal Detail" showBack>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ModuleLayout>
    );
  }

  if (!entry) {
    return (
      <ModuleLayout title="Journal Detail" showBack>
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
        
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.headerRow}>
            <View style={[styles.badge, styles[statusConfig.badgeStyle]]}>
              <StatusIcon size={14} color={statusConfig.color} />
              <Text style={[styles.badgeText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
            
            <View style={[styles.badge, styles.badgePurple]}>
              <FileText size={14} color={colors.purple_500} />
              <Text style={[styles.badgeText, styles.purpleText]}>
                {entry.voucher_type}
              </Text>
            </View>
          </View>
          
          <Text style={styles.amountHero}>
            {formatCurrency(entry.total_debit, 'INR')}
          </Text>
          <Text style={styles.metaText}>Total Amount</Text>

          {entry.docstatus === 0 && (
            <TouchableOpacity 
              style={styles.editIconBtn}
              onPress={() => navigation.navigate('JournalEntryEdit', { entryId: entry.name })}
            >
              <Edit size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Primary Details */}
        <View style={styles.detailsContainer}>
          <VerticalField label="Posting Date" value={entry.posting_date} icon={Calendar} />
          <VerticalField label="Voucher Type" value={entry.voucher_type} icon={FileText} />
          
          <View style={styles.divider} />
          <VerticalField label="Reference No" value={referenceNo} icon={Hash} />
          <VerticalField label="Reference Date" value={referenceDate} icon={Calendar} />

          <View style={styles.divider} />
          <VerticalField label="Company" value={entry.company} icon={Landmark} />
        </View>

        {/* Accounting Ledger */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Accounting Ledger</Text>
          <View style={styles.accountList}>{accountList}</View>
        </View>

        {/* User Remarks */}
        {entry.user_remark && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>User Remarks</Text>
            <View style={styles.remarksBox}>
              <Text style={styles.remarksContent}>{entry.user_remark}</Text>
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
                <Text style={styles.buttonText}>Submit Journal</Text>
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
