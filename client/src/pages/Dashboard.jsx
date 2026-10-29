
import { useEffect, useState } from "react";
import {
  Users,
  UserRound,
  BriefcaseBusiness,
  Trophy,
  IndianRupee,
  Clock,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { getDashboard } from "../services/dashboardService";
import "./Dashboard.css";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const response = await getDashboard();
      setData(response.data);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load dashboard. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-state">
        <RefreshCw className="dashboard-spinner" size={24} />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-state dashboard-error">
        <AlertCircle size={24} />
        <p>{error}</p>
        <button onClick={loadDashboard}>Try again</button>
      </div>
    );
  }

  if (!data) return null;

  const { summary, leadsByStatus, dealsByStage, recentLeads, recentDeals } =
    data;

  const cards = [
    {
      label: "Total Leads",
      value: summary.totalLeads,
      icon: Users,
      color: "green",
    },
    {
      label: "Customers",
      value: summary.totalCustomers,
      icon: UserRound,
      color: "blue",
    },
    {
      label: "Active Deals",
      value: summary.activeDeals,
      icon: BriefcaseBusiness,
      color: "purple",
    },
    {
      label: "Won Deals",
      value: summary.wonDeals,
      icon: Trophy,
      color: "orange",
    },
    {
      label: "Active Pipeline",
      value: currency(summary.activePipelineValue),
      icon: IndianRupee,
      color: "blue",
    },
    {
      label: "Won Deal Value",
      value: currency(summary.wonRevenue),
      icon: Trophy,
      color: "green",
    },
    {
      label: "Due Today",
      value: summary.pendingToday,
      icon: Clock,
      color: "orange",
    },
    {
      label: "Overdue Activities",
      value: summary.overdueActivities,
      icon: AlertCircle,
      color: "red",
    },
  ];

  const maxLeadCount = Math.max(
    1,
    ...leadsByStatus.map((item) => item.count)
  );

  const maxDealCount = Math.max(
    1,
    ...dealsByStage.map((item) => item.count)
  );

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">OVERVIEW</p>
          <h1>Dashboard</h1>
          <p className="dashboard-subtitle">
            Track your sales performance and daily activities.
          </p>
        </div>

        <button className="dashboard-refresh" onClick={loadDashboard}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </header>

      <section className="dashboard-stats">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <article className="dashboard-stat" key={label}>
            <div className={`dashboard-stat-icon ${color}`}>
              <Icon size={21} />
            </div>

            <div className="dashboard-stat-content">
              <p>{label}</p>
              <h2>{value}</h2>
            </div>
          </article>
        ))}
      </section>

      <section className="dashboard-panels">
        <article className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h2>Leads by Status</h2>
              <p>Distribution of your leads</p>
            </div>
            <Users size={20} />
          </div>

          {leadsByStatus.length === 0 ? (
            <p className="dashboard-empty">No leads available yet.</p>
          ) : (
            <div className="dashboard-bars">
              {leadsByStatus.map((item) => (
                <div className="dashboard-bar-row" key={item._id}>
                  <div className="dashboard-bar-label">
                    <span>{item._id || "Unspecified"}</span>
                    <strong>{item.count}</strong>
                  </div>

                  <div className="dashboard-bar-track">
                    <div
                      className="dashboard-bar-fill lead-fill"
                      style={{
                        width: `${(item.count / maxLeadCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h2>Deals Pipeline</h2>
              <p>Deals grouped by stage</p>
            </div>
            <BriefcaseBusiness size={20} />
          </div>

          {dealsByStage.length === 0 ? (
            <p className="dashboard-empty">No deals available yet.</p>
          ) : (
            <div className="dashboard-bars">
              {dealsByStage.map((item) => (
                <div className="dashboard-bar-row" key={item._id}>
                  <div className="dashboard-bar-label">
                    <span>{item._id || "Unspecified"}</span>
                    <strong>{item.count}</strong>
                  </div>

                  <div className="dashboard-bar-track">
                    <div
                      className="dashboard-bar-fill deal-fill"
                      style={{
                        width: `${(item.count / maxDealCount) * 100}%`,
                      }}
                    />
                  </div>

                  <p className="dashboard-stage-value">
                    {currency(item.value)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="dashboard-panels">
        <article className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h2>Recent Leads</h2>
              <p>Your latest lead records</p>
            </div>
          </div>

          {recentLeads.length === 0 ? (
            <p className="dashboard-empty">No leads available yet.</p>
          ) : (
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Company</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.map((lead) => (
                    <tr key={lead._id}>
                      <td>{lead.name}</td>
                      <td>{lead.company || "—"}</td>
                      <td>
                        <span className="dashboard-status">
                          {lead.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h2>Recent Deals</h2>
              <p>Your latest sales opportunities</p>
            </div>
          </div>

          {recentDeals.length === 0 ? (
            <p className="dashboard-empty">No deals available yet.</p>
          ) : (
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Deal</th>
                    <th>Value</th>
                    <th>Stage</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDeals.map((deal) => (
                    <tr key={deal._id}>
                      <td>
                        <strong>{deal.title}</strong>
                        <span className="dashboard-secondary">
                          {deal.customer?.name || "No customer"}
                        </span>
                      </td>
                      <td>{currency(deal.value)}</td>
                      <td>
                        <span className="dashboard-status">
                          {deal.stage}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
