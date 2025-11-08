"use client";

interface AuroraLoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  className?: string;
}

export default function AuroraLoader({
  size = "md",
  text,
  className = "",
}: AuroraLoaderProps) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
    xl: "w-40 h-40",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      {/* Aurora Wave Animation */}
      <div className={`relative ${sizeClasses[size]}`}>
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-aurora-green/20 via-aurora-blue/20 to-aurora-purple/20 rounded-full blur-xl animate-pulse"></div>

        {/* Aurora waves */}
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* First wave - Green */}
          <path
            d="M 10,50 Q 25,20 40,50 T 70,50 T 90,50"
            fill="none"
            stroke="url(#gradient1)"
            strokeWidth="3"
            strokeLinecap="round"
          >
            <animate
              attributeName="d"
              dur="3s"
              repeatCount="indefinite"
              values="
                M 10,50 Q 25,20 40,50 T 70,50 T 90,50;
                M 10,50 Q 25,80 40,50 T 70,50 T 90,50;
                M 10,50 Q 25,20 40,50 T 70,50 T 90,50
              "
            />
          </path>

          {/* Second wave - Blue */}
          <path
            d="M 10,55 Q 25,85 40,55 T 70,55 T 90,55"
            fill="none"
            stroke="url(#gradient2)"
            strokeWidth="3"
            strokeLinecap="round"
          >
            <animate
              attributeName="d"
              dur="2.5s"
              repeatCount="indefinite"
              values="
                M 10,55 Q 25,85 40,55 T 70,55 T 90,55;
                M 10,55 Q 25,25 40,55 T 70,55 T 90,55;
                M 10,55 Q 25,85 40,55 T 70,55 T 90,55
              "
            />
          </path>

          {/* Third wave - Purple */}
          <path
            d="M 10,60 Q 25,30 40,60 T 70,60 T 90,60"
            fill="none"
            stroke="url(#gradient3)"
            strokeWidth="3"
            strokeLinecap="round"
          >
            <animate
              attributeName="d"
              dur="2.8s"
              repeatCount="indefinite"
              values="
                M 10,60 Q 25,30 40,60 T 70,60 T 90,60;
                M 10,60 Q 25,90 40,60 T 70,60 T 90,60;
                M 10,60 Q 25,30 40,60 T 70,60 T 90,60
              "
            />
          </path>

          {/* Gradient definitions */}
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00ff87" stopOpacity="0.2">
                <animate
                  attributeName="stopOpacity"
                  values="0.2;1;0.2"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="50%" stopColor="#00ff87" stopOpacity="1" />
              <stop offset="100%" stopColor="#00ff87" stopOpacity="0.2">
                <animate
                  attributeName="stopOpacity"
                  values="0.2;1;0.2"
                  dur="2s"
                  repeatCount="indefinite"
                  begin="1s"
                />
              </stop>
            </linearGradient>

            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00d9ff" stopOpacity="0.2">
                <animate
                  attributeName="stopOpacity"
                  values="0.2;1;0.2"
                  dur="2.5s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="50%" stopColor="#00d9ff" stopOpacity="1" />
              <stop offset="100%" stopColor="#00d9ff" stopOpacity="0.2">
                <animate
                  attributeName="stopOpacity"
                  values="0.2;1;0.2"
                  dur="2.5s"
                  repeatCount="indefinite"
                  begin="1.25s"
                />
              </stop>
            </linearGradient>

            <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#b77aff" stopOpacity="0.2">
                <animate
                  attributeName="stopOpacity"
                  values="0.2;1;0.2"
                  dur="2.8s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="50%" stopColor="#b77aff" stopOpacity="1" />
              <stop offset="100%" stopColor="#b77aff" stopOpacity="0.2">
                <animate
                  attributeName="stopOpacity"
                  values="0.2;1;0.2"
                  dur="2.8s"
                  repeatCount="indefinite"
                  begin="1.4s"
                />
              </stop>
            </linearGradient>
          </defs>

          {/* Stars */}
          <circle cx="20" cy="20" r="1" fill="#ffffff" opacity="0.8">
            <animate
              attributeName="opacity"
              values="0.3;1;0.3"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="80" cy="25" r="1.5" fill="#ffffff" opacity="0.6">
            <animate
              attributeName="opacity"
              values="0.2;0.8;0.2"
              dur="2s"
              repeatCount="indefinite"
              begin="0.5s"
            />
          </circle>
          <circle cx="50" cy="15" r="1" fill="#ffffff" opacity="0.7">
            <animate
              attributeName="opacity"
              values="0.3;0.9;0.3"
              dur="1.8s"
              repeatCount="indefinite"
              begin="0.3s"
            />
          </circle>
          <circle cx="70" cy="80" r="1.2" fill="#ffffff" opacity="0.5">
            <animate
              attributeName="opacity"
              values="0.2;0.7;0.2"
              dur="2.2s"
              repeatCount="indefinite"
              begin="0.8s"
            />
          </circle>
          <circle cx="30" cy="85" r="1" fill="#ffffff" opacity="0.6">
            <animate
              attributeName="opacity"
              values="0.3;0.8;0.3"
              dur="1.6s"
              repeatCount="indefinite"
              begin="1s"
            />
          </circle>
        </svg>
      </div>

      {/* Loading text */}
      {text && (
        <p
          className={`${textSizeClasses[size]} font-medium text-gray-300 animate-pulse`}
        >
          {text}
        </p>
      )}
    </div>
  );
}
