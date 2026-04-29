import { useState } from "react";
import Table from "@cloudscape-design/components/table";
import Header from "@cloudscape-design/components/header";
import Button from "@cloudscape-design/components/button";
import Badge from "@cloudscape-design/components/badge";
import ProgressBar from "@cloudscape-design/components/progress-bar";
import Link from "@cloudscape-design/components/link";
import Box from "@cloudscape-design/components/box";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Textarea from "@cloudscape-design/components/textarea";
import Select from "@cloudscape-design/components/select";
import Spinner from "@cloudscape-design/components/spinner";

const getStatusColor = (status) => {
  const colorMap = {
    0: "grey",
    1: "blue",
    2: "blue",
    3: "blue",
    4: "blue",
    5: "green",
    6: "green",
    7: "red",
    8: "grey",
  };
  return colorMap[status] || "grey";
};

export const STATUS_LABELS = [
  { value: 0, label: "Not Applied" },
  { value: 1, label: "Applied" },
  { value: 2, label: "Phone Screen" },
  { value: 3, label: "Technical Interview" },
  { value: 4, label: "Final Round" },
  { value: 5, label: "Offer" },
  { value: 6, label: "Accepted" },
  { value: 7, label: "Rejected" },
  { value: 8, label: "Withdrawn" },
];

