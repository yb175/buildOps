import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { ProjectsDashboard } from "./components/ProjectsDashboard";
import { ProjectOverview } from "./components/ProjectOverview";
import { DrawingUpload } from "./components/DrawingUpload";
import { PipelineProgress } from "./components/PipelineProgress";
import { FindingsReview } from "./components/FindingsReview";
import { RfiList } from "./components/RfiList";
import { RfiModal } from "./components/RfiModal";
import type { Project, Drawing, Conflict, Rfi, ProjectDetails } from "./types";

export default function App() {
  const [currentView, setCurrentView] = useState<"projects" | "overview" | "upload" | "pipeline" | "findings" | "rfis">("projects");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("500 Gaj Residence");
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);
  
  // Active states for drawing review
  const [activeDrawing, setActiveDrawing] = useState<Drawing | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [rfis, setRfis] = useState<Rfi[]>([]);
  const [selectedConflictId, setSelectedConflictId] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<"ALL" | "HIGH" | "MEDIUM" | "LOW">("ALL");

  // RFI creation state
  const [showRfiModal, setShowRfiModal] = useState(false);
  const [rfiSubject, setRfiSubject] = useState("");
  const [rfiQuestion, setRfiQuestion] = useState("");
  const [rfiRecommendation, setRfiRecommendation] = useState("");

  // Upload drawing state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDiscipline, setUploadDiscipline] = useState("ARCHITECTURAL");
  const [uploadDrawingNo, setUploadDrawingNo] = useState("");
  const [uploadRevision, setUploadRevision] = useState("Rev 0");
  const [uploadPreparedBy, setUploadPreparedBy] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Pipeline simulation state
  const [pipelineDrawingName, setPipelineDrawingName] = useState("");
  const [pipelineStep, setPipelineStep] = useState(1);
  const [pipelineProgress, setPipelineProgress] = useState(0);
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const pipelineAbortedRef = React.useRef(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  // Fetch all projects for the dashboard
  const fetchProjects = async () => {
    setProjectsLoading(true);
    setProjectsError(null);
    try {
      const res = await fetch(`${API_URL}/drawings/projects`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      } else {
        setProjectsError(`Server responded with status: ${res.status}`);
      }
    } catch (err: any) {
      console.error("Failed to fetch projects:", err);
      setProjectsError(err.message || "Failed to fetch projects");
    } finally {
      setProjectsLoading(false);
    }
  };

  // Fetch details for the selected project
  const fetchProjectDetails = async (projectName: string) => {
    try {
      const res = await fetch(`${API_URL}/drawings/projects/${encodeURIComponent(projectName)}`);
      if (res.ok) {
        const data = await res.json();
        setProjectDetails(data);
        if (data.rfis) {
          setRfis(data.rfis);
        }
      }
    } catch (err) {
      console.error("Failed to fetch project details:", err);
    }
  };

  // Fetch drawings and details when a drawing is selected for review
  const selectDrawingForReview = async (drawing: Drawing) => {
    setActiveDrawing(drawing);
    setCurrentView("findings");
    try {
      // Fetch conflicts
      const conflictsRes = await fetch(`${API_URL}/drawings/${drawing.id}/conflicts`);
      if (conflictsRes.ok) {
        const data = await conflictsRes.json();
        setConflicts(data.conflicts || []);
        if (data.conflicts && data.conflicts.length > 0) {
          setSelectedConflictId(data.conflicts[0].id);
        } else {
          setSelectedConflictId(null);
        }
      }

      // Fetch RFIs
      const rfisRes = await fetch(`${API_URL}/drawings/${drawing.id}/rfis`);
      if (rfisRes.ok) {
        const data = await rfisRes.json();
        setRfis(data.rfis || []);
      }
    } catch (err) {
      console.error("Failed to fetch drawing review details:", err);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchProjects();
  }, []);

  // Sync project details when selected project changes
  useEffect(() => {
    if (selectedProject) {
      fetchProjectDetails(selectedProject);
    }
  }, [selectedProject]);

  // Handle new drawing upload submit
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    setPipelineError(null);
    setPipelineStep(1);
    setPipelineProgress(0);
    setPipelineLogs([]);

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("discipline", uploadDiscipline);
    formData.append("projectName", selectedProject);
    formData.append("drawingNo", uploadDrawingNo);
    formData.append("revision", uploadRevision);
    formData.append("preparedBy", uploadPreparedBy);

    try {
      setPipelineLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - Uploading drawing file: ${uploadFile.name}...`]);
      const res = await fetch(`${API_URL}/drawings`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload drawing to server.");
      }

      const data = await res.json();
      const newId = data.drawingId;
      setPipelineDrawingName(uploadFile.name);
      setCurrentView("pipeline");
      
      // Trigger pipeline processing loop
      startPipelineProcessing(newId, uploadFile.name);
    } catch (err: any) {
      console.error(err);
      setPipelineError(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  // Cancel pipeline run gracefully
  const handleCancelPipeline = () => {
    pipelineAbortedRef.current = true;
    setPipelineError(null);
    setCurrentView("upload");
  };

  // Run GitLab-style analysis pipeline logs and API triggers
  const startPipelineProcessing = async (id: string, _name: string) => {
    pipelineAbortedRef.current = false;
    const steps = [
      { step: 1, progress: 20, log: "Document classification & intake verified." },
      { step: 2, progress: 40, log: "Rendering drawing layers at high definition (300 DPI)." },
      { step: 3, progress: 60, log: "Extracting spaces, doors, walls, and annotations." },
      { step: 4, progress: 80, log: "Running cross-discipline conflict validations." },
      { step: 5, progress: 100, log: "Analysis complete. Ready for constructability review." }
    ];

    for (let i = 0; i < steps.length; i++) {
      if (pipelineAbortedRef.current) return;
      await new Promise(r => setTimeout(r, 1500));
      if (pipelineAbortedRef.current) return;

      setPipelineStep(steps[i].step);
      setPipelineProgress(steps[i].progress);
      setPipelineLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${steps[i].log}`]);

      // Trigger backend endpoints during appropriate steps and stop on failure
      try {
        if (steps[i].step === 3) {
          const res = await fetch(`${API_URL}/drawings/${id}/analyze`, { method: "POST" });
          if (!res.ok) throw new Error(`Analysis step failed with status ${res.status}`);
        }
        if (steps[i].step === 4) {
          const res = await fetch(`${API_URL}/drawings/${id}/conflicts`, { method: "POST" });
          if (!res.ok) throw new Error(`Conflict validation step failed with status ${res.status}`);
        }
        if (steps[i].step === 5) {
          const res = await fetch(`${API_URL}/drawings/${id}/rfis`, { method: "POST" });
          if (!res.ok) throw new Error(`RFI generation step failed with status ${res.status}`);
        }
      } catch (err: any) {
        console.error(err);
        setPipelineError(err.message || "Pipeline execution failed");
        return;
      }
    }

    if (pipelineAbortedRef.current) return;
    await new Promise(r => setTimeout(r, 1000));
    if (pipelineAbortedRef.current) return;

    try {
      const res = await fetch(`${API_URL}/drawings/projects/${encodeURIComponent(selectedProject)}`);
      if (res.ok) {
        const details = await res.json();
        setProjectDetails(details);
        const matchingDrawing = details.drawings.find((d: Drawing) => d.id === id);
        if (matchingDrawing) {
          selectDrawingForReview(matchingDrawing);
        } else {
          setCurrentView("overview");
        }
      }
    } catch (err) {
      setCurrentView("overview");
    }
  };

  // Open RFI Modal with prefilled values from selected conflict
  const handleOpenRfiModal = (conflict: Conflict) => {
    setRfiSubject(`RFI for conflict: ${conflict.title}`);
    setRfiQuestion(`Regarding ${conflict.entityA}${conflict.entityB ? ` and ${conflict.entityB}` : ""}: ${conflict.description}`);
    setRfiRecommendation(conflict.recommendation);
    setShowRfiModal(true);
  };

  // Handle RFI Submit
  const handleRfiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDrawing || !selectedConflictId) return;

    const targetRfi = rfis.find(r => r.conflictId === selectedConflictId);
    if (!targetRfi) {
      console.warn("No generated RFI found for this conflict to update.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/drawings/${activeDrawing.id}/rfis/${targetRfi.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: rfiSubject,
          question: rfiQuestion,
          recommendation: rfiRecommendation,
          status: "REVIEWED"
        })
      });
      if (res.ok) {
        const updatedRfi = await res.json();
        setRfis(prev => prev.map(r => r.id === updatedRfi.id ? updatedRfi : r));
        if (projectDetails) {
          setProjectDetails({
            ...projectDetails,
            rfis: projectDetails.rfis.map(r => r.id === updatedRfi.id ? updatedRfi : r)
          });
        }
      }
      setShowRfiModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Resolve conflict locally
  const handleResolveConflict = (id: string) => {
    setConflicts(prev => prev.filter(c => c.id !== id));
    if (selectedConflictId === id) {
      setSelectedConflictId(null);
    }
  };

  return (
    <div style={layoutContainerStyle}>
      <Sidebar 
        currentView={currentView} 
        setCurrentView={(view) => {
          setCurrentView(view);
          if (view === "projects") {
            fetchProjects();
          }
        }} 
      />

      <div style={mainContentContainerStyle}>
        <Header 
          currentView={currentView}
          selectedProject={selectedProject}
          activeDrawingFileName={activeDrawing?.fileName}
          setCurrentView={setCurrentView}
        />

        {/* View Router */}
        {currentView === "projects" && (
          projectsLoading ? (
            <div style={{padding: 24, textAlign: "center", color: "var(--text-secondary)"}}>Loading projects...</div>
          ) : projectsError ? (
            <div style={{padding: 24, textAlign: "center", color: "var(--danger-red)"}}>
              <p>Error: {projectsError}</p>
              <button className="btn btn-outline" onClick={fetchProjects}>Retry</button>
            </div>
          ) : (
            <ProjectsDashboard 
              projects={projects}
              onSelectProject={(projectName) => {
                setSelectedProject(projectName);
                setCurrentView("overview");
              }}
              onNewProjectDrawing={() => {
                setSelectedProject("500 Gaj Residence");
                setCurrentView("upload");
              }}
            />
          )
        )}

        {currentView === "overview" && projectDetails && (
          <ProjectOverview 
            projectDetails={projectDetails}
            onUploadDrawingClick={() => setCurrentView("upload")}
            onViewDrawingReview={(drawing) => selectDrawingForReview(drawing)}
          />
        )}

        {currentView === "upload" && (
          <DrawingUpload 
            selectedProject={selectedProject}
            uploadFile={uploadFile}
            setUploadFile={setUploadFile}
            uploadDiscipline={uploadDiscipline}
            setUploadDiscipline={setUploadDiscipline}
            uploadDrawingNo={uploadDrawingNo}
            setUploadDrawingNo={setUploadDrawingNo}
            uploadRevision={uploadRevision}
            setUploadRevision={setUploadRevision}
            uploadPreparedBy={uploadPreparedBy}
            setUploadPreparedBy={setUploadPreparedBy}
            isUploading={isUploading}
            onSubmit={handleUploadSubmit}
            onCancel={() => setCurrentView("overview")}
          />
        )}

        {currentView === "pipeline" && (
          <PipelineProgress 
            pipelineDrawingName={pipelineDrawingName}
            uploadDiscipline={uploadDiscipline}
            uploadRevision={uploadRevision}
            pipelineProgress={pipelineProgress}
            pipelineStep={pipelineStep}
            pipelineLogs={pipelineLogs}
            pipelineError={pipelineError}
            onCancel={handleCancelPipeline}
          />
        )}

        {currentView === "findings" && activeDrawing && (
          <FindingsReview 
            activeDrawing={activeDrawing}
            conflicts={conflicts}
            selectedConflictId={selectedConflictId}
            setSelectedConflictId={setSelectedConflictId}
            filterSeverity={filterSeverity}
            setFilterSeverity={setFilterSeverity}
            onOpenRfiModal={handleOpenRfiModal}
            onResolveConflict={handleResolveConflict}
            onApproveDrawing={() => setCurrentView("overview")}
          />
        )}

        {currentView === "rfis" && (
          <RfiList rfis={rfis} />
        )}
      </div>

      <RfiModal 
        show={showRfiModal}
        rfiSubject={rfiSubject}
        setRfiSubject={setRfiSubject}
        rfiQuestion={rfiQuestion}
        setRfiQuestion={setRfiQuestion}
        rfiRecommendation={rfiRecommendation}
        setRfiRecommendation={setRfiRecommendation}
        onClose={() => setShowRfiModal(false)}
        onSubmit={handleRfiSubmit}
      />
    </div>
  );
}

const layoutContainerStyle: React.CSSProperties = {
  display: "flex",
  minHeight: "100vh",
  backgroundColor: "var(--bg)",
  color: "var(--text-primary)",
};

const mainContentContainerStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  height: "100vh",
  overflowY: "auto",
};
