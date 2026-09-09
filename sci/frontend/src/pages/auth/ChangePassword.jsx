import "./ChangePassword.css";
import React, { useState } from "react";
import api from "../../api/axios";
import { Card, Button, Input } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, KeyRound, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export const ChangePassword = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [skipping, setSkipping] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      toast.error("Please enter a new password.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    const loadId = toast.loading("Updating password...");
    try {
      await api.post("/auth/change-first-password", {
        new_password: newPassword
      });
      toast.success("Password updated successfully! Welcome to CampusOS.", { id: loadId });
      if (user) {
        updateUser({
          ...user,
          is_first_login: false,
          password_changed: true
        });
        const defaultPaths = {
          student: "/dashboard",
          faculty: "/faculty",
          admin: "/admin"
        };
        navigate(defaultPaths[user.role] || "/dashboard", { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to change password.";
      toast.error(msg, { id: loadId });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setSkipping(true);
    try {
      await api.post("/auth/skip-password-change");
      toast.success("Default password kept. You can change it later from settings.");
      if (user) {
        updateUser({ ...user, is_first_login: false });
        const defaultPaths = { student: "/dashboard", faculty: "/faculty", admin: "/admin" };
        navigate(defaultPaths[user.role] || "/dashboard", { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to skip.");
    } finally {
      setSkipping(false);
    }
  };

  return (
    <div className="changepassword-screen-container">
      {/* Background Aurora Effect */}
      <div className="aurora-glow glow-1" />
      <div className="aurora-glow glow-2" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="changepassword-card-wrapper"
      >
        <Card hoverGlow={false} className="changepassword-form-card">
          <div className="card-top-header">
            <div className="warning-icon-box">
              <ShieldAlert size={22} className="text-amber" />
            </div>
            <h2 className="changepassword-title">Welcome to CampusOS</h2>
            <p className="changepassword-desc">
              We recommend changing your default password for security. You can also skip this and change it later from settings.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="changepassword-fields-form">
            <div className="input-group-row">
              <Input
                label="New Password"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                icon={<Lock size={15} />}
                required
              />
            </div>
            
            <div className="input-group-row">
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                icon={<KeyRound size={15} />}
                required
              />
            </div>
            
            <div className="form-actions-box">
              <Button type="submit" variant="primary" disabled={loading || skipping}>
                {loading ? "Updating..." : "Change Password & Enter"}
              </Button>
              <Button type="button" variant="ghost" onClick={handleSkip} disabled={loading || skipping}>
                {skipping ? "Skipping..." : "Skip & Keep Default"}
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};
