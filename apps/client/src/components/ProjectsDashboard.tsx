import React from "react";
import type { Project } from "../types";

interface ProjectsDashboardProps {
  projects: Project[];
  onSelectProject: (projectName: string) => void;
  onNewProjectDrawing: () => void;
}

export const ProjectsDashboard: React.FC<ProjectsDashboardProps> = ({
  projects,
  onSelectProject,
  onNewProjectDrawing,
}) => {
  return (
    <div style={viewWrapperStyle}>
      <div className="flex justify-between align-center" style={{marginBottom: 20}}>
        <div>
          <h1 style={titleStyle}>PROJECTS</h1>
          <p style={subtitleStyle}>Active construction projects and drawing reviews</p>
        </div>
        <button 
          className="btn btn-secondary"
          onClick={onNewProjectDrawing}
        >
          + New Project Drawing
        </button>
      </div>

      <div className="panel" style={{padding: 0, overflow: "hidden"}}>
        <table style={tableStyle}>
          <thead>
            <tr style={tableHeaderRowStyle}>
              <th style={tableHeaderCellStyle}>Project Name</th>
              <th style={tableHeaderCellStyle}>Last Updated</th>
              <th style={tableHeaderCellStyle}>Status</th>
              <th style={tableHeaderCellStyle} className="text-right">Issues Detected</th>
              <th style={tableHeaderCellStyle} className="text-right">RFIs Created</th>
              <th style={tableHeaderCellStyle}>Manual Review Saved</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr 
                key={p.name} 
                style={tableBodyRowStyle}
                onClick={() => onSelectProject(p.name)}
              >
                <td style={{...tableCellStyle, fontWeight: 600, color: "var(--primary-navy)"}}>
                  📁 {p.name}
                </td>
                <td style={tableCellStyle}>
                  {new Date(p.lastUpdated).toLocaleDateString()} {new Date(p.lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </td>
                <td style={tableCellStyle}>
                  <span className={`badge ${
                    p.status === "HIGH PRIORITY" ? "badge-high" : p.status === "IN REVIEW" ? "badge-review" : "badge-complete"
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td style={tableCellStyle} className="text-right font-semibold">
                  {p.issuesCount}
                </td>
                <td style={tableCellStyle} className="text-right">
                  {p.rfiCount}
                </td>
                <td style={{...tableCellStyle, color: "var(--primary-navy)", fontWeight: 600}}>
                  ⏱️ {p.manualTimeSaved}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const viewWrapperStyle: React.CSSProperties = {
  padding: 24,
  flex: 1,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: "0.08em",
  color: "var(--primary-navy)",
  textTransform: "uppercase",
};

const subtitleStyle: React.CSSProperties = {
  margin: "4px 0 0 0",
  fontSize: 13,
  color: "var(--text-secondary)",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  textAlign: "left",
};

const tableHeaderRowStyle: React.CSSProperties = {
  backgroundColor: "#F9FAFB",
  borderBottom: "1px solid var(--border)",
};

const tableHeaderCellStyle: React.CSSProperties = {
  padding: "10px 16px",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  color: "var(--text-secondary)",
  letterSpacing: "0.05em",
};

const tableBodyRowStyle: React.CSSProperties = {
  borderBottom: "1px solid var(--border)",
  cursor: "pointer",
  transition: "background-color 0.15s ease",
};

const tableCellStyle: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: 13,
  color: "var(--text-primary)",
};
