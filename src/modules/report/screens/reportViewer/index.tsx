import React, { useState, useMemo, useCallback, memo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  FlatList, 
  RefreshControl, 
  Share, 
  PanResponder, 
  Animated,
  Alert
} from 'react-native';
import { 
  Filter, X, ArrowUpDown, FileText, Share2, Plus, Lock, AlertCircle
} from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { useRunReport } from '../../hooks/reportQueries';
import { colors } from '../../../../core/theme';
import { styles } from './styles';
import { formatCurrency, formatDate } from '../../../../core/utils/formatters';
import { ReportFilterModal } from '../../components/ReportFilterModal';

// --- Optimized Components for Performance ---

const ReportCell = memo(({ value, column, isTotal }: any) => {
  const width = column.width || 120;
  
  let displayValue = value;
  if (column.fieldtype === 'Currency') displayValue = formatCurrency(value, 'INR');
  if (column.fieldtype === 'Date') displayValue = formatDate(value);

  let textStyle: any = [styles.cellText];
  if (isTotal) {
    textStyle.push(styles.totalText);
  }

  // Semantic value coloring
  if (column.fieldtype === 'Currency' && typeof value === 'number') {
    if (value < 0) textStyle.push({ color: colors.red_600 });
    else if (value > 0 && (column.fieldname?.includes('profit') || column.fieldname?.includes('revenue'))) {
      textStyle.push({ color: '#10b981' });
    }
  }

  return (
    <View style={[styles.cell, { width }]}>
      <Text style={textStyle} numberOfLines={1}>
        {displayValue ?? '-'}
      </Text>
    </View>
  );
});

const ReportRow = memo(({ item, index, columns }: any) => {
  const isTotal = useMemo(() => {
    return (Array.isArray(item) && (typeof item[0] === 'string' && item[0].includes('Total'))) || 
           (item.entity === 'Total' || (typeof item.account_name === 'string' && item.account_name.includes('Total')));
  }, [item]);
  
  let rowStyle: any = [styles.row];
  if (isTotal) {
    rowStyle.push(styles.totalRow);
  } else {
    const mod = index % 3;
    if (mod === 0) rowStyle.push(styles.blueRow);
    else if (mod === 1) rowStyle.push(styles.greenRow);
    else rowStyle.push(styles.redRow);
  }

  return (
    <View style={rowStyle}>
      {columns.map((col: any, idx: number) => (
        <ReportCell 
          key={col.fieldname || `cell-${idx}`} 
          value={Array.isArray(item) ? item[idx] : item[col.fieldname]}
          column={col} 
          isTotal={isTotal} 
        />
      ))}
    </View>
  );
});

