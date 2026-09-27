import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link, Navigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button, Input, Card } from "../../components/ui";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { ROLE_DEFAULT_REDIRECTS } from "../../constants/roles";
import { ROUTES } from "../../constants/routes";

export const Login = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem("campus_remember_me") === "true";
  });
  const [email, setEmail] = useState(() => {
    return localStorage.getItem("campus_saved_email") || "";
  });
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect immediately to destination or default role dashboard
  if (user) {
    const from = location.state?.from?.pathname;
    const destination = from || ROLE_DEFAULT_REDIRECTS[user.role] || ROUTES.STUDENT_DASHBOARD;
    return <Navigate to={destination} replace />;
  }

  const handleSuccessfulAuth = (loggedInUser, currentEmail) => {
    const emailToSave = currentEmail || email;
    if (rememberMe) {
      localStorage.setItem("campus_remember_me", "true");
      localStorage.setItem("campus_saved_email", emailToSave);
    } else {
      localStorage.removeItem("campus_remember_me");
      localStorage.removeItem("campus_saved_email");
    }

    const from = location.state?.from?.pathname;
    const roleKey = loggedInUser?.role?.toLowerCase();
    const dest = from || ROLE_DEFAULT_REDIRECTS[roleKey] || ROUTES.STUDENT_DASHBOARD;
    navigate(dest, { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email/roll number and password");
      return;
    }
    setLoading(true);
    try {
      const authResult = await login({ email, password });
      const loggedInUser = authResult?.user || (localStorage.getItem("campus_user") ? JSON.parse(localStorage.getItem("campus_user")).user : null);
      if (loggedInUser) {
        handleSuccessfulAuth(loggedInUser, email);
        return;
      }
      navigate(ROUTES.ROOT);
    } catch {
      // Handled by login toast
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (roleEmail) => {
    setEmail(roleEmail);
    setPassword("password123");
    setLoading(true);
    try {
      const authResult = await login({ email: roleEmail, password: "password123" });
      const loggedInUser = authResult?.user || (localStorage.getItem("campus_user") ? JSON.parse(localStorage.getItem("campus_user")).user : null);
      if (loggedInUser) {
        handleSuccessfulAuth(loggedInUser, roleEmail);
        return;
      }
      navigate(ROUTES.ROOT);
    } catch {
      // Handled by login toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Subtle Ambient Atmosphere */}
      <div className="auth-glow-top" />
      <div className="auth-glow-bottom" />
      
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="auth-wrapper auth-wrapper-login"
      >
        {/* Branding header with official logo */}
        <div className="auth-header">
          <Link to="/" className="auth-logo-link">
            <div className="auth-logo-img-container">
              <img src="/logo.png" alt="Smart Campus AI Logo" className="auth-logo-img" width="60" height="60" />
            </div>
            <img src="/title.png" alt="Smart Campus AI" className="auth-logo-title-img" />
          </Link>
          <p className="auth-subtitle-text">
            Autonomous Digital Campus Platform
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

            {/* Remember Me Option */}
            <div className="auth-remember-row">
              <label className="auth-remember-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="auth-remember-checkbox"
                />
                <span>Remember this device</span>
              </label>
            </div>

            <Button type="submit" loading={loading} className="auth-btn-primary">
              Sign In
            </Button>
          </form>

          {/* Quick Demo Login Grid */}
          <div className="auth-quick-login-divider">
            <div className="auth-quick-login-line" />
            <span className="auth-quick-login-title">
              One-Click Demo Access
            </span>
            <div className="auth-quick-login-line" />
          </div>

          <div className="auth-quick-login-grid">
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
              onClick={() => handleQuickLogin("warden@campus.com")}
              className="auth-quick-login-btn"
            >
              Warden
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
            Enterprise protected portal. Unauthorized access is monitored.
          </p>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;
