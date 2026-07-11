import React from "react";

interface PipelineProgressProps {
  pipelineDrawingName: string;
  uploadDiscipline: string;
  uploadRevision: string;
  pipelineProgress: number;
  pipelineStep: number;
  pipelineLogs: string[];
  pipelineError: string | null;
  onCancel: () => void;
}

export const PipelineProgress: React.FC<PipelineProgressProps> = ({
  pipelineDrawingName,
  uploadDiscipline,
  uploadRevision,
  pipelineProgress,
  pipelineStep,
  pipelineLogs,
  pipelineError,
  onCancel,
}) => {
  return (
    <div style={viewWrapperStyle}>
      <div style={{maxWidth: 700, margin: "0 auto"}}>
        <h1 style={titleStyle}>ANALYSIS PIPELINE RUN</h1>
        <p style={subtitleStyle}>Analyzing constructability specifications on {pipelineDrawingName}</p>

        {pipelineError ? (
          <div className="panel" style={{borderColor: "var(--danger-red)", color: "var(--danger-red)"}}>
            <h3>❌ Pipeline Execution Failed</h3>
            <p>{pipelineError}</p>
            <button className="btn btn-outline" onClick={onCancel}>
              Back to Upload
            </button>
          </div>
        ) : (
          <div className="panel" style={{display: "flex", flexDirection: "column", gap: 24, marginTop: 20}}>
            
            {/* Progress Info */}
            <div className="flex justify-between align-center">
              <div>
                <div style={{fontWeight: 600, fontSize: 15}}>{pipelineDrawingName}</div>
                <div style={{color: "var(--text-secondary)", fontSize: 13}}>Discipline: {uploadDiscipline} • {uploadRevision}</div>
              </div>
              <div style={{fontWeight: "bold", fontSize: 18, color: "var(--primary-navy)"}}>{pipelineProgress}%</div>
            </div>

            {/* Progress Track */}
            <div style={progressBarContainerStyle}>
              <div style={{...progressBarFillStyle, width: `${pipelineProgress}%`}} />
            </div>

            {/* Steps */}
            <div style={{display: "flex", flexDirection: "column", gap: 16}}>
              <div style={{...pipelineStepRowStyle, opacity: pipelineStep >= 1 ? 1 : 0.4}}>
                <span style={pipelineStep >= 1 ? (pipelineStep > 1 ? pipelineDoneIndicatorStyle : pipelineActiveIndicatorStyle) : pipelinePendingIndicatorStyle}>
                  {pipelineStep > 1 ? "✓" : "1"}
                </span>
                <div>
                  <div style={{fontWeight: 600}}>Document Received</div>
                  <div style={{fontSize: 12, color: "var(--text-secondary)"}}>Verify PDF checksum, file headers and discipline format</div>
                </div>
              </div>

              <div style={{...pipelineStepRowStyle, opacity: pipelineStep >= 2 ? 1 : 0.4}}>
                <span style={pipelineStep >= 2 ? (pipelineStep > 2 ? pipelineDoneIndicatorStyle : pipelineActiveIndicatorStyle) : pipelinePendingIndicatorStyle}>
                  {pipelineStep > 2 ? "✓" : "2"}
                </span>
                <div>
                  <div style={{fontWeight: 600}}>Page Rendering</div>
                  <div style={{fontSize: 12, color: "var(--text-secondary)"}}>Convert PDF layout drawings into high DPI raster formats</div>
                </div>
              </div>

              <div style={{...pipelineStepRowStyle, opacity: pipelineStep >= 3 ? 1 : 0.4}}>
                <span style={pipelineStep >= 3 ? (pipelineStep > 3 ? pipelineDoneIndicatorStyle : pipelineActiveIndicatorStyle) : pipelinePendingIndicatorStyle}>
                  {pipelineStep > 3 ? "✓" : "3"}
                </span>
                <div>
                  <div style={{fontWeight: 600}}>Space Extraction</div>
                  <div style={{fontSize: 12, color: "var(--text-secondary)"}}>Identify walls, door swings, corridors and room bounds via Gemini Vision</div>
                </div>
              </div>

              <div style={{...pipelineStepRowStyle, opacity: pipelineStep >= 4 ? 1 : 0.4}}>
                <span style={pipelineStep >= 4 ? (pipelineStep > 4 ? pipelineDoneIndicatorStyle : pipelineActiveIndicatorStyle) : pipelinePendingIndicatorStyle}>
                  {pipelineStep > 4 ? "✓" : "4"}
                </span>
                <div>
                  <div style={{fontWeight: 600}}>Running Conflict Validations</div>
                  <div style={{fontSize: 12, color: "var(--text-secondary)"}}>Evaluate spatial constraints and building codes on drawings</div>
                </div>
              </div>

              <div style={{...pipelineStepRowStyle, opacity: pipelineStep >= 5 ? 1 : 0.4}}>
                <span style={pipelineStep >= 5 ? (pipelineStep > 5 ? pipelineDoneIndicatorStyle : pipelineActiveIndicatorStyle) : pipelinePendingIndicatorStyle}>
                  {pipelineStep > 5 ? "✓" : "5"}
                </span>
                <div>
                  <div style={{fontWeight: 600}}>Generating Constructability Review</div>
                  <div style={{fontSize: 12, color: "var(--text-secondary)"}}>Formulate RFI skeleton documents and code compliance checks</div>
                </div>
              </div>
            </div>

            {/* Logs terminal box */}
            <div style={terminalBoxStyle}>
              <div style={{fontWeight: 600, fontSize: 11, color: "var(--text-tertiary)", marginBottom: 8, borderBottom: "1px solid #374151", paddingBottom: 4}}>
                BUILD RUN LOGS (STDOUT)
              </div>
              {pipelineLogs.map((log, index) => (
                <div key={index} style={{marginBottom: 4}}>{log}</div>
              ))}
            </div>

          </div>
        )}

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

const progressBarContainerStyle: React.CSSProperties = {
  height: 8,
  backgroundColor: "#E5E7EB",
  borderRadius: 4,
  overflow: "hidden",
};

const progressBarFillStyle: React.CSSProperties = {
  height: "100%",
  backgroundColor: "var(--blueprint-blue)",
  transition: "width 0.3s ease",
};

const pipelineStepRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 16,
  alignItems: "center",
  transition: "opacity 0.3s ease",
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

const terminalBoxStyle: React.CSSProperties = {
  backgroundColor: "#1E2937",
  color: "#34D399",
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 11,
  padding: 12,
  borderRadius: 4,
  maxHeight: 200,
  overflowY: "auto",
  textAlign: "left",
};
