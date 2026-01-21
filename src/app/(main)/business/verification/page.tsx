"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function BusinessVerificationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [existingData, setExistingData] = useState<any>(null);

  const [formData, setFormData] = useState({
    businessDescription: "",
    businessEmail: "",
    businessCity: "",
    businessCountry: "Finland",
  });

  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [licenseUrl, setLicenseUrl] = useState<string | null>(null);
  const [idUrl, setIdUrl] = useState<string | null>(null);
  const [uploadingLicense, setUploadingLicense] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      fetchVerificationStatus();
    }
  }, [status, router]);

  const fetchVerificationStatus = async () => {
    try {
      const response = await fetch("/api/business/verification/submit");
      const data = await response.json();

      if (response.ok) {
        setVerificationStatus(data.verificationStatus);
        setExistingData(data.businessDetails);

        // Populate form with existing data if available
        if (data.businessDetails) {
          setFormData({
            businessDescription: data.businessDetails.businessDescription || "",
            businessEmail: data.businessDetails.businessEmail || "",
            businessCity: data.businessDetails.businessCity || "",
            businessCountry: data.businessDetails.businessCountry || "Finland",
          });
          setLicenseUrl(data.businessDetails.businessLicenseUrl);
          setIdUrl(data.businessDetails.idDocumentUrl);
        }
      }
    } catch (error) {
      console.error("Error fetching verification status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, type: "license" | "id") => {
    const uploadFormData = new FormData();
    uploadFormData.append("document", file);
    uploadFormData.append("type", type);

    if (type === "license") {
      setUploadingLicense(true);
    } else {
      setUploadingId(true);
    }

    try {
      const response = await fetch("/api/business/verification/upload", {
        method: "POST",
        body: uploadFormData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload document");
      }

      if (type === "license") {
        setLicenseUrl(data.documentUrl);
        toast.success("Business license uploaded successfully");
      } else {
        setIdUrl(data.documentUrl);
        toast.success("ID document uploaded successfully");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to upload document");
    } finally {
      if (type === "license") {
        setUploadingLicense(false);
      } else {
        setUploadingId(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!licenseUrl) {
      toast.error("Please upload your business license");
      return;
    }

    if (!idUrl) {
      toast.error("Please upload your ID document");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/business/verification/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessLicenseUrl: licenseUrl,
          idDocumentUrl: idUrl,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit verification");
      }

      toast.success("Verification request submitted successfully!");
      setVerificationStatus("pending");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit verification");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-300">Loading...</div>
      </div>
    );
  }

  // Show status if already verified
  if (verificationStatus === "verified") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black pb-24 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-green-900/20 border border-green-500 rounded-lg p-6 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Business Verified!
            </h1>
            <p className="text-gray-300">
              Your business has been successfully verified. You can now access all business features.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show pending status
  if (verificationStatus === "pending") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black pb-24 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-6 text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Verification Pending
            </h1>
            <p className="text-gray-300 mb-4">
              Your verification request is being reviewed. We'll notify you once it's complete.
            </p>
            <p className="text-sm text-gray-400">
              This usually takes 1-3 business days.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black pb-24 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Business Verification
          </h1>
          <p className="text-gray-400">
            Complete verification to unlock all business features including room type uploads and premium visibility.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business License Upload */}
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
            <label className="block text-sm font-medium text-white mb-2">
              Business License *
            </label>
            <p className="text-sm text-gray-400 mb-4">
              Upload your business registration certificate or license (PDF, JPEG, or PNG, max 10MB)
            </p>

            {licenseUrl ? (
              <div className="flex items-center gap-4">
                <div className="flex-1 px-4 py-2 bg-green-900/20 border border-green-500 rounded-lg text-green-400 text-sm">
                  ✓ License uploaded
                </div>
                <button
                  type="button"
                  onClick={() => setLicenseUrl(null)}
                  className="px-4 py-2 bg-red-900/20 border border-red-500 text-red-400 rounded-lg text-sm hover:bg-red-900/30"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setLicenseFile(file);
                      handleFileUpload(file, "license");
                    }
                  }}
                  className="hidden"
                  id="license-upload"
                  disabled={uploadingLicense}
                />
                <label
                  htmlFor="license-upload"
                  className={`flex items-center justify-center px-4 py-3 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-aurora-green transition-colors ${
                    uploadingLicense ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <div className="text-center">
                    <svg
                      className="w-8 h-8 text-gray-400 mx-auto mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="text-sm text-gray-300">
                      {uploadingLicense ? "Uploading..." : "Click to upload business license"}
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* ID Document Upload */}
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
            <label className="block text-sm font-medium text-white mb-2">
              ID Document *
            </label>
            <p className="text-sm text-gray-400 mb-4">
              Upload a government-issued ID (passport, driver's license, etc.)
            </p>

            {idUrl ? (
              <div className="flex items-center gap-4">
                <div className="flex-1 px-4 py-2 bg-green-900/20 border border-green-500 rounded-lg text-green-400 text-sm">
                  ✓ ID uploaded
                </div>
                <button
                  type="button"
                  onClick={() => setIdUrl(null)}
                  className="px-4 py-2 bg-red-900/20 border border-red-500 text-red-400 rounded-lg text-sm hover:bg-red-900/30"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setIdFile(file);
                      handleFileUpload(file, "id");
                    }
                  }}
                  className="hidden"
                  id="id-upload"
                  disabled={uploadingId}
                />
                <label
                  htmlFor="id-upload"
                  className={`flex items-center justify-center px-4 py-3 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-aurora-green transition-colors ${
                    uploadingId ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <div className="text-center">
                    <svg
                      className="w-8 h-8 text-gray-400 mx-auto mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="text-sm text-gray-300">
                      {uploadingId ? "Uploading..." : "Click to upload ID document"}
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Business Details */}
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Business Details
            </h3>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Business Description *
              </label>
              <textarea
                value={formData.businessDescription}
                onChange={(e) =>
                  setFormData({ ...formData, businessDescription: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-aurora-green resize-none"
                rows={4}
                placeholder="Describe your business, services, and what makes you unique..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Business Email *
              </label>
              <input
                type="email"
                value={formData.businessEmail}
                onChange={(e) =>
                  setFormData({ ...formData, businessEmail: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-aurora-green"
                placeholder="contact@yourbusiness.com"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.businessCity}
                  onChange={(e) =>
                    setFormData({ ...formData, businessCity: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-aurora-green"
                  placeholder="e.g., Rovaniemi"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.businessCountry}
                  onChange={(e) =>
                    setFormData({ ...formData, businessCountry: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-aurora-green"
                  placeholder="Finland"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || uploadingLicense || uploadingId || !licenseUrl || !idUrl}
            className="w-full bg-aurora-green hover:bg-aurora-green/80 text-black font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Submit for Verification"}
          </button>

          <p className="text-sm text-gray-400 text-center">
            By submitting, you confirm that all information provided is accurate and you have the authority to represent this business.
          </p>
        </form>
      </div>
    </div>
  );
}
