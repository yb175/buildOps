import React from "react";

interface DrawingUploadProps {
  selectedProject: string;
  uploadFile: File | null;
  setUploadFile: (file: File | null) => void;
  uploadDiscipline: string;
  setUploadDiscipline: (disc: string) => void;
  uploadDrawingNo: string;
  setUploadDrawingNo: (no: string) => void;
  uploadRevision: string;
  setUploadRevision: (rev: string) => void;
  uploadPreparedBy: string;
  setUploadPreparedBy: (name: string) => void;
  isUploading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const DrawingUpload: React.FC<DrawingUploadProps> = ({
  selectedProject,
  uploadFile,
  setUploadFile,
  uploadDiscipline,
  setUploadDiscipline,
  uploadDrawingNo,
  setUploadDrawingNo,
  uploadRevision,
  setUploadRevision,
  uploadPreparedBy,
  setUploadPreparedBy,
  isUploading,
  onSubmit,
  onCancel,
}) => {
  return (
    <div style={viewWrapperStyle}>
      <div style={{maxWidth: 800, margin: "0 auto"}}>
        <h1 style={titleStyle}>UPLOAD CONSTRUCTION DOCUMENT</h1>
        <p style={subtitleStyle}>Submit Architectural, Structural, MEP, or Civil drawings for constructability review.</p>

        <form onSubmit={onSubmit} className="panel" style={{display: "flex", flexDirection: "column", gap: 20, marginTop: 20}}>
          
          {/* Dragzone */}
          <div style={dropzoneStyle}>
            <svg style={{width: 48, height: 48, color: "var(--text-secondary)", marginBottom: 12}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            {uploadFile ? (
              <div style={{fontWeight: 600, color: "var(--primary-navy)"}}>📁 {uploadFile.name}</div>
            ) : (
              <div>
                <div style={{fontWeight: 600, fontSize: 15, marginBottom: 4}}>Drop construction document here</div>
                <div style={{color: "var(--text-secondary)", fontSize: 13, marginBottom: 12}}>or click below to choose file</div>
              </div>
            )}

            <input 
              type="file" 
              id="drawing-file-input" 
              style={{display: "none"}} 
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setUploadFile(e.target.files[0]);
                }
              }} 
            />
            
            <label htmlFor="drawing-file-input" className="btn btn-outline" style={{padding: "6px 12px", fontSize: 12, cursor: "pointer"}}>
              Choose File
            </label>

            <div style={{display: "flex", gap: 8, marginTop: 16}}>
              <span style={formatChipStyle}>PDF</span>
              <span style={formatChipStyle}>DWG</span>
              <span style={formatChipStyle}>DXF</span>
              <span style={formatChipStyle}>RVT</span>
            </div>
          </div>

          {/* Form fields Grid */}
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16}}>
            <div>
              <label className="form-label">Project Name</label>
              <input type="text" className="form-input" value={selectedProject} disabled />
            </div>
            <div>
              <label className="form-label">Drawing Number</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. A-101, S-102"
                value={uploadDrawingNo}
                onChange={e => setUploadDrawingNo(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label">Discipline</label>
              <select 
                className="form-input" 
                value={uploadDiscipline} 
                onChange={e => setUploadDiscipline(e.target.value)}
              >
                <option value="ARCHITECTURAL">Architectural Plan</option>
                <option value="STRUCTURAL">Structural Details</option>
                <option value="MECHANICAL">Mechanical (MEP)</option>
                <option value="ELECTRICAL">Electrical Plan</option>
                <option value="PLUMBING">Plumbing Layout</option>
              </select>
            </div>
            <div>
              <label className="form-label">Revision</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Rev 0"
                value={uploadRevision}
                onChange={e => setUploadRevision(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Prepared By</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Project Coordinator"
                value={uploadPreparedBy}
                onChange={e => setUploadPreparedBy(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Submission Date</label>
              <input type="text" className="form-input" value={new Date().toLocaleDateString()} disabled />
            </div>
          </div>

          <div className="flex justify-end" style={{gap: 12, marginTop: 12}}>
            <button type="button" className="btn btn-outline" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-secondary" disabled={!uploadFile || isUploading}>
              {isUploading ? "Uploading..." : "Begin Analysis"}
            </button>
          </div>

        </form>
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

const dropzoneStyle: React.CSSProperties = {
  border: "2px dashed var(--border)",
  borderRadius: 4,
  padding: "40px 20px",
  textAlign: "center",
  backgroundColor: "#F9FAFB",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  cursor: "pointer",
};

const formatChipStyle: React.CSSProperties = {
  padding: "2px 8px",
  fontSize: 11,
  backgroundColor: "#E5E7EB",
  color: "var(--text-secondary)",
  fontWeight: 600,
  borderRadius: 2,
};
