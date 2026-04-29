import { useState, useEffect } from "react";
import MainTable from "./components/MainTable";
import ResumeUpload from "./components/ResumeUpload.jsx";
import AppLayout from "@cloudscape-design/components/app-layout";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import { applyMode, Mode } from "@cloudscape-design/global-styles";
import Toggle from "@cloudscape-design/components/toggle";

const Home = () => {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    applyMode(newMode ? Mode.Dark : Mode.Light);
  };
  // Resume
  const [userResume, setUserResume] = useState(null);
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [analyzingApplications, setAnalyzingApplications] = useState(new Set());

  useEffect(() => {
    const savedResume = localStorage.getItem("userResume");
    if (savedResume) {
      try {
        const parsedResume = JSON.parse(savedResume);
        setUserResume({ name: parsedResume.fileName });
        setResumeAnalysis(parsedResume); // Keep full data including rawText
      } catch (error) {
        console.error("Error parsing saved resume:", error);
      }
    }
  }, []);
  const analyzeJobMatch = async (application, resumeData) => {
    if (!resumeData || !application.jobDescription) return null;

    try {
      const { analyzeJobAlignment } = await import("./utils/geminiAI");
      return await analyzeJobAlignment(application, resumeData);
    } catch (error) {
      console.error("Analysis failed:", error);
      return null;
    }
  };

  const analyzeAndUpdateApp = async (appId, appData = null) => {
    const app = appData || applications.find((a) => a.id === appId);
    if (!app || !resumeAnalysis || !app.jobDescription) return;

    setAnalyzingApplications((prev) => new Set(prev).add(appId));

    try {
      const analysis = await analyzeJobMatch(app, resumeAnalysis);
      if (analysis) {
        setApplications((apps) =>
          apps.map((a) =>
            a.id === appId
              ? { ...a, analysis, priority: a.priority || analysis.priority }
              : a,
          ),
        );
      }
    } finally {
      setAnalyzingApplications((prev) => {
        const newSet = new Set(prev);
        newSet.delete(appId);
        return newSet;
      });
    }
  };

  // Applications
  const [applications, setApplications] = useState([
    {
      id: crypto.randomUUID(),
      company: "",
      companyUrl: "",
      role: "",
      location: "",
      jobDescription: "",
      applicationDeadline: "",
      dateApplied: "",
      status: "",
    },
  ]);

  useEffect(() => {
    const savedApplications = localStorage.getItem("jobApplications");
    if (savedApplications) {
      try {
        const parsedApplications = JSON.parse(savedApplications);
        setApplications(parsedApplications);
      } catch (error) {
        console.error("Error parsing saved applications:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (applications.length > 0) {
      localStorage.setItem("jobApplications", JSON.stringify(applications));
    }
  }, [applications]);

  const handleAddApplication = async (newApp) => {
    setApplications([...applications, newApp]);

    const handleAddApplication = async (newApp) => {
      setApplications([...applications, newApp]);

      if (resumeAnalysis && newApp.jobDescription) {
        analyzeAndUpdateApp(newApp.id, newApp);
      }
    };
  };
  useEffect(() => {
    if (resumeAnalysis) {
      applications.forEach((app) => {
        if (
          app.jobDescription &&
          !analyzingApplications.has(app.id) &&
          (!app.analysis?.matchScore || !app.analysis?.recommendations?.length)
        ) {
          analyzeAndUpdateApp(app.id);
        }
      });
    }
  }, [resumeAnalysis]);

  const handleDeleteApplication = (id) => {
    setApplications(applications.filter((app) => app.id != id));
  };

  const handleUpdateApplication = async (id, updates) => {
    const originalApp = applications.find((app) => app.id === id);

    setApplications((apps) =>
      apps.map((app) => (app.id === id ? { ...app, ...updates } : app)),
    );

    if (
      resumeAnalysis &&
      updates.jobDescription &&
      updates.jobDescription !== originalApp?.jobDescription
    ) {
      analyzeAndUpdateApp(id);
    }
  };
  return (
    <AppLayout
      navigationHide
      toolsHide
      content={
        <ContentLayout
          header={
            <Header
              variant="h1"
              description="Track and optimize your job search with AI-powered insights"
            >
              Job Application Tracker
            </Header>
          }
        >
          <SpaceBetween size="xl">
            <Toggle onChange={toggleDarkMode} checked={darkMode}>
              {darkMode ? "Dark" : "Light"}
            </Toggle>

            <ResumeUpload
              userResume={userResume}
              setUserResume={setUserResume}
              setResumeAnalysis={setResumeAnalysis}
              applications={applications}
              setApplications={setApplications}
              analyzeAndUpdateApp={analyzeAndUpdateApp}
            />

            <MainTable
              applications={applications}
              onUpdateApplication={handleUpdateApplication}
              onAddApplication={handleAddApplication}
              onDeleteApplication={handleDeleteApplication}
              resumeAnalysis={resumeAnalysis}
              analyzeJobMatch={analyzeJobMatch}
              analyzingApplications={analyzingApplications}
            />
          </SpaceBetween>
        </ContentLayout>
      }
    />
  );
};

export default Home;
