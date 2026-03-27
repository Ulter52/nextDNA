import React, { useCallback, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, ScrollView, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { 
  ClipboardList, Package, Calendar, MapPin, Clock, Edit,
  FileText, User, Info, Activity, CheckCircle2
} from 'lucide-react-native';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { styles } from '../itemDetail/styles';
import { colors, spacing, borderRadius, shadow } from '../../../../core/theme';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useMaterialRequestDetail } from '../../hooks/materialRequestQueries';
import { stockApi } from '../../services/stockApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// MEMOIZED SUB-COMPONENTS
const VerticalInfoRow = React.memo(({ label, value, icon: Icon }: { label: string, value: any, icon?: any }) => (
  <View style={[styles.infoRow, { flexDirection: 'column', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: colors.border_light, paddingVertical: spacing.md }]}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      {Icon && <Icon size={12} color={colors.text_tertiary} />}
      <Text style={[styles.infoLabel, { textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.5, fontWeight: '700' }]}>{label}</Text>
    </View>
    <Text style={[styles.infoValue, { textAlign: 'left', fontSize: 14, color: colors.text_primary, fontWeight: '600' }]}>{value || 'N/A'}</Text>
  </View>
));

export function MaterialRequestDetail() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { requestId } = route.params;
  
  // Use React Query for caching
  const { 
    data: request, 
    isLoading, 
    isRefetching, 
    refetch 
  } = useMaterialRequestDetail(requestId);

  const handleEdit = useCallback(() => {
    navigation.navigate('MaterialRequestEdit', { requestId });
  }, [navigation, requestId]);

  const handleSubmit = useCallback(async () => {
    Alert.alert(
      "Submit Request",
      "Finalize this Material Request? This action is permanent.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Submit", 
          onPress: async () => {
            try {
              // Note: Using stockApi directly here for action
              // In a full implementation, this could be a mutation
              await stockApi.updateResource('Material Request', requestId, { docstatus: 1 });
              Alert.alert("Success", "Request submitted successfully");
              refetch();
            } catch (err: any) {
              Alert.alert("Error", "Failed to submit request.");
            }
          }
        }
      ]
    );
  }, [requestId, refetch]);

  const sections = useMemo(() => [
    { id: 'overview', title: 'Overview', icon: FileText, type: 'blue' },
    { id: 'items', title: 'Items List', icon: Package, type: 'orange' },
    { id: 'more_info', title: 'Audit Info', icon: Info, type: 'cyan' },
  ], []);

  const renderSection = useCallback(({ item: section }: { item: any }) => {
    if (!request) return null;
    
    const SectionIcon = section.icon;
    const cardStyle = [
      styles.sectionCard,
      section.type === 'blue' && styles.blueCard,
      section.type === 'orange' && styles.orangeCard,
      section.type === 'cyan' && styles.cyanCard,
    ];

    const titleColor = colors[
      section.type === 'blue' ? 'blue_500' : 
      section.type === 'orange' ? 'orange_500' : 'teal_500'
    ];

    return (
      <View style={cardStyle}>
        <View style={[styles.cardTitleRow, { justifyContent: 'space-between' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <SectionIcon size={22} color={titleColor} strokeWidth={2.5} />
            <Text style={[styles.cardTitle, { color: titleColor }]}>{section.title}</Text>
          </View>
          {section.id === 'overview' && request.status === 'Draft' && (
            <TouchableOpacity onPress={handleEdit} activeOpacity={0.7}>
              <Edit size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {section.id === 'overview' && (
            <View>
              <VerticalInfoRow label="Status" value={request.status} icon={Clock} />
              <VerticalInfoRow label="Type" value={request.material_request_type} icon={Activity} />
              <VerticalInfoRow label="Date" value={request.transaction_date} icon={Calendar} />
              <VerticalInfoRow label="Target Warehouse" value={request.set_warehouse} icon={MapPin} />
              
              {request.status === 'Draft' && (
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
                >
                  <CheckCircle2 size={18} color={colors.white} />
                  <Text style={{ color: colors.white, fontWeight: 'bold' }}>Submit Request</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {section.id === 'items' && (
            <View>
              {request.items?.map((item: any, idx: number) => (
                <View key={idx} style={{ marginBottom: spacing.md, padding: spacing.md, backgroundColor: colors.background, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border_light }}>
                  <Text style={[styles.infoLabel, { color: colors.orange_600, marginBottom: spacing.xs, fontSize: 10, textTransform: 'uppercase' }]}>{item.item_code}</Text>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.text_primary, marginBottom: spacing.sm }}>{item.item_name}</Text>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border_light, paddingTop: spacing.sm }}>
                    <View>
                        <Text style={{ fontSize: 9, color: colors.text_tertiary, textTransform: 'uppercase', fontWeight: 'bold' }}>Quantity</Text>
                        <Text style={{ fontSize: 13, fontWeight: 'bold' }}>{item.qty} {item.uom}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 9, color: colors.text_tertiary, textTransform: 'uppercase', fontWeight: 'bold' }}>Warehouse</Text>
                        <Text style={{ fontSize: 13, fontWeight: 'bold' }}>{item.warehouse || 'N/A'}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {section.id === 'more_info' && (
            <View>
              <VerticalInfoRow label="Owner" value={request.owner} icon={User} />
              <VerticalInfoRow label="Created On" value={request.creation?.split('.')[0]} icon={Clock} />
              <VerticalInfoRow label="Last Modified" value={request.modified?.split('.')[0]} icon={Clock} />
              {request.description && (
                <View style={[styles.descriptionContainer, { marginTop: spacing.md }]}>
                  <Text style={[styles.infoLabel, { marginBottom: 4, color: titleColor, fontSize: 10, textTransform: 'uppercase' }]}>Remarks</Text>
                  <Text style={styles.descriptionText}>{request.description}</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    );
  }, [request, handleEdit, handleSubmit]);

  if (isLoading && !request) {
    return (
      <ModuleLayout title={requestId} showBack>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout title={request?.name || requestId} showBack>
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
            <RefreshControl 
              refreshing={isRefetching} 
              onRefresh={refetch} 
              tintColor={colors.primary} 
            />
          }
        />
      </View>
    </ModuleLayout>
  );
}
