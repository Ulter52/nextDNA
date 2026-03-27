import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { Printer, Share2 } from 'lucide-react-native';
import { colors, spacing } from '../theme';
import { BASE_URL } from '../api/client';
import { callMethod } from '../api/frappeApiHelpers';

interface PDFRowProps {
  doctype: string;
  name: string;
  label?: string;
  icon?: any;
}

export function PDFRow({ doctype, name, label = "Print Format / PDF", icon: Icon = Printer }: PDFRowProps) {
  const [loading, setLoading] = useState(false);

  const handleOpenPDF = async () => {
    if (!name) return;
    setLoading(true);
    try {
      // 1. Fetch sharing key for the document to bypass session requirement in external browser
      const sharingKey = await callMethod('frappe.get_document_share_key', {
        doctype: doctype,
        name: name
      });

      // 2. Construct the PDF download URL with the sharing key
      let pdfUrl = `${BASE_URL}/api/method/frappe.utils.print_format.download_pdf?doctype=${encodeURIComponent(doctype)}&name=${encodeURIComponent(name)}&format=Standard&no_letterhead=0`;
      
      if (sharingKey) {
        pdfUrl += `&key=${sharingKey}`;
      }

      // 3. Open in external browser
      await Linking.openURL(pdfUrl);
      
    } catch (error) {
      console.error("PDF Sharing Error:", error);
      // Fallback: attempt to open without key
      try {
        const fallbackUrl = `${BASE_URL}/api/method/frappe.utils.print_format.download_pdf?doctype=${encodeURIComponent(doctype)}&name=${encodeURIComponent(name)}&format=Standard`;
        await Linking.openURL(fallbackUrl);
      } catch (e) {
        Alert.alert("Error", "Failed to generate a secure PDF link.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handleOpenPDF}
      disabled={loading}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.labelContainer}>
          <Icon size={12} color={colors.primary} />
          <Text style={styles.label}>{label}</Text>
        </View>
        <View style={styles.valueContainer}>
          <Text style={styles.value}>Generate & View PDF</Text>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />
          ) : (
            <Share2 size={16} color={colors.primary} style={{ marginLeft: 8 }} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.border_light,
    paddingVertical: spacing.md,
    width: '100%',
  },
  content: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  label: {
    textTransform: 'uppercase',
    fontSize: 10,
    letterSpacing: 0.5,
    fontWeight: '700',
    color: colors.text_tertiary,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  value: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  }
});
