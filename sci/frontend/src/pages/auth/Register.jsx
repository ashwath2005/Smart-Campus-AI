import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, User, Phone, GraduationCap, Building } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button, Input, Select, Card } from "../../components/ui";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [department, setDepartment] = useState("CSE");
  const [semester, setSemester] = useState(1);
  const [rollNumber, setRollNumber] = useState("");
  const [phone, setPhone] = useState("");
  const handleNext = () => {
    if (step === 1) {
      if (!name || !email || !password) {
        toast.error("Please fill in name, email and password");
        return;
      }
      if (password.length < 6) {
        toast.error("Password must be at least 6 characters long");
        return;
      }
      setStep(2);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({
        name,
        email,
        password,
        role,
        department,
        semester: role === "student" ? semester : void 0,
        rollNumber: role === "student" ? rollNumber : void 0,
        phone
      });
      toast.success("Registration successful!");
      const defaultPaths = {
        student: "/dashboard",
        faculty: "/faculty",
        admin: "/admin"
      };
      navigate(defaultPaths[role] || "/login");
    } catch (err) {
      toast.error(err.message || "Registration failed. Please check details.");
    } finally {
      setLoading(false);
    }
  };
  const departmentOptions = [
    { value: "CSE", label: "Computer Science & Engineering" },
    { value: "ECE", label: "Electronics & Communication" },
    { value: "ME", label: "Mechanical Engineering" },
    { value: "IT", label: "Information Technology" }
  ];
  const semesterOptions = [
    { value: 1, label: "Semester 1" },
    { value: 2, label: "Semester 2" },
    { value: 3, label: "Semester 3" },
    { value: 4, label: "Semester 4" },
    { value: 5, label: "Semester 5" },
    { value: 6, label: "Semester 6" },
    { value: 7, label: "Semester 7" },
    { value: 8, label: "Semester 8" }
  ];
  return (
    <div className="auth-page-container">
      {/* Premium ambient glows */}
      <div className="auth-glow-top" />
      <div className="auth-glow-bottom" />
      
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="auth-wrapper auth-wrapper-register"
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
            Create an account to access academics & campus tools
          </p>
        </div>

        <Card className="auth-card">
          {/* Progress Indicator */}
          <div className="auth-progress-indicator">
            <span className={`auth-progress-step-name ${step === 1 ? "auth-progress-step-name-active" : ""}`}>
              Account Details
            </span>
            <div className="auth-progress-track">
              <div
                className="auth-progress-fill"
                style={{ width: step === 1 ? "0%" : "100%" }}
              />
            </div>
            <span className={`auth-progress-step-name ${step === 2 ? "auth-progress-step-name-active" : ""}`}>
              Campus Info
            </span>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.15 }}
                  className="auth-form-step-container"
                >
                  <Input
                    label="Full Name"
                    placeholder="Rahul Sharma"
                    icon={<User size={16} />}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="name@campus.com"
                    icon={<Mail size={16} />}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Input
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    icon={<Lock size={16} />}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  
                  {/* Segmented Control Role Selector */}
                  <div className="auth-form-step-container">
                    <label className="auth-form-role-label">
                      Select Role
                    </label>
                    <div className="segmented-control-bg" style={{ display: 'flex', padding: '4px', position: 'relative' }}>
                      <button
                        type="button"
                        onClick={() => setRole("student")}
                        style={{
                          flex: 1,
                          padding: '8px 0',
                          fontSize: '12px',
                          fontWeight: '700',
                          borderRadius: '12px',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          position: 'relative',
                          zIndex: 10,
                          color: role === 'student' ? 'var(--text-primary)' : 'var(--text-secondary)',
                          transition: 'color 0.2s ease'
                        }}
                      >
                        Student
                        {role === "student" && (
                          <motion.div
                            layoutId="activeRoleIndicator"
                            style={{
                              position: 'absolute',
                              top: 0, left: 0, right: 0, bottom: 0,
                              backgroundColor: 'rgba(255, 255, 255, 0.08)',
                              borderRadius: '12px',
                              zIndex: -1,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}
                            transition={{ type: "spring", stiffness: 450, damping: 30 }}
                          />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole("faculty")}
                        style={{
                          flex: 1,
                          padding: '8px 0',
                          fontSize: '12px',
                          fontWeight: '700',
                          borderRadius: '12px',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          position: 'relative',
                          zIndex: 10,
                          color: role === 'faculty' ? 'var(--text-primary)' : 'var(--text-secondary)',
                          transition: 'color 0.2s ease'
                        }}
                      >
                        Faculty
                        {role === "faculty" && (
                          <motion.div
                            layoutId="activeRoleIndicator"
                            style={{
                              position: 'absolute',
                              top: 0, left: 0, right: 0, bottom: 0,
                              backgroundColor: 'rgba(255, 255, 255, 0.08)',
                              borderRadius: '12px',
                              zIndex: -1,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}
                            transition={{ type: "spring", stiffness: 450, damping: 30 }}
                          />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button type="button" onClick={handleNext} className="auth-btn-primary w-full">
                    Continue
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.15 }}
                  className="auth-form-step-container"
                >
                  <Select
                    label="Department"
                    options={departmentOptions}
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    icon={<Building size={16} />}
                  />
                  {role === "student" && (
                    <>
                      <Select
                        label="Current Semester"
                        options={semesterOptions}
                        value={semester}
                        onChange={(e) => setSemester(Number(e.target.value))}
                        icon={<GraduationCap size={16} />}
                      />
                      <Input
                        label="Roll Number / Enrollment ID"
                        placeholder="CS001"
                        icon={<GraduationCap size={16} />}
                        value={rollNumber}
                        onChange={(e) => setRollNumber(e.target.value)}
                        required
                      />
                    </>
                  )}
                  <Input
                    label="Phone Number"
                    type="tel"
                    placeholder="+91 98765 43210"
                    icon={<Phone size={16} />}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <div className="auth-register-buttons-row">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setStep(1)}
                      className="auth-register-back-btn"
                    >
                      Back
                    </Button>
                    <Button type="submit" loading={loading} className="auth-btn-primary auth-register-submit-btn">
                      Register
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <p className="auth-footer-text">
            Already have an account?{" "}
            <Link to="/login" className="auth-footer-link">
              Sign In
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
};
