import React from "react";

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: any) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  return (
    <aside style={sidebarStyle}>
      <div style={sidebarHeaderStyle}>
        <div style={logoBadgeStyle}>BO</div>
        <span style={logoTextStyle}>BUILDOPS</span>
      </div>
      
      <nav style={navGroupStyle}>
        <button 
          style={{...navLinkStyle, ...(currentView === "projects" || currentView === "overview" ? navLinkActiveStyle : {})}}
          onClick={() => setCurrentView("projects")}
        >
          <svg style={navIconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Projects
        </button>
        
        <button 
          style={{...navLinkStyle, ...(currentView === "upload" ? navLinkActiveStyle : {})}}
          onClick={() => setCurrentView("upload")}
        >
          <svg style={navIconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload Drawing
        </button>
        
        <button 
          style={{...navLinkStyle, ...(currentView === "rfis" ? navLinkActiveStyle : {})}}
          onClick={() => setCurrentView("rfis")}
        >
          <svg style={navIconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          RFIs
        </button>
      </nav>

      <div style={sidebarFooterStyle}>
        <div style={userAvatarStyle}>BO</div>
        <div style={userInfoStyle}>
          <div style={{fontWeight: 600}}>Sharma Const.</div>
          <div style={{fontSize: 11, color: "var(--text-tertiary)"}}>Project Admin</div>
        </div>
      </div>
    </aside>
  );
};

const sidebarStyle: React.CSSProperties = {
  width: 240,
  backgroundColor: "var(--sidebar-bg)",
  color: "var(--sidebar-text)",
  display: "flex",
  flexDirection: "column",
  borderRight: "1px solid var(--border)",
  height: "100vh",
};

const sidebarHeaderStyle: React.CSSProperties = {
  padding: "20px 16px",
  display: "flex",
  alignItems: "center",
  gap: 10,
  borderBottom: "1px solid #2D3748",
};

const logoBadgeStyle: React.CSSProperties = {
  backgroundColor: "var(--blueprint-blue)",
  color: "#FFFFFF",
  fontWeight: "bold",
  fontSize: 14,
  padding: "4px 8px",
  borderRadius: 2,
};

const logoTextStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 15,
  letterSpacing: "0.08em",
  color: "#FFFFFF",
};

const navGroupStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  padding: "16px 8px",
  flex: 1,
};

const navLinkStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "10px 12px",
  fontSize: 13,
  fontWeight: 500,
  color: "var(--sidebar-text)",
  backgroundColor: "transparent",
  border: 0,
  borderRadius: 4,
  cursor: "pointer",
  textAlign: "left",
  width: "100%",
  transition: "all 0.15s ease",
};

const navLinkActiveStyle: React.CSSProperties = {
  backgroundColor: "rgba(37, 99, 235, 0.15)",
  color: "#FFFFFF",
  borderLeft: "3px solid var(--blueprint-blue)",
  borderRadius: "0 4px 4px 0",
};

const navIconStyle: React.CSSProperties = {
  width: 16,
  height: 16,
};

const sidebarFooterStyle: React.CSSProperties = {
  padding: "16px",
  borderTop: "1px solid #2D3748",
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const userAvatarStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: "50%",
  backgroundColor: "var(--primary-navy)",
  color: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 600,
  fontSize: 12,
};

const userInfoStyle: React.CSSProperties = {
  fontSize: 12,
  display: "flex",
  flexDirection: "column",
  color: "#FFFFFF",
};