const MainTable = ({
  applications,
  onUpdateApplication,
  onAddApplication,
  onDeleteApplication,
  resumeAnalysis,
  analyzingApplications,
}) => {
  const [isEditingApp, setIsEditingApp] = useState(false);
  const [isAddingApp, setIsAddingApp] = useState(false);
  const [editForm, setEditForm] = useState({});

  const handleAction = (actionId, item) => {
    if (actionId === "edit") {
      setIsEditingApp(true);
      setEditForm({ ...item });
    } else if (actionId === "delete") {
      onDeleteApplication(item.id);
    }
  };

  const handleAddApp = () => {
    const newApp = {
      id: crypto.randomUUID(),
      company: "",
      companyUrl: "",
      role: "",
      location: "",
      jobDescription: "",
      applicationDeadline: "",
      dateApplied: "",
      status: 0,
      addedDate: new Date().toISOString(),
    };
    setIsAddingApp(true);
    setIsEditingApp(true);
    setEditForm(newApp);
  };

  const handleSave = () => {
    if (isAddingApp) {
      onAddApplication(editForm);
      setIsAddingApp(false);
    } else {
      onUpdateApplication(editForm.id, editForm);
    }
    setIsEditingApp(false);

    setEditForm({});
  };

  const updateEditForm = (field, value) => {
    setEditForm({ ...editForm, [field]: value });
  };

  return (
    <>
      <Table
        resizableColumns
        columnDefinitions={[
          {
            id: "company",
            header: "Company",
            cell: (item) =>
              item.companyUrl ? (
                <Link href={item.companyUrl} external>
                  {item.company}
                </Link>
              ) : (
                item.company || "-"
              ),
            sortingField: "company",
            isRowHeader: true,
          },
          {
            id: "role",
            header: "Role",
            cell: (item) => item.role || "-",
            sortingField: "role",
          },
          {
            id: "location",
            header: "Location",
            cell: (item) => item.location || "-",
          },
          {
            id: "status",
            header: "Status",
            cell: (item) => (
              <Badge color={getStatusColor(item.status)}>
                {STATUS_LABELS[item.status]?.label || "-"}
              </Badge>
            ),
          },
          {
            id: "matchScore",
            header: "Match",
            cell: (item) =>
              analyzingApplications.has(item.id) ? (
                <Spinner size="normal" />
              ) : item.analysis ? (
                <ProgressBar
                  value={item.analysis.matchScore}
                  label="Match Score"
                  description={`${item.analysis.matchScore}% match`}
                  variant={
                    item.analysis.matchScore >= 75
                      ? "success"
                      : item.analysis.matchScore >= 50
                        ? "warning"
                        : "error"
                  }
                />
              ) : (
                <Box textAlign="center">-</Box>
              ),
          },
          {
            id: "priority",
            header: "Priority",
            cell: (item) => {
              const priority = item.priority || item.analysis?.priority;
              if (!priority) {
                return <Box textAlign="center">-</Box>;
              }
              return (
                <Badge
                  color={
                    priority === "High"
                      ? "green"
                      : priority === "Medium"
                        ? "blue"
                        : "grey"
                  }
                >
                  {priority}
                </Badge>
              );
            },
          },
          {
            id: "recommendations",
            header: "Recommendations",
            width: 250,
            cell: (item) =>
              item.analysis?.recommendations ? (
                <Box fontSize="body-s">
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: "1.2em",
                      listStyleType: "disc",
                      lineHeight: "1.2",
                    }}
                  >
                    {item.analysis.recommendations.map((rec, idx) => (
                      <li
                        key={idx}
                        style={{
                          wordBreak: "break-word",
                          whiteSpace: "normal",
                          lineHeight: "1.2",
                          marginBottom: "0.2em",
                        }}
                      >
                        {rec}
                      </li>
                    ))}
                  </ul>
                </Box>
              ) : (
                <Box textAlign="center">-</Box>
              ),
          },
          {
            id: "dateApplied",
            header: "Date applied",
            cell: (item) => item.dateApplied || "-",
          },
          {
            id: "actions",
            header: "Actions",
            cell: (item) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  iconName="edit"
                  variant="inline-icon"
                  ariaLabel="Edit"
                  onClick={() => handleAction("edit", item)}
                />
                <Button
                  iconName="remove"
                  variant="inline-icon"
                  ariaLabel="Delete"
                  onClick={() => handleAction("delete", item)}
                />
              </SpaceBetween>
            ),
          },
        ]}
        items={applications}
        header={
          <Header
            actions={
              <Button variant="primary" onClick={handleAddApp}>
                Add Application
              </Button>
            }
          >
            Applications ({applications.length})
          </Header>
        }
        sortingDisabled={false}
        empty={
          <Box textAlign="center" color="inherit">
            <b>No applications</b>
            <Box padding={{ bottom: "s" }} variant="p" color="inherit">
              No applications to display.
            </Box>
          </Box>
        }
      />

      <Modal
        visible={isEditingApp}
        onDismiss={() => {
          setIsEditingApp(false);
          setIsAddingApp(false);
          setEditForm({});
        }}
        header={isAddingApp ? "Add Application" : "Edit Application"}
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="link"
                onClick={() => {
                  setIsEditingApp(false);
                  setIsAddingApp(false);
                  setEditForm({});
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave}>
                Save
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Company">
            <Input
              value={editForm.company || ""}
              onChange={({ detail }) => updateEditForm("company", detail.value)}
            />
          </FormField>
          <FormField label="Company URL">
            <Input
              value={editForm.companyUrl || ""}
              onChange={({ detail }) =>
                updateEditForm("companyUrl", detail.value)
              }
            />
          </FormField>
          <FormField label="Role">
            <Input
              value={editForm.role || ""}
              onChange={({ detail }) => updateEditForm("role", detail.value)}
            />
          </FormField>
          <FormField label="Location">
            <Input
              value={editForm.location || ""}
              onChange={({ detail }) =>
                updateEditForm("location", detail.value)
              }
            />
          </FormField>
          <FormField label="Job Description">
            <Textarea
              value={editForm.jobDescription || ""}
              onChange={({ detail }) =>
                updateEditForm("jobDescription", detail.value)
              }
              rows={10}
            />
          </FormField>
          <FormField label="Status">
            <Select
              selectedOption={
                STATUS_LABELS.find((s) => s.value === editForm.status) || null
              }
              onChange={({ detail }) =>
                updateEditForm("status", detail.selectedOption.value)
              }
              options={STATUS_LABELS}
            />
          </FormField>
          <FormField label="Priority">
            <Select
              selectedOption={
                editForm.priority
                  ? { label: editForm.priority, value: editForm.priority }
                  : null
              }
              onChange={({ detail }) =>
                updateEditForm("priority", detail.selectedOption.value)
              }
              options={[
                { label: "High", value: "High" },
                { label: "Medium", value: "Medium" },
                { label: "Low", value: "Low" },
              ]}
              placeholder="Select priority"
            />
          </FormField>
          <FormField label="Date Applied">
            <Input
              type="date"
              value={editForm.dateApplied || ""}
              onChange={({ detail }) =>
                updateEditForm("dateApplied", detail.value)
              }
            />
          </FormField>
        </SpaceBetween>
      </Modal>
    </>
  );
};

export default MainTable;
