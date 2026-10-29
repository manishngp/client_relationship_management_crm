
import { useCallback, useEffect, useState } from "react";
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
  Building2,
  Mail,
  Phone,
  ArrowLeft,
} from "lucide-react";

import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../services/customerService";

import "./Customers.css";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  notes: "",
};

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getCustomers({
        search,
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        order,
      });

      setCustomers(data.customers || []);
      setPagination((previous) => ({
        ...previous,
        ...data.pagination,
      }));
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load customers."
      );
    } finally {
      setLoading(false);
    }
  }, [search, pagination.page, pagination.limit, sortBy, order]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleSearch = (event) => {
    event.preventDefault();
    setPagination((previous) => ({ ...previous, page: 1 }));
    setSearch(searchInput.trim());
  };

  const openCreate = () => {
    setEditingCustomer(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (customer) => {
    setEditingCustomer(customer);
    setForm({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      company: customer.company || "",
      notes: customer.notes || "",
    });
    setError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingCustomer(null);
    setForm(emptyForm);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        company: form.company.trim(),
        notes: form.notes.trim(),
      };

      if (editingCustomer) {
        await updateCustomer(editingCustomer._id, payload);
        setNotice("Customer updated successfully.");
      } else {
        await createCustomer(payload);
        setNotice("Customer created successfully.");
        setPagination((previous) => ({ ...previous, page: 1 }));
      }

      setModalOpen(false);
      setEditingCustomer(null);
      setForm(emptyForm);

      await loadCustomers();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to save customer."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (customer) => {
    const confirmed = window.confirm(
      `Delete customer "${customer.name}"?`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      await deleteCustomer(customer._id);
      setNotice("Customer deleted successfully.");

      if (selectedCustomer?._id === customer._id) {
        setSelectedCustomer(null);
      }

      if (customers.length === 1 && pagination.page > 1) {
        setPagination((previous) => ({
          ...previous,
          page: previous.page - 1,
        }));
      } else {
        await loadCustomers();
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to delete customer."
      );
    }
  };

  const openDetails = async (customer) => {
    setSelectedCustomer(customer);
    setDetailLoading(true);
    setError("");

    try {
      const data = await getCustomerById(customer._id);
      setSelectedCustomer(data.customer);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load customer details."
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSort = (field) => {
    const nextOrder =
      sortBy === field && order === "asc" ? "desc" : "asc";

    setSortBy(field);
    setOrder(nextOrder);
    setPagination((previous) => ({ ...previous, page: 1 }));
  };

  if (selectedCustomer) {
    return (
      <main className="customers-page">
        <button
          type="button"
          className="customer-back"
          onClick={() => setSelectedCustomer(null)}
        >
          <ArrowLeft size={17} />
          Back to customers
        </button>

        <section className="customer-detail-card">
          {detailLoading ? (
            <p>Loading customer details...</p>
          ) : (
            <>
              <div className="customer-detail-heading">
                <div className="customer-avatar large-avatar">
                  {selectedCustomer.name?.charAt(0).toUpperCase() || "C"}
                </div>

                <div className="customer-detail-title">
                  <p className="customer-eyebrow">CUSTOMER PROFILE</p>
                  <h1>{selectedCustomer.name}</h1>
                  <p>
                    {selectedCustomer.company || "Individual customer"}
                  </p>
                </div>

                <button
                  type="button"
                  className="customer-primary-button"
                  onClick={() => openEdit(selectedCustomer)}
                >
                  <Pencil size={16} />
                  Edit
                </button>
              </div>

              <div className="customer-detail-grid">
                <div className="customer-info-item">
                  <Mail size={19} />
                  <div>
                    <span>Email</span>
                    <strong>{selectedCustomer.email || "Not provided"}</strong>
                  </div>
                </div>

                <div className="customer-info-item">
                  <Phone size={19} />
                  <div>
                    <span>Phone</span>
                    <strong>{selectedCustomer.phone || "Not provided"}</strong>
                  </div>
                </div>

                <div className="customer-info-item">
                  <Building2 size={19} />
                  <div>
                    <span>Company</span>
                    <strong>{selectedCustomer.company || "Not provided"}</strong>
                  </div>
                </div>

                <div className="customer-info-item">
                  <Users size={19} />
                  <div>
                    <span>Assigned to</span>
                    <strong>
                      {selectedCustomer.assignedTo?.name || "Unassigned"}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="customer-notes">
                <h3>Notes</h3>
                <p>{selectedCustomer.notes || "No notes added yet."}</p>
              </div>

              <div className="customer-notes">
                <h3>Record information</h3>
                <p>
                  Created:{" "}
                  {selectedCustomer.createdAt
                    ? new Date(selectedCustomer.createdAt).toLocaleString()
                    : "—"}
                </p>
                {selectedCustomer.sourceLead && (
                  <p>Source lead: {String(
                    selectedCustomer.sourceLead._id ||
                    selectedCustomer.sourceLead
                  )}</p>
                )}
              </div>
            </>
          )}
        </section>

        {modalOpen && renderCustomerModal()}
      </main>
    );
  }

  function renderCustomerModal() {
    return (
      <div
        className="customer-modal-backdrop"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeModal();
        }}
      >
        <section
          className="customer-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="customer-modal-title"
        >
          <header className="customer-modal-header">
            <div>
              <p className="customer-eyebrow">CUSTOMER MANAGEMENT</p>
              <h2 id="customer-modal-title">
                {editingCustomer ? "Edit customer" : "Add customer"}
              </h2>
            </div>

            <button
              type="button"
              className="customer-icon-button"
              onClick={closeModal}
              disabled={saving}
              aria-label="Close form"
            >
              <X size={20} />
            </button>
          </header>

          <form className="customer-form" onSubmit={handleSubmit}>
            <label>
              Customer name *
              <input
                name="name"
                value={form.name}
                onChange={handleFormChange}
                required
                maxLength={100}
                placeholder="Full name"
              />
            </label>

            <div className="customer-form-grid">
              <label>
                Email
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleFormChange}
                  maxLength={254}
                  placeholder="name@example.com"
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
              Notes
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleFormChange}
                rows={4}
                maxLength={3000}
                placeholder="Customer details and notes..."
              />
            </label>

            {error && (
              <div className="customer-error" role="alert">{error}</div>
            )}

            <footer className="customer-modal-actions">
              <button
                type="button"
                className="customer-secondary-button"
                onClick={closeModal}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="customer-primary-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingCustomer
                    ? "Save changes"
                    : "Create customer"}
              </button>
            </footer>
          </form>
        </section>
      </div>
    );
  }

  return (
    <main className="customers-page">
      <header className="customers-header">
        <div>
          <p className="customer-eyebrow">CUSTOMER RELATIONSHIP MANAGEMENT</p>
          <h1>Customers</h1>
          <p>Manage your customer relationships in one place.</p>
        </div>

        <button
          type="button"
          className="customer-primary-button"
          onClick={openCreate}
        >
          <Plus size={18} />
          Add customer
        </button>
      </header>

      {notice && (
        <div className="customer-success" role="status">
          {notice}
          <button onClick={() => setNotice("")} aria-label="Dismiss message">
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="customer-error" role="alert">
          {error}
          <button onClick={() => setError("")} aria-label="Dismiss error">
            <X size={16} />
          </button>
        </div>
      )}

      <section className="customer-stat-card">
        <div className="customer-stat-icon"><Users size={23} /></div>
        <div>
          <span>Total customers</span>
          <strong>{pagination.total}</strong>
        </div>
        <button
          type="button"
          className="customer-icon-button customer-refresh"
          onClick={loadCustomers}
          aria-label="Refresh customers"
          title="Refresh"
        >
          <RefreshCw size={17} />
        </button>
      </section>

      <section className="customers-panel">
        <form
          className="customers-toolbar"
          onSubmit={handleSearch}
        >
          <div className="customer-search">
            <Search size={18} />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search name, email, company..."
              aria-label="Search customers"
            />
          </div>

          <button type="submit" className="customer-secondary-button">
            Search
          </button>

          <select
            value={pagination.limit}
            aria-label="Customers per page"
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

        <div className="customers-table-wrap">
          <table className="customers-table">
            <thead>
              <tr>
                <th>
                  <button
                    type="button"
                    className="customer-sort"
                    onClick={() => handleSort("name")}
                  >
                    Customer {sortBy === "name" ? (order === "asc" ? "↑" : "↓") : ""}
                  </button>
                </th>
                <th>Contact</th>
                <th>Company</th>
                <th>Assigned to</th>
                <th>
                  <button
                    type="button"
                    className="customer-sort"
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
                  <td colSpan="6" className="customer-table-message">
                    <RefreshCw size={20} className="customer-spin" />
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="customer-table-message">
                    <Users size={25} />
                    <strong>No customers found</strong>
                    <span>Try another search or add your first customer.</span>
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer._id}>
                    <td>
                      <div className="customer-name">
                        <div className="customer-avatar">
                          {customer.name?.charAt(0).toUpperCase() || "C"}
                        </div>
                        <strong>{customer.name}</strong>
                      </div>
                    </td>

                    <td>
                      <div>{customer.email || "—"}</div>
                      <span className="customer-muted">
                        {customer.phone || "—"}
                      </span>
                    </td>

                    <td>{customer.company || "—"}</td>

                    <td>{customer.assignedTo?.name || "Unassigned"}</td>

                    <td>
                      {customer.createdAt
                        ? new Date(customer.createdAt).toLocaleDateString()
                        : "—"}
                    </td>

                    <td>
                      <div className="customer-row-actions">
                        <button
                          type="button"
                          className="customer-icon-button"
                          onClick={() => openDetails(customer)}
                          aria-label={`View ${customer.name}`}
                          title="View customer"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          type="button"
                          className="customer-icon-button"
                          onClick={() => openEdit(customer)}
                          aria-label={`Edit ${customer.name}`}
                          title="Edit customer"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          className="customer-icon-button customer-delete"
                          onClick={() => handleDelete(customer)}
                          aria-label={`Delete ${customer.name}`}
                          title="Delete customer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="customers-pagination">
          <span>
            {pagination.total === 0
              ? "No results"
              : `Showing ${(pagination.page - 1) * pagination.limit + 1}–${Math.min(
                  pagination.page * pagination.limit,
                  pagination.total
                )} of ${pagination.total}`}
          </span>

          <div>
            <button
              type="button"
              className="customer-icon-button"
              disabled={loading || pagination.page <= 1}
              onClick={() =>
                setPagination((previous) => ({
                  ...previous,
                  page: previous.page - 1,
                }))
              }
              aria-label="Previous page"
            >
              <ChevronLeft size={18} />
            </button>

            <span>
              Page {pagination.page} of {Math.max(1, pagination.totalPages)}
            </span>

            <button
              type="button"
              className="customer-icon-button"
              disabled={
                loading ||
                pagination.totalPages === 0 ||
                pagination.page >= pagination.totalPages
              }
              onClick={() =>
                setPagination((previous) => ({
                  ...previous,
                  page: previous.page + 1,
                }))
              }
              aria-label="Next page"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </footer>
      </section>

      {modalOpen && renderCustomerModal()}
    </main>
  );
}
