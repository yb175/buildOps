import React from "react";
import type { ProjectDetails, Drawing } from "../types";

interface ProjectOverviewProps {
  projectDetails: ProjectDetails;
  onUploadDrawingClick: () => void;
  onViewDrawingReview: (drawing: Drawing) => void;
}

export const ProjectOverview: React.FC<ProjectOverviewProps> = ({
  projectDetails,
  onUploadDrawingClick,
  onViewDrawingReview,
}) => {
  const totalIssues = projectDetails.drawings.reduce((sum, d) => sum + d.conflictsCount, 0);

  return (
    <div style={viewWrapperStyle}>
      <div className="flex justify-between align-center" style={{marginBottom: 20}}>
        <div>
          <h1 style={titleStyle}>{projectDetails.name}</h1>
          <p style={subtitleStyle}>Sharma Constructions • Sector 14, Gurugram</p>
        </div>
        <button className="btn btn-primary" onClick={onUploadDrawingClick}>
          + Upload Drawing
        </button>
      </div>

      {/* Metrics Row */}
      <div style={metricsGridStyle}>
        <div className="panel" style={metricCardStyle}>
          <div style={metricLabelStyle}>TOTAL DRAWINGS</div>
          <div style={metricValueStyle}>{projectDetails.drawings.length}</div>
        </div>
        <div className="panel" style={metricCardStyle}>
          <div style={metricLabelStyle}>TOTAL OPEN ISSUES</div>
          <div style={{...metricValueStyle, color: "var(--danger-red)"}}>{totalIssues}</div>
        </div>
        <div className="panel" style={metricCardStyle}>
          <div style={metricLabelStyle}>RFIS GENERATED</div>
          <div style={metricValueStyle}>{projectDetails.rfis.length}</div>
        </div>
        <div className="panel" style={metricCardStyle}>
          <div style={metricLabelStyle}>EST. MANUAL HOURS SAVED</div>
          <div style={{...metricValueStyle, color: "var(--success-green)"}}>
            {projectDetails.name === "500 Gaj Residence" ? "2.2h" : "0.5h"}
          </div>
        </div>
      </div>

      {/* Workflow Pipeline Panel */}
      <div className="panel" style={{marginBottom: 24}}>
        <div style={panelSectionTitleStyle}>DOCUMENT WORKFLOW WORKFLOW</div>
        <div className="flex align-center justify-between" style={pipelineTrackStyle}>
          <div className="flex align-center" style={{gap: 8}}>
            <span style={pipelineDoneIndicatorStyle}>✓</span>
            <span style={pipelineStepNameStyle}>Upload</span>
          </div>
          <div style={pipelineLineDoneStyle} />
          <div className="flex align-center" style={{gap: 8}}>
            <span style={pipelineDoneIndicatorStyle}>✓</span>
            <span style={pipelineStepNameStyle}>Extraction</span>
          </div>
          <div style={pipelineLineDoneStyle} />
          <div className="flex align-center" style={{gap: 8}}>
            <span style={pipelineDoneIndicatorStyle}>✓</span>
            <span style={pipelineStepNameStyle}>Validation</span>
          </div>
          <div style={pipelineLineDoneStyle} />
          <div className="flex align-center" style={{gap: 8}}>
            <span style={pipelineActiveIndicatorStyle}>●</span>
            <span style={{...pipelineStepNameStyle, color: "var(--blueprint-blue)", fontWeight: 600}}>Review</span>
          </div>
          <div style={pipelineLinePendingStyle} />
          <div className="flex align-center" style={{gap: 8}}>
            <span style={pipelinePendingIndicatorStyle}>○</span>
            <span style={pipelineStepNameStyle}>Construct Ready</span>
          </div>
        </div>
      </div>

      {/* Content split grid */}
      <div style={overviewGridStyle}>
        {/* Left Column: Drawings & RFIs */}
        <div style={{flex: 2, display: "flex", flexDirection: "column", gap: 24}}>
          
          {/* Drawings List */}
          <div className="panel" style={{padding: 0}}>
            <div style={panelHeaderStyle}>
              <div style={panelTitleStyle}>DRAWINGS</div>
            </div>
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeaderRowStyle}>
                  <th style={tableHeaderCellStyle}>Drawing No.</th>
                  <th style={tableHeaderCellStyle}>File Name</th>
                  <th style={tableHeaderCellStyle}>Discipline</th>
                  <th style={tableHeaderCellStyle}>Status</th>
                  <th style={tableHeaderCellStyle} className="text-right">Issues</th>
                  <th style={tableHeaderCellStyle}>Action</th>
                </tr>
              </thead>
              <tbody>
                {projectDetails.drawings.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{padding: 24, textAlign: "center", color: "var(--text-secondary)"}}>
                      No drawings uploaded yet.
                    </td>
                  </tr>
                ) : (
                  projectDetails.drawings.map(d => (
                    <tr key={d.id} style={tableBodyRowStyle}>
                      <td style={{...tableCellStyle, fontWeight: 600}} className="code-font">
                        {d.discipline === "ARCHITECTURAL" ? "A-101" : "S-101"}
                      </td>
                      <td style={tableCellStyle}>{d.fileName}</td>
                      <td style={tableCellStyle}>{d.discipline}</td>
                      <td style={tableCellStyle}>
                        <span className={`badge ${
                          d.status === "PARSED" ? "badge-complete" : d.status === "FAILED" ? "badge-high" : "badge-review"
                        }`}>
                          {d.status === "PARSED" ? "REVIEW COMPLETE" : d.status}
                        </span>
                      </td>
                      <td style={tableCellStyle} className="text-right font-semibold">
                        {d.conflictsCount}
                      </td>
                      <td style={tableCellStyle}>
                        <button 
                          className="btn btn-outline" 
                          style={{padding: "4px 8px", fontSize: 11}}
                          onClick={() => onViewDrawingReview(d)}
                        >
                          View Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* RFIs List */}
          <div className="panel" style={{padding: 0}}>
            <div style={panelHeaderStyle}>
              <div style={panelTitleStyle}>RFIS (REQUESTS FOR INFORMATION)</div>
            </div>
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeaderRowStyle}>
                  <th style={tableHeaderCellStyle}>RFI No</th>
                  <th style={tableHeaderCellStyle}>Subject</th>
                  <th style={tableHeaderCellStyle}>Raised By</th>
                  <th style={tableHeaderCellStyle}>Status</th>
                  <th style={tableHeaderCellStyle}>Created Date</th>
                </tr>
              </thead>
              <tbody>
                {projectDetails.rfis.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{padding: 24, textAlign: "center", color: "var(--text-secondary)"}}>
                      No RFIs generated yet. Run constructability review on drawings.
                    </td>
                  </tr>
                ) : (
                  projectDetails.rfis.map((r, index) => (
                    <tr key={r.id} style={tableBodyRowStyle}>
                      <td style={{...tableCellStyle, fontWeight: 600}} className="code-font">
                        RFI-{String(index + 1).padStart(3, '0')}
                      </td>
                      <td style={tableCellStyle}>{r.subject}</td>
                      <td style={tableCellStyle}>BuildOps (Auto)</td>
                      <td style={tableCellStyle}>
                        <span className={`badge ${
                          r.status === "SENT" ? "badge-complete" : r.status === "REVIEWED" ? "badge-review" : "badge-low"
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td style={tableCellStyle}>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

        {/* Right Column: Properties & Activity */}
        <div style={{flex: 1, display: "flex", flexDirection: "column", gap: 24}}>
          {/* Project Properties */}
          <div className="panel">
            <div style={panelSectionTitleStyle}>PROJECT PROPERTIES</div>
            <div style={propRowStyle}>
              <span style={propLabelStyle}>Site Address:</span>
              <span style={propValueStyle}>Sector 14, Gurugram</span>
            </div>
            <div style={propRowStyle}>
              <span style={propLabelStyle}>Client Name:</span>
              <span style={propValueStyle}>Sharma Constructions</span>
            </div>
            <div style={propRowStyle}>
              <span style={propLabelStyle}>Building Type:</span>
              <span style={propValueStyle}>Residential (G+2)</span>
            </div>
            <div style={propRowStyle}>
              <span style={propLabelStyle}>Total Area:</span>
              <span style={propValueStyle}>500 Sq Yards</span>
            </div>
            <div style={propRowStyle}>
              <span style={propLabelStyle}>Lead Engineer:</span>
              <span style={propValueStyle}>Vikram R.</span>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="panel">
            <div style={panelSectionTitleStyle}>RECENT ACTIVITY LOG</div>
            <div style={{display: "flex", flexDirection: "column", gap: 12}}>
              <div style={timelineItemStyle}>
                <span style={timelineDotStyle} />
                <div>
                  <div style={timelineTitleStyle}>Analysis pipeline completed</div>
                  <div style={timelineTimeStyle}>13:22 today • Drawing A-101</div>
                </div>
              </div>
              <div style={timelineItemStyle}>
                <span style={timelineDotStyle} />
                <div>
                  <div style={timelineTitleStyle}>Conflict engine resolved 1 issue</div>
                  <div style={timelineTimeStyle}>13:21 today • Vikram R.</div>
                </div>
              </div>
              <div style={timelineItemStyle}>
                <span style={timelineDotStyle} />
                <div>
                  <div style={timelineTitleStyle}>Drawing uploaded successfully</div>
                  <div style={timelineTimeStyle}>13:20 today • A-101_Ground_Floor_Plan.pdf</div>
                </div>
              </div>
              <div style={timelineItemStyle}>
                <span style={timelineDotStyle} />
                <div>
                  <div style={timelineTitleStyle}>Project initialized</div>
                  <div style={timelineTimeStyle}>Yesterday • System</div>
                </div>
              </div>
            </div>
          </div>
        </div>
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

const metricsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 16,
  marginBottom: 24,
};

const metricCardStyle: React.CSSProperties = {
  padding: 16,
  borderRadius: 4,
};

const metricLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: 4,
};

const metricValueStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  color: "var(--primary-navy)",
};

const panelSectionTitleStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: 16,
};

const pipelineTrackStyle: React.CSSProperties = {
  padding: "8px 16px",
};

const pipelineStepNameStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--text-secondary)",
};

const pipelineDoneIndicatorStyle: React.CSSProperties = {
  width: 20,
  height: 20,
  borderRadius: "50%",
  backgroundColor: "var(--success-green)",
  color: "#FFFFFF",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 11,
  fontWeight: "bold",
};

const pipelineActiveIndicatorStyle: React.CSSProperties = {
  width: 20,
  height: 20,
  borderRadius: "50%",
  backgroundColor: "var(--blueprint-blue)",
  color: "#FFFFFF",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 11,
  fontWeight: "bold",
};

const pipelinePendingIndicatorStyle: React.CSSProperties = {
  width: 20,
  height: 20,
  borderRadius: "50%",
  backgroundColor: "#E5E7EB",
  color: "var(--text-secondary)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 11,
  border: "1px solid var(--border)",
};

const pipelineLineDoneStyle: React.CSSProperties = {
  flex: 1,
  height: 2,
  backgroundColor: "var(--success-green)",
  margin: "0 8px",
};

const pipelineLinePendingStyle: React.CSSProperties = {
  flex: 1,
  height: 2,
  backgroundColor: "var(--border)",
  margin: "0 8px",
};

const overviewGridStyle: React.CSSProperties = {
  display: "flex",
  gap: 24,
};

const panelHeaderStyle: React.CSSProperties = {
  padding: "12px 16px",
  borderBottom: "1px solid var(--border)",
  backgroundColor: "#F9FAFB",
};

const panelTitleStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
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

const propRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "8px 0",
  borderBottom: "1px solid #F3F4F6",
  fontSize: 13,
};

const propLabelStyle: React.CSSProperties = {
  color: "var(--text-secondary)",
  fontWeight: 500,
};

const propValueStyle: React.CSSProperties = {
  color: "var(--text-primary)",
  fontWeight: 600,
};

const timelineItemStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "flex-start",
};

const timelineDotStyle: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: "50%",
  backgroundColor: "var(--border)",
  marginTop: 6,
};

const timelineTitleStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
};

const timelineTimeStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--text-secondary)",
};
