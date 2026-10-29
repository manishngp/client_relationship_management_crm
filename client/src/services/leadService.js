import api from "./api";

export const getLeads = async (params = {}) => {
  const response = await api.get("/leads", { params });
  return response.data;
};

export const createLead = async (leadData) => {
  const response = await api.post("/leads", leadData);
  return response.data;
};

export const updateLead = async (id, leadData) => {
  const response = await api.patch(`/leads/${id}`, leadData);
  return response.data;
};

export const deleteLead = async (id) => {
  const response = await api.delete(`/leads/${id}`);
  return response.data;
};