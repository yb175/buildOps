import React from "react";
import type { Rfi } from "../types";

interface RfiListProps {
  rfis: Rfi[];
}

export const RfiList: React.FC<RfiListProps> = ({ rfis }) => {
  return (
    <div style={viewWrapperStyle}>
      <h1 style={titleStyle}>RFIS (REQUESTS FOR INFORMATION)</h1>
      <p style={subtitleStyle}>List of coordinate RFI drafts generated from drawings reviews</p>

      <div className="panel" style={{padding: 0, overflow: "hidden", marginTop: 20}}>
        <table style={tableStyle}>
          <thead>
            <tr style={tableHeaderRowStyle}>
              <th style={tableHeaderCellStyle}>RFI ID</th>
              <th style={tableHeaderCellStyle}>Subject</th>
              <th style={tableHeaderCellStyle}>Priority</th>
              <th style={tableHeaderCellStyle}>Discipline</th>
              <th style={tableHeaderCellStyle}>Question</th>
              <th style={tableHeaderCellStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rfis.length === 0 ? (
              <tr>
                <td colSpan={6} style={{padding: 24, textAlign: "center", color: "var(--text-secondary)"}}>
                  No RFIs generated yet. View a drawing and choose "Create RFI".
                </td>
              </tr>
            ) : (
              rfis.map((r, index) => (
                <tr key={r.id} style={tableBodyRowStyle}>
                  <td style={{...tableCellStyle, fontWeight: 600}} className="code-font">
                    RFI-{String(index + 1).padStart(3, '0')}
                  </td>
                  <td style={{...tableCellStyle, fontWeight: 600}}>{r.subject}</td>
                  <td style={tableCellStyle}>
                    <span className={`badge ${r.priority === "HIGH" ? "badge-high" : "badge-low"}`}>
                      {r.priority}
                    </span>
                  </td>
                  <td style={tableCellStyle}>{r.discipline}</td>
                  <td style={{...tableCellStyle, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
                    {r.question}
                  </td>
                  <td style={tableCellStyle}>
                    <span className={`badge ${r.status === "SENT" ? "badge-complete" : "badge-review"}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
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
