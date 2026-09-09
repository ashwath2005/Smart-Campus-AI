import React from "react";
import { Compass } from "lucide-react";

export function CampusCompass({ cameraAngle = 0, onResetNorth }) {
  return (
    <button
      onClick={onResetNorth}
      className="dt-compass-widget"
      title="True North Indicator (Click to align North up)"
      aria-label="Align camera to True North"
      style={{
        position: "absolute",
        top: "60px",
        left: "14px",
        width: "44px",
        height: "44px",
        borderRadius: "50%",
        background: "rgba(8, 8, 8, 0.94)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        zIndex: 20,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        color: "#F4F4F5",
        outline: "none",
        transition: "all 0.2s ease"
      }}
    >
      {/* Rotating Dial Needle */}
      <div
        style={{
          transform: `rotate(${-cameraAngle}rad)`,
          transition: "transform 0.1s ease-out",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          position: "relative"
        }}
      >
        {/* North Pointer (Red/White Needle) */}
        <span
          style={{
            position: "absolute",
            top: "5px",
            fontSize: "9px",
            fontWeight: "800",
            color: "#EF4444",
            lineHeight: 1
          }}
        >
          N
        </span>
        <div
          style={{
            width: "2px",
            height: "14px",
            background: "linear-gradient(to bottom, #EF4444 50%, #71717A 50%)",
            borderRadius: "1px"
          }}
        />
        <span
          style={{
            position: "absolute",
            bottom: "5px",
            fontSize: "8px",
            fontWeight: "700",
            color: "#71717A",
            lineHeight: 1
          }}
        >
          S
        </span>
      </div>
    </button>
  );
}
