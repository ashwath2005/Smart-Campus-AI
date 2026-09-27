import React from "react";
import { useAuth } from "../../context/AuthContext";
import { AdminPlacementsView } from "./placements/AdminPlacementsView";
import { StudentPlacementsView } from "./placements/StudentPlacementsView";
import { Skeleton } from "../../components/ui";

export const Placements = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ padding: "2rem" }}>
        <Skeleton variant="card" count={2} />
      </div>
    );
  }

  const role = (user?.role || "").toLowerCase();
  const isAdminOrStaff = role === "admin" || role === "hod";

  if (isAdminOrStaff) {
    return <AdminPlacementsView />;
  }

  return <StudentPlacementsView />;
};

export default Placements;
