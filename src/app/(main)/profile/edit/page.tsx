"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import toast from "react-hot-toast";
import UsernameSettings from "@/components/profile/UsernameSettings";

export default function EditProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    instagram: "",
    whatsappNumber: "",
    publicEmail: "",
    image: "",
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [userType, setUserType] = useState<string>("personal");
  const [verificationStatus, setVerificationStatus] = useState<string>("unverified");
  const [businessName, setBusinessName] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      fetchProfile();
    }
  }, [status]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to load profile");
        router.push("/profile");
        return;
      }

      setFormData({
        username: data.username || "",
        bio: data.bio || "",
        instagram: data.instagram || "",
        whatsappNumber: data.whatsappNumber || "",
        publicEmail: data.publicEmail || "",
        image: data.image || "",
      });

      // Set business account info
      setUserType(data.userType || "personal");
      setVerificationStatus(data.verificationStatus || "unverified");
      setBusinessName(data.businessName || null);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
      router.push("/profile");
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload image
    setUploadingImage(true);
    const imageFormData = new FormData();
    imageFormData.append("image", file);

    try {
      const response = await fetch("/api/user/profile/image", {
        method: "POST",
        body: imageFormData,
      });

      const data = await response.json();

      if (response.ok) {
        setFormData({ ...formData, image: data.imageUrl });
        toast.success("Profile image updated!");
      } else {
        toast.error(data.error || "Failed to upload image");
        setPreviewImage(null);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
      setPreviewImage(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: formData.bio.trim() || null,
          instagram: formData.instagram.trim() || null,
          whatsappNumber: formData.whatsappNumber.trim() || null,
          publicEmail: formData.publicEmail.trim() || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Profile updated successfully!");
        router.push("/profile");
      } else {
        toast.error(data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setSaving(false);
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
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/profile")}
            className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Profile
          </button>

          <h1 className="text-3xl font-bold text-white">Edit Profile</h1>
          <p className="text-gray-400 mt-2">
            Update your profile information
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Image Section */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Profile Photo</h2>
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 rounded-full overflow-hidden flex-shrink-0">
                {previewImage || formData.image ? (
                  <Image
                    src={previewImage || formData.image}
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-aurora-blue to-aurora-green flex items-center justify-center text-white text-3xl font-bold">
                    {session?.user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-t-aurora-green border-r-aurora-blue border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="px-4 py-2 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-lg font-medium hover:from-green-500 hover:to-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingImage ? "Uploading..." : "Change Photo"}
                </button>
                <p className="text-sm text-gray-400 mt-2">
                  JPG, PNG or GIF. Max size 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Username Settings */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Username</h2>
            <UsernameSettings currentUsername={formData.username} />
          </div>

          {/* Profile Info Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Bio Section */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Bio</h2>
              <div>
                <textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  className="w-full bg-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-aurora-green resize-none"
                  rows={4}
                  placeholder="Tell people about yourself..."
                  maxLength={150}
                />
                <p className="text-sm text-gray-400 mt-2">
                  {formData.bio.length}/150 characters
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Contact Information</h2>
              <div className="space-y-4">
                {/* Instagram */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Instagram Handle
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      @
                    </span>
                    <input
                      type="text"
                      value={formData.instagram}
                      onChange={(e) =>
                        setFormData({ ...formData, instagram: e.target.value })
                      }
                      className="w-full bg-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-aurora-green"
                      placeholder="yourusername"
                    />
                  </div>
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    WhatsApp Number
                  </label>
                  <input
                    type="text"
                    value={formData.whatsappNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, whatsappNumber: e.target.value })
                    }
                    className="w-full bg-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-aurora-green"
                    placeholder="e.g., 6591234567 (with country code, no spaces)"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Include country code without + or spaces (e.g., 6591234567 for Singapore)
                  </p>
                </div>

                {/* Public Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Public Email
                  </label>
                  <input
                    type="email"
                    value={formData.publicEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, publicEmail: e.target.value })
                    }
                    className="w-full bg-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-aurora-green"
                    placeholder="your@email.com"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    This email will be visible on your public profile
                  </p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white py-3 rounded-lg font-medium hover:from-green-500 hover:to-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>

          {/* Business Account Section */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border-2 border-amber-500/30">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white">Business Account</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Upgrade to a business account to create and manage business chats
                </p>
              </div>
            </div>

            {userType === "personal" && verificationStatus === "unverified" ? (
              <div>
                <div className="bg-white/5 rounded-lg p-4 mb-4">
                  <h3 className="text-white font-medium mb-2">Why upgrade to business?</h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-aurora-green flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Create and manage your own business chats</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-aurora-green flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Engage directly with aurora hunters in your area</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-aurora-green flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Verified badge on your profile and chats</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-aurora-green flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Both public and private chat options</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => router.push("/profile/business-upgrade")}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Upgrade to Business Account
                </button>
              </div>
            ) : verificationStatus === "pending" ? (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                  <h3 className="text-white font-medium">Verification Pending</h3>
                </div>
                <p className="text-sm text-gray-300">
                  Your business verification request is being reviewed by our admin team.
                  We'll notify you once it's processed (usually within 24-48 hours).
                </p>
              </div>
            ) : verificationStatus === "verified" ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <h3 className="text-white font-medium">Business Verified ✓</h3>
                </div>
                <p className="text-sm text-gray-300 mb-3">
                  {businessName && <strong>{businessName}</strong>} is verified and ready to create business chats!
                </p>
                <button
                  onClick={() => router.push("/business/subscriptions")}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-2.5 rounded-lg font-medium hover:from-green-600 hover:to-blue-600 transition-colors"
                >
                  Manage Business Chats
                </button>
              </div>
            ) : verificationStatus === "rejected" ? (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <h3 className="text-white font-medium">Verification Rejected</h3>
                </div>
                <p className="text-sm text-gray-300 mb-3">
                  Unfortunately, your business verification was not approved. You can submit a new application with updated information.
                </p>
                <button
                  onClick={() => router.push("/profile/business-upgrade")}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2.5 rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-colors"
                >
                  Reapply for Verification
                </button>
              </div>
            ) : null}
          </div>

          {/* Business Management Section - Only for Verified Businesses */}
          {userType === "business" && verificationStatus === "verified" && (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-white">Business Management</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Manage your business offerings and services
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Room Types */}
                <button
                  onClick={() => router.push("/business/room-types")}
                  className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left group"
                >
                  <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Room Types</h3>
                    <p className="text-sm text-gray-400">Accommodation options</p>
                  </div>
                </button>

                {/* Menu Items */}
                <button
                  onClick={() => router.push("/business/menu-items")}
                  className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left group"
                >
                  <div className="p-2 bg-orange-500/20 rounded-lg group-hover:bg-orange-500/30 transition-colors">
                    <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Menu Items</h3>
                    <p className="text-sm text-gray-400">Restaurant menu</p>
                  </div>
                </button>

                {/* Experiences */}
                <button
                  onClick={() => router.push("/business/experiences")}
                  className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left group"
                >
                  <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Experiences</h3>
                    <p className="text-sm text-gray-400">Tour activities</p>
                  </div>
                </button>

                {/* Tours */}
                <button
                  onClick={() => router.push("/business/tours")}
                  className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left group"
                >
                  <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Tour Packages</h3>
                    <p className="text-sm text-gray-400">Guided tours</p>
                  </div>
                </button>

                {/* Photography Packages */}
                <button
                  onClick={() => router.push("/business/photography")}
                  className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left group"
                >
                  <div className="p-2 bg-pink-500/20 rounded-lg group-hover:bg-pink-500/30 transition-colors">
                    <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Photography</h3>
                    <p className="text-sm text-gray-400">Photo packages</p>
                  </div>
                </button>

                {/* Products */}
                <button
                  onClick={() => router.push("/business/products")}
                  className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left group"
                >
                  <div className="p-2 bg-cyan-500/20 rounded-lg group-hover:bg-cyan-500/30 transition-colors">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Products</h3>
                    <p className="text-sm text-gray-400">Shop items</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Back Button */}
          <button
            onClick={() => router.push("/profile")}
            className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg font-medium transition-colors"
          >
            Back to Profile
          </button>
        </div>
      </div>
    </div>
  );
}
