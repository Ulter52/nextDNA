import React, { useMemo } from 'react';
import { View, Text, ActivityIndicator, RefreshControl, ScrollView, TouchableOpacity } from 'react-native';
import { 
  Calendar, 
  FileText,
  Tag,
  Layers,
  Info,
  Edit
} from 'lucide-react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

import { ModuleLayout } from '@core/components/ModuleLayout';
import { colors, spacing, borderRadius } from '@core/theme';
import { styles as detailStyles } from '../itemDetail/styles';

import { useItemPriceDetail } from '../../hooks/itemPriceQueries';

const InfoRow = React.memo(({ label, value, icon: Icon }: { label: string, value: any, icon?: any }) => (
  <View style={detailStyles.infoRow}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
      {Icon && <Icon size={14} color={colors.text_tertiary} />}
      <Text style={detailStyles.infoLabel}>{label}</Text>
    </View>
    <Text style={detailStyles.infoValue} numberOfLines={2}>{value || 'N/A'}</Text>
  </View>
));

export function ItemPriceDetail() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { priceId } = route.params;
  
  const { data: price, isLoading, refetch } = useItemPriceDetail(priceId);

  if (isLoading && !price) {
    return (
      <ModuleLayout title="Item Price Detail" showBack>
        <View style={detailStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ModuleLayout>
    );
  }

  if (!price) {
    return (
      <ModuleLayout title="Not Found" showBack>
        <View style={detailStyles.loadingContainer}>
          <Text style={{ color: colors.text_secondary }}>Price detail not found</Text>
        </View>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout title="Item Price Detail" showBack>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        <View style={[detailStyles.sectionCard, detailStyles.blueCard, { width: '100%' }]}>
          <View style={[detailStyles.cardTitleRow, { justifyContent: 'space-between' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <FileText size={22} color={colors.blue_500} strokeWidth={2.5} />
              <Text style={[detailStyles.cardTitle, { color: colors.blue_500 }]}>Pricing Info</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('ItemPriceEdit', { priceId })}>
              <Edit size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={{ marginBottom: spacing.lg, alignItems: 'center', padding: spacing.md, backgroundColor: colors.blue_50, borderRadius: borderRadius.lg }}>
            <Text style={{ fontSize: 12, color: colors.primary, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 }}>Price List Rate</Text>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.text_primary }}>{price.currency} {price.price_list_rate?.toLocaleString()}</Text>
          </View>
          
          <InfoRow label="Price List" value={price.price_list} icon={FileText} />
          <InfoRow label="Item" value={`${price.item_name} (${price.item_code})`} icon={Tag} />
          <InfoRow label="Currency" value={price.currency} icon={Info} />
          <InfoRow label="Packing Unit" value={price.packing_unit} icon={Layers} />
          <InfoRow label="Valid From" value={price.valid_from} icon={Calendar} />
          <InfoRow label="Valid Upto" value={price.valid_upto} icon={Calendar} />
        </View>
      </ScrollView>
    </ModuleLayout>
  );
}
