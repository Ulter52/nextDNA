import React, { useCallback, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, ScrollView, Dimensions, TouchableOpacity, Image } from 'react-native';
import { 
  User, MapPin, Phone, Mail, Globe, 
  FileText, CreditCard, Edit,
  Briefcase, Tag, Landmark, Hash, CheckCircle2, ShoppingCart
} from 'lucide-react-native';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { styles } from '../../../stock/screens/itemDetail/styles';
import { colors, spacing, borderRadius } from '../../../../core/theme';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSupplierDetail } from '../../hooks/buyingQueries';
import { BASE_URL } from '../../../../core/api/client';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const VerticalInfoRow = React.memo(({ label, value, icon: Icon }: { label: string, value: any, icon?: any }) => (
  <View style={[styles.infoRow, { flexDirection: 'column', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: colors.border_light, paddingVertical: spacing.md }]}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      {Icon && <Icon size={12} color={colors.text_tertiary} />}
      <Text style={[styles.infoLabel, { textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.5, fontWeight: '700' }]}>{label}</Text>
    </View>
    <Text style={[styles.infoValue, { textAlign: 'left', fontSize: 14, color: colors.text_primary, fontWeight: '600' }]}>
      {String(value ?? '') || '—'}
    </Text>
  </View>
));

export function SupplierDetail() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { supplierId } = route.params;
  
  const { data: supplier, isLoading, isRefetching, refetch } = useSupplierDetail(supplierId);

  const handleEdit = useCallback(() => {
    navigation.navigate('SupplierEdit', { supplierId });
  }, [navigation, supplierId]);

  const sections = useMemo(() => [
    { id: 'basic', title: 'Basic Info', icon: User, type: 'blue' },
    { id: 'contact', title: 'Primary Contact', icon: Phone, type: 'orange' },
    { id: 'address', title: 'Primary Address', icon: MapPin, type: 'green' },
    { id: 'accounting', title: 'Accounting', icon: Landmark, type: 'blue' },
  ], []);

  const renderSection = useCallback(({ item: section }: { item: any }) => {
    if (!supplier) return null;
    
    const contact = supplier.contact_data;
    const address = supplier.address_data;

    const SectionIcon = section.icon;
    const cardStyle = [
      styles.sectionCard,
      section.type === 'blue' && styles.blueCard,
      section.type === 'orange' && styles.orangeCard,
      section.type === 'green' && styles.greenCard,
    ];

    const titleColor = colors[section.type === 'blue' ? 'blue_500' : section.type === 'orange' ? 'orange_500' : 'green_500'];

    return (
      <View style={cardStyle}>
        <View style={[styles.cardTitleRow, { justifyContent: 'space-between' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <SectionIcon size={22} color={titleColor} strokeWidth={2.5} />
            <Text style={[styles.cardTitle, { color: titleColor }]}>{section.title}</Text>
          </View>
          {section.id === 'basic' && (
            <TouchableOpacity onPress={handleEdit} activeOpacity={0.7}>
              <Edit size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {section.id === 'basic' && (
            <View>
              <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
                {supplier.image ? (
                  <Image source={{ uri: `${BASE_URL}${supplier.image}` }} style={{ width: 80, height: 80, borderRadius: 40 }} />
                ) : (
                  <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.blue_50, justifyContent: 'center', alignItems: 'center' }}>
                    <User size={40} color={colors.primary} />
                  </View>
                )}
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text_primary, marginTop: spacing.sm }}>{supplier.supplier_name}</Text>
                <Text style={{ fontSize: 12, color: colors.text_tertiary }}>{supplier.name}</Text>
              </View>
              
              <VerticalInfoRow label="Supplier Name" value={supplier.supplier_name} icon={User} />
              <VerticalInfoRow label="Supplier Group" value={supplier.supplier_group} icon={Tag} />
              <VerticalInfoRow label="Supplier Type" value={supplier.supplier_type} icon={Briefcase} />
              <VerticalInfoRow label="GST Category" value={supplier.gst_category} icon={FileText} />
              <VerticalInfoRow label="GSTIN / UIN" value={supplier.gstin || supplier._gstin} icon={Hash} />
            </View>
          )}

          {section.id === 'contact' && (
            <View>
              <VerticalInfoRow 
                label="First Name" 
                value={contact?.first_name || supplier.map_to_first_name} 
                icon={User} 
              />
              <VerticalInfoRow 
                label="Last Name" 
                value={contact?.last_name || supplier.map_to_last_name} 
                icon={User} 
              />
              <VerticalInfoRow 
                label="Email ID" 
                value={contact?.email_id || supplier.email_id || supplier._email_id} 
                icon={Mail} 
              />
              <VerticalInfoRow 
                label="Mobile Number" 
                value={contact?.mobile_no || supplier.mobile_no || supplier._mobile_no} 
                icon={Phone} 
              />
            </View>
          )}

          {section.id === 'address' && (
            <View>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: spacing.md }}>
                {(address?.is_primary_address || supplier.is_primary_address) && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.blue_50, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                    <CheckCircle2 size={10} color={colors.blue_600} />
                    <Text style={{ fontSize: 10, color: colors.blue_600, fontWeight: 'bold' }}>BILLING</Text>
                  </View>
                )}
                {(address?.is_shipping_address || supplier.is_shipping_address) && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.green_50, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                    <CheckCircle2 size={10} color={colors.green_600} />
                    <Text style={{ fontSize: 10, color: colors.green_600, fontWeight: 'bold' }}>SHIPPING</Text>
                  </View>
                )}
              </View>
              
              <VerticalInfoRow label="Address Line 1" value={address?.address_line1 || supplier.address_line1} icon={MapPin} />
              <VerticalInfoRow label="Address Line 2" value={address?.address_line2 || supplier.address_line2} icon={MapPin} />
              <VerticalInfoRow label="City/Town" value={address?.city || supplier.city} icon={Globe} />
              <VerticalInfoRow label="State/Province" value={address?.state || supplier.state} icon={MapPin} />
              <VerticalInfoRow label="Country" value={address?.country || supplier.country} icon={Globe} />
              <VerticalInfoRow label="Postal Code" value={address?.pincode || supplier.pincode || supplier._pincode} icon={Hash} />
            </View>
          )}

          {section.id === 'accounting' && (
            <View>
              <VerticalInfoRow label="Default Currency" value={supplier.default_currency} icon={CreditCard} />
              <VerticalInfoRow label="Default Price List" value={supplier.default_price_list} icon={ShoppingCart} />
              <VerticalInfoRow label="Tax Category" value={supplier.tax_category} icon={Tag} />
              <VerticalInfoRow label="Payment Terms" value={supplier.payment_terms} icon={FileText} />
              <VerticalInfoRow label="Default Bank Account" value={supplier.default_bank_account} icon={Landmark} />
            </View>
          )}
        </ScrollView>
      </View>
    );
  }, [supplier, handleEdit]);

  if (isLoading && !supplier) {
    return (
      <ModuleLayout title={supplierId} showBack>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout title={supplier?.supplier_name || supplierId} showBack>
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
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        />
      </View>
    </ModuleLayout>
  );
}