export function ReportViewerScreen() {
  const route = useRoute<any>();
  const { reportId, reportName, filters: initialFilters } = route.params || {};

  const [filters, setFilters] = useState(initialFilters || {});
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);

  // --- Draggable FAB Logic ---
  const pan = useState(new Animated.ValueXY())[0];
  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5,
    onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
    onPanResponderRelease: () => {
      pan.extractOffset();
    },
  }), [pan]);

  const { 
    data: reportRes, 
    isLoading, 
    isFetching, 
    error,
    refetch 
  } = useRunReport(reportName, filters);

  // Extract data once and keep stable
  const { resultData, columnsData } = useMemo(() => {
    if (!reportRes) return { resultData: [], columnsData: [] };
    const message = reportRes.message || reportRes;
    return {
      resultData: message.result || [],
      columnsData: message.columns || []
    };
  }, [reportRes]);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return resultData;
    
    const sorted = [...resultData].sort((a, b) => {
      const colIndex = columnsData.findIndex((c: any) => c.fieldname === sortConfig.key);
      const valA = Array.isArray(a) ? a[colIndex] : a[sortConfig.key];
      const valB = Array.isArray(b) ? b[colIndex] : b[sortConfig.key];

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [resultData, columnsData, sortConfig]);

  const handleShareSummary = useCallback(async () => {
    try {
      let summary = `📊 *${reportName} Report*\n` +
        `🏢 *Co:* ${filters.company || 'All'}\n` +
        `📅 *Period:* ${filters.from_date || 'Start'} to ${filters.to_date || 'End'}\n` +
        `━━━━━━━━━━━━━━\n\n`;

      if (sortedData.length > 0 && columnsData.length > 0) {
        const cols = columnsData.slice(0, 3);
        summary += `*Summary (Top ${Math.min(5, sortedData.length)}):*\n`;
        sortedData.slice(0, 5).forEach((row, idx) => {
          const rowText = cols.map((col, cIdx) => {
            let val = Array.isArray(row) ? row[cIdx] : row[col.fieldname];
            if (col.fieldtype === 'Currency') val = formatCurrency(val, 'INR');
            return val ?? '-';
          }).join(' | ');
          summary += `${idx + 1}. ${rowText}\n`;
        });
      }

      summary += `\n🔢 *Total Rows:* ${resultData.length}\n` +
        `🔗 _Generated via ERP Mobile_`;

      await Share.share({
        message: summary,
        title: reportName,
      });
    } catch (error) {
      console.error("Sharing failed", error);
    }
  }, [reportName, filters, resultData.length, sortedData, columnsData]);

  const handleExportPDF = useCallback(() => {
    setShowFabMenu(false);
    Alert.alert(
      "Coming Soon (V2.0)",
      "High-fidelity PDF Export is being optimized for Version 2.0. Please use the 'Share Summary' option for now.",
      [{ text: "OK", style: "default" }]
    );
  }, []);

  const handleApplyFilters = useCallback((newFilters: any) => {
    setFilters(newFilters);
  }, []);

  const renderItem = useCallback(({ item, index }: any) => (
    <ReportRow item={item} index={index} columns={columnsData} />
  ), [columnsData]);

  const renderHeader = useMemo(() => (
    <View style={styles.tableHeader}>
      {columnsData.map((column: any, index: number) => {
        const width = column.width || 120;
        return (
          <View key={column.fieldname || `col-${index}`} style={[styles.headerCell, { width }]}>
            <TouchableOpacity 
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              onPress={() => setSortConfig({ 
                key: column.fieldname, 
                direction: sortConfig.key === column.fieldname && sortConfig.direction === 'asc' ? 'desc' : 'asc' 
              })}
            >
              <Text style={styles.headerText}>{column.label || column.fieldname}</Text>
              <ArrowUpDown size={10} color={colors.white} />
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  ), [columnsData, sortConfig.key, sortConfig.direction]);

  if (isLoading) {
    return (
      <ModuleLayout title={reportName} showBack>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Running Analysis...</Text>
        </View>
      </ModuleLayout>
    );
  }

  if (error) {
    return (
      <ModuleLayout title={reportName} showBack>
        <View style={styles.emptyState}>
          <AlertCircle size={48} color={colors.red_500} />
          <Text style={[styles.emptyText, { color: colors.red_600, fontWeight: 'bold' }]}>
            Report Failed to Load
          </Text>
          <Text style={[styles.emptyText, { marginTop: 4 }]}>
            {(error as any).response?.data?.message || "Ensure you have the correct permissions for this report."}
          </Text>
          <TouchableOpacity 
            onPress={() => refetch()} 
            style={{ marginTop: 20, padding: 12, backgroundColor: colors.primary, borderRadius: 8 }}
          >
            <Text style={{ color: colors.white, fontWeight: 'bold' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout title={reportName} showBack>
      <View style={styles.container}>
        {isFetching && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, alignItems: 'center' }}>
             <View style={{ backgroundColor: '#2563eb', paddingHorizontal: 12, paddingVertical: 4, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
                <ActivityIndicator size="small" color={colors.white} />
             </View>
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View>
            {renderHeader}

            <FlatList
              data={sortedData}
              keyExtractor={(_, index) => index.toString()}
              renderItem={renderItem}
              initialNumToRender={10}
              maxToRenderPerBatch={5}
              windowSize={5}
              removeClippedSubviews={true}
              refreshControl={
                <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor="#2563eb" />
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <X size={48} color={colors.border} />
                  <Text style={styles.emptyText}>No data matches the selected filters.</Text>
                </View>
              }
            />
          </View>
        </ScrollView>

        {/* Draggable FAB */}
        <Animated.View 
          style={[
            styles.fabContainer, 
            { transform: pan.getTranslateTransform() }
          ]}
          {...panResponder.panHandlers}
        >
          {showFabMenu && (
            <View style={styles.fabActions}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                <View style={styles.miniFabLabel}><Text style={styles.miniFabLabelText}>Export PDF (V2.0)</Text></View>
                <TouchableOpacity 
                  style={[styles.miniFab, { backgroundColor: '#f3f4f6' }]} 
                  onPress={handleExportPDF}
                >
                  <Lock size={20} color={colors.text_tertiary} />
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                <View style={styles.miniFabLabel}><Text style={styles.miniFabLabelText}>Share Summary</Text></View>
                <TouchableOpacity 
                  style={styles.miniFab} 
                  onPress={() => { setShowFabMenu(false); handleShareSummary(); }}
                >
                  <Share2 size={20} color={colors.text_primary} />
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                <View style={styles.miniFabLabel}><Text style={styles.miniFabLabelText}>Filter</Text></View>
                <TouchableOpacity 
                  style={styles.miniFab} 
                  onPress={() => { setShowFabMenu(false); setFilterModalVisible(true); }}
                >
                  <Filter size={20} color="#2563eb" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity 
            style={[styles.fabMain, showFabMenu && { backgroundColor: colors.neutral_800 }]} 
            onPress={() => setShowFabMenu(!showFabMenu)}
            activeOpacity={0.9}
          >
            {showFabMenu ? <X size={24} color={colors.white} /> : <Plus size={24} color={colors.white} />}
            {!isFetching && <View style={styles.syncBadge} />}
          </TouchableOpacity>
        </Animated.View>

        <ReportFilterModal
          visible={filterModalVisible}
          onClose={() => setFilterModalVisible(false)}
          onApply={handleApplyFilters}
          reportId={reportId || reportName}
          currentFilters={filters}
        />
      </View>
    </ModuleLayout>
  );
}
