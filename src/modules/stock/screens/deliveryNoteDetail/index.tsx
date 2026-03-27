import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, ScrollView, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { 
  Package, 
  Building2, 
  Calendar, 
  Clock, 
  Edit,
  FileText,
  User,
  CreditCard,
  Percent,
  CheckCircle2,
  Briefcase,
} from 'lucide-react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

import { ModuleLayout } from '@core/components/ModuleLayout';
import { PDFRow } from '@core/components/PDFRow';
import { colors, spacing, borderRadius, shadow } from '@core/theme';
import { styles } from '../itemDetail/styles';

import { 
  useDeliveryNoteDetail, 
  useSubmitDeliveryNote 
} from '../../hooks/deliveryNoteQueries';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const VerticalInfoRow = ({ label, value, icon: Icon }: { label: string, value: any, icon?: any }) => (
  <View style={[styles.infoRow, { flexDirection: 'column', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: colors.border_light, paddingVertical: spacing.md }]}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      {Icon && <Icon size={12} color={colors.text_tertiary} />}
      <Text style={[styles.infoLabel, { textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.5, fontWeight: '700' }]}>{label}</Text>
    </View>
    <Text style={[styles.infoValue, { textAlign: 'left', fontSize: 14, color: colors.text_primary, fontWeight: '600' }]}>{value || 'N/A'}</Text>
  </View>
);

