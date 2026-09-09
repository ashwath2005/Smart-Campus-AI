import React, { useState } from "react";
import { Modal, Input, Button } from "../../../components/ui";
import toast from "react-hot-toast";

export const CompanyModal = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !industry) {
      toast.error("Please fill in company name and industry");
      return;
    }

    setLoading(true);
    try {
      await onSave({
        name,
        industry,
        website,
        description,
        logo_url: logoUrl || "https://via.placeholder.com/150"
      });
      setName("");
      setIndustry("");
      setWebsite("");
      setDescription("");
      setLogoUrl("");
      onClose();
    } catch {
      // Error handled by caller
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Recruiting Company Profile">
      <form onSubmit={handleSubmit} className="p-space-y-4">
        <Input
          label="Company Name *"
          placeholder="e.g. Zoho Corporation / Tata Consultancy Services"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Input
          label="Industry / Domain *"
          placeholder="e.g. Software & SaaS / Information Technology"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          required
        />

        <Input
          label="Company Website"
          placeholder="https://company.com"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />

        <Input
          label="Logo Image URL"
          placeholder="https://company.com/logo.png"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
        />

        <div className="input-group">
          <label className="input-label">Company Overview</label>
          <textarea
            rows={3}
            placeholder="Brief profile of company operations and hiring history..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="study-textarea"
          />
        </div>

        <div className="modal-actions-row">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Save Company Profile
          </Button>
        </div>
      </form>
    </Modal>
  );
};
