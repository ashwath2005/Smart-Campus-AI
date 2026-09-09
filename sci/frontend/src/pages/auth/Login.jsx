import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, GraduationCap } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button, Input, Card } from "../../components/ui";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email/roll number and password");
      return;
    }
    setLoading(true);
    try {
      await login({ email, password });
      const stored = localStorage.getItem("campus_user");
      if (stored) {
        const { user: loggedInUser } = JSON.parse(stored);
        if (loggedInUser) {
          const defaultPaths = {
            student: "/dashboard",
            faculty: "/faculty",
            admin: "/admin",
            hod: "/hod",
            security: "/gate-security",
            guardian: "/guardian-gate-pass"
          };
          navigate(defaultPaths[loggedInUser.role] || "/dashboard");
          return;
        }
      }
      navigate("/");
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (roleEmail) => {
    setEmail(roleEmail);
    setPassword("password123");
    setLoading(true);
    try {
      await login({ email: roleEmail, password: "password123" });
      const stored = localStorage.getItem("campus_user");
      if (stored) {
        const { user: loggedInUser } = JSON.parse(stored);
        if (loggedInUser) {
          const defaultPaths = {
            student: "/dashboard",
            faculty: "/faculty",
            admin: "/admin",
            hod: "/hod",
            security: "/gate-security",
            guardian: "/guardian-gate-pass"
          };
          navigate(defaultPaths[loggedInUser.role] || "/dashboard");
          return;
        }
      }
      navigate("/");
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="auth-page-container">
      {/* Premium ambient glows */}
      <div className="auth-glow-top" />
      <div className="auth-glow-bottom" />
      
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="auth-wrapper auth-wrapper-login"
      >
        {/* Branding header */}
        <div className="auth-header">
          <Link to="/" className="auth-logo-link">
            <div className="auth-logo-img-container">
              <img src="/logo.png" alt="SCME-AWN Logo" className="auth-logo-img" width="64" height="64" />
            </div>
            <img src="/title.png" alt="SCME-AWN" className="auth-logo-title-img" />
          </Link>
          <p className="auth-subtitle-text">
            AI-Powered Intelligent Management Ecosystem
          </p>
        </div>

        <Card className="auth-card">
          <h3 className="auth-title">
            Sign In to your account
          </h3>
          <form onSubmit={handleSubmit} className="auth-form">
            <Input
              label="Email Address or Roll Number"
              type="text"
              placeholder="e.g. name@campus.com or CS001"
              icon={<Mail size={16} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
            
            <div>
              <div className="auth-password-label-row">
                <label className="auth-password-label">
                  Password
                </label>
                <Link to="/forgot-password" className="auth-forgot-link">
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                icon={<Lock size={16} />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <Button type="submit" loading={loading} className="auth-btn-primary">
              Sign In
            </Button>
          </form>

          {/* Transparent Grid-Friendly Divider */}
          <div className="auth-quick-login-divider">
            <div className="auth-quick-login-line" />
            <span className="auth-quick-login-title">
              Demo Accounts
            </span>
            <div className="auth-quick-login-line" />
          </div>

          {/* Demo Login buttons */}
          <div className="auth-quick-login-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleQuickLogin("student1@campus.com")}
              className="auth-quick-login-btn"
            >
              Student
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleQuickLogin("faculty1@campus.com")}
              className="auth-quick-login-btn"
            >
              Faculty
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleQuickLogin("hod1@campus.com")}
              className="auth-quick-login-btn"
            >
              HOD
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleQuickLogin("admin@campus.com")}
              className="auth-quick-login-btn"
            >
              Admin
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleQuickLogin("security@campus.com")}
              className="auth-quick-login-btn"
            >
              Security
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleQuickLogin("guardian@campus.com")}
              className="auth-quick-login-btn"
            >
              Guardian
            </Button>
          </div>

          <p className="auth-footer-text">
            Contact your campus administrator to request account provisioning.
          </p>
        </Card>
      </motion.div>
    </div>
  );
};
