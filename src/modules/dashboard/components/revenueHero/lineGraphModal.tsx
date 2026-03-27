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
  const chartWidth = Dimensions.get('window').width - 100; // Account for Y-axis and padding
  const chartHeight = 220;
  
  if (!data || data.length === 0) return null;

  // Find max across both datasets for scaling
  const allValues = [...data.map(d => d.value), ...(prevData ? prevData.map(d => d.value) : [])];
  const maxVal = Math.max(...allValues, 1);
  const minVal = 0;
  
  const yAxisTicks = [maxVal, maxVal * 0.75, maxVal * 0.5, maxVal * 0.25, 0];

  const getX = (index: number, totalPoints: number) => (index / (totalPoints - 1)) * chartWidth;
  const getY = (value: number) => chartHeight - ((value - minVal) / (maxVal - minVal)) * chartHeight;

  // Current FY points
  const linePoints = data.map((d, i) => `${getX(i, data.length)},${getY(d.value)}`).join(' ');
  const areaPoints = `0,${chartHeight} ${linePoints} ${chartWidth},${chartHeight}`;

  // Previous FY points
  const prevLinePoints = prevData?.map((d, i) => `${getX(i, prevData.length)},${getY(d.value)}`).join(' ');

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
                    <View style={[styles.legendDot, { backgroundColor: '#94a3b8', borderStyle: 'dashed' }]} />
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
                    {tick >= 100000 ? `${(tick / 100000).toFixed(1)}L` : tick.toFixed(0)}
                  </Text>
                ))}
              </View>

              <View style={styles.mainChartArea}>
                <Svg width={chartWidth} height={chartHeight}>
                  <Defs>
                    <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
                      <Stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                    </LinearGradient>
                  </Defs>

                  {yAxisTicks.map((tick, i) => (
                    <Line
                      key={i}
                      x1="0"
                      y1={getY(tick)}
                      x2={chartWidth}
                      y2={getY(tick)}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Previous FY Line (Dashed) */}
                  {prevLinePoints && (
                    <Polyline
                      points={prevLinePoints}
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                  )}

                  {/* Current FY Area */}
                  <Polyline points={areaPoints} fill="url(#gradient)" />

                  {/* Current FY Line */}
                  <Polyline
                    points={linePoints}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Current FY Data Points */}
                  {data.map((d, i) => (
                    <Circle
                      key={i}
                      cx={getX(i, data.length)}
                      cy={getY(d.value)}
                      r="4"
                      fill="#ffffff"
                      stroke="#2563eb"
                      strokeWidth="2"
                    />
                  ))}
                </Svg>
              </View>
            </View>

            <View style={styles.xAxis}>
              {data.map((d, i) => (
                <Text key={i} style={styles.xLabel} numberOfLines={1}>
                  {d.label.substring(0, 3)}
                </Text>
              ))}
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
            <View style={styles.statsRow}>
              {data.map((d, i) => (
                <View key={i} style={styles.statItem}>
                  <Text style={styles.statLabel}>{d.label}</Text>
                  <Text style={styles.statValue}>{formatCurrency(d.value, 'INR')}</Text>
                  {prevData && prevData[i] && (
                    <Text style={styles.prevStatValue}>
                      LY: {formatCurrency(prevData[i].value, 'INR')}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
