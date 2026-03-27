import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Layers, FileBadge } from 'lucide-react-native';
import { colors, spacing, shadow, borderRadius } from '@core/theme';
import { Selector } from '@core/components/Selector';

export const TotalsSection = memo(({ 
  formData, 
  handleChange, 
  taxCategories, 
  setTaxCategorySearch,
  taxTemplates,
  setTaxTemplateSearch
}: any) => {
  return (
    <View>
      <Selector 
        label="Tax Category" 
        options={taxCategories} 
        value={formData.tax_category} 
        onChange={(v: any) => handleChange('tax_category', v)} 
        onSearch={setTaxCategorySearch}
        icon={Layers} 
        placeholder="Tax Category" 
      />

      <Selector 
        label="Purchase Taxes Template" 
        options={taxTemplates} 
        value={formData.taxes_and_charges} 
        onChange={(v: any) => handleChange('taxes_and_charges', v)} 
        onSearch={setTaxTemplateSearch}
        icon={FileBadge} 
        placeholder="Taxes and Charges Template" 
      />
      
      <View style={formStyles.totalsDisplay}>
        <View style={formStyles.totalRow}>
          <Text style={formStyles.totalLabel}>Net Total</Text>
          <Text style={formStyles.totalValue}>{(formData.net_total || 0).toFixed(2)}</Text>
        </View>
        {(formData.taxes || []).map((tax: any, tIdx: number) => (
          <View key={tIdx} style={[formStyles.totalRow, { marginTop: 4 }]}>
            <Text style={[formStyles.totalLabel, { fontSize: 10, fontWeight: 'normal' }]}>{tax.description || 'Tax'}</Text>
            <Text style={formStyles.totalValueSmall}>{(tax.tax_amount || 0).toFixed(2)}</Text>
          </View>
        ))}
        <View style={[formStyles.totalRow, formStyles.grandTotalRow]}>
          <Text style={[formStyles.totalLabel, { color: colors.text_primary }]}>Grand Total</Text>
          <Text style={[formStyles.totalValue, { color: colors.primary, fontSize: 18 }]}>{(formData.grand_total || 0).toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );
});

const formStyles = StyleSheet.create({
  totalsDisplay: { 
    marginTop: spacing.xl, 
    padding: spacing.lg, 
    backgroundColor: colors.white, 
    borderRadius: borderRadius.lg, 
    borderWidth: 1, 
    borderColor: colors.border_light, 
    ...shadow.small 
  },
  totalRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  totalLabel: { 
    fontSize: 12, 
    color: colors.text_secondary, 
    fontWeight: '700', 
    textTransform: 'uppercase' 
  },
  totalValue: { 
    fontSize: 14, 
    fontWeight: '900', 
    color: colors.text_primary 
  },
  totalValueSmall: {
    fontSize: 12,
    fontWeight: 'normal',
    color: colors.text_primary
  },
  grandTotalRow: { 
    marginTop: spacing.sm, 
    borderTopWidth: 1, 
    borderTopColor: colors.border_light, 
    paddingTop: spacing.sm 
  },
});
