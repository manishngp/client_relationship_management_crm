
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChartNoAxesCombined,
  Users,
  Handshake,
  CalendarCheck,
} from "lucide-react";

import "./Home.css";

const features = [
  {
    icon: Users,
    title: "Lead management",
    description:
      "Organize prospects, track lead status, and manage your sales pipeline.",
  },
  {
    icon: Handshake,
    title: "Customer and deal tracking",
    description:
      "Keep customer records and deal stages connected in one workspace.",
  },
  {
    icon: CalendarCheck,
    title: "Activities and follow-ups",
    description:
      "Track upcoming calls, meetings, due dates, and completed activities.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Sales overview",
    description:
      "See key metrics and recent sales activity from your dashboard.",
  },
];

export default function Home() {
  return (
    <main className="home-page">
      <header className="home-navbar">
        <Link to="/" className="home-brand">
          <span className="home-brand-mark">M</span>
          <span>MiniCRM</span>
        </Link>

        <nav className="home-nav-actions">
          <Link to="/login" className="home-login-link">
            Log in
          </Link>
          <Link to="/login" className="home-primary-button">
            Open workspace <ArrowRight size={15} />
          </Link>
        </nav>
      </header>

      <section className="home-hero">
        <div className="home-hero-copy">
          <span className="home-overline">
            CUSTOMER RELATIONSHIP MANAGEMENT
          </span>

          <h1>
            Keep your sales process
            <br />
            <span>organized and moving.</span>
          </h1>

          <p>
            Manage leads, customers, deals, and follow-ups in one
            straightforward workspace built for your sales team.
          </p>

          <div className="home-hero-actions">
            <Link to="/login" className="home-primary-button">
              Go to MiniCRM <ArrowRight size={16} />
            </Link>
            <a href="#features" className="home-secondary-button">
              Explore features
            </a>
          </div>

          <div className="home-hero-footnote">
            One workspace. A clearer view of your sales.
          </div>
        </div>

        <div className="home-preview">
          <div className="home-preview-header">
            <div>
              <span className="home-preview-caption">WORKSPACE</span>
              <h2>Sales overview</h2>
            </div>
            <span className="home-preview-indicator">
              <span /> Live workspace
            </span>
          </div>

          <div className="home-preview-stats">
            <div>
              <span>Total leads</span>
              <strong>01</strong>
            </div>
            <div>
              <span>Customers</span>
              <strong>02</strong>
            </div>
            <div>
              <span>Open deals</span>
              <strong>03</strong>
            </div>
          </div>

          <div className="home-preview-table">
            <div className="home-preview-table-head">
              <span>OPPORTUNITY</span>
              <span>STATUS</span>
            </div>
            <div className="home-preview-row">
              <div>
                <strong>Website redesign</strong>
                <span>Example customer</span>
              </div>
              <span className="home-preview-tag">Proposal</span>
            </div>
            <div className="home-preview-row">
              <div>
                <strong>New business inquiry</strong>
                <span>Prospect follow-up</span>
              </div>
              <span className="home-preview-tag home-preview-tag-green">
                Qualified
              </span>
            </div>
            <div className="home-preview-row">
              <div>
                <strong>Renewal discussion</strong>
                <span>Customer meeting</span>
              </div>
              <span className="home-preview-tag home-preview-tag-amber">
                Pending
              </span>
            </div>
          </div>

          <p className="home-preview-note">
            Illustrative preview — your actual records appear after login.
          </p>
        </div>
      </section>

      <section className="home-features" id="features">
        <div className="home-section-heading">
          <span className="home-overline">ONE CONNECTED WORKSPACE</span>
          <h2>The essentials for managing customer relationships.</h2>
          <p>
            Keep everyday sales work connected without unnecessary
            complexity.
          </p>
        </div>

        <div className="home-feature-grid">
          {features.map(({ icon: Icon, title, description }) => (
            <article className="home-feature" key={title}>
              <div className="home-feature-icon">
                <Icon size={19} />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="home-footer">
        <Link to="/" className="home-footer-brand">
          MiniCRM
        </Link>
        <span>Sales and customer management in one place.</span>
        <Link to="/login">Sign in <ArrowRight size={13} /></Link>
      </footer>
    </main>
  );
}
