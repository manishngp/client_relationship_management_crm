
import api from "./api";

export const getActivities = (params = {}) =>
  api.get("/activities", { params });

export const getActivityById = (id) =>
  api.get(`/activities/${id}`);

export const createActivity = (activityData) =>
  api.post("/activities", activityData);

export const updateActivity = (id, activityData) =>
  api.patch(`/activities/${id}`, activityData);

export const deleteActivity = (id) =>
  api.delete(`/activities/${id}`);
