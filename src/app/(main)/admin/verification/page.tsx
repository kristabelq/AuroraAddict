"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { format } from "date-fns";

interface Business {
  id: string;
  name: string | null;
  email: string | null;
  businessName: string | null;
  businessServices: string[] | null;
  businessDescription: string | null;
  businessEmail: string | null;
  businessCity: string | null;
  businessCountry: string | null;
  businessLicenseUrl: string | null;
  idDocumentUrl: string | null;
  verificationStatus: string;
  verificationSubmittedAt: string | null;
  createdAt: string;
}

export default function AdminVerificationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      fetchBusinesses();
    }
  }, [status, selectedStatus, router]);

  const fetchBusinesses = async () => {
    try {
      const response = await fetch(`/api/admin/verification?status=${selectedStatus}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          toast.error("You don't have admin access");
          router.push("/");
          return;
        }
        throw new Error(data.error || "Failed to fetch businesses");
      }

      setBusinesses(data.businesses);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch businesses");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (businessId: string) => {
    if (!confirm("Are you sure you want to approve this business?")) {
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch("/api/admin/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: businessId,
          action: "approve",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to approve business");
      }

      toast.success("Business verified successfully!");
      setSelectedBusiness(null);
      fetchBusinesses();
    } catch (error: any) {
      toast.error(error.message || "Failed to approve business");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (businessId: string) => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    if (!confirm("Are you sure you want to reject this business?")) {
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch("/api/admin/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: businessId,
          action: "reject",
          rejectionReason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reject business");
      }

      toast.success("Business verification rejected");
      setSelectedBusiness(null);
      setRejectionReason("");
      fetchBusinesses();
    } catch (error: any) {
      toast.error(error.message || "Failed to reject business");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-300">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black pb-24 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Business Verification Review
          </h1>
          <p className="text-gray-400">
            Review and approve business verification requests
          </p>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 mb-6">
          {["pending", "verified", "rejected"].map((status) => (
            <button
              key={status}
              onClick={() => {
                setSelectedStatus(status);
                setLoading(true);
              }}
              className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                selectedStatus === status
                  ? "bg-aurora-green text-black font-semibold"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Businesses List */}
        {businesses.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-lg">
            <p className="text-gray-400">No {selectedStatus} businesses found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {businesses.map((business) => (
              <div
                key={business.id}
                className="bg-white/5 backdrop-blur-sm rounded-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-1">
                      {business.businessName || business.name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {business.businessEmail || business.email}
                    </p>
                    <p className="text-sm text-gray-400">
                      {business.businessCity}, {business.businessCountry}
                    </p>
                    {business.verificationSubmittedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Submitted: {format(new Date(business.verificationSubmittedAt), "MMM dd, yyyy 'at' HH:mm")}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedBusiness(business)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
                  >
                    Review
                  </button>
                </div>

                {business.businessServices && business.businessServices.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {business.businessServices.map((service) => (
                      <span
                        key={service}
                        className="px-3 py-1 bg-white/10 rounded-full text-xs text-gray-300 capitalize"
                      >
                        {service.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                )}

                {business.businessDescription && (
                  <p className="text-sm text-gray-300">
                    {business.businessDescription}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Review Modal */}
        {selectedBusiness && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="bg-[#0a0e17] border border-white/10 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-[#0a0e17] border-b border-white/10 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                  Review Verification Request
                </h2>
                <button
                  onClick={() => {
                    setSelectedBusiness(null);
                    setRejectionReason("");
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Business Info */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Business Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Business Name</p>
                      <p className="text-white">{selectedBusiness.businessName}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Contact Email</p>
                      <p className="text-white">{selectedBusiness.businessEmail}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Location</p>
                      <p className="text-white">
                        {selectedBusiness.businessCity}, {selectedBusiness.businessCountry}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Services</p>
                      <p className="text-white capitalize">
                        {selectedBusiness.businessServices?.join(", ").replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                  {selectedBusiness.businessDescription && (
                    <div className="mt-4">
                      <p className="text-gray-400 mb-1">Description</p>
                      <p className="text-white">{selectedBusiness.businessDescription}</p>
                    </div>
                  )}
                </div>

                {/* Documents */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Verification Documents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedBusiness.businessLicenseUrl && (
                      <div>
                        <p className="text-gray-400 mb-2">Business License</p>
                        <a
                          href={selectedBusiness.businessLicenseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-center text-aurora-green transition-colors"
                        >
                          View Document
                        </a>
                      </div>
                    )}
                    {selectedBusiness.idDocumentUrl && (
                      <div>
                        <p className="text-gray-400 mb-2">ID Document</p>
                        <a
                          href={selectedBusiness.idDocumentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-center text-aurora-green transition-colors"
                        >
                          View Document
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rejection Reason (if rejecting) */}
                {selectedStatus === "pending" && (
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Rejection Reason (optional for approval, required for rejection)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-aurora-green resize-none"
                      rows={3}
                      placeholder="Provide a reason if rejecting..."
                    />
                  </div>
                )}

                {/* Actions */}
                {selectedStatus === "pending" && (
                  <div className="flex gap-3 pt-4 border-t border-white/10">
                    <button
                      onClick={() => handleReject(selectedBusiness.id)}
                      disabled={processing}
                      className="flex-1 px-4 py-3 bg-red-900/20 hover:bg-red-900/30 border border-red-500 text-red-400 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing ? "Processing..." : "Reject"}
                    </button>
                    <button
                      onClick={() => handleApprove(selectedBusiness.id)}
                      disabled={processing}
                      className="flex-1 px-4 py-3 bg-aurora-green hover:bg-aurora-green/80 text-black rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing ? "Processing..." : "Approve"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
