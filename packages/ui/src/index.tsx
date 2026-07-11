import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export const Button = ({ variant = "primary", children, style, ...props }: ButtonProps) => {
  const isPrimary = variant === "primary";
  const buttonStyle: React.CSSProperties = {
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    border: "none",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "0.95rem",
    transition: "all 0.2s ease-in-out",
    backgroundColor: isPrimary ? "#6366f1" : "rgba(255, 255, 255, 0.1)",
    color: isPrimary ? "#ffffff" : "#e2e8f0",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: isPrimary ? "0 4px 6px -1px rgba(99, 102, 241, 0.4)" : "none",
    outline: "none",
    ...style,
  };

  return (
    <button style={buttonStyle} {...props}>
      {children}
    </button>
  );
};
