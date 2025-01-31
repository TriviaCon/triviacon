import React from "react";

const Logo: React.FC = () => {
  return (
    <div>
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
};
export default Logo;
