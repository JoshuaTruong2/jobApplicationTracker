import React, { useState } from "react";
import { parseResume } from "../utils/geminiAI";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import FileUpload from "@cloudscape-design/components/file-upload";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";

const ResumeUpload = ({
  userResume,
  setUserResume,
  setResumeAnalysis,
  applications,
  setApplications,
  analyzeAndUpdateApp,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [processingStep, setProcessingStep] = useState("");

  const handleUploadResume = async (file) => {
    if (!file) return;

    setIsProcessing(true);
    setUploadStatus("processing");

    try {
      setProcessingStep("Extracting text from resume...");

      // Parse and analyze resume with AI
      const resumeData = await parseResume(file);

      setProcessingStep("Analyzing with AI models...");

      setUserResume(file);
      setResumeAnalysis(resumeData);

      // Store in localStorage
      localStorage.setItem(
        "userResume",
        JSON.stringify({
          fileName: file.name,
          uploadDate: new Date().toISOString(),
          ...resumeData,
        }),
      );

      setProcessingStep("Updating job applications...");

      // Re-analyze existing applications with new resume data
      if (applications.length > 0) {
        if (applications.length > 0) {
          applications.forEach((app) => {
            if (app.jobDescription) {
              analyzeAndUpdateApp(app.id);
            }
          });
        }
      }

      setUploadStatus("success");
      setProcessingStep("");
    } catch (error) {
      console.error("Resume parsing failed:", error);
      setUploadStatus("error");
      setProcessingStep("");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveResume = () => {
    setUserResume(null);
    setResumeAnalysis(null);
    localStorage.removeItem("userResume");
    setUploadStatus(null);
  };

  return (
    <Container
      header={
        <Header
          variant="h2"
          description="Upload your resume to enable AI matching"
        >
          Resume
        </Header>
      }
    >
      <SpaceBetween size="m">
        {userResume ? (
          <StatusIndicator type="success">{userResume.name}</StatusIndicator>
        ) : (
          <StatusIndicator type="warning">No resume uploaded</StatusIndicator>
        )}

        <FileUpload
          onChange={({ detail }) => {
            if (detail.value && detail.value.length > 0) {
              handleUploadResume(detail.value[0]);
            }
          }}
          value={[]}
          accept=".pdf,.doc,.docx"
          i18nStrings={{
            uploadButtonText: (e) => (e ? "Choose files" : "Choose file"),
            dropzoneText: (e) =>
              e ? "Drop files to upload" : "Drop file to upload",
            removeFileAriaLabel: (e) => `Remove file ${e + 1}`,
          }}
        />
      </SpaceBetween>
    </Container>
  );
};

export default ResumeUpload;
