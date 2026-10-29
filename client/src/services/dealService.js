import api from "./api";

export const getDeals = (params = {}) => api.get("/deals", { params });

export const getDealById = (id) => api.get(`/deals/${id}`);

export const createDeal = (dealData) => api.post("/deals", dealData);

export const updateDeal = (id, dealData) =>
  api.patch(`/deals/${id}`, dealData);

export const deleteDeal = (id) => api.delete(`/deals/${id}`);