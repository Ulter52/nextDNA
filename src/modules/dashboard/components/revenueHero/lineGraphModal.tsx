import React from 'react';
import { View, Text, Modal, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import Svg, { Circle, Polyline, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { styles } from './lineGraphStyles';
import { formatCurrency } from '@utils/formatters';

interface DataPoint {
  label: string;
  value: number;
}

interface LineGraphModalProps {
  visible: boolean;
  onClose: () => void;
  data: DataPoint[];
  prevData?: DataPoint[];
  title: string;
}

export const LineGraphModal: React.FC<LineGraphModalProps> = ({ visible, onClose, data, prevData, title }) => {
  const chartWidth = Dimensions.get('window').width - 80; 
  const chartHeight = 220;
  
  if (!data || data.length === 0) return null;

  // 1. Scaling: Calculate max across all 24 potential points
  const allValues = [...data.map(d => d.value), ...(prevData ? prevData.map(d => d.value) : [])];
  const maxVal = Math.max(...allValues, 1000); 
  const yAxisTicks = [maxVal, maxVal * 0.75, maxVal * 0.5, maxVal * 0.25, 0];

  const getX = (index: number) => (index / 11) * chartWidth;
  const getY = (value: number) => chartHeight - (value / maxVal) * chartHeight;

  // 2. Current FY Plotting (Stop at last month with data)
  const lastActiveIdx = [...data].reverse().findIndex(d => d.value > 0);
  const plotEndIndex = lastActiveIdx === -1 ? 0 : 11 - lastActiveIdx;
  const plotData = data.slice(0, plotEndIndex + 1);

  // Line points for Current FY
  let linePoints = plotData.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');
  
  // Area points for Current FY (Shading)
  const lastX = getX(plotEndIndex);
  let areaPoints = `0,${chartHeight} ${linePoints} ${lastX},${chartHeight}`;

  // If only one point exists, create a small segment so it's visible
  if (plotData.length === 1) {
    const x0 = getX(0);
    const y0 = getY(plotData[0].value);
    const x1 = getX(0.5);
    linePoints = `${x0},${y0} ${x1},${y0}`;
    areaPoints = `${x0},${chartHeight} ${x0},${y0} ${x1},${y0} ${x1},${chartHeight}`;
  }

  // 3. Previous FY Plotting (Dashed Line)
  const prevLinePoints = prevData && prevData.length === 12 
    ? prevData.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ')
    : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{title}</Text>
              <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#2563eb' }]} />
                  <Text style={styles.legendText}>Current FY</Text>
                </View>
                {prevData && (
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#cbd5e1', borderStyle: 'dashed' }]} />
                    <Text style={styles.legendText}>Previous FY</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.chartWrapper}>
            <View style={styles.chartContainer}>
              <View style={{ width: 40, justifyContent: 'space-between', paddingVertical: 2 }}>
                {yAxisTicks.map((tick, i) => (
                  <Text key={i} style={styles.axisLabel}>
                    {tick >= 100000 ? `${(tick / 100000).toFixed(1)}L` : tick >= 1000 ? `${(tick / 1000).toFixed(0)}K` : tick.toFixed(0)}
                  </Text>
                ))}
              </View>

              <View style={[styles.mainChartArea, { borderLeftWidth: 1, borderBottomWidth: 1, borderColor: '#f1f5f9' }]}>
                <Svg width={chartWidth} height={chartHeight} style={{ overflow: 'visible' }}>
                  <Defs>
                    <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
                      <Stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                    </LinearGradient>
                  </Defs>

                  {/* Horizontal Grid Lines */}
                  {yAxisTicks.map((tick, i) => (
                    <Line key={i} x1="0" y1={getY(tick)} x2={chartWidth} y2={getY(tick)} stroke="#f8fafc" strokeWidth="1" />
                  ))}

                  {/* Previous FY Dashed Line */}
                  {prevLinePoints && (
                    <Polyline points={prevLinePoints} fill="none" stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="4,4" />
                  )}

                  {/* Current FY Shaded Area */}
                  {plotData.length > 0 && (
                    <Polyline points={areaPoints} fill="url(#gradient)" stroke="none" />
                  )}

                  {/* Current FY Bold Line */}
                  <Polyline points={linePoints} fill="none" stroke="#2563eb" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

                  {/* Current FY Data Markers */}
                  {plotData.map((d, i) => (
                    <Circle key={i} cx={getX(i)} cy={getY(d.value)} r="4" fill="#ffffff" stroke="#2563eb" strokeWidth="2" />
                  ))}

                  {/* Previous FY Data Markers (Subtle) */}
                  {prevData && prevData.map((d, i) => (
                    d.value > 0 && (
                      <Circle key={i} cx={getX(i)} cy={getY(d.value)} r="2" fill="#cbd5e1" />
                    )
                  ))}
                </Svg>
              </View>
            </View>

            {/* X-Axis Labels aligned with chart points */}
            <View style={{ flexDirection: 'row', marginLeft: 40, width: chartWidth, marginTop: 8 }}>
              {data.map((d, i) => (
                <View key={i} style={{ width: chartWidth / 11, alignItems: 'center', marginLeft: i === 0 ? -(chartWidth/22) : 0 }}>
                  <Text style={[styles.xLabel, { width: 40 }]}>{d.label.substring(0, 3)}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Footer Stats Cards */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
            <View style={styles.statsRow}>
              {data.map((d, i) => {
                const hasCurrentVal = d.value > 0;
                const hasPrevVal = prevData && prevData[i] && prevData[i].value > 0;
                
                // Show month if it has data in either year, OR if it's the current month (April) or the last month (March)
                if (!hasCurrentVal && !hasPrevVal && d.label !== 'Apr' && d.label !== 'Mar') return null;

                return (
                  <View key={i} style={styles.statItem}>
                    <Text style={styles.statLabel}>{d.label}</Text>
                    <Text style={styles.statValue}>{formatCurrency(d.value, 'INR')}</Text>
                    {prevData && prevData[i] && (
                      <Text style={styles.prevStatValue}>LY: {formatCurrency(prevData[i].value, 'INR')}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
