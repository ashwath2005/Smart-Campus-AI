import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle2, GraduationCap } from "lucide-react";
import { Button, Input, Card } from "../../components/ui";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
export const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSubmitted(true);
      toast.success("Simulation: Password reset email request success!");
    } catch (err) {
      toast.error(err.message || "Verification failed. Email may not exist.");
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="auth-wrapper auth-wrapper-forgot"
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
            Recover access to your intelligent college dashboard
          </p>
        </div>

        <Card className="auth-card">
          {submitted ? (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="auth-success-container"
            >
              <div className="auth-success-icon">
                <CheckCircle2 size={48} />
              </div>
              <h3 className="auth-success-title">
                Check your email
              </h3>
              <p className="auth-success-description">
                We've sent a simulated password recovery token to <strong>{email}</strong>.
              </p>
              <Link to="/login" className="auth-success-btn-container">
                <Button variant="primary" className="w-full">
                  Return to Login
                </Button>
              </Link>
            </motion.div>
          ) : (
            <>
              <h3 className="auth-title">
                Forgot your password?
              </h3>
              <p className="auth-description">
                Enter your registered email address and we'll send you a link to reset your password.
              </p>
              <form onSubmit={handleSubmit} className="auth-form">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@campus.com"
                  icon={<Mail size={16} />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
                <Button type="submit" loading={loading} className="auth-btn-primary">
                  Request Password Reset
                </Button>
              </form>
              <div className="auth-back-link-container">
                <Link to="/login" className="auth-back-link">
                  <ArrowLeft size={16} />
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
};
