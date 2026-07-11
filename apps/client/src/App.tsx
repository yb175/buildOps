import { useState, useEffect } from "react";
import { Button } from "@buildops/ui";
import type { HealthResponse } from "@buildops/shared";

interface SystemLog {
  id: number;
  message: string;
  createdAt: string;
}

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [newLogMessage, setNewLogMessage] = useState("");
  const [submittingLog, setSubmittingLog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const fetchHealth = async () => {
    setLoadingHealth(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/status`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      console.error("Health check fetch failed:", err);
      setHealth(null);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingHealth(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/entries`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error("Failed to fetch system logs:", err);
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogMessage.trim()) return;
    setSubmittingLog(true);
    try {
      const res = await fetch(`${API_URL}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newLogMessage }),
      });
      if (res.ok) {
        setNewLogMessage("");
        await fetchLogs();
      }
    } catch (err) {
      console.error("Failed to add log:", err);
    } finally {
      setSubmittingLog(false);
    }
  };

  useEffect(() => {
    // Fetch initial data asynchronously to avoid cascading renders
    const initTimer = setTimeout(() => {
      fetchHealth();
      fetchLogs();
    }, 0);

    const interval = setInterval(() => {
      fetchHealth();
      fetchLogs();
    }, 10000);

    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div style={logoContainerStyle}>
          <div style={logoBadgeStyle}>BO</div>
          <h1 style={titleStyle}>BuildOps Monorepo</h1>
        </div>
        <div style={badgeStyle}>Environment: Development</div>
      </header>

      <main style={gridStyle}>
        {/* Status Card */}
        <section style={cardStyle}>
          <h2 style={cardTitleStyle}>System Health Status</h2>
          <p style={cardDescStyle}>
            Live connectivity check between Client, Express Server, and PostgreSQL Database.
          </p>

          <div style={statusListStyle}>
            <div style={statusItemStyle}>
              <span>Client Status</span>
              <span style={{ ...indicatorStyle, ...indicatorActiveStyle }}>Active</span>
            </div>

            <div style={statusItemStyle}>
              <span>Express Server</span>
              {loadingHealth ? (
                <span style={indicatorPendingStyle}>Checking...</span>
              ) : health?.status === "ok" ? (
                <span style={{ ...indicatorStyle, ...indicatorActiveStyle }}>Online</span>
              ) : (
                <span style={{ ...indicatorStyle, ...indicatorErrorStyle }}>Offline</span>
              )}
            </div>

            <div style={statusItemStyle}>
              <span>PostgreSQL Database</span>
              {loadingHealth ? (
                <span style={indicatorPendingStyle}>Checking...</span>
              ) : health?.database === "connected" ? (
                <span style={{ ...indicatorStyle, ...indicatorActiveStyle }}>Connected</span>
              ) : (
                <span style={{ ...indicatorStyle, ...indicatorErrorStyle }}>Disconnected</span>
              )}
            </div>
          </div>

          {health && (
            <div style={detailsBoxStyle}>
              <div style={detailRowStyle}>
                <strong>Server Uptime:</strong> <span>{Math.round(health.uptime)}s</span>
              </div>
              <div style={detailRowStyle}>
                <strong>Checked At:</strong>{" "}
                <span>{new Date(health.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          )}

          {error && <div style={errorBoxStyle}>⚠️ Connection Error: {error}</div>}

          <div style={{ marginTop: "1.5rem" }}>
            <Button onClick={fetchHealth} disabled={loadingHealth}>
              {loadingHealth ? "Refreshing..." : "Trigger Manual Health Check"}
            </Button>
          </div>
        </section>

        {/* Database Logs Card (E2E verification) */}
        <section style={cardStyle}>
          <h2 style={cardTitleStyle}>Database E2E Check</h2>
          <p style={cardDescStyle}>
            Insert records directly into PostgreSQL to verify read/write database functionality.
          </p>

          <form onSubmit={handleAddLog} style={formStyle}>
            <input
              type="text"
              value={newLogMessage}
              onChange={(e) => setNewLogMessage(e.target.value)}
              placeholder="Enter a test log message..."
              style={inputStyle}
              disabled={submittingLog}
            />
            <Button
              variant="secondary"
              type="submit"
              disabled={submittingLog || !newLogMessage.trim()}
            >
              {submittingLog ? "Saving..." : "Write to DB"}
            </Button>
          </form>

          <h3 style={sectionSubtitleStyle}>Recent Database Entries</h3>
          <div style={logsContainerStyle}>
            {logs.length === 0 ? (
              <p style={emptyLogsStyle}>No logs created yet. Try inserting one above!</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} style={logItemStyle}>
                  <span style={logMessageStyle}>{log.message}</span>
                  <span style={logTimeStyle}>{new Date(log.createdAt).toLocaleTimeString()}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <footer style={footerStyle}>
        <p>
          BuildOps Monorepo Developer Dashboard • React 19 • Express 4 • Prisma 5 • Docker
          PostgreSQL
        </p>
      </footer>
    </div>
  );
}

// Inline CSS for premium styling (independent of global CSS changes)
const containerStyle: React.CSSProperties = {
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  backgroundColor: "#0b0f19",
  color: "#f8fafc",
  minHeight: "100vh",
  padding: "2rem",
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottom: "1px solid #1e293b",
  paddingBottom: "1.5rem",
  marginBottom: "2rem",
};

const logoContainerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "1rem",
};

const logoBadgeStyle: React.CSSProperties = {
  backgroundColor: "#4f46e5",
  color: "#ffffff",
  fontWeight: "bold",
  fontSize: "1.2rem",
  padding: "0.5rem 0.8rem",
  borderRadius: "8px",
  letterSpacing: "1px",
};

const titleStyle: React.CSSProperties = {
  fontSize: "1.8rem",
  fontWeight: 700,
  margin: 0,
  color: "#ffffff",
};

const badgeStyle: React.CSSProperties = {
  backgroundColor: "#1e293b",
  color: "#94a3b8",
  padding: "0.4rem 0.8rem",
  borderRadius: "9999px",
  fontSize: "0.85rem",
  fontWeight: 500,
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
  gap: "2rem",
  flexGrow: 1,
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#111827",
  border: "1px solid #1e293b",
  borderRadius: "12px",
  padding: "2rem",
  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
  display: "flex",
  flexDirection: "column",
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: "1.3rem",
  fontWeight: 600,
  margin: "0 0 0.5rem 0",
  color: "#ffffff",
};

const cardDescStyle: React.CSSProperties = {
  fontSize: "0.9rem",
  color: "#94a3b8",
  margin: "0 0 1.5rem 0",
  lineHeight: 1.5,
};

const statusListStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
  marginBottom: "1.5rem",
};

const statusItemStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0.85rem 1rem",
  backgroundColor: "#1f2937",
  borderRadius: "8px",
  fontSize: "0.95rem",
};

const indicatorStyle: React.CSSProperties = {
  fontWeight: 600,
  padding: "0.25rem 0.6rem",
  borderRadius: "6px",
  fontSize: "0.8rem",
  textTransform: "uppercase",
};

const indicatorActiveStyle: React.CSSProperties = {
  backgroundColor: "rgba(16, 185, 129, 0.15)",
  color: "#10b981",
};

const indicatorErrorStyle: React.CSSProperties = {
  backgroundColor: "rgba(239, 68, 68, 0.15)",
  color: "#ef4444",
};

const indicatorPendingStyle: React.CSSProperties = {
  color: "#eab308",
  fontSize: "0.9rem",
};

const detailsBoxStyle: React.CSSProperties = {
  backgroundColor: "#1f2937",
  border: "1px solid #374151",
  borderRadius: "8px",
  padding: "1rem",
  fontSize: "0.85rem",
  marginTop: "auto",
};

const detailRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "0.5rem",
};

const errorBoxStyle: React.CSSProperties = {
  backgroundColor: "rgba(239, 68, 68, 0.1)",
  border: "1px solid rgba(239, 68, 68, 0.3)",
  color: "#f87171",
  borderRadius: "8px",
  padding: "1rem",
  fontSize: "0.85rem",
  marginTop: "1rem",
};

const formStyle: React.CSSProperties = {
  display: "flex",
  gap: "0.5rem",
  marginBottom: "1.5rem",
};

const inputStyle: React.CSSProperties = {
  flexGrow: 1,
  backgroundColor: "#1f2937",
  border: "1px solid #374151",
  borderRadius: "8px",
  padding: "0.75rem 1rem",
  color: "#ffffff",
  fontSize: "0.95rem",
  outline: "none",
};

const sectionSubtitleStyle: React.CSSProperties = {
  fontSize: "1rem",
  fontWeight: 600,
  color: "#e2e8f0",
  margin: "0 0 0.75rem 0",
};

const logsContainerStyle: React.CSSProperties = {
  flexGrow: 1,
  backgroundColor: "#0b0f19",
  border: "1px solid #1e293b",
  borderRadius: "8px",
  padding: "1rem",
  overflowY: "auto",
  maxHeight: "220px",
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
};

const emptyLogsStyle: React.CSSProperties = {
  fontSize: "0.85rem",
  color: "#64748b",
  textAlign: "center",
  margin: "auto",
};

const logItemStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "0.5rem 0.75rem",
  backgroundColor: "#111827",
  borderRadius: "4px",
  fontSize: "0.85rem",
  borderLeft: "3px solid #4f46e5",
};

const logMessageStyle: React.CSSProperties = {
  color: "#e2e8f0",
};

const logTimeStyle: React.CSSProperties = {
  color: "#64748b",
  fontSize: "0.75rem",
};

const footerStyle: React.CSSProperties = {
  textAlign: "center",
  paddingTop: "2rem",
  borderTop: "1px solid #1e293b",
  marginTop: "2rem",
  color: "#64748b",
  fontSize: "0.8rem",
};

export default App;
