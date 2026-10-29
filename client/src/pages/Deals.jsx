import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  DollarSign,
  CalendarDays,
  UserRound,
  ChevronDown,
} from "lucide-react";
import {
  getDeals,
  createDeal,
  updateDeal,
  deleteDeal,
} from "../services/dealService";
import { getCustomers } from "../services/customerService";
import "./Deals.css";

const STAGES = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Won",
  "Lost",
];

const EMPTY_FORM = {
  title: "",
  customer: "",
  value: "",
  stage: "New",
  probability: 10,
  expectedCloseDate: "",
};

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

export default function Deals() {
  const [deals, setDeals] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deletingId, setDeletingId] = useState(null);


async function loadData() {
  setLoading(true);
  setError("");

  try {
    // Fetch deals
    const dealResponse = await getDeals({ limit: 100 });

    const dealData = dealResponse.data;

    const dealsList = Array.isArray(dealData)
      ? dealData
      : dealData?.deals || dealData?.data || [];

    setDeals(dealsList);

    // Fetch customers separately
    try {
      const customerResponse = await getCustomers({ limit: 100 });

      // getCustomers() returns the response body directly
      const customerData = customerResponse;

      const customersList = Array.isArray(customerData)
        ? customerData
        : customerData?.customers ||
          customerData?.data ||
          [];

      setCustomers(
        Array.isArray(customersList) ? customersList : []
      );
    } catch (customerError) {
      console.error(
        "Customers API error:",
        customerError.response?.status,
        customerError.response?.data || customerError.message
      );

      setCustomers([]);
      setError(
        "Deals loaded, but customers could not be loaded. Check the Customers API."
      );
    }
  } catch (dealError) {
    console.error(
      "Deals API error:",
      dealError.response?.status,
      dealError.response?.data || dealError.message
    );

    setError(
      dealError.response?.data?.message ||
        "Unable to load deals. Please refresh and try again."
    );
  } finally {
    setLoading(false);
  }
}


  useEffect(() => {
    loadData();
  }, []);

  const filteredDeals = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return deals;

    return deals.filter((deal) => {
      const customer =
        typeof deal.customer === "object" && deal.customer
          ? `${deal.customer.name || ""} ${deal.customer.company || ""}`
          : "";

      return `${deal.title || ""} ${customer} ${deal.stage || ""}`
        .toLowerCase()
        .includes(query);
    });
  }, [deals, search]);

  const totalPipeline = filteredDeals
    .filter((deal) => !["Won", "Lost"].includes(deal.stage))
    .reduce((sum, deal) => sum + Number(deal.value || 0), 0);

  function openCreateModal() {
    setEditingDeal(null);
    setForm({
      ...EMPTY_FORM,
      customer: customers[0]?._id || "",
    });
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openEditModal(deal) {
    setEditingDeal(deal);

    setForm({
      title: deal.title || "",
      customer:
        typeof deal.customer === "object"
          ? deal.customer?._id || ""
          : deal.customer || "",
      value: deal.value ?? "",
      stage: deal.stage || "New",
      probability: deal.probability ?? 10,
      expectedCloseDate: deal.expectedCloseDate
        ? new Date(deal.expectedCloseDate).toISOString().slice(0, 10)
        : "",
    });

    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditingDeal(null);
  }

  function handleFormChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.customer) {
      setError("Please create or select a customer first.");
      return;
    }

    if (form.title.trim().length === 0 || Number(form.value) < 0) {
      setError("Enter a deal title and a valid deal value.");
      return;
    }

    setSaving(true);

    const payload = {
      title: form.title.trim(),
      customer: form.customer,
      value: Number(form.value),
      stage: form.stage,
      probability: Number(form.probability),
      expectedCloseDate: form.expectedCloseDate || null,
    };

    try {
      if (editingDeal) {
        await updateDeal(editingDeal._id, payload);
        setSuccess("Deal updated successfully.");
      } else {
        await createDeal(payload);
        setSuccess("Deal created successfully.");
      }

      setModalOpen(false);
      setEditingDeal(null);
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save deal. Please check the form and try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStageChange(deal, stage) {
    const previousStage = deal.stage;
    const previousDeals = deals;

    setDeals((current) =>
      current.map((item) =>
        item._id === deal._id ? { ...item, stage } : item
      )
    );

    setError("");
    setSuccess("");

    try {
      await updateDeal(deal._id, { stage });
      setSuccess(`Deal moved to ${stage}.`);
      await loadData();
    } catch (err) {
      setDeals(previousDeals.map((item) =>
        item._id === deal._id ? { ...item, stage: previousStage } : item
      ));
      setError(
        err.response?.data?.message || "Could not update the deal stage."
      );
    }
  }

  async function handleDelete(deal) {
    const confirmed = window.confirm(
      `Delete "${deal.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(deal._id);
    setError("");
    setSuccess("");

    try {
      await deleteDeal(deal._id);
      setDeals((current) =>
        current.filter((item) => item._id !== deal._id)
      );
      setSuccess("Deal deleted successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to delete this deal."
      );
    } finally {
      setDeletingId(null);
    }
  }

  function customerName(deal) {
    if (typeof deal.customer === "object" && deal.customer) {
      return deal.customer.company || deal.customer.name || "Customer";
    }
    return "Customer";
  }

  return (
    <main className="deals-page">
      <header className="deals-header">
        <div>
          <span className="deals-eyebrow">SALES MANAGEMENT</span>
          <h1>Deals Pipeline</h1>
          <p>Track opportunities and move deals toward success.</p>
        </div>

        <button className="deals-primary-btn" onClick={openCreateModal}>
          <Plus size={18} /> New Deal
        </button>
      </header>

      <section className="deals-summary">
        <div className="deals-summary-card">
          <span>Total deals</span>
          <strong>{filteredDeals.length}</strong>
        </div>
        <div className="deals-summary-card">
          <span>Open pipeline</span>
          <strong>{money(totalPipeline)}</strong>
        </div>
        <div className="deals-summary-card">
          <span>Won deals</span>
          <strong>
            {filteredDeals.filter((deal) => deal.stage === "Won").length}
          </strong>
        </div>
      </section>

      <section className="deals-toolbar">
        <div className="deals-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search deals, customers, or stages..."
          />
          {search && (
            <button
              type="button"
              className="deals-icon-btn"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button className="deals-secondary-btn" onClick={loadData}>
          <RefreshCw size={16} /> Refresh
        </button>
      </section>

      {error && !modalOpen && (
        <div className="deals-alert deals-alert-error">{error}</div>
      )}

      {success && !modalOpen && (
        <div className="deals-alert deals-alert-success">{success}</div>
      )}

      {loading ? (
        <div className="deals-loading">
          <RefreshCw className="deals-spin" size={24} />
          <span>Loading deals...</span>
        </div>
      ) : customers.length === 0 ? (
        <div className="deals-empty">
          <UserRound size={34} />
          <h3>No customers available</h3>
          <p>Create a customer before adding a deal.</p>
        </div>
      ) : (
        <section className="deals-board">
          {STAGES.map((stage) => {
            const stageDeals = filteredDeals.filter(
              (deal) => deal.stage === stage
            );

            const stageTotal = stageDeals.reduce(
              (sum, deal) => sum + Number(deal.value || 0),
              0
            );

            return (
              <div className="deals-column" key={stage}>
                <div className="deals-column-header">
                  <div>
                    <span className={`stage-dot stage-${stage.toLowerCase()}`} />
                    <h2>{stage}</h2>
                    <span className="deals-count">{stageDeals.length}</span>
                  </div>
                  <span className="deals-column-total">
                    {money(stageTotal)}
                  </span>
                </div>

                <div className="deals-column-content">
                  {stageDeals.length === 0 ? (
                    <div className="deals-column-empty">No deals here</div>
                  ) : (
                    stageDeals.map((deal) => (
                      <article className="deal-card" key={deal._id}>
                        <div className="deal-card-top">
                          <span className="deal-card-label">OPPORTUNITY</span>
                          <div className="deal-card-actions">
                            <button
                              type="button"
                              className="deals-icon-btn"
                              onClick={() => openEditModal(deal)}
                              title="Edit deal"
                              aria-label="Edit deal"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              className="deals-icon-btn deals-delete-btn"
                              onClick={() => handleDelete(deal)}
                              disabled={deletingId === deal._id}
                              title="Delete deal"
                              aria-label="Delete deal"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        <h3>{deal.title}</h3>
                        <p className="deal-customer">
                          <UserRound size={14} />
                          {customerName(deal)}
                        </p>

                        <div className="deal-value">
                          <DollarSign size={17} />
                          <strong>{money(deal.value)}</strong>
                        </div>

                        <div className="deal-probability">
                          <div className="deal-probability-label">
                            <span>Win probability</span>
                            <strong>{deal.probability ?? 0}%</strong>
                          </div>
                          <div className="deal-progress">
                            <span
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(0, Number(deal.probability) || 0)
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        {deal.expectedCloseDate && (
                          <p className="deal-date">
                            <CalendarDays size={14} />
                            {new Date(
                              deal.expectedCloseDate
                            ).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        )}

                        <label className="deal-stage-control">
                          <span>Move to</span>
                          <span className="deal-stage-select-wrap">
                            <select
                              value={deal.stage}
                              onChange={(event) =>
                                handleStageChange(deal, event.target.value)
                              }
                            >
                              {STAGES.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                            <ChevronDown size={14} />
                          </span>
                        </label>
                      </article>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {modalOpen && (
        <div className="deals-modal-overlay" onMouseDown={closeModal}>
          <section
            className="deals-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="deals-modal-header">
              <div>
                <span className="deals-eyebrow">SALES OPPORTUNITY</span>
                <h2>{editingDeal ? "Edit Deal" : "Create Deal"}</h2>
              </div>
              <button
                type="button"
                className="deals-icon-btn"
                onClick={closeModal}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </header>

            {error && (
              <div className="deals-alert deals-alert-error">{error}</div>
            )}

            <form className="deals-form" onSubmit={handleSubmit}>
              <label>
                Deal title *
                <input
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  placeholder="e.g. Website Development"
                  required
                  maxLength={150}
                />
              </label>

              <label>
                Customer *
                <select
                  name="customer"
                  value={form.customer}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">Select a customer</option>
                  {customers.map((customer) => (
                    <option key={customer._id} value={customer._id}>
                      {customer.company || customer.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="deals-form-grid">
                <label>
                  Deal value (₹) *
                  <input
                    name="value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.value}
                    onChange={handleFormChange}
                    placeholder="75000"
                    required
                  />
                </label>

                <label>
                  Probability (%)
                  <input
                    name="probability"
                    type="number"
                    min="0"
                    max="100"
                    value={form.probability}
                    onChange={handleFormChange}
                    required
                  />
                </label>
              </div>

              <div className="deals-form-grid">
                <label>
                  Stage
                  <select
                    name="stage"
                    value={form.stage}
                    onChange={handleFormChange}
                  >
                    {STAGES.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Expected close date
                  <input
                    name="expectedCloseDate"
                    type="date"
                    value={form.expectedCloseDate}
                    onChange={handleFormChange}
                  />
                </label>
              </div>

              <footer className="deals-form-actions">
                <button
                  type="button"
                  className="deals-secondary-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="deals-primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingDeal
                    ? "Save Changes"
                    : "Create Deal"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}