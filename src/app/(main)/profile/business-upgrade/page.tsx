"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

export default function BusinessUpgradePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const businessLicenseRef = useRef<HTMLInputElement>(null);
  const idDocumentRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    businessName: "",
    businessCategory: "",
    businessDescription: "",
    businessWebsite: "",
    businessPhone: "",
    businessEmail: "",
    businessAddress: "",
    businessCity: "",
    businessCountry: "Finland",
  });

  const [documents, setDocuments] = useState({
    businessLicense: null as File | null,
    idDocument: null as File | null,
  });

  const [documentPreviews, setDocumentPreviews] = useState({
    businessLicense: null as string | null,
    idDocument: null as string | null,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      checkVerificationStatus();
    }
  }, [status]);

  const checkVerificationStatus = async () => {
    try {
      const response = await fetch("/api/user/profile");
      const data = await response.json();

      // Redirect if already verified or pending
      if (data.verificationStatus === "verified") {
        toast.success("You're already verified!");
        router.push("/profile/edit");
        return;
      }

      if (data.verificationStatus === "pending") {
        toast("Your verification is pending review");
        router.push("/profile/edit");
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error("Error checking verification status:", error);
      toast.error("Failed to load");
      router.push("/profile/edit");
    }
  };

  const handleDocumentChange = (
    type: "businessLicense" | "idDocument",
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a JPG, PNG, or PDF file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size should be less than 10MB");
      return;
    }

    // Update documents
    setDocuments({ ...documents, [type]: file });

    // Show preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocumentPreviews({
          ...documentPreviews,
          [type]: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    } else {
      setDocumentPreviews({
        ...documentPreviews,
        [type]: "pdf",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.businessName.trim()) {
      toast.error("Business name is required");
      return;
    }

    if (!formData.businessCategory) {
      toast.error("Please select a business category");
      return;
    }

    if (!documents.businessLicense) {
      toast.error("Business license document is required");
      return;
    }

    if (!documents.idDocument) {
      toast.error("ID document is required");
      return;
    }

    setSubmitting(true);

    try {
      // Upload documents first
      const uploadFormData = new FormData();
      uploadFormData.append("businessLicense", documents.businessLicense);
      uploadFormData.append("idDocument", documents.idDocument);

      setUploadingDocuments(true);
      const uploadResponse = await fetch("/api/user/business-verification/upload", {
        method: "POST",
        body: uploadFormData,
      });

      const uploadData = await uploadResponse.json();
      setUploadingDocuments(false);

      if (!uploadResponse.ok) {
        toast.error(uploadData.error || "Failed to upload documents");
        setSubmitting(false);
        return;
      }

      // Submit verification request
      const response = await fetch("/api/user/upgrade-to-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          businessLicenseUrl: uploadData.businessLicenseUrl,
          idDocumentUrl: uploadData.idDocumentUrl,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Business verification submitted! We'll review it within 24-48 hours.");
        router.push("/profile/edit");
      } else {
        toast.error(data.error || "Failed to submit verification");
      }
    } catch (error) {
      console.error("Error submitting verification:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black pb-24">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/profile/edit")}
            className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Settings
          </button>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/20 rounded-xl">
              <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Upgrade to Business Account</h1>
              <p className="text-gray-400">
                Fill out the form below to apply for business verification. Our team will review your application within 24-48 hours.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Information */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-aurora-green" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Business Information
            </h2>

            <div className="space-y-4">
              {/* Business Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Business Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full bg-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-aurora-green"
                  placeholder="e.g., Northern Lights Tours"
                  required
                />
              </div>

              {/* Business Category */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Business Category <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.businessCategory}
                  onChange={(e) => setFormData({ ...formData, businessCategory: e.target.value })}
                  className="w-full bg-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-aurora-green"
                  required
                >
                  <option value="" className="bg-[#1a1f2e]">Select a category</option>
                  <option value="accommodation" className="bg-[#1a1f2e]">Accommodation (Hotels, Cabins, etc.)</option>
                  <option value="tour_operator" className="bg-[#1a1f2e]">Tour Operator</option>
                  <option value="photography" className="bg-[#1a1f2e]">Photography Services</option>
                  <option value="restaurant" className="bg-[#1a1f2e]">Restaurant / Café</option>
                  <option value="shop" className="bg-[#1a1f2e]">Shop / Retail</option>
                  <option value="other" className="bg-[#1a1f2e]">Other</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Select the category that best describes your business
                </p>
              </div>

              {/* Business Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Business Description
                </label>
                <textarea
                  value={formData.businessDescription}
                  onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
                  className="w-full bg-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-aurora-green resize-none"
                  rows={4}
                  placeholder="Brief description of your business..."
                  maxLength={300}
                />
                <p className="text-sm text-gray-400 mt-1">
                  {formData.businessDescription.length}/300 characters
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-aurora-green" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Contact Information
            </h2>

            <div className="space-y-4">
              {/* Website */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.businessWebsite}
                  onChange={(e) => setFormData({ ...formData, businessWebsite: e.target.value })}
                  className="w-full bg-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-aurora-green"
                  placeholder="https://yourbusiness.com"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Business Phone
                </label>
                <input
                  type="tel"
                  value={formData.businessPhone}
                  onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
                  className="w-full bg-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-aurora-green"
                  placeholder="+358 12 345 6789"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Business Email
                </label>
                <input
                  type="email"
                  value={formData.businessEmail}
                  onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                  className="w-full bg-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-aurora-green"
                  placeholder="contact@yourbusiness.com"
                />
              </div>
            </div>
          </div>

          {/* Business Address */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-aurora-green" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Business Location
            </h2>

            <div className="space-y-4">
              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Street Address
                </label>
                <input
                  type="text"
                  value={formData.businessAddress}
                  onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                  className="w-full bg-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-aurora-green"
                  placeholder="123 Northern Lights Ave"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.businessCity}
                  onChange={(e) => setFormData({ ...formData, businessCity: e.target.value })}
                  className="w-full bg-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-aurora-green"
                  placeholder="e.g., Rovaniemi"
                />
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Country
                </label>
                <select
                  value={formData.businessCountry}
                  onChange={(e) => setFormData({ ...formData, businessCountry: e.target.value })}
                  className="w-full bg-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-aurora-green"
                >
                  <option value="Finland" className="bg-[#1a1f2e]">Finland</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Currently only available in Finland
                </p>
              </div>
            </div>
          </div>

          {/* Verification Documents */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border-2 border-amber-500/30">
            <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              Verification Documents <span className="text-red-400">*</span>
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Please upload the required documents for verification. All files must be clear and readable.
            </p>

            <div className="space-y-4">
              {/* Business License */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Business License or Registration Certificate <span className="text-red-400">*</span>
                </label>
                <input
                  ref={businessLicenseRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleDocumentChange("businessLicense", e)}
                  className="hidden"
                  required
                />
                <button
                  type="button"
                  onClick={() => businessLicenseRef.current?.click()}
                  className="w-full bg-white/10 hover:bg-white/20 border-2 border-dashed border-gray-600 hover:border-aurora-green rounded-lg px-4 py-6 text-white transition-colors flex flex-col items-center gap-2"
                >
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm">
                    {documents.businessLicense
                      ? documents.businessLicense.name
                      : "Click to upload business license"}
                  </span>
                </button>
                {documentPreviews.businessLicense && documentPreviews.businessLicense !== "pdf" && (
                  <div className="mt-2 relative w-full h-48 rounded-lg overflow-hidden">
                    <img
                      src={documentPreviews.businessLicense}
                      alt="Business License Preview"
                      className="w-full h-full object-contain bg-black/50"
                    />
                  </div>
                )}
              </div>

              {/* ID Document */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Government-Issued ID (Passport, Driver's License, etc.) <span className="text-red-400">*</span>
                </label>
                <input
                  ref={idDocumentRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleDocumentChange("idDocument", e)}
                  className="hidden"
                  required
                />
                <button
                  type="button"
                  onClick={() => idDocumentRef.current?.click()}
                  className="w-full bg-white/10 hover:bg-white/20 border-2 border-dashed border-gray-600 hover:border-aurora-green rounded-lg px-4 py-6 text-white transition-colors flex flex-col items-center gap-2"
                >
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm">
                    {documents.idDocument
                      ? documents.idDocument.name
                      : "Click to upload government ID"}
                  </span>
                </button>
                {documentPreviews.idDocument && documentPreviews.idDocument !== "pdf" && (
                  <div className="mt-2 relative w-full h-48 rounded-lg overflow-hidden">
                    <img
                      src={documentPreviews.idDocument}
                      alt="ID Document Preview"
                      className="w-full h-full object-contain bg-black/50"
                    />
                  </div>
                )}
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-gray-300">
                <p className="font-medium text-white mb-1">📋 Accepted Formats:</p>
                <ul className="list-disc list-inside space-y-1 ml-1">
                  <li>JPG, PNG, or PDF files</li>
                  <li>Maximum file size: 10MB per document</li>
                  <li>Documents must be clear and readable</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/profile/edit")}
              disabled={submitting}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploadingDocuments}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploadingDocuments ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Uploading Documents...
                </>
              ) : submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Submit for Verification
                </>
              )}
            </button>
          </div>

          <p className="text-center text-sm text-gray-400">
            By submitting, you agree to provide accurate information. False information may result in rejection.
          </p>
        </form>
      </div>
    </div>
  );
}
