import React from "react";

interface RfiModalProps {
  show: boolean;
  rfiSubject: string;
  setRfiSubject: (subj: string) => void;
  rfiQuestion: string;
  setRfiQuestion: (q: string) => void;
  rfiRecommendation: string;
  setRfiRecommendation: (rec: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const RfiModal: React.FC<RfiModalProps> = ({
  show,
  rfiSubject,
  setRfiSubject,
  rfiQuestion,
  setRfiQuestion,
  rfiRecommendation,
  setRfiRecommendation,
  onClose,
  onSubmit,
}) => {
  React.useEffect(() => {
    if (!show) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between align-center" style={{marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 12}}>
          <h2 style={{margin: 0, fontSize: 16, color: "var(--primary-navy)"}}>RFI DOCUMENT DRAFT CO-ORDINATION</h2>
          <button 
            style={{border: 0, background: "none", fontSize: 18, cursor: "pointer", fontWeight: "bold"}} 
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit} style={{display: "flex", flexDirection: "column", gap: 16}}>
          <div>
            <label className="form-label" htmlFor="rfi-subject-input">RFI Subject</label>
            <input 
              id="rfi-subject-input"
              type="text" 
              className="form-input" 
              value={rfiSubject} 
              onChange={e => setRfiSubject(e.target.value)} 
              required 
            />
          </div>

          <div>
            <label className="form-label" htmlFor="rfi-question-textarea">RFI Technical Question</label>
            <textarea 
              id="rfi-question-textarea"
              className="form-input" 
              style={{height: 100, resize: "vertical", fontFamily: "inherit"}}
              value={rfiQuestion} 
              onChange={e => setRfiQuestion(e.target.value)} 
              required
            />
          </div>

          <div>
            <label className="form-label" htmlFor="rfi-recommendation-textarea">Suggested Resolution Recommendation</label>
            <textarea 
              id="rfi-recommendation-textarea"
              className="form-input" 
              style={{height: 80, resize: "vertical", fontFamily: "inherit"}}
              value={rfiRecommendation} 
              onChange={e => setRfiRecommendation(e.target.value)} 
            />
          </div>

          <div className="flex justify-end" style={{gap: 12, borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 8, justifyContent: "flex-end"}}>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Close
            </button>
            <button type="submit" className="btn btn-primary">
              Export & Verify RFI
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 100,
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 4,
  width: "100%",
  maxWidth: 550,
  padding: 20,
};
