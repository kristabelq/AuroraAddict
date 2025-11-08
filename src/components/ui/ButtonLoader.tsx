"use client";

interface ButtonLoaderProps {
  size?: "sm" | "md" | "lg";
  color?: "white" | "blue" | "green" | "gray";
}

export default function ButtonLoader({
  size = "md",
  color = "white",
}: ButtonLoaderProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-5 h-5 border-2",
    lg: "w-6 h-6 border-3",
  };

  const colorClasses = {
    white: "border-white/30 border-t-white",
    blue: "border-blue-200 border-t-blue-600",
    green: "border-green-200 border-t-green-600",
    gray: "border-gray-200 border-t-gray-600",
  };

  return (
    <div
      className={`inline-block ${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-spin`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
