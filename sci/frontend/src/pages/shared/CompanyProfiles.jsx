import "./CompanyProfiles.css";
import { useState, useEffect } from "react";
import api from "../../api/axios";
import { Card, Skeleton } from "../../components/ui";
import { Search, Globe, Landmark } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
export const CompanyProfiles = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await api.get("/placements/companies");
        setCompanies(res.data);
      } catch (err) {
        toast.error("Failed to load companies");
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);
  const filteredCompanies = companies.filter(
    (c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.industry.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    className="pg-companyprofiles-1"
  ><div><h2 className="pg-companyprofiles-2">
          Recruiting Companies
        </h2><p className="pg-companyprofiles-3">
          Explore organizations recruiting students from our campus
        </p></div>{
    /* Search */
  }<div className="pg-companyprofiles-4"><span className="pg-companyprofiles-5"><Search size={16} /></span><input
    type="text"
    placeholder="Search companies..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="pg-companyprofiles-6"
  /></div>{loading ? <div className="pg-companyprofiles-7"><Skeleton variant="card" count={3} /></div> : filteredCompanies.length > 0 ? <div className="pg-companyprofiles-7">{filteredCompanies.map((c, idx) => <motion.div
    key={c.id}
    initial={{ opacity: 0, scale: 0.97 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: idx * 0.04  }}
  ><Card className="pg-companyprofiles-8"><div><div className="pg-companyprofiles-9"><div className="pg-companyprofiles-10"><div className="pg-companyprofiles-11"><Landmark size={16} /></div><h3 className="pg-companyprofiles-12">{c.name}</h3></div></div><p className="pg-companyprofiles-13">{c.industry}</p><p className="pg-companyprofiles-14">{c.description || "No description available."}</p></div>{c.website && <div className="pg-companyprofiles-15"><a
    href={`https://${c.website}`}
    target="_blank"
    rel="noopener noreferrer"
    className="pg-companyprofiles-16"
  ><Globe size={14} />
                      Visit Website
                    </a></div>}</Card></motion.div>)}</div> : <Card hoverGlow={false} className="pg-companyprofiles-17">
          No company profiles match your search.
        </Card>}</motion.div>;
};
