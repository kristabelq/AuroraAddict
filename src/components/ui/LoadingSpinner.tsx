"use client";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export default function LoadingSpinner({
  size = "md",
  text,
  fullScreen = false,
  className = "",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      {/* Aurora-themed spinner */}
      <div className={`relative ${sizeClasses[size]}`}>
        {/* Outer ring - rotating */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-400 border-r-blue-500 animate-spin"></div>

        {/* Middle ring - counter-rotating */}
        <div className="absolute inset-1 rounded-full border-4 border-transparent border-b-purple-400 border-l-pink-500 animate-spin-reverse"></div>

        {/* Inner ring - fast rotation */}
        <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-green-400 animate-spin-fast"></div>

        {/* Center glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Loading text */}
      {text && (
        <p className={`${textSizeClasses[size]} font-medium text-gray-700 dark:text-gray-300 animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
}
