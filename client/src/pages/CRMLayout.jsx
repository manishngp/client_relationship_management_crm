
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ContactRound,
  Handshake,
  CalendarClock,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";

import "./CRMLayout.css";

const navigation = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Sales",
    items: [
      { label: "Leads", path: "/leads", icon: Users },
      { label: "Customers", path: "/customers", icon: ContactRound },
      { label: "Deals", path: "/deals", icon: Handshake },
      { label: "Activities", path: "/activities", icon: CalendarClock },
    ],
  },
];

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

export default function CRMLayout() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const user = getStoredUser();
  const displayName = user.name || user.fullName || "CRM User";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  }

  function navigateTo(path) {
    setMobileOpen(false);
    navigate(path);
  }

  return (
    <div
      className={`crm-shell ${collapsed ? "sidebar-collapsed" : ""} ${
        mobileOpen ? "mobile-sidebar-open" : ""
      }`}
    >
      {mobileOpen && (
        <button
          className="crm-mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className="crm-sidebar">
        <div className="crm-brand">
          <div className="crm-brand-mark">M</div>

          {!collapsed && (
            <div className="crm-brand-copy">
              <span className="crm-brand-name">MiniCRM</span>
              <span className="crm-brand-caption">Sales workspace</span>
            </div>
          )}

          <button
            className="crm-icon-button crm-mobile-close"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          >
            <X size={17} />
          </button>
        </div>

        <div className="crm-workspace-label">
          {!collapsed && "WORKSPACE"}
        </div>

        <nav className="crm-navigation" aria-label="Main navigation">
          {navigation.map((section) => (
            <div className="crm-nav-section" key={section.label}>
              {!collapsed && (
                <p className="crm-nav-heading">{section.label}</p>
              )}

              {section.items.map(({ label, path, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  title={collapsed ? label : undefined}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `crm-nav-link ${isActive ? "active" : ""}`
                  }
                >
                  <Icon size={17} strokeWidth={1.8} />
                  {!collapsed && <span>{label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="crm-sidebar-bottom">
          <div className="crm-account-card">
            <div className="crm-avatar">
              {initials || "U"}
            </div>

            {!collapsed && (
              <div className="crm-account-info">
                <span className="crm-account-name">{displayName}</span>
                <span className="crm-account-role">
                  {user.role || "Team member"}
                </span>
              </div>
            )}
          </div>

          <button
            className="crm-nav-link crm-logout"
            onClick={logout}
            title={collapsed ? "Log out" : undefined}
          >
            <LogOut size={17} strokeWidth={1.8} />
            {!collapsed && <span>Log out</span>}
          </button>

          <button
            className="crm-collapse-button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen size={17} />
            ) : (
              <PanelLeftClose size={17} />
            )}
            {!collapsed && <span>Collapse sidebar</span>}
          </button>
        </div>
      </aside>

      <div className="crm-main">
        <header className="crm-topbar">
          <div className="crm-topbar-left">
            <button
              className="crm-icon-button crm-mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={19} />
            </button>

            <span className="crm-topbar-context">
              MiniCRM <span>/</span> Workspace
            </span>
          </div>

          <div className="crm-topbar-right">
            <div className="crm-profile-wrapper">
              <button
                className="crm-profile-trigger"
                onClick={() => setProfileOpen((value) => !value)}
                aria-expanded={profileOpen}
              >
                <span className="crm-avatar crm-avatar-small">
                  {initials || "U"}
                </span>

                <span className="crm-profile-name">{displayName}</span>
                <ChevronDown size={14} />
              </button>

              {profileOpen && (
                <>
                  <button
                    className="crm-dropdown-dismiss"
                    aria-label="Close profile menu"
                    onClick={() => setProfileOpen(false)}
                  />

                  <div className="crm-profile-menu">
                    <div className="crm-profile-menu-info">
                      <strong>{displayName}</strong>
                      <span>{user.email || user.role || "MiniCRM account"}</span>
                    </div>

                    <button
                      className="crm-profile-logout"
                      onClick={logout}
                    >
                      <LogOut size={15} />
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="crm-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
