import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator, RefreshControl, ScrollView, TouchableOpacity } from 'react-native';
import { 
  Calendar, 
  FileText,
  Tag,
  Layers,
  Info,
  Edit
} from 'lucide-react-native';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { styles as detailStyles } from '../itemDetail/styles';
import { colors, spacing, borderRadius } from '../../../../core/theme';
import { useRoute, useNavigation } from '@react-navigation/native';
import { fetchResource } from '../../../../core/api/frappeApiHelpers';

export function ItemPriceDetail() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { priceId } = route.params;
  
  const [price, setPrice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetchResource(`Item Price/${priceId}`);
      setPrice(res?.data || null);
    } catch (err) {
      console.error("Failed to fetch item price details", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [priceId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading && !price) {
    return (
      <ModuleLayout title="Item Price Detail" showBack>
        <View style={detailStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ModuleLayout>
    );
  }

  const InfoRow = ({ label, value, icon: Icon }: { label: string, value: any, icon?: any }) => (
    <View style={detailStyles.infoRow}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
        {Icon && <Icon size={14} color={colors.text_tertiary} />}
        <Text style={detailStyles.infoLabel}>{label}</Text>
      </View>
      <Text style={detailStyles.infoValue} numberOfLines={2}>{value || 'N/A'}</Text>
    </View>
  );

  return (
    <ModuleLayout title="Item Price Detail" showBack>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
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
