import React from "react";
import type { Drawing, Conflict } from "../types";

interface FindingsReviewProps {
  activeDrawing: Drawing;
  conflicts: Conflict[];
  selectedConflictId: string | null;
  setSelectedConflictId: (id: string | null) => void;
  filterSeverity: "ALL" | "HIGH" | "MEDIUM" | "LOW";
  setFilterSeverity: (sev: "ALL" | "HIGH" | "MEDIUM" | "LOW") => void;
  onOpenRfiModal: (conflict: Conflict) => void;
  onResolveConflict: (id: string) => void;
  onApproveDrawing: () => void;
}

export const FindingsReview: React.FC<FindingsReviewProps> = ({
  activeDrawing,
  conflicts,
  selectedConflictId,
  setSelectedConflictId,
  filterSeverity,
  setFilterSeverity,
  onOpenRfiModal,
  onResolveConflict,
  onApproveDrawing,
}) => {
  const filteredConflicts = conflicts.filter(c => {
    if (filterSeverity === "ALL") return true;
    return c.severity === filterSeverity;
  });

  const activeConflict = conflicts.find(c => c.id === selectedConflictId);

  return (
    <div style={{...viewWrapperStyle, display: "flex", flexDirection: "column", height: "calc(100vh - 54px)", padding: 0}}>
      
      {/* Top Review Info bar */}
      <div style={triageHeaderStyle}>
        <div className="flex align-center" style={{gap: 16}}>
          <span className="badge badge-complete">✓ REVIEW COMPLETE</span>
          <span style={{fontWeight: 600, fontSize: 15}}>{activeDrawing.fileName}</span>
          <span style={{color: "var(--text-tertiary)", fontSize: 12}}>|</span>
          <span style={{fontSize: 13}}>{filteredConflicts.length} Findings displayed</span>
        </div>
        <div className="flex align-center" style={{gap: 12}}>
          <span style={{fontSize: 12, color: "var(--text-secondary)"}}>
            Estimated Review Time Saved: <strong style={{color: "var(--primary-navy)"}}>{activeDrawing.projectName === "500 Gaj Residence" ? "2h 14m" : "0h 32m"}</strong>
          </span>
          <button className="btn btn-success" style={{padding: "6px 12px", fontSize: 12}} onClick={onApproveDrawing}>
            Approve for Construction
          </button>
        </div>
      </div>

      {/* Split 3 Columns container */}
      <div style={splitColumnsContainerStyle}>
        
        {/* Column 1: Jira-style Triage List */}
        <div style={triageListColumnStyle}>
          <div style={sidebarSectionHeaderStyle}>FINDINGS</div>
          
          <div style={filterTabsStyle}>
            <button style={{...filterTabStyle, ...(filterSeverity === "ALL" ? filterTabActiveStyle : {})}} onClick={() => setFilterSeverity("ALL")}>
              ALL ({conflicts.length})
            </button>
            <button style={{...filterTabStyle, ...(filterSeverity === "HIGH" ? filterTabActiveStyle : {})}} onClick={() => setFilterSeverity("HIGH")}>
              HIGH ({conflicts.filter(c => c.severity === "HIGH").length})
            </button>
            <button style={{...filterTabStyle, ...(filterSeverity === "MEDIUM" ? filterTabActiveStyle : {})}} onClick={() => setFilterSeverity("MEDIUM")}>
              MED ({conflicts.filter(c => c.severity === "MEDIUM").length})
            </button>
            <button style={{...filterTabStyle, ...(filterSeverity === "LOW" ? filterTabActiveStyle : {})}} onClick={() => setFilterSeverity("LOW")}>
              LOW ({conflicts.filter(c => c.severity === "LOW").length})
            </button>
          </div>

          <div style={{overflowY: "auto", flex: 1}}>
            {filteredConflicts.length === 0 ? (
              <div style={{padding: 20, textAlign: "center", color: "var(--text-secondary)"}}>No findings match filter criteria.</div>
            ) : (
              filteredConflicts.map((c, index) => (
                <div 
                  key={c.id} 
                  className={`list-row ${selectedConflictId === c.id ? "active" : ""}`}
                  style={{
                    display: "flex", 
                    flexDirection: "column", 
                    alignItems: "flex-start", 
                    gap: 6,
                    borderLeft: selectedConflictId === c.id ? "4px solid var(--blueprint-blue)" : `4px solid ${
                      c.severity === "HIGH" ? "var(--danger-red)" : c.severity === "MEDIUM" ? "var(--warning-amber)" : "var(--text-secondary)"
                    }`
                  }}
                  onClick={() => setSelectedConflictId(c.id)}
                >
                  <div className="flex align-center justify-between" style={{width: "100%"}}>
                    <span className="code-font" style={{fontWeight: "bold"}}>BLD-{String(index + 1).padStart(3, '0')}</span>
                    <span className={`badge ${
                      c.severity === "HIGH" ? "badge-high" : c.severity === "MEDIUM" ? "badge-medium" : "badge-low"
                    }`} style={{fontSize: 9, padding: "1px 4px"}}>
                      {c.severity}
                    </span>
                  </div>
                  <div style={{fontWeight: 600, fontSize: 13, color: "var(--text-primary)"}}>{c.title}</div>
                  <div style={{fontSize: 11, color: "var(--text-secondary)"}}>📍 {c.entityA}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: CAD Floorplan Blueprint Interactive View */}
        <div style={blueprintViewerColumnStyle}>
          <div style={blueprintHeaderStyle}>
            <span>GROUND FLOOR PLAN LAYOUT SHEET — A-101</span>
            <span style={{fontSize: 11, color: "var(--text-secondary)"}}>Grid Scale: 1 square = 2m</span>
          </div>

          {/* SVG Blueprint Draw */}
          <div style={blueprintCanvasContainerStyle}>
            <svg width="100%" height="100%" viewBox="0 0 800 600" style={{backgroundColor: "#F5F5F0", display: "block"}}>
              {/* Architectural Blueprint Grid */}
              <defs>
                <pattern id="blueprint-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E2D5" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="800" height="600" fill="url(#blueprint-grid)" />

              {/* Room boundaries */}
              {/* Living Room */}
              <rect x="50" y="50" width="300" height="250" fill="none" stroke="var(--primary-navy)" strokeWidth="2.5" />
              <text x="65" y="80" fill="var(--primary-navy)" fontSize="12" fontWeight="600">LIVING ROOM</text>
              <text x="65" y="98" fill="var(--text-secondary)" fontSize="10">24' x 18'</text>

              {/* Kitchen */}
              <rect x="350" y="50" width="220" height="200" fill="none" stroke="var(--primary-navy)" strokeWidth="2.5" />
              <text x="365" y="80" fill="var(--primary-navy)" fontSize="12" fontWeight="600">KITCHEN</text>
              <text x="365" y="98" fill="var(--text-secondary)" fontSize="10">16' x 14'</text>

              {/* Corridor */}
              <rect x="50" y="300" width="520" height="60" fill="none" stroke="var(--primary-navy)" strokeWidth="2.5" strokeDasharray="5,3" />
              <text x="65" y="335" fill="var(--primary-navy)" fontSize="12" fontWeight="600">CORRIDOR C1</text>

              {/* Master Bedroom */}
              <rect x="50" y="360" width="280" height="200" fill="none" stroke="var(--primary-navy)" strokeWidth="2.5" />
              <text x="65" y="390" fill="var(--primary-navy)" fontSize="12" fontWeight="600">MASTER BEDROOM</text>
              <text x="65" y="408" fill="var(--text-secondary)" fontSize="10">18' x 16'</text>

              {/* Bedroom 2 */}
              <rect x="330" y="360" width="240" height="200" fill="none" stroke="var(--primary-navy)" strokeWidth="2.5" />
              <text x="345" y="390" fill="var(--primary-navy)" fontSize="12" fontWeight="600">BEDROOM 2 (Room 102)</text>
              <text x="345" y="408" fill="var(--text-secondary)" fontSize="10">14' x 14'</text>

              {/* Doors & Windows representations */}
              {/* Door D-04 intersection conflict illustration */}
              <path d="M 350,180 Q 320,180 320,210" fill="none" stroke="var(--primary-navy)" strokeWidth="2" />
              <line x1="350" y1="180" x2="350" y2="210" stroke="var(--primary-navy)" strokeWidth="2" />

              {/* Interactive Red Warning Highlights when conflict is selected */}
              {activeConflict?.title === "Door intersects wall" && (
                <g>
                  {/* Red bounding box around Kitchen doorway */}
                  <rect x="315" y="170" width="50" height="50" fill="rgba(239, 68, 68, 0.15)" stroke="var(--danger-red)" strokeWidth="2" strokeDasharray="4,2" />
                  <circle cx="340" cy="195" r="4" fill="var(--danger-red)" />
                  <rect x="348" y="195" width="65" height="18" fill="var(--danger-red)" rx="2" />
                  <text x="352" y="208" fill="#FFFFFF" fontSize="10" fontWeight="bold">BLD-001</text>
                </g>
              )}

              {activeConflict?.title === "Window opening exceeds structural span" && (
                <g>
                  {/* Window W-02 conflict location */}
                  <rect x="560" y="90" width="20" height="80" fill="rgba(239, 68, 68, 0.15)" stroke="var(--danger-red)" strokeWidth="2" strokeDasharray="4,2" />
                  <rect x="580" y="120" width="65" height="18" fill="var(--danger-red)" rx="2" />
                  <text x="584" y="133" fill="#FFFFFF" fontSize="10" fontWeight="bold">BLD-002</text>
                </g>
              )}

              {activeConflict?.title === "Staircase width below code minimum" && (
                <g>
                  {/* Staircase S1 location */}
                  <rect x="50" y="470" width="80" height="90" fill="rgba(239, 68, 68, 0.15)" stroke="var(--danger-red)" strokeWidth="2" strokeDasharray="4,2" />
                  <rect x="135" y="505" width="65" height="18" fill="var(--danger-red)" rx="2" />
                  <text x="139" y="518" fill="#FFFFFF" fontSize="10" fontWeight="bold">BLD-003</text>
                </g>
              )}

              {activeConflict?.title === "Duplicate room labels 'Bedroom 2'" && (
                <g>
                  {/* Bedroom 2 location */}
                  <rect x="330" y="360" width="240" height="60" fill="rgba(217, 119, 6, 0.15)" stroke="var(--warning-amber)" strokeWidth="2" strokeDasharray="4,2" />
                  <rect x="440" y="375" width="65" height="18" fill="var(--warning-amber)" rx="2" />
                  <text x="444" y="388" fill="#FFFFFF" fontSize="10" fontWeight="bold">BLD-005</text>
                </g>
              )}
            </svg>
          </div>

          <div style={blueprintFooterStyle}>
            <span>Page 1 of 12</span>
            <div className="flex" style={{gap: 8}}>
              <button className="btn btn-outline" style={{padding: "2px 8px", fontSize: 11}}>Zoom In</button>
              <button className="btn btn-outline" style={{padding: "2px 8px", fontSize: 11}}>Zoom Out</button>
              <button className="btn btn-outline" style={{padding: "2px 8px", fontSize: 11}}>Fit to Width</button>
            </div>
          </div>
        </div>

        {/* Column 3: Triage Details & Actions */}
        <div style={triageDetailColumnStyle}>
          {activeConflict ? (
            <div style={{display: "flex", flexDirection: "column", height: "100%"}}>
              
              {/* Header */}
              <div style={{marginBottom: 16}}>
                <div className="flex justify-between align-center" style={{marginBottom: 8}}>
                  <span className="code-font" style={{fontWeight: "bold", fontSize: 13}}>BLD-ID: {activeConflict.id.slice(0, 8)}</span>
                  <span className={`badge ${
                    activeConflict.severity === "HIGH" ? "badge-high" : activeConflict.severity === "MEDIUM" ? "badge-medium" : "badge-low"
                  }`}>
                    {activeConflict.severity}
                  </span>
                </div>
                <h2 style={{margin: 0, fontSize: 16, fontWeight: 700, color: "var(--primary-navy)"}}>{activeConflict.title}</h2>
              </div>

              <hr style={{border: 0, borderTop: "1px solid var(--border)", margin: "0 0 16px 0"}} />

              {/* Properties grid */}
              <div style={{display: "flex", flexDirection: "column", gap: 12, flex: 1, overflowY: "auto"}}>
                <div>
                  <div style={detailLabelStyle}>LOCATION</div>
                  <div style={detailValueStyle}>Ground Floor, Axis C-4</div>
                </div>

                <div>
                  <div style={detailLabelStyle}>AFFECTED ELEMENT A</div>
                  <div style={detailValueStyle} className="code-font">{activeConflict.entityA}</div>
                </div>

                {activeConflict.entityB && (
                  <div>
                    <div style={detailLabelStyle}>AFFECTED ELEMENT B</div>
                    <div style={detailValueStyle} className="code-font">{activeConflict.entityB}</div>
                  </div>
                )}

                <div>
                  <div style={detailLabelStyle}>CONFLICT CATEGORY</div>
                  <div style={detailValueStyle}>{activeConflict.category}</div>
                </div>

                <div>
                  <div style={detailLabelStyle}>DESCRIPTION</div>
                  <div style={{...detailValueStyle, lineHeight: 1.4}}>{activeConflict.description}</div>
                </div>

                <div className="panel" style={{backgroundColor: "#FEF2F2", borderColor: "#FCA5A5", padding: 12}}>
                  <div style={{...detailLabelStyle, color: "var(--danger-red)"}}>RECOMMENDATION</div>
                  <div style={{fontSize: 13, color: "#991B1B", lineHeight: 1.4}}>{activeConflict.recommendation}</div>
                </div>
              </div>

              <hr style={{border: 0, borderTop: "1px solid var(--border)", margin: "16px 0"}} />

              {/* Actions */}
              <div className="flex flex-col" style={{gap: 8}}>
                <button className="btn btn-primary" onClick={() => onOpenRfiModal(activeConflict)}>
                  Create RFI Draft
                </button>
                <div className="flex" style={{gap: 8}}>
                  <button className="btn btn-outline flex-1" onClick={() => onResolveConflict(activeConflict.id)}>
                    Ignore / Resolve
                  </button>
                  <button className="btn btn-outline flex-1" onClick={() => onResolveConflict(activeConflict.id)}>
                    Flag Row
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div style={{display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-secondary)"}}>
              Select a constructability issue to inspect properties.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

const viewWrapperStyle: React.CSSProperties = {
  padding: 24,
  flex: 1,
};

const triageHeaderStyle: React.CSSProperties = {
  backgroundColor: "var(--surface)",
  borderBottom: "1px solid var(--border)",
  padding: "10px 16px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const splitColumnsContainerStyle: React.CSSProperties = {
  display: "flex",
  flex: 1,
  overflow: "hidden",
};

const triageListColumnStyle: React.CSSProperties = {
  width: 280,
  borderRight: "1px solid var(--border)",
  backgroundColor: "var(--surface)",
  display: "flex",
  flexDirection: "column",
  height: "100%",
};

const sidebarSectionHeaderStyle: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: 11,
  fontWeight: 600,
  color: "var(--text-secondary)",
  textTransform: "uppercase",
  borderBottom: "1px solid var(--border)",
  backgroundColor: "#F9FAFB",
  letterSpacing: "0.05em",
};

const filterTabsStyle: React.CSSProperties = {
  display: "flex",
  borderBottom: "1px solid var(--border)",
  backgroundColor: "#F9FAFB",
  padding: "4px 8px",
  gap: 4,
};

const filterTabStyle: React.CSSProperties = {
  flex: 1,
  border: 0,
  backgroundColor: "transparent",
  fontSize: 10,
  fontWeight: 600,
  padding: "4px 0",
  cursor: "pointer",
  color: "var(--text-secondary)",
};

const filterTabActiveStyle: React.CSSProperties = {
  color: "var(--primary-navy)",
  borderBottom: "2px solid var(--primary-navy)",
};

const blueprintViewerColumnStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  backgroundColor: "#F5F5F0",
  borderRight: "1px solid var(--border)",
};

const blueprintHeaderStyle: React.CSSProperties = {
  padding: "8px 16px",
  backgroundColor: "var(--surface)",
  borderBottom: "1px solid var(--border)",
  display: "flex",
  justifyContent: "space-between",
  fontSize: 12,
  fontWeight: 600,
};

const blueprintCanvasContainerStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  padding: 16,
};

const blueprintFooterStyle: React.CSSProperties = {
  padding: "8px 16px",
  backgroundColor: "var(--surface)",
  borderTop: "1px solid var(--border)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: 12,
};

const triageDetailColumnStyle: React.CSSProperties = {
  width: 320,
  backgroundColor: "var(--surface)",
  padding: 16,
  height: "100%",
  display: "flex",
  flexDirection: "column",
};

const detailLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: "var(--text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: 2,
};

const detailValueStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--text-primary)",
  fontWeight: 500,
};
