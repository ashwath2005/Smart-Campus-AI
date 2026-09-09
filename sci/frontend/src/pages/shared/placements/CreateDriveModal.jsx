import React, { useState, useEffect } from "react";
import { Modal, Button } from "../../../components/ui";
import { ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import "./CreateDriveModal.css";

export const CreateDriveModal = ({ isOpen, onClose, onSave, companies = [], driveToEdit = null }) => {
  const [companyName, setCompanyName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("fulltime");
  const [packageLpa, setPackageLpa] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [deadline, setDeadline] = useState("");
  const [registrationType, setRegistrationType] = useState("INTERNAL");
  const [registrationUrl, setRegistrationUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (driveToEdit) {
      setCompanyName(driveToEdit.companyName || driveToEdit.company || "");
      setTitle(driveToEdit.title || "");
      setDescription(driveToEdit.description || "");
      setType(driveToEdit.type === "internship" ? "internship" : "fulltime");
      setPackageLpa(driveToEdit.package ? driveToEdit.package.replace(" LPA", "") : "");
      setEligibility(driveToEdit.eligibility || "");
      setDeadline(driveToEdit.deadline || "");
      setRegistrationType(driveToEdit.registrationType || "INTERNAL");
      setRegistrationUrl(driveToEdit.registrationUrl || "");
    } else {
      setCompanyName("");
      setTitle("");
      setDescription("");
      setType("fulltime");
      setPackageLpa("");
      setEligibility("Minimum CGPA 7.0+, No Active Backlogs");
      setDeadline("");
      setRegistrationType("INTERNAL");
      setRegistrationUrl("");
    }
  }, [driveToEdit, companies, isOpen]);

  const handleTestLink = () => {
    if (!registrationUrl) {
      toast.error("Please enter a valid HTTPS registration link first");
      return;
    }
    if (!registrationUrl.startsWith("https://")) {
      toast.error("Security requirement: External registration link MUST start with 'https://'");
      return;
    }
    window.open(registrationUrl, "_blank", "noopener,noreferrer");
    toast.success("Opening external link in a new tab...");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companyName.trim() || !title || !packageLpa || !deadline) {
      toast.error("Please complete all required fields");
      return;
    }

    if (registrationType === "EXTERNAL" && registrationUrl) {
      if (!registrationUrl.startsWith("https://")) {
        toast.error("External URL must start with 'https://'");
        return;
      }
    }

    setLoading(true);
    const payload = {
      company_name: companyName.trim(),
      title,
      description,
      placement_type: type,
      package_lpa: parseFloat(packageLpa),
      eligibility_criteria: eligibility,
      deadline,
      registration_type: registrationType,
      registration_url: registrationUrl
    };

    try {
      await onSave(payload, driveToEdit?.id);
      onClose();
    } catch {
      // Error handled by parent caller
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={driveToEdit ? "Edit Placement Drive" : "Create Placement Drive"}
    >
      <form onSubmit={handleSubmit} className="drive-modal-form">
        <div className="drive-field-group">
          <label className="drive-field-label">Recruiting Company Name *</label>
          <input
            type="text"
            list="companies-datalist"
            placeholder="Type company name (e.g. Amazon, Google, Microsoft...)"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="drive-input-control"
            required
          />
          <datalist id="companies-datalist">
            {companies.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </div>

        <div className="drive-field-group">
          <label className="drive-field-label">Job Role / Drive Title *</label>
          <input
            type="text"
            placeholder="e.g. Software Engineer / SDE-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="drive-input-control"
            required
          />
        </div>

        <div className="drive-form-row">
          <div className="drive-field-group">
            <label className="drive-field-label">Job Type *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="drive-select-control"
            >
              <option value="fulltime">Full Time (FTE)</option>
              <option value="internship">Internship</option>
              <option value="parttime">Part Time</option>
            </select>
          </div>

          <div className="drive-field-group">
            <label className="drive-field-label">Package (CTC in LPA) *</label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 8.5"
              value={packageLpa}
              onChange={(e) => setPackageLpa(e.target.value)}
              className="drive-input-control"
              required
            />
          </div>
        </div>

        <div className="drive-form-row">
          <div className="drive-field-group">
            <label className="drive-field-label">Application Deadline *</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="drive-input-control"
              required
            />
          </div>

          <div className="drive-field-group">
            <label className="drive-field-label">Eligibility Requirements</label>
            <input
              type="text"
              placeholder="e.g. CGPA >= 7.0, Max 0 Backlogs"
              value={eligibility}
              onChange={(e) => setEligibility(e.target.value)}
              className="drive-input-control"
            />
          </div>
        </div>

        {/* Registration Configuration (Internal vs External Link) */}
        <div className="registration-mode-card">
          <label className="drive-field-label highlight">
            Registration Mode & External Link Setup
          </label>

          <div className="registration-radio-group">
            <label className="registration-radio-label">
              <input
                type="radio"
                name="regType"
                value="INTERNAL"
                checked={registrationType === "INTERNAL"}
                onChange={() => setRegistrationType("INTERNAL")}
                className="registration-radio-input"
              />
              <span>SCME-AWN Internal Registration</span>
            </label>

            <label className="registration-radio-label">
              <input
                type="radio"
                name="regType"
                value="EXTERNAL"
                checked={registrationType === "EXTERNAL"}
                onChange={() => setRegistrationType("EXTERNAL")}
                className="registration-radio-input"
              />
              <span>Direct External Registration Link</span>
            </label>
          </div>

          {registrationType === "EXTERNAL" && (
            <div>
              <div className="external-url-tester-row">
                <input
                  type="url"
                  placeholder="https://example.com/register or Google Form link..."
                  value={registrationUrl}
                  onChange={(e) => setRegistrationUrl(e.target.value)}
                  className="external-url-input"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleTestLink}
                  className="border border-slate-700"
                >
                  <ExternalLink size={14} />
                  <span>Test Link</span>
                </Button>
              </div>
              <p className="external-url-hint">
                HTTPS link will open safely in a new tab when clicked by students (`target="_blank"`).
              </p>
            </div>
          )}
        </div>

        <div className="drive-field-group">
          <label className="drive-field-label">Job Description & Details</label>
          <textarea
            rows={3}
            placeholder="Key responsibilities, skills required, interview process..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="drive-textarea-control"
          />
        </div>

        <div className="drive-modal-actions">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {driveToEdit ? "Update Placement Drive" : "Publish Placement Drive"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
