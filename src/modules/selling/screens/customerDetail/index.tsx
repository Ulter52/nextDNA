import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, ScrollView, Dimensions, TouchableOpacity, Image, DeviceEventEmitter } from 'react-native';
import { 
  User, MapPin, Phone, Mail, Globe, 
  Edit, Briefcase, Tag, CheckCircle2, Hash
} from 'lucide-react-native';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { styles } from '../../../stock/screens/itemDetail/styles';
import { colors, spacing } from '../../../../core/theme';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useCustomerDetail } from '../../hooks/customerQueries';

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

export function CustomerDetail() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { customerId } = route.params;
  
  const { data: customer, isLoading, isRefetching, refetch } = useCustomerDetail(customerId);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('customers_updated', refetch);
    return () => sub.remove();
  }, [refetch]);

  const handleEdit = useCallback(() => {
    navigation.navigate('NewCustomer', { customerId });
  }, [navigation, customerId]);

  const sections = useMemo(() => [
    { id: 'basic', title: 'Basic Info', icon: User, type: 'blue' },
    { id: 'contact', title: 'Primary Contact', icon: Phone, type: 'orange' },
    { id: 'address', title: 'Primary Address', icon: MapPin, type: 'green' },
  ], []);

  const renderSection = useCallback(({ item: section }: { item: any }) => {
    if (!customer) return null;
    
    const contact = customer.contact_data;
    const address = customer.address_data;

    const SectionIcon = section.icon;
    const cardStyle = [
      styles.sectionCard,
      section.type === 'blue' && styles.blueCard,
      section.type === 'orange' && styles.orangeCard,
      section.type === 'green' && styles.greenCard,
    ];

    const titleColor = colors[section.type === 'blue' ? 'blue_500' : (section.type === 'orange' ? 'orange_500' : 'green_500')];

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
                {customer.image ? (
                  <Image 
                    source={{ uri: customer.image.startsWith('http') ? customer.image : `https://erp.nextdna.in${customer.image}` }} 
                    style={{ width: 80, height: 80, borderRadius: 40 }} 
                  />
                ) : (
                  <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.blue_50, justifyContent: 'center', alignItems: 'center' }}>
                    <User size={40} color={colors.primary} />
                  </View>
                )}
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text_primary, marginTop: spacing.sm }}>{customer.customer_name}</Text>
                <Text style={{ fontSize: 12, color: colors.text_tertiary }}>{customer.name}</Text>
              </View>
              
              <VerticalInfoRow label="Customer Name" value={customer.customer_name} icon={User} />
              <VerticalInfoRow label="Customer Group" value={customer.customer_group} icon={Tag} />
              <VerticalInfoRow label="Customer Type" value={customer.customer_type} icon={Briefcase} />
              <VerticalInfoRow label="Territory" value={customer.territory} icon={Globe} />
            </View>
          )}

          {section.id === 'contact' && (
            <View>
              <VerticalInfoRow 
                label="First Name" 
                value={contact?.first_name} 
                icon={User} 
              />
              <VerticalInfoRow 
                label="Last Name" 
                value={contact?.last_name} 
                icon={User} 
              />
              <VerticalInfoRow 
                label="Email ID" 
                value={contact?.email_id || customer.email_id} 
                icon={Mail} 
              />
              <VerticalInfoRow 
                label="Mobile Number" 
                value={contact?.mobile_no || customer.mobile_no} 
                icon={Phone} 
              />
            </View>
          )}

          {section.id === 'address' && (
            <View>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: spacing.md }}>
                {!!address?.is_primary_address && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.blue_50, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                    <CheckCircle2 size={10} color={colors.blue_600} />
                    <Text style={{ fontSize: 10, color: colors.blue_600, fontWeight: 'bold' }}>BILLING</Text>
                  </View>
                )}
                {!!address?.is_shipping_address && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.green_50, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                    <CheckCircle2 size={10} color={colors.green_600} />
                    <Text style={{ fontSize: 10, color: colors.green_600, fontWeight: 'bold' }}>SHIPPING</Text>
                  </View>
                )}
              </View>
              
              <VerticalInfoRow label="Address Line 1" value={address?.address_line1} icon={MapPin} />
              <VerticalInfoRow label="Address Line 2" value={address?.address_line2} icon={MapPin} />
              <VerticalInfoRow label="City/Town" value={address?.city} icon={Globe} />
              <VerticalInfoRow label="State/Province" value={address?.state} icon={MapPin} />
              <VerticalInfoRow label="Country" value={address?.country} icon={Globe} />
              <VerticalInfoRow label="Postal Code" value={address?.pincode} icon={Hash} />
            </View>
          )}
        </ScrollView>
      </View>
    );
  }, [customer, handleEdit]);

  if (isLoading && !customer) {
    return (
      <ModuleLayout title={customerId} showBack>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout title={customer?.customer_name || customerId} showBack>
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
