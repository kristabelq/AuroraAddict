export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black flex items-center justify-center">
      <div className="text-center">
        {/* Aurora-themed spinner */}
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-aurora-green/30 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-aurora-green rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-400 animate-pulse">Loading aurora data...</p>
      </div>
    </div>
  );
}
