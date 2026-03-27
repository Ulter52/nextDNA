import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { X, Search, FileText, ChevronRight } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadow, moderateScale } from '../theme';
import { callMethod } from '../api/frappeApiHelpers';
import { useNavigation } from '@react-navigation/native';

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
}

interface SearchResult {
  doctype: string;
  name: string;
  description?: string;
}

export const SearchModal: React.FC<SearchModalProps> = ({ visible, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();

  const handleSearch = useCallback(async (text: string) => {
    setQuery(text);
    if (text.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // Using Frappe's global search method
      const data = await callMethod('frappe.utils.global_search.search', {
        text: text,
        start: 0,
        limit: 20
      });
      
      if (Array.isArray(data)) {
        setResults(data.map((item: any) => ({
          doctype: item.doctype,
          name: item.name,
          description: item.content
        })));
      }
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const navigateToResult = (result: SearchResult) => {
    onClose();
    // Logic to navigate based on Doctype
    // For example:
    if (result.doctype === 'Sales Invoice') {
      navigation.navigate('SellingTab', { screen: 'SalesInvoiceDetail', params: { name: result.name } });
    } else if (result.doctype === 'Item') {
       // navigation.navigate('StockTab', { screen: 'ItemDetail', params: { name: result.name } });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.searchBar}>
            <Search size={20} color={colors.text_tertiary} />
            <TextInput
              style={styles.input}
              placeholder="Search anything..."
              placeholderTextColor={colors.text_tertiary}
              autoFocus
              value={query}
              onChangeText={handleSearch}
            />
            <TouchableOpacity onPress={onClose}>
              <X size={20} color={colors.text_secondary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : (
            <ScrollView style={styles.resultsList} keyboardShouldPersistTaps="handled">
              {results.length > 0 ? (
                results.map((res, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.resultItem}
                    onPress={() => navigateToResult(res)}
                  >
                    <View style={styles.resultIcon}>
                      <FileText size={18} color={colors.primary} />
                    </View>
                    <View style={styles.resultContent}>
                      <Text style={styles.resultName}>{res.name}</Text>
                      <Text style={styles.resultDocType}>{res.doctype}</Text>
                    </View>
                    <ChevronRight size={16} color={colors.border} />
                  </TouchableOpacity>
                ))
              ) : query.length > 1 ? (
                <Text style={styles.noResults}>No results found for "{query}"</Text>
              ) : (
                <View style={styles.recentSearch}>
                  <Text style={styles.recentTitle}>Global Search</Text>
                  <Text style={styles.recentDesc}>Find items, customers, invoices, and more across all modules.</Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'flex-start',
  },
  container: {
    backgroundColor: colors.white,
    marginTop: moderateScale(50),
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.xl,
    maxHeight: '80%',
    ...shadow.medium,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border_light,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.text_primary,
    height: moderateScale(40),
  },
  loader: {
    padding: spacing.xxl,
  },
  resultsList: {
    padding: spacing.sm,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  resultIcon: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: borderRadius.md,
    backgroundColor: colors.blue_50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultContent: {
    flex: 1,
  },
  resultName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text_primary,
  },
  resultDocType: {
    fontSize: typography.sizes.xs,
    color: colors.text_tertiary,
    textTransform: 'uppercase',
    fontWeight: typography.weights.bold,
  },
  noResults: {
    textAlign: 'center',
    padding: spacing.xxl,
    color: colors.text_tertiary,
    fontSize: typography.sizes.sm,
  },
  recentSearch: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  recentTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text_secondary,
    marginBottom: spacing.xs,
  },
  recentDesc: {
    fontSize: typography.sizes.sm,
    color: colors.text_tertiary,
    textAlign: 'center',
    lineHeight: 20,
  }
});
