import "./NotFound.css";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import { Button } from "../../components/ui";
import { motion } from "framer-motion";
export const NotFound = () => {
  const navigate = useNavigate();
  const handleGoHome = () => {
    const stored = localStorage.getItem("campus_user");
    if (!stored) {
      navigate("/login");
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      const role = parsed.role;
      if (role === "student") navigate("/dashboard");
      else if (role === "faculty") navigate("/faculty");
      else if (role === "admin") navigate("/admin");
      else navigate("/login");
    } catch {
      navigate("/login");
    }
  };
  return <div className="pg-notfound-1">{
    /* Decorative Orbs */
  }<div className="pg-notfound-2" /><div className="pg-notfound-3" /><motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4  }}
    className="pg-notfound-4"
  ><motion.div
    animate={{ y: [0, -10, 0] }}
    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut"  }}
    className="pg-notfound-5"
  >
          🧭
        </motion.div><h2 className="pg-notfound-6">
          404 Page Not Found
        </h2><p className="pg-notfound-7">
          The page you are looking for doesn't exist or has been moved to another section.
        </p><Button variant="primary" onClick={handleGoHome} icon={<Home size={16} />} className="pg-notfound-8">
          Back to Dashboard
        </Button></motion.div></div>;
};
