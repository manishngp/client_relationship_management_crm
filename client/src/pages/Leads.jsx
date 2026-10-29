import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users,
  X,
  RefreshCw,
} from "lucide-react";

import {
  getLeads,
  createLead,
  updateLead,
  deleteLead,
} from "../services/leadService";

import { convertLeadToCustomer } from "../services/customerService";

import "./Leads.css";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  source: "Other",
  status: "New",
  notes: "",
};

const statuses = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal",
  "Won",
  "Lost",
];

const statusClass = (status) =>
  `status status-${status.toLowerCase()}`;

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const [convertingLeadId, setConvertingLeadId] = useState(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [form, setForm] = useState(initialForm);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getLeads({
        search,
        status: statusFilter || undefined,
        sortBy,
        order,
        page: pagination.page,
        limit: pagination.limit,
      });

      setLeads(data.leads || []);
      setPagination((previous) => ({
        ...previous,
        ...data.pagination,
      }));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load leads. Check your login and backend."
      );
    } finally {
      setLoading(false);
    }
  }, [
    search,
    statusFilter,
    sortBy,
    order,
    pagination.page,
    pagination.limit,
  ]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const handleSearch = (event) => {
    event.preventDefault();
    setPagination((previous) => ({ ...previous, page: 1 }));
    setSearch(searchInput.trim());
  };

  const openCreateModal = () => {
    setEditingLead(null);
    setForm(initialForm);
    setError("");
    setNotice("");
    setModalOpen(true);
  };

  const openEditModal = (lead) => {
    setEditingLead(lead);
    setForm({
      name: lead.name || "",
      email: lead.email || "",
      phone: lead.phone || "",
      company: lead.company || "",
      source: lead.source || "Other",
      status: lead.status || "New",
      notes: lead.notes || "",
    });
    setError("");
    setNotice("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingLead(null);
    setForm(initialForm);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        company: form.company.trim(),
        notes: form.notes.trim(),
      };

      if (editingLead) {
        await updateLead(editingLead._id, payload);
        setNotice("Lead updated successfully.");
      } else {
        await createLead(payload);
        setNotice("Lead created successfully.");
        setPagination((previous) => ({
          ...previous,
          page: 1,
        }));
      }

      setModalOpen(false);
      setEditingLead(null);
      setForm(initialForm);

      // Refresh the current list immediately.
      await loadLeads();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to save this lead."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (lead) => {
    const confirmed = window.confirm(
      `Delete the lead "${lead.name}"? This cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      await deleteLead(lead._id);
      setNotice("Lead deleted successfully.");

      const isLastItemOnPage = leads.length === 1 && pagination.page > 1;

      if (isLastItemOnPage) {
        setPagination((previous) => ({
          ...previous,
          page: previous.page - 1,
        }));
      } else {
        await loadLeads();
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to delete this lead."
      );
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setOrder((previous) => (previous === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setOrder("asc");
    }

    setPagination((previous) => ({ ...previous, page: 1 }));
  };

  const changePage = (nextPage) => {
    setPagination((previous) => ({
      ...previous,
      page: nextPage,
    }));
  };


  const handleConvertLead = async (lead) => {
  const confirmed = window.confirm(
    `Convert "${lead.name}" into a customer?`
  );

  if (!confirmed) return;

  setConvertingLeadId(lead._id);
  setError("");
  setNotice("");

  try {
    await convertLeadToCustomer(lead._id);
    setNotice(`${lead.name} was converted into a customer.`);
    await loadLeads();
  } catch (err) {
    setError(
      err.response?.data?.message ||
        "Unable to convert this lead."
    );
  } finally {
    setConvertingLeadId(null);
  }
};

  return (
    <main className="leads-page">
      <header className="leads-header">
        <div>
          <p className="eyebrow">CUSTOMER RELATIONSHIP MANAGEMENT</p>
          <h1>Leads</h1>
          <p className="leads-subtitle">
            Manage prospects and track your sales pipeline.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openCreateModal}
        >
          <Plus size={18} />
          Add lead
        </button>
      </header>

      <section className="leads-summary">
        <div className="summary-icon">
          <Users size={22} />
        </div>
        <div>
          <p>Total matching leads</p>
          <h2>{pagination.total}</h2>
        </div>
        <button
          type="button"
          className="icon-button refresh-button"
          onClick={loadLeads}
          title="Refresh leads"
          aria-label="Refresh leads"
        >
          <RefreshCw size={17} />
        </button>
      </section>

      {notice && (
        <div className="feedback success-feedback" role="status">
          {notice}
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="feedback error-feedback" role="alert">
          {error}
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <section className="leads-panel">
        <form className="leads-toolbar" onSubmit={handleSearch}>
          <div className="search-field">
            <Search size={18} />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search name, email, company..."
              aria-label="Search leads"
            />
          </div>

          <button type="submit" className="secondary-button">
            Search
          </button>

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPagination((previous) => ({
                ...previous,
                page: 1,
              }));
            }}
          >
            <option value="">All statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            aria-label="Rows per page"
            value={pagination.limit}
            onChange={(event) =>
              setPagination((previous) => ({
                ...previous,
                page: 1,
                limit: Number(event.target.value),
              }))
            }
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </form>

        <div className="table-wrapper">
          <table className="leads-table">
            <thead>
              <tr>
                <th>
                  <button
                    type="button"
                    className="sort-button"
                    onClick={() => handleSort("name")}
                  >
                    Lead {sortBy === "name" ? (order === "asc" ? "↑" : "↓") : ""}
                  </button>
                </th>
                <th>Contact</th>
                <th>Company</th>
                <th>Status</th>
                <th>Assigned to</th>
                <th>
                  <button
                    type="button"
                    className="sort-button"
                    onClick={() => handleSort("createdAt")}
                  >
                    Created {sortBy === "createdAt" ? (order === "asc" ? "↑" : "↓") : ""}
                  </button>
                </th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="table-message">
                    <RefreshCw className="spin-icon" size={20} />
                    Loading leads...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="7" className="table-message">
                    <Users size={24} />
                    <strong>No leads found</strong>
                    <span>Try changing your search or add a new lead.</span>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead._id}>
                    <td>
                      <div className="lead-name">{lead.name}</div>
                      <div className="muted-text">
                        {lead.source || "Other"}
                      </div>
                    </td>

                    <td>
                      <div>{lead.email || "—"}</div>
                      <div className="muted-text">
                        {lead.phone || "—"}
                      </div>
                    </td>

                    <td>{lead.company || "—"}</td>

                    <td>
                      <span className={statusClass(lead.status)}>
                        {lead.status}
                      </span>
                    </td>

                    <td>
                      {lead.assignedTo?.name || "Unassigned"}
                    </td>

                    <td>
                      {lead.createdAt
                        ? new Date(lead.createdAt).toLocaleDateString()
                        : "—"}
                    </td>

                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="icon-button"
                          title="Edit lead"
                          aria-label={`Edit ${lead.name}`}
                          onClick={() => openEditModal(lead)}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          className="icon-button delete-button"
                          title="Delete lead"
                          aria-label={`Delete ${lead.name}`}
                          onClick={() => handleDelete(lead)}
                        >
                          <Trash2 size={16} />
                        </button>

                        <button
  type="button"
  className="icon-button"
  title="Convert to customer"
  aria-label={`Convert ${lead.name} to customer`}
  disabled={Boolean(lead.convertedToCustomer) || convertingLeadId === lead._id}
  onClick={() => handleConvertLead(lead)}
>
  {convertingLeadId === lead._id
    ? <RefreshCw size={16} className="spin-icon" />
    : <Users size={16} />}
</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="leads-pagination">
          <span>
            {pagination.total === 0
              ? "No results"
              : `Showing ${
                  (pagination.page - 1) * pagination.limit + 1
                }–${Math.min(
                  pagination.page * pagination.limit,
                  pagination.total
                )} of ${pagination.total}`}
          </span>

          <div className="pagination-actions">
            <button
              type="button"
              className="icon-button"
              disabled={pagination.page <= 1 || loading}
              onClick={() => changePage(pagination.page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={18} />
            </button>

            <span>
              Page {pagination.page} of {Math.max(1, pagination.totalPages)}
            </span>

            <button
              type="button"
              className="icon-button"
              disabled={
                loading ||
                pagination.page >= pagination.totalPages ||
                pagination.totalPages === 0
              }
              onClick={() => changePage(pagination.page + 1)}
              aria-label="Next page"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </footer>
      </section>

      {modalOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            className="lead-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lead-modal-title"
          >
            <header className="modal-header">
              <div>
                <p className="eyebrow">LEAD MANAGEMENT</p>
                <h2 id="lead-modal-title">
                  {editingLead ? "Edit lead" : "Create a new lead"}
                </h2>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={closeModal}
                aria-label="Close form"
                disabled={saving}
              >
                <X size={20} />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="lead-form">
              <label>
                Full name *
                <input
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  required
                  maxLength={100}
                  placeholder="e.g. Rahul Sharma"
                />
              </label>

              <div className="form-grid">
                <label>
                  Email
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleFormChange}
                    maxLength={254}
                    placeholder="rahul@example.com"
                  />
                </label>

                <label>
                  Phone
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleFormChange}
                    maxLength={30}
                    placeholder="Phone number"
                  />
                </label>
              </div>

              <div className="form-grid">
                <label>
                  Company
                  <input
                    name="company"
                    value={form.company}
                    onChange={handleFormChange}
                    maxLength={150}
                    placeholder="Company name"
                  />
                </label>

                <label>
                  Source
                  <select
                    name="source"
                    value={form.source}
                    onChange={handleFormChange}
                  >
                    {[
                      "Other",
                      "Website",
                      "LinkedIn",
                      "Referral",
                      "Advertisement",
                      "Cold Call",
                      "Email",
                    ].map((source) => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                Status
                <select
                  name="status"
                  value={form.status}
                  onChange={handleFormChange}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Notes
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleFormChange}
                  rows={3}
                  maxLength={3000}
                  placeholder="Add notes about this prospect..."
                />
              </label>

              {error && (
                <div className="feedback error-feedback" role="alert">
                  {error}
                </div>
              )}

              <footer className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingLead
                      ? "Save changes"
                      : "Create lead"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}