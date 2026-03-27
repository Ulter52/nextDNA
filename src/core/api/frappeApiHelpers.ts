import apiClient from './client';

export const callMethod = async (method: string, params: any = {}) => {
  try {
    console.log(`[API Request] Method: ${method}`, params);
    const response = await apiClient.get(`/api/method/${method}`, { params });
    console.log(`[API Response] Method: ${method}`, response.data);
    return response.data.message;
  } catch (error) {
    console.warn(`[API Error] Method Failed: ${method}`, error);
    return null;
  }
};

export const runReport = async (reportName: string, filters: any = {}) => {
  return await callMethod('frappe.desk.query_report.run', {
    report_name: reportName,
    filters: JSON.stringify(filters)
  });
};

export const fetchResource = async (doctype: string, params: any = {}) => {
  try {
    console.log(`[API Request] Resource: ${doctype}`, params);
    const response = await apiClient.get(`/api/resource/${doctype}`, { params });
    console.log(`[API Response] Resource: ${doctype}`, response.data);
    return response.data;
  } catch (error) {
    console.warn(`[API Error] Resource Failed: ${doctype}`, error);
    return null;
  }
};

export const createResource = async (doctype: string, data: any) => {
  try {
    console.log(`[API Request] Create Resource: ${doctype}`, data);
    const response = await apiClient.post(`/api/resource/${doctype}`, data);
    console.log(`[API Response] Create Resource: ${doctype}`, response.data);
    return response.data;
  } catch (error) {
    console.warn(`[API Error] Create Resource Failed: ${doctype}`, error);
    throw error;
  }
};

export const updateResource = async (doctype: string, name: string, data: any) => {
  try {
    console.log(`[API Request] Update Resource: ${doctype}/${name}`, data);
    const response = await apiClient.put(`/api/resource/${doctype}/${name}`, data);
    console.log(`[API Response] Update Resource: ${doctype}/${name}`, response.data);
    return response.data;
  } catch (error) {
    console.warn(`[API Error] Update Resource Failed: ${doctype}/${name}`, error);
    throw error;
  }
};

export const frappeApi = {
  getCompanies: () => fetchResource('Company', {
    fields: '["name", "company_name", "abbr", "default_currency"]',
    limit_page_length: 50
  })
};
