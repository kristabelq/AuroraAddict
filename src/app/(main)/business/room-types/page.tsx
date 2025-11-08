"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import toast from "react-hot-toast";

interface RoomType {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  priceFrom: number | null;
  currency: string;
  images: string[];
  coverImage: string | null;
  amenities: string[];
  bookingComUrl: string | null;
  agodaUrl: string | null;
  directBookingUrl: string | null;
  isActive: boolean;
  displayOrder: number;
  viewCount: number;
  clickCount: number;
}

export default function RoomTypesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomType | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    capacity: 2,
    priceFrom: "",
    currency: "EUR",
    amenities: [] as string[],
    images: [] as string[],
    coverImage: null as string | null,
    bookingComUrl: "",
    agodaUrl: "",
    directBookingUrl: "",
  });

  const [amenityInput, setAmenityInput] = useState("");
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      fetchRoomTypes();
    }
  }, [status]);

  const fetchRoomTypes = async () => {
    try {
      const response = await fetch("/api/business/room-types");
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          toast.error(data.error);
          router.push("/profile/edit");
          return;
        }
        throw new Error(data.error || "Failed to load room types");
      }

      setRoomTypes(data.roomTypes || []);
    } catch (error: any) {
      console.error("Error fetching room types:", error);
      toast.error(error.message || "Failed to load room types");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Room name is required");
      return;
    }

    if (formData.capacity < 1) {
      toast.error("Capacity must be at least 1");
      return;
    }

    try {
      const url = editingRoom
        ? `/api/business/room-types/${editingRoom.id}`
        : "/api/business/room-types";
      const method = editingRoom ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          priceFrom: formData.priceFrom ? parseFloat(formData.priceFrom) : null,
          images: formData.images,
          coverImage: formData.coverImage || (formData.images.length > 0 ? formData.images[0] : null),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save room type");
      }

      toast.success(editingRoom ? "Room updated!" : "Room added!");
      setShowAddModal(false);
      setEditingRoom(null);
      resetForm();
      fetchRoomTypes();
    } catch (error: any) {
      console.error("Error saving room type:", error);
      toast.error(error.message);
    }
  };

  const handleEdit = (room: RoomType) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      description: room.description || "",
      capacity: room.capacity,
      priceFrom: room.priceFrom?.toString() || "",
      currency: room.currency,
      amenities: room.amenities || [],
      images: room.images || [],
      coverImage: room.coverImage,
      bookingComUrl: room.bookingComUrl || "",
      agodaUrl: room.agodaUrl || "",
      directBookingUrl: room.directBookingUrl || "",
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this room type?")) {
      return;
    }

    try {
      const response = await fetch(`/api/business/room-types/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete room type");
      }

      toast.success("Room deleted!");
      fetchRoomTypes();
    } catch (error: any) {
      console.error("Error deleting room type:", error);
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      capacity: 2,
      priceFrom: "",
      currency: "EUR",
      amenities: [],
      images: [],
      coverImage: null,
      bookingComUrl: "",
      agodaUrl: "",
      directBookingUrl: "",
    });
    setAmenityInput("");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check number of images (max 10 total)
    if (formData.images.length + files.length > 10) {
      toast.error("Maximum 10 images allowed");
      return;
    }

    setUploadingImages(true);

    try {
      const uploadFormData = new FormData();
      Array.from(files).forEach((file) => {
        uploadFormData.append("images", file);
      });

      const response = await fetch("/api/business/room-types/upload", {
        method: "POST",
        body: uploadFormData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload images");
      }

      setFormData({
        ...formData,
        images: [...formData.images, ...data.imageUrls],
        coverImage: formData.coverImage || data.imageUrls[0],
      });

      toast.success(`${data.imageUrls.length} image(s) uploaded!`);
    } catch (error: any) {
      console.error("Error uploading images:", error);
      toast.error(error.message);
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (imageUrl: string) => {
    const newImages = formData.images.filter((img) => img !== imageUrl);
    setFormData({
      ...formData,
      images: newImages,
      coverImage: formData.coverImage === imageUrl
        ? (newImages.length > 0 ? newImages[0] : null)
        : formData.coverImage,
    });
  };

  const setCoverImage = (imageUrl: string) => {
    setFormData({
      ...formData,
      coverImage: imageUrl,
    });
  };

  const addAmenity = () => {
    if (amenityInput.trim() && !formData.amenities.includes(amenityInput.trim())) {
      setFormData({
        ...formData,
        amenities: [...formData.amenities, amenityInput.trim()],
      });
      setAmenityInput("");
    }
  };

  const removeAmenity = (amenity: string) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.filter((a) => a !== amenity),
    });
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
      <div className="max-w-6xl mx-auto px-4 py-8">
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

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Room Types</h1>
              <p className="text-gray-400">
                Manage your accommodation options
              </p>
            </div>
            <button
              onClick={() => {
                setEditingRoom(null);
                resetForm();
                setShowAddModal(true);
              }}
              className="bg-gradient-to-r from-aurora-green to-aurora-blue text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Room Type
            </button>
          </div>
        </div>

        {/* Room Types Grid */}
        {roomTypes.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Room Types Yet</h3>
            <p className="text-gray-400 mb-6">
              Start by adding your first accommodation option
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-aurora-green to-aurora-blue text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Add Your First Room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roomTypes.map((room) => (
              <div
                key={room.id}
                className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden hover:bg-white/10 transition-colors"
              >
                {/* Room Image */}
                <div className="relative h-48 bg-gradient-to-br from-purple-900/30 to-blue-900/30">
                  {room.coverImage ? (
                    <Image
                      src={room.coverImage}
                      alt={room.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      🏠
                    </div>
                  )}
                </div>

                {/* Room Info */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-2">{room.name}</h3>
                  {room.description && (
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                      {room.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      <span>Up to {room.capacity} guests</span>
                    </div>
                    {room.priceFrom && (
                      <div className="flex items-center gap-2 text-sm text-aurora-green font-medium">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                        </svg>
                        <span>From {room.currency} {room.priceFrom}/night</span>
                      </div>
                    )}
                  </div>

                  {/* Amenities */}
                  {room.amenities.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {room.amenities.slice(0, 3).map((amenity, index) => (
                          <span
                            key={index}
                            className="text-xs bg-white/10 px-2 py-1 rounded-full text-gray-300"
                          >
                            {amenity}
                          </span>
                        ))}
                        {room.amenities.length > 3 && (
                          <span className="text-xs text-gray-400">
                            +{room.amenities.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-400 mb-4 pb-4 border-b border-white/10">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      {room.viewCount} views
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      {room.clickCount} clicks
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(room)}
                      className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(room.id)}
                      className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1a1f2e] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-white/10 sticky top-0 bg-[#1a1f2e] z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">
                    {editingRoom ? "Edit Room Type" : "Add Room Type"}
                  </h2>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingRoom(null);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Basic Info */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Room Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-aurora-green"
                    placeholder="e.g., Aurora Glass Igloo"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-aurora-green resize-none"
                    rows={4}
                    placeholder="Describe this room type..."
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {formData.description.length}/500 characters
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Capacity <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                      className="w-full bg-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-aurora-green"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Price From (per night)
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        className="bg-white/10 rounded-lg px-3 py-3 text-white focus:outline-none focus:ring-2 focus:ring-aurora-green"
                      >
                        <option value="EUR" className="bg-[#1a1f2e]">EUR</option>
                        <option value="USD" className="bg-[#1a1f2e]">USD</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.priceFrom}
                        onChange={(e) => setFormData({ ...formData, priceFrom: e.target.value })}
                        className="flex-1 bg-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-aurora-green"
                        placeholder="150"
                      />
                    </div>
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-4 border-t border-white/10 pt-6">
                  <h3 className="text-lg font-semibold text-white">Room Images</h3>
                  <p className="text-sm text-gray-400">
                    Upload up to 10 images. The first image will be used as the cover.
                  </p>

                  {/* Image Grid */}
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      {formData.images.map((imageUrl, index) => (
                        <div
                          key={index}
                          className={`relative aspect-video rounded-lg overflow-hidden group ${
                            formData.coverImage === imageUrl ? "ring-2 ring-aurora-green" : ""
                          }`}
                        >
                          <Image
                            src={imageUrl}
                            alt={`Room image ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            {formData.coverImage !== imageUrl && (
                              <button
                                type="button"
                                onClick={() => setCoverImage(imageUrl)}
                                className="bg-aurora-green/80 hover:bg-aurora-green text-white px-3 py-1 rounded text-xs font-medium"
                              >
                                Set as Cover
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeImage(imageUrl)}
                              className="bg-red-500/80 hover:bg-red-500 text-white px-3 py-1 rounded text-xs font-medium"
                            >
                              Remove
                            </button>
                          </div>
                          {formData.coverImage === imageUrl && (
                            <div className="absolute top-2 left-2 bg-aurora-green text-black px-2 py-1 rounded text-xs font-bold">
                              COVER
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Button */}
                  {formData.images.length < 10 && (
                    <div>
                      <input
                        type="file"
                        id="room-images"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImages}
                      />
                      <label
                        htmlFor="room-images"
                        className={`w-full bg-white/10 hover:bg-white/20 border-2 border-dashed border-gray-600 hover:border-aurora-green rounded-lg px-4 py-8 text-white transition-colors flex flex-col items-center gap-2 cursor-pointer ${
                          uploadingImages ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        {uploadingImages ? (
                          <>
                            <div className="w-8 h-8 border-4 border-t-aurora-green border-r-aurora-blue border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                            <span className="text-sm">Uploading...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span className="text-sm">
                              Click to upload room images ({formData.images.length}/10)
                            </span>
                            <span className="text-xs text-gray-500">
                              JPG, PNG up to 10MB each
                            </span>
                          </>
                        )}
                      </label>
                    </div>
                  )}
                </div>

                {/* Amenities */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amenities
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={amenityInput}
                      onChange={(e) => setAmenityInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addAmenity();
                        }
                      }}
                      className="flex-1 bg-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-aurora-green"
                      placeholder="e.g., Private Sauna"
                    />
                    <button
                      type="button"
                      onClick={addAmenity}
                      className="bg-aurora-green/20 hover:bg-aurora-green/30 text-aurora-green px-4 py-2 rounded-lg transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.amenities.map((amenity, index) => (
                      <span
                        key={index}
                        className="bg-white/10 px-3 py-1 rounded-full text-sm text-white flex items-center gap-2"
                      >
                        {amenity}
                        <button
                          type="button"
                          onClick={() => removeAmenity(amenity)}
                          className="text-gray-400 hover:text-white"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Booking URLs */}
                <div className="space-y-4 border-t border-white/10 pt-6">
                  <h3 className="text-lg font-semibold text-white">Booking Links</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Booking.com URL
                    </label>
                    <input
                      type="url"
                      value={formData.bookingComUrl}
                      onChange={(e) => setFormData({ ...formData, bookingComUrl: e.target.value })}
                      className="w-full bg-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-aurora-green"
                      placeholder="https://www.booking.com/hotel/..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Agoda URL
                    </label>
                    <input
                      type="url"
                      value={formData.agodaUrl}
                      onChange={(e) => setFormData({ ...formData, agodaUrl: e.target.value })}
                      className="w-full bg-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-aurora-green"
                      placeholder="https://www.agoda.com/..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Direct Booking URL
                    </label>
                    <input
                      type="url"
                      value={formData.directBookingUrl}
                      onChange={(e) => setFormData({ ...formData, directBookingUrl: e.target.value })}
                      className="w-full bg-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-aurora-green"
                      placeholder="https://yourbusiness.com/book"
                    />
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingRoom(null);
                      resetForm();
                    }}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-aurora-green to-aurora-blue text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    {editingRoom ? "Update Room" : "Add Room"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