export function DeliveryNoteDetail() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { noteId } = route.params;
  
  const { data: note, isLoading, refetch } = useDeliveryNoteDetail(noteId);
  const submitMutation = useSubmitDeliveryNote();

  const handleEdit = () => {
    navigation.navigate('DeliveryNoteEdit', { noteId });
  };

  const handleSubmit = async () => {
    Alert.alert(
      "Submit Delivery Note",
      "Finalize this Delivery Note? This will reduce stock levels and cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Submit", 
          onPress: async () => {
            try {
              await submitMutation.mutateAsync(noteId);
              Alert.alert("Success", "Delivery Note submitted successfully");
            } catch (err: any) {
              Alert.alert("Error", err.response?.data?.message || "Failed to submit delivery note.");
            }
          }
        }
      ]
    );
  };

  const sections = useMemo(() => [
    { id: 'overview', title: 'General Info', icon: FileText, type: 'blue' },
    { id: 'items', title: 'Items Dispatched', icon: Package, type: 'orange' },
    { id: 'totals', title: 'Totals & Taxes', icon: CreditCard, type: 'green' },
  ], []);

  const renderSection = useCallback(({ item: section }: { item: any }) => {
    if (!note) return null;

    const SectionIcon = section.icon;
    const cardStyle = [
      styles.sectionCard,
      section.type === 'blue' && styles.blueCard,
      section.type === 'orange' && styles.orangeCard,
      section.type === 'green' && styles.greenCard,
    ];

    const titleColor = colors[
      section.type === 'blue' ? 'blue_500' : 
      section.type === 'orange' ? 'orange_500' : 'green_500'
    ];

    return (
      <View style={cardStyle}>
        <View style={[styles.cardTitleRow, { justifyContent: 'space-between' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <SectionIcon size={22} color={titleColor} strokeWidth={2.5} />
            <Text style={[styles.cardTitle, { color: titleColor }]}>{section.title}</Text>
          </View>
          {section.id === 'overview' && note.docstatus === 0 && (
            <TouchableOpacity onPress={handleEdit} activeOpacity={0.7}>
              <Edit size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {section.id === 'overview' && (
            <View>
              <VerticalInfoRow label="Status" value={note.status} icon={Clock} />
              <VerticalInfoRow label="Customer" value={note.customer} icon={User} />
              <VerticalInfoRow label="Posting Date" value={note.posting_date} icon={Calendar} />
              <VerticalInfoRow label="Posting Time" value={note.posting_time} icon={Clock} />
              <VerticalInfoRow label="Company" value={note.company} icon={Building2} />
              <VerticalInfoRow label="Project" value={note.project} icon={Briefcase} />
              <VerticalInfoRow label="Cost Center" value={note.cost_center} icon={Briefcase} />
              
              <PDFRow doctype="Delivery Note" name={note.name} label="Print Delivery Note" />

              {note.docstatus === 0 && (
                <TouchableOpacity 
                  style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: 8, 
                    backgroundColor: colors.primary, 
                    marginTop: spacing.xl, 
                    paddingVertical: 14, 
                    borderRadius: borderRadius.lg,
                    ...shadow.medium 
                  }}
                  onPress={handleSubmit}
                  disabled={submitMutation.isPending}
                >
                  {submitMutation.isPending ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <>
                      <CheckCircle2 size={18} color={colors.white} />
                      <Text style={{ color: colors.white, fontWeight: 'bold' }}>Submit Note</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}

          {section.id === 'items' && (
            <View>
              {note.items?.map((item: any, idx: number) => (
                <View key={idx} style={{ marginBottom: spacing.md, padding: spacing.md, backgroundColor: colors.background, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border_light }}>
                  <Text style={[styles.infoLabel, { color: colors.orange_600, marginBottom: spacing.xs, fontSize: 10, textTransform: 'uppercase' }]}>{item.item_code}</Text>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.text_primary, marginBottom: spacing.sm }}>{item.item_name}</Text>
                  
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
                    <View style={{ width: '45%' }}>
                        <Text style={{ fontSize: 9, color: colors.text_tertiary, textTransform: 'uppercase', fontWeight: 'bold' }}>Quantity</Text>
                        <Text style={{ fontSize: 13, fontWeight: 'bold' }}>{item.qty} {item.uom}</Text>
                    </View>
                    <View style={{ width: '45%' }}>
                        <Text style={{ fontSize: 9, color: colors.text_tertiary, textTransform: 'uppercase', fontWeight: 'bold' }}>Rate</Text>
                        <Text style={{ fontSize: 13, fontWeight: 'bold' }}>{note.currency} {item.rate?.toLocaleString()}</Text>
                    </View>
                    <View style={{ width: '45%' }}>
                        <Text style={{ fontSize: 9, color: colors.text_tertiary, textTransform: 'uppercase', fontWeight: 'bold' }}>Warehouse</Text>
                        <Text style={{ fontSize: 13, fontWeight: 'bold' }}>{item.warehouse || 'N/A'}</Text>
                    </View>
                  </View>

                  {item.serial_no && (
                    <View style={{ marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border_light }}>
                        <Text style={{ fontSize: 9, color: colors.text_tertiary, textTransform: 'uppercase', fontWeight: 'bold' }}>Serial Nos</Text>
                        <Text style={{ fontSize: 11, color: colors.text_secondary }}>{item.serial_no}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {section.id === 'totals' && (
            <View>
              <VerticalInfoRow label="Total Quantity" value={note.total_qty} icon={Package} />
              <VerticalInfoRow label="Net Total" value={`${note.currency} ${note.total?.toLocaleString()}`} icon={CreditCard} />
              {note.discount_amount > 0 && (
                <VerticalInfoRow label="Discount" value={`${note.currency} ${note.discount_amount?.toLocaleString()}`} icon={Percent} />
              )}
              <View style={{ marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border_light }}>
                <Text style={[styles.infoLabel, { color: colors.green_600, marginBottom: spacing.xs, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' }]}>Grand Total</Text>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text_primary }}>{note.currency} {note.grand_total?.toLocaleString()}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }, [note, submitMutation.isPending, handleEdit, handleSubmit]);

  if (isLoading) {
    return (
      <ModuleLayout title={noteId} showBack>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout title={`#${noteId}`} showBack>
      <View style={styles.container}>
        <FlatList
          data={sections}
          renderItem={renderSection}
          keyExtractor={(s) => s.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToAlignment="start"
          decelerationRate="fast"
          snapToInterval={SCREEN_WIDTH * 0.9 + spacing.xs * 2}
          contentContainerStyle={styles.horizontalList}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />
          }
        />
      </View>
    </ModuleLayout>
  );
}
