"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Image from "next/image";

interface BusinessVerification {
  id: string;
  name: string | null;
  email: string | null;
  username: string | null;
  image: string | null;
  businessName: string | null;
  businessCategory: string | null;
  businessDescription: string | null;
  businessWebsite: string | null;
  businessPhone: string | null;
  businessEmail: string | null;
  businessAddress: string | null;
  businessCity: string | null;
  businessCountry: string | null;
  businessLicenseUrl: string | null;
  idDocumentUrl: string | null;
  verificationStatus: string;
  verificationSubmittedAt: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

type TabType = "all" | "pending" | "verified" | "rejected";

// Admin emails (must match the API)
const ADMIN_EMAILS = [
  "kristabel.quek@gmail.com",
  "kristabelq@gmail.com",
  // Add more admin emails here
];

const CATEGORY_LABELS: Record<string, string> = {
  accommodation: "🏨 Accommodation",
  tour_operator: "🚐 Tour Operator",
  photography: "📸 Photography",
  restaurant: "🍴 Restaurant",
  shop: "🛍️ Shop",
  other: "📋 Other",
};

export default function AdminBusinessVerificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [verifications, setVerifications] = useState<BusinessVerification[]>([]);
  const [filteredVerifications, setFilteredVerifications] = useState<BusinessVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<TabType>("pending");
  const [selectedVerification, setSelectedVerification] = useState<BusinessVerification | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Check if user is admin
  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user?.email) {
      toast.error("Unauthorized - Please sign in");
      router.push("/auth/signin");
      return;
    }

    if (!ADMIN_EMAILS.includes(session.user.email)) {
      toast.error("Forbidden - Admin access required");
      router.push("/");
      return;
    }
  }, [session, status, router]);

  // Fetch verifications
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) return;

    fetchVerifications();
  }, [session, status]);

  // Filter verifications based on selected tab
  useEffect(() => {
    if (selectedTab === "all") {
      setFilteredVerifications(verifications);
    } else {
      setFilteredVerifications(
        verifications.filter((v) => v.verificationStatus === selectedTab)
      );
    }
  }, [selectedTab, verifications]);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/business-verifications");

      if (!response.ok) {
        throw new Error("Failed to fetch verifications");
      }

      const data = await response.json();
      setVerifications(data.verifications || []);
    } catch (error) {
      console.error("Error fetching verifications:", error);
      toast.error("Failed to fetch verifications");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm("Are you sure you want to approve this business verification?")) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/business-verifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to approve verification");
      }

      toast.success("Business verification approved successfully!");
      setShowModal(false);
      setSelectedVerification(null);
      await fetchVerifications();
    } catch (error: any) {
      console.error("Error approving verification:", error);
      toast.error(error.message || "Failed to approve verification");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    if (!confirm("Are you sure you want to reject this business verification?")) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/business-verifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          rejectionReason: rejectionReason.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reject verification");
      }

      toast.success("Business verification rejected");
      setShowModal(false);
      setSelectedVerification(null);
      setRejectionReason("");
      await fetchVerifications();
    } catch (error: any) {
      console.error("Error rejecting verification:", error);
      toast.error(error.message || "Failed to reject verification");
    } finally {
      setActionLoading(false);
    }
  };

  const openModal = (verification: BusinessVerification) => {
    setSelectedVerification(verification);
    setRejectionReason(verification.rejectionReason || "");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedVerification(null);
    setRejectionReason("");
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/50",
      verified: "bg-green-500/20 text-green-300 border-green-500/50",
      rejected: "bg-red-500/20 text-red-300 border-red-500/50",
      unverified: "bg-gray-500/20 text-gray-300 border-gray-500/50",
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || styles.unverified}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (status === "loading" || !session?.user?.email) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!ADMIN_EMAILS.includes(session.user.email)) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Business Verifications</h1>
          <p className="text-gray-400">Review and manage business verification requests</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6 border-b border-gray-700/50">
          {[
            { key: "pending" as TabType, label: "Pending", count: verifications.filter(v => v.verificationStatus === "pending").length },
            { key: "verified" as TabType, label: "Verified", count: verifications.filter(v => v.verificationStatus === "verified").length },
            { key: "rejected" as TabType, label: "Rejected", count: verifications.filter(v => v.verificationStatus === "rejected").length },
            { key: "all" as TabType, label: "All", count: verifications.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key)}
              className={`px-6 py-3 font-medium transition-colors relative ${
                selectedTab === tab.key
                  ? "text-aurora-green"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
              <span className="ml-2 text-sm">({tab.count})</span>
              {selectedTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-aurora-green" />
              )}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12 text-gray-400">
            Loading verifications...
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredVerifications.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No verifications found</div>
            <div className="text-gray-500 text-sm">
              {selectedTab === "pending" && "There are no pending verification requests at the moment."}
              {selectedTab === "verified" && "No businesses have been verified yet."}
              {selectedTab === "rejected" && "No verifications have been rejected."}
              {selectedTab === "all" && "No verification requests found."}
            </div>
          </div>
        )}

        {/* Verifications Grid */}
        {!loading && filteredVerifications.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVerifications.map((verification) => (
              <div
                key={verification.id}
                onClick={() => openModal(verification)}
                className="bg-white/5 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:bg-white/10 transition-colors cursor-pointer"
              >
                {/* User Info */}
                <div className="flex items-center gap-3 mb-4">
                  {verification.image ? (
                    <Image
                      src={verification.image}
                      alt={verification.name || "User"}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-aurora-green to-aurora-purple flex items-center justify-center text-white font-bold text-lg">
                      {verification.name?.charAt(0) || verification.businessName?.charAt(0) || "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">
                      {verification.name || "No Name"}
                    </div>
                    <div className="text-gray-400 text-sm truncate">
                      @{verification.username || "no-username"}
                    </div>
                  </div>
                </div>

                {/* Business Info */}
                <div className="mb-4">
                  <div className="text-white font-semibold mb-1 truncate">
                    {verification.businessName || "No Business Name"}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {CATEGORY_LABELS[verification.businessCategory || "other"] || "📋 Other"}
                  </div>
                  {verification.businessCity && (
                    <div className="text-gray-400 text-sm mt-1">
                      📍 {verification.businessCity}, {verification.businessCountry || "Finland"}
                    </div>
                  )}
                </div>

                {/* Status & Date */}
                <div className="flex items-center justify-between">
                  {getStatusBadge(verification.verificationStatus)}
                  <div className="text-gray-500 text-xs">
                    {formatDate(verification.verificationSubmittedAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedVerification && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-gray-700/50 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-slate-900 border-b border-gray-700/50 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Verification Details</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                {getStatusBadge(selectedVerification.verificationStatus)}
                <div className="text-gray-400 text-sm">
                  Submitted: {formatDate(selectedVerification.verificationSubmittedAt)}
                </div>
              </div>

              {/* User Information */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">User Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Name</div>
                    <div className="text-white">{selectedVerification.name || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Email</div>
                    <div className="text-white">{selectedVerification.email || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Username</div>
                    <div className="text-white">@{selectedVerification.username || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">User ID</div>
                    <div className="text-white text-xs font-mono">{selectedVerification.id}</div>
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Business Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Business Name</div>
                    <div className="text-white">{selectedVerification.businessName || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Category</div>
                    <div className="text-white">
                      {CATEGORY_LABELS[selectedVerification.businessCategory || "other"] || "N/A"}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-gray-400">Description</div>
                    <div className="text-white">{selectedVerification.businessDescription || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Website</div>
                    <div className="text-white">
                      {selectedVerification.businessWebsite ? (
                        <a
                          href={selectedVerification.businessWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-aurora-green hover:underline"
                        >
                          {selectedVerification.businessWebsite}
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Phone</div>
                    <div className="text-white">{selectedVerification.businessPhone || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Email</div>
                    <div className="text-white">{selectedVerification.businessEmail || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Location</div>
                    <div className="text-white">
                      {selectedVerification.businessAddress || "N/A"}
                      {selectedVerification.businessCity && `, ${selectedVerification.businessCity}`}
                      {selectedVerification.businessCountry && `, ${selectedVerification.businessCountry}`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Verification Documents */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Verification Documents</h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Business License */}
                  <div>
                    <div className="text-gray-400 text-sm mb-2">Business License</div>
                    {selectedVerification.businessLicenseUrl ? (
                      selectedVerification.businessLicenseUrl.endsWith(".pdf") ? (
                        <a
                          href={selectedVerification.businessLicenseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block bg-white/10 rounded-lg p-6 text-center hover:bg-white/20 transition-colors"
                        >
                          <div className="text-4xl mb-2">📄</div>
                          <div className="text-aurora-green text-sm">View PDF</div>
                        </a>
                      ) : (
                        <a
                          href={selectedVerification.businessLicenseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Image
                            src={selectedVerification.businessLicenseUrl}
                            alt="Business License"
                            width={300}
                            height={300}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                        </a>
                      )
                    ) : (
                      <div className="bg-white/10 rounded-lg p-6 text-center text-gray-400">
                        No document
                      </div>
                    )}
                  </div>

                  {/* ID Document */}
                  <div>
                    <div className="text-gray-400 text-sm mb-2">ID Document</div>
                    {selectedVerification.idDocumentUrl ? (
                      selectedVerification.idDocumentUrl.endsWith(".pdf") ? (
                        <a
                          href={selectedVerification.idDocumentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block bg-white/10 rounded-lg p-6 text-center hover:bg-white/20 transition-colors"
                        >
                          <div className="text-4xl mb-2">📄</div>
                          <div className="text-aurora-green text-sm">View PDF</div>
                        </a>
                      ) : (
                        <a
                          href={selectedVerification.idDocumentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Image
                            src={selectedVerification.idDocumentUrl}
                            alt="ID Document"
                            width={300}
                            height={300}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                        </a>
                      )
                    ) : (
                      <div className="bg-white/10 rounded-lg p-6 text-center text-gray-400">
                        No document
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Rejection Reason (if rejected) */}
              {selectedVerification.verificationStatus === "rejected" && selectedVerification.rejectionReason && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-red-400 mb-2">Rejection Reason</h3>
                  <p className="text-gray-300">{selectedVerification.rejectionReason}</p>
                </div>
              )}

              {/* Rejection Reason Input (for pending) */}
              {selectedVerification.verificationStatus === "pending" && (
                <div className="bg-white/5 rounded-lg p-4">
                  <label className="block text-gray-400 text-sm mb-2">
                    Rejection Reason (optional - only used if rejecting)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full bg-white/10 border border-gray-700/50 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-aurora-green resize-none"
                    rows={3}
                    placeholder="Enter reason for rejection (e.g., documents unclear, missing information, etc.)"
                  />
                </div>
              )}

              {/* Verified Info (if verified) */}
              {selectedVerification.verificationStatus === "verified" && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-400 mb-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">Verified</span>
                  </div>
                  <div className="text-gray-300 text-sm">
                    Verified on {formatDate(selectedVerification.verifiedAt)}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            {selectedVerification.verificationStatus === "pending" && (
              <div className="sticky bottom-0 bg-slate-900 border-t border-gray-700/50 px-6 py-4 flex gap-3">
                <button
                  onClick={() => handleReject(selectedVerification.id)}
                  disabled={actionLoading}
                  className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? "Processing..." : "Reject"}
                </button>
                <button
                  onClick={() => handleApprove(selectedVerification.id)}
                  disabled={actionLoading}
                  className="flex-1 bg-gradient-to-r from-aurora-green to-emerald-400 hover:from-aurora-green/90 hover:to-emerald-400/90 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? "Processing..." : "Approve"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
