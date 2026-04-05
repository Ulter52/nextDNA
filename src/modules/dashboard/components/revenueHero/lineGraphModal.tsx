import React from 'react';
import { View, Text, Modal, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import Svg, { Path, Circle, Polyline, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
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
  const chartWidth = Dimensions.get('window').width - 100; 
  const chartHeight = 220;
  
  if (!data || data.length === 0) return null;

  // 1. Calculate Max Value only from active data to ensure proper scaling
  const activeData = data.filter(d => d.value > 0);
  const activePrevData = prevData ? prevData.filter(d => d.value > 0) : [];
  const allActiveValues = [...activeData.map(d => d.value), ...activePrevData.map(d => d.value)];
  
  const maxVal = Math.max(...allActiveValues, 1000); 
  const yAxisTicks = [maxVal, maxVal * 0.75, maxVal * 0.5, maxVal * 0.25, 0];

  const getX = (index: number) => (index / 11) * chartWidth;
  const getY = (value: number) => chartHeight - (value / maxVal) * chartHeight;

  // 2. Plotting logic for Current FY
  // Find the last month that has a non-zero value to stop the line there
  const lastActiveIndex = [...data].reverse().findIndex(d => d.value > 0);
  const plotEndIndex = lastActiveIndex === -1 ? 0 : 11 - lastActiveIndex;
  const plotData = data.slice(0, plotEndIndex + 1);

  const linePoints = plotData.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');
  
  // Area points: Start at (0, height), follow line, then drop from LAST ACTIVE point to X-axis
  const lastX = getX(plotEndIndex);
  const areaPoints = `0,${chartHeight} ${linePoints} ${lastX},${chartHeight}`;

  // 3. Plotting logic for Previous FY (usually full 12 months)
  const prevLinePoints = prevData && prevData.length > 0 
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
              <View style={styles.yAxis}>
                {yAxisTicks.map((tick, i) => (
                  <Text key={i} style={styles.axisLabel}>
                    {tick >= 100000 ? `${(tick / 100000).toFixed(1)}L` : tick >= 1000 ? `${(tick / 1000).toFixed(0)}K` : tick.toFixed(0)}
                  </Text>
                ))}
              </View>

              <View style={styles.mainChartArea}>
                <Svg width={chartWidth} height={chartHeight} style={{ overflow: 'visible' }}>
                  <Defs>
                    <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                      <Stop offset="100%" stopColor="#2563eb" stopOpacity="0.01" />
                    </LinearGradient>
                  </Defs>

                  {yAxisTicks.map((tick, i) => (
                    <Line key={i} x1="0" y1={getY(tick)} x2={chartWidth} y2={getY(tick)} stroke="#f1f5f9" strokeWidth="1" />
                  ))}

                  {prevLinePoints && (
                    <Polyline points={prevLinePoints} fill="none" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5,5" />
                  )}

                  {plotData.length > 1 && (
                    <Polyline points={areaPoints} fill="url(#gradient)" stroke="none" />
                  )}

                  <Polyline points={linePoints} fill="none" stroke="#2563eb" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />

                  {plotData.map((d, i) => (
                    <Circle key={i} cx={getX(i)} cy={getY(d.value)} r="4" fill="#ffffff" stroke="#2563eb" strokeWidth="2" />
                  ))}
                </Svg>
              </View>
            </View>

            <View style={styles.xAxis}>
              {data.map((d, i) => (
                <Text key={i} style={styles.xLabel} numberOfLines={1}>{d.label.substring(0, 3)}</Text>
              ))}
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
            <View style={styles.statsRow}>
              {data.filter(d => d.value > 0 || (prevData && prevData[data.indexOf(d)]?.value > 0)).map((d, i) => {
                const idx = data.indexOf(d);
                return (
                  <View key={idx} style={styles.statItem}>
                    <Text style={styles.statLabel}>{d.label}</Text>
                    <Text style={styles.statValue}>{formatCurrency(d.value, 'INR')}</Text>
                    {prevData && prevData[idx] && (
                      <Text style={styles.prevStatValue}>LY: {formatCurrency(prevData[idx].value, 'INR')}</Text>
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
