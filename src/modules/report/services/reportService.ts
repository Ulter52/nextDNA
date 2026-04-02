import apiClient, { BASE_URL } from '../../../core/api/client';
import { ReportStats } from '../types';
import { callMethod } from '../../../core/api/frappeApiHelpers';
import { Alert, Linking } from 'react-native';

export const reportService = {
  async getReportOverview(company: string): Promise<ReportStats> {
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const now = new Date();
    const firstDayCurrent = formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
    const today = formatDate(now);

    try {
      const [arRes, apRes, plRes, gpRes] = await Promise.all([
        apiClient.get('/api/method/frappe.desk.query_report.run', {
          params: {
            report_name: 'Accounts Receivable Summary',
            filters: JSON.stringify({ company })
          }
        }),
        apiClient.get('/api/method/frappe.desk.query_report.run', {
          params: {
            report_name: 'Accounts Payable Summary',
            filters: JSON.stringify({ company })
          }
        }),
        apiClient.get('/api/method/frappe.desk.query_report.run', {
          params: {
            report_name: 'Profit and Loss Statement',
            filters: JSON.stringify({ company, periodicity: 'Monthly', from_date: firstDayCurrent, to_date: today })
          }
        }),
        apiClient.get('/api/method/frappe.desk.query_report.run', {
          params: {
            report_name: 'Gross Profit',
            filters: JSON.stringify({ company, from_date: firstDayCurrent, to_date: today })
          }
        })
      ]);

      return {
        net_profit: 0, 
        total_expenses: 0,
        gross_profit: 0,
        receivables: [],
        payables: [],
        revenue_trend: []
      };
    } catch (error) {
      console.error('Report Service Error:', error);
      throw error;
    }
  },

  async runReport(reportName: string, filters: any) {
    return callMethod('frappe.desk.query_report.run', {
      report_name: reportName,
      filters: JSON.stringify(filters)
    });
  },

  /**
   * Generates a link to export the report as PDF.
   * Note: Browser will require a login session to avoid 417 errors.
   */
  getReportPDFUrl(reportName: string, filters: any): string {
    const cleanBaseUrl = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
    const params = [
      `report_name=${encodeURIComponent(reportName)}`,
      `filters=${encodeURIComponent(JSON.stringify(filters))}`,
      `format=PDF`,
      `include_indentation=0`
    ].join('&');

    return `${cleanBaseUrl}/api/method/frappe.desk.query_report.export_report?${params}`;
  },

  async exportReportPDF(reportName: string, filters: any) {
    const url = this.getReportPDFUrl(reportName, filters);
    console.log('[ReportService] Opening Export URL:', url);
    
    try {
      // Directly attempt to open the URL to avoid unreliable canOpenURL checks
      await Linking.openURL(url);
    } catch (error) {
      console.error('[ReportService] Failed to open URL:', error);
      Alert.alert("Export Error", "Could not open browser for PDF export.");
    }
  },

  /**
   * Uses @react-native-documents to fetch and download the PDF.
   * This allows sharing without session issues in the browser.
   */
  async downloadAndSharePDF(reportName: string, filters: any) {
    try {
      // 1. Fetch the PDF as a blob using our authenticated apiClient
      // Use query params for standard ERPNext report export
      const response = await apiClient.get('/api/method/frappe.desk.query_report.export_report', {
        params: {
          report_name: reportName,
          filters: JSON.stringify(filters),
          format: 'PDF',
          include_indentation: '0'
        },
        responseType: 'blob'
      });

      if (!response.data) {
        throw new Error('No data received from server');
      }

      // 2. Since we need to use @react-native-documents (picker/sharing), 
      // we convert the blob to base64.
      const reader = new FileReader();
      
      return new Promise((resolve, reject) => {
        reader.onloadend = async () => {
          try {
            const base64data = reader.result as string;
            const base64Content = base64data.split(',')[1];

            // Attempt to use the documents library
            try {
              const { share } = require('@react-native-documents/core');
              await share({
                fileName: `${reportName.replace(/\s+/g, '_')}.pdf`,
                base64: base64Content,
                mimeType: 'application/pdf'
              });
              resolve(true);
            } catch (e) {
              console.warn('Documents library share failed, falling back to basic sharing');
              const { Share: RNShare } = require('react-native');
              await RNShare.share({
                title: reportName,
                url: `data:application/pdf;base64,${base64Content}`
              });
              resolve(true);
            }
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read blob'));
        reader.readAsDataURL(response.data);
      });

    } catch (error) {
      console.error('PDF Download/Share Error:', error);
      Alert.alert("Error", "Failed to fetch PDF for sharing. Check your connection.");
    }
  }
};
