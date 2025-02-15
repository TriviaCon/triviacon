import React from "react";

const Logo: React.FC<{ bg?: string }> = ({ bg = 'black' }) => {
  return (
    <div style={{ backgroundColor: bg, borderRadius: "0.25rem" }} className="px-1">
      <h4 className="text-center mb-0">
        <span className="text-white outline-white">Trivia</span>
        <span
          style={{
            fontWeight: "bold",
            background:
              "linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          CON
        </span>
      </h4>
    </div>
  );
};export default Logo;
