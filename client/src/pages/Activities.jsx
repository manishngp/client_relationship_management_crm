
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  Phone,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  Users,
  Video,
  ListTodo,
  CircleCheck,
} from "lucide-react";
import {
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
} from "../services/activityService";
import { getLeads } from "../services/leadService";
import { getCustomers } from "../services/customerService";
import "./Activities.css";

const TYPES = ["Call", "Meeting", "Email", "Follow-up", "Demo", "Other"];
const STATUSES = ["Pending", "Completed"];

const EMPTY_FORM = {
  type: "Follow-up",
  title: "",
  description: "",
  lead: "",
  customer: "",
  dueDate: "",
  status: "Pending",
};

function getList(response, key) {
  const data = response?.data ?? response;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data)) return data.data;

  return [];
}

function toLocalInputDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 16);
}

function formatDate(value) {
  if (!value) return "No date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPersonName(person) {
  if (!person) return "";
  if (typeof person === "string") return "";
  return person.company || person.name || "";
}

function getActivityIcon(type) {
  const icons = {
    Call: Phone,
    Meeting: Users,
    Email: Mail,
    "Follow-up": Clock3,
    Demo: Video,
    Other: ListTodo,
  };

  return icons[type] || ListTodo;
}

export default function Activities() {
  const [activities, setActivities] = useState([]);
  const [leads, setLeads] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dueFilter, setDueFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deletingId, setDeletingId] = useState(null);

  async function loadActivities() {
    setLoading(true);
    setError("");

    try {
      const response = await getActivities({ limit: 100 });
      setActivities(getList(response, "activities"));
    } catch (err) {
      console.error(
        "Activities API error:",
        err.response?.status,
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
          "Unable to load activities. Please refresh."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadRelatedRecords() {
    const [leadResult, customerResult] = await Promise.allSettled([
      getLeads({ limit: 100 }),
      getCustomers({ limit: 100 }),
    ]);

    if (leadResult.status === "fulfilled") {
      setLeads(getList(leadResult.value, "leads"));
    } else {
      console.error("Leads API error:", leadResult.reason);
    }

    if (customerResult.status === "fulfilled") {
      setCustomers(getList(customerResult.value, "customers"));
    } else {
      console.error("Customers API error:", customerResult.reason);
    }
  }

  async function reloadPageData() {
    await Promise.all([loadActivities(), loadRelatedRecords()]);
  }

  useEffect(() => {
    reloadPageData();
  }, []);

  const filteredActivities = useMemo(() => {
    const query = search.trim().toLowerCase();

    return activities.filter((activity) => {
      const matchesSearch =
        !query ||
        [
          activity.title,
          activity.description,
          activity.type,
          getPersonName(activity.lead),
          getPersonName(activity.customer),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "All" || activity.status === statusFilter;

      const date = activity.dueDate ? new Date(activity.dueDate) : null;
      const validDate = date && !Number.isNaN(date.getTime());

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const matchesDue =
        dueFilter === "All" ||
        (validDate &&
          dueFilter === "Today" &&
          date >= today &&
          date < tomorrow) ||
        (validDate &&
          dueFilter === "Overdue" &&
          date < today &&
          activity.status === "Pending");

      return matchesSearch && matchesStatus && matchesDue;
    });
  }, [activities, search, statusFilter, dueFilter]);

  const pendingCount = activities.filter(
    (activity) => activity.status === "Pending"
  ).length;

  const completedCount = activities.filter(
    (activity) => activity.status === "Completed"
  ).length;

  const overdueCount = activities.filter((activity) => {
    if (activity.status !== "Pending" || !activity.dueDate) return false;
    const date = new Date(activity.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return !Number.isNaN(date.getTime()) && date < today;
  }).length;

  function openCreateModal() {
    setEditingActivity(null);
    setForm({
      ...EMPTY_FORM,
      dueDate: toLocalInputDate(new Date()),
    });
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openEditModal(activity) {
    setEditingActivity(activity);

    setForm({
      type: activity.type || "Follow-up",
      title: activity.title || "",
      description: activity.description || "",
      lead:
        typeof activity.lead === "object"
          ? activity.lead?._id || ""
          : activity.lead || "",
      customer:
        typeof activity.customer === "object"
          ? activity.customer?._id || ""
          : activity.customer || "",
      dueDate: toLocalInputDate(activity.dueDate),
      status: activity.status || "Pending",
    });

    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditingActivity(null);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => {
      if (name === "lead" && value) {
        return { ...previous, lead: value, customer: "" };
      }

      if (name === "customer" && value) {
        return { ...previous, customer: value, lead: "" };
      }

      return { ...previous, [name]: value };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.title.trim()) {
      setError("Activity title is required.");
      return;
    }

    if (!form.dueDate) {
      setError("Please select a due date.");
      return;
    }

    const payload = {
      type: form.type,
      title: form.title.trim(),
      description: form.description.trim(),
      lead: form.lead || null,
      customer: form.customer || null,
      dueDate: new Date(form.dueDate).toISOString(),
      status: form.status,
    };

    setSaving(true);

    try {
      if (editingActivity) {
        await updateActivity(editingActivity._id, payload);
        setSuccess("Activity updated successfully.");
      } else {
        await createActivity(payload);
        setSuccess("Activity created successfully.");
      }

      setModalOpen(false);
      setEditingActivity(null);
      await loadActivities();
    } catch (err) {
      console.error("Save activity error:", err.response?.data || err.message);

      setError(
        err.response?.data?.message ||
          "Unable to save activity. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(activity) {
    const newStatus =
      activity.status === "Completed" ? "Pending" : "Completed";

    setError("");
    setSuccess("");

    try {
      await updateActivity(activity._id, { status: newStatus });
      setActivities((current) =>
        current.map((item) =>
          item._id === activity._id
            ? { ...item, status: newStatus }
            : item
        )
      );

      setSuccess(`Activity marked ${newStatus.toLowerCase()}.`);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update activity status."
      );
    }
  }

  async function handleDelete(activity) {
    if (!window.confirm(`Delete "${activity.title}"?`)) return;

    setDeletingId(activity._id);
    setError("");
    setSuccess("");

    try {
      await deleteActivity(activity._id);

      setActivities((current) =>
        current.filter((item) => item._id !== activity._id)
      );

      setSuccess("Activity deleted successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to delete activity."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="activities-page">
      <header className="activities-header">
        <div>
          <span className="activities-eyebrow">WORK MANAGEMENT</span>
          <h1>Activities & Follow-ups</h1>
          <p>Keep every call, meeting, and customer follow-up on track.</p>
        </div>

        <button className="activities-primary-btn" onClick={openCreateModal}>
          <Plus size={18} /> New Activity
        </button>
      </header>

      <section className="activities-stats">
        <article className="activity-stat-card">
          <div className="activity-stat-icon pending-icon">
            <Clock3 size={20} />
          </div>
          <div>
            <span>Pending</span>
            <strong>{pendingCount}</strong>
          </div>
        </article>

        <article className="activity-stat-card">
          <div className="activity-stat-icon overdue-icon">
            <CalendarDays size={20} />
          </div>
          <div>
            <span>Overdue</span>
            <strong>{overdueCount}</strong>
          </div>
        </article>

        <article className="activity-stat-card">
          <div className="activity-stat-icon completed-icon">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span>Completed</span>
            <strong>{completedCount}</strong>
          </div>
        </article>
      </section>

      <section className="activities-toolbar">
        <div className="activities-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search activities or people..."
          />
          {search && (
            <button
              type="button"
              className="activity-icon-btn"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter by status"
        >
          <option value="All">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          value={dueFilter}
          onChange={(event) => setDueFilter(event.target.value)}
          aria-label="Filter by due date"
        >
          <option value="All">All dates</option>
          <option value="Today">Due today</option>
          <option value="Overdue">Overdue only</option>
        </select>

        <button
          className="activities-secondary-btn"
          onClick={reloadPageData}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </section>

      {error && !modalOpen && (
        <div className="activities-alert activities-alert-error">{error}</div>
      )}

      {success && !modalOpen && (
        <div className="activities-alert activities-alert-success">
          {success}
        </div>
      )}

      <section className="activities-list">
        <div className="activities-list-header">
          <h2>Activity schedule</h2>
          <span>{filteredActivities.length} activities</span>
        </div>

        {loading ? (
          <div className="activities-empty">
            <RefreshCw className="activities-spin" size={24} />
            <p>Loading activities...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="activities-empty">
            <ListTodo size={34} />
            <h3>No activities found</h3>
            <p>Create an activity or change your filters.</p>
          </div>
        ) : (
          <div className="activities-table-wrap">
            <table className="activities-table">
              <thead>
                <tr>
                  <th>Activity</th>
                  <th>Related to</th>
                  <th>Due date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredActivities.map((activity) => {
                  const TypeIcon = getActivityIcon(activity.type);
                  const related =
                    getPersonName(activity.lead) ||
                    getPersonName(activity.customer) ||
                    "General activity";

                  const isOverdue =
                    activity.status === "Pending" &&
                    activity.dueDate &&
                    new Date(activity.dueDate) < new Date();

                  return (
                    <tr key={activity._id}>
                      <td>
                        <div className="activity-title-cell">
                          <span className="activity-type-icon">
                            <TypeIcon size={18} />
                          </span>
                          <div>
                            <strong>{activity.title}</strong>
                            <span>{activity.type}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="activity-related">{related}</span>
                      </td>

                      <td>
                        <span
                          className={
                            isOverdue
                              ? "activity-due activity-due-overdue"
                              : "activity-due"
                          }
                        >
                          {formatDate(activity.dueDate)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`activity-status activity-status-${activity.status.toLowerCase()}`}
                        >
                          {activity.status}
                        </span>
                      </td>

                      <td>
                        <div className="activity-row-actions">
                          <button
                            type="button"
                            className="activity-icon-btn activity-complete-btn"
                            onClick={() => handleToggleStatus(activity)}
                            title={
                              activity.status === "Completed"
                                ? "Mark pending"
                                : "Mark completed"
                            }
                            aria-label="Toggle activity status"
                          >
                            <CircleCheck size={17} />
                          </button>

                          <button
                            type="button"
                            className="activity-icon-btn"
                            onClick={() => openEditModal(activity)}
                            title="Edit activity"
                            aria-label="Edit activity"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            className="activity-icon-btn activity-delete-btn"
                            onClick={() => handleDelete(activity)}
                            disabled={deletingId === activity._id}
                            title="Delete activity"
                            aria-label="Delete activity"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalOpen && (
        <div className="activities-modal-overlay" onMouseDown={closeModal}>
          <section
            className="activities-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="activities-modal-header">
              <div>
                <span className="activities-eyebrow">ACTIVITY DETAILS</span>
                <h2>{editingActivity ? "Edit Activity" : "New Activity"}</h2>
              </div>

              <button
                type="button"
                className="activity-icon-btn"
                onClick={closeModal}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </header>

            {error && (
              <div className="activities-alert activities-alert-error">
                {error}
              </div>
            )}

            <form className="activities-form" onSubmit={handleSubmit}>
              <div className="activities-form-grid">
                <label>
                  Activity type *
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    required
                  >
                    {TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Status
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                Title *
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Follow up on proposal"
                  maxLength={150}
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Add meeting notes or next steps..."
                  rows={3}
                />
              </label>

              <div className="activities-form-grid">
                <label>
                  Link to lead
                  <select
                    name="lead"
                    value={form.lead}
                    onChange={handleChange}
                  >
                    <option value="">No lead selected</option>
                    {leads.map((lead) => (
                      <option key={lead._id} value={lead._id}>
                        {lead.name}
                        {lead.company ? ` — ${lead.company}` : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Link to customer
                  <select
                    name="customer"
                    value={form.customer}
                    onChange={handleChange}
                  >
                    <option value="">No customer selected</option>
                    {customers.map((customer) => (
                      <option key={customer._id} value={customer._id}>
                        {customer.company || customer.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                Due date and time *
                <input
                  name="dueDate"
                  type="datetime-local"
                  value={form.dueDate}
                  onChange={handleChange}
                  required
                />
              </label>

              <footer className="activities-form-actions">
                <button
                  type="button"
                  className="activities-secondary-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="activities-primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingActivity
                    ? "Save Changes"
                    : "Create Activity"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
