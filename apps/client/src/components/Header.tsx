import React from "react";

interface HeaderProps {
  currentView: string;
  selectedProject: string;
  activeDrawingFileName?: string;
  setCurrentView: (view: any) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  selectedProject,
  activeDrawingFileName,
  setCurrentView,
}) => {
  return (
    <header style={headerBarStyle}>
      <div style={breadcrumbStyle}>
        <span>BuildOps</span>
        <span style={{margin: "0 8px", color: "var(--text-tertiary)"}}>/</span>
        <span 
          style={{cursor: "pointer", color: "var(--primary-navy)"}}
          onClick={() => setCurrentView("projects")}
        >
          Projects
        </span>
        {currentView !== "projects" && (
          <>
            <span style={{margin: "0 8px", color: "var(--text-tertiary)"}}>/</span>
            <span 
              style={{cursor: "pointer", fontWeight: 600}}
              onClick={() => setCurrentView("overview")}
            >
              {selectedProject}
            </span>
          </>
        )}
        {currentView === "findings" && activeDrawingFileName && (
          <>
            <span style={{margin: "0 8px", color: "var(--text-tertiary)"}}>/</span>
            <span style={{color: "var(--text-secondary)"}}>{activeDrawingFileName}</span>
          </>
        )}
      </div>
      
      <div className="flex align-center" style={{gap: 12}}>
        <span className="badge badge-complete" style={{fontSize: 10}}>Status: Operational</span>
        <div style={serverBadgeStyle}>Server: Online</div>
      </div>
    </header>
  );
};

const headerBarStyle: React.CSSProperties = {
  height: 54,
  backgroundColor: "var(--surface)",
  borderBottom: "1px solid var(--border)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 24px",
};

const breadcrumbStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--text-secondary)",
  display: "flex",
  alignItems: "center",
};

const serverBadgeStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--success-green)",
  fontWeight: 600,
};
