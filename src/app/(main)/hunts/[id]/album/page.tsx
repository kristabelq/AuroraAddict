"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import toast from "react-hot-toast";
import { formatDistanceToNow, format, differenceInDays } from "date-fns";
import { useDropzone } from "react-dropzone";
import { formatSightingLocation } from "@/utils/location";
import { extractPhotoMetadata, reverseGeocode, formatCaptureDate, getDateString, getTimeString } from "@/utils/exif";
import { isPhotoOutsideHuntDates, formatValidationWindow } from "@/utils/huntValidation";
import LocationAutocomplete from "@/components/forms/LocationAutocomplete";
import TimezoneSelect from "@/components/forms/TimezoneSelect";

interface Sighting {
  id: string;
  caption: string | null;
  images: string[];
  videos: string[];
  sightingType: string;
  location: string;
  sightingDate?: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image: string;
    username: string | null;
  };
  _count: {
    likes: number;
    comments: number;
  };
  isLiked: boolean;
}

interface Hunt {
  id: string;
  name: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  isUserParticipant: boolean;
  isCreator: boolean;
  startDate: string;
  endDate: string;
  timezone: string;
  participants: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      username: string | null;
      image: string;
    };
  }>;
  user: {
    id: string;
    name: string;
    username: string | null;
    image: string;
  };
}

interface ImagePreview {
  file: File;
  preview: string;
  latitude?: number;
  longitude?: number;
  captureDate?: Date;
  timezone?: string; // IANA timezone extracted from GPS or manual
  caption?: string; // Per-photo caption
  manualLatitude?: string;
  manualLongitude?: string;
  manualDate?: string;
  manualTime?: string;
  manualTimezone?: string; // Manual timezone override
  locationSearchValue?: string;
}

export default function HuntAlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { id: huntId } = use(params);
  const [hunt, setHunt] = useState<Hunt | null>(null);
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [caption, setCaption] = useState("");
  const [sightingType, setSightingType] = useState<"realtime" | "past">("realtime");
  const [uploading, setUploading] = useState(false);
  const [extractingGPS, setExtractingGPS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showFeedView, setShowFeedView] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [overrideDateValidation, setOverrideDateValidation] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      fetchHuntAndSightings();
    }
  }, [status]);

  // Detect if mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkMobile();
  }, []);

  const fetchHuntAndSightings = async () => {
    if (!huntId) return;

    try {
      // Fetch hunt details
      const huntResponse = await fetch(`/api/hunts/${huntId}`);
      const huntData = await huntResponse.json();

      if (!huntResponse.ok) {
        toast.error(huntData.error || "Failed to load hunt");
        router.push("/plan");
        return;
      }

      setHunt(huntData);

      // Fetch sightings
      const sightingsResponse = await fetch(`/api/hunts/${huntId}/sightings`);
      const sightingsData = await sightingsResponse.json();

      if (sightingsResponse.ok) {
        setSightings(sightingsData);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching hunt album:", error);
      toast.error("Failed to load shared album");
      setLoading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setExtractingGPS(true);

    const newImages: ImagePreview[] = [];

    for (const file of acceptedFiles) {
      const preview = URL.createObjectURL(file);

      // Extract comprehensive metadata using utility function
      const metadata = await extractPhotoMetadata(file, true);

      // Reverse geocode to get location name for this specific photo
      let locationSearchValue = "";
      if (metadata.latitude && metadata.longitude) {
        locationSearchValue = await reverseGeocode(metadata.latitude, metadata.longitude);
      }

      newImages.push({
        file,
        preview,
        latitude: metadata.latitude,
        longitude: metadata.longitude,
        captureDate: metadata.captureDate,
        timezone: metadata.timezone,
        caption: "", // Initialize with empty caption
        locationSearchValue: locationSearchValue, // Auto-populate location field
      });
    }

    setImages((prev) => [...prev, ...newImages]);
    setExtractingGPS(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: sightingType === "past" ? 10 : 5,
  });

  const removeImage = (index: number) => {
    setImages((prev) => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const updateImageData = (index: number, field: keyof ImagePreview, value: any) => {
    setImages((prev) => {
      const newImages = [...prev];
      newImages[index] = { ...newImages[index], [field]: value };
      return newImages;
    });
  };

  // Check if image date is within hunt date range (with 24-hour window)
  // Uses timezone-aware validation
  const isImageOutsideHuntDateRange = (img: ImagePreview): boolean => {
    if (!hunt) return false;

    let imageDate: Date | null = null;
    let imageTimezone: string | undefined = undefined;

    // Get date from metadata or manual input
    if (img.captureDate) {
      imageDate = img.captureDate;
      imageTimezone = img.timezone || img.manualTimezone;
    } else if (img.manualDate && img.manualTime) {
      imageDate = new Date(`${img.manualDate}T${img.manualTime}`);
      imageTimezone = img.manualTimezone;
    }

    if (!imageDate) return false;

    // Use the timezone-aware validation utility with 24-hour window
    return isPhotoOutsideHuntDates(
      imageDate,
      imageTimezone,
      hunt.startDate,
      hunt.endDate,
      hunt.timezone,
      24 // 24-hour window (not 48)
    );
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (images.length === 0) {
      toast.error("Please add at least one image");
      return;
    }

    setUploading(true);

    try {
      let successCount = 0;
      let failCount = 0;

      // Process each image individually
      for (const img of images) {
        const formData = new FormData();

        // Add the single image
        formData.append("images", img.file);

        // Use per-photo caption, fallback to global caption if empty
        formData.append("caption", img.caption || caption);
        formData.append("sightingType", sightingType);
        formData.append("huntId", huntId!);

        // Use location from GPS metadata or manual input - required
        let finalLat: number | undefined = img.latitude;
        let finalLng: number | undefined = img.longitude;

        // If no metadata GPS, check for manual input
        if (!finalLat || !finalLng) {
          if (img.manualLatitude && img.manualLongitude) {
            finalLat = parseFloat(img.manualLatitude);
            finalLng = parseFloat(img.manualLongitude);
            if (isNaN(finalLat) || isNaN(finalLng)) {
              console.warn("Skipping image - invalid manual GPS coordinates");
              failCount++;
              continue;
            }
          } else {
            console.warn("Skipping image - no GPS location data");
            failCount++;
            continue;
          }
        }

        formData.append("latitude", finalLat.toString());
        formData.append("longitude", finalLng.toString());

        // Reverse geocode to get human-readable location
        let locationName = `${finalLat.toFixed(4)}, ${finalLng.toFixed(4)}`;
        try {
          const geocodeResponse = await fetch(
            `/api/geocode/reverse?lat=${finalLat}&lng=${finalLng}`
          );
          if (geocodeResponse.ok) {
            const geocodeData = await geocodeResponse.json();
            locationName = geocodeData.location || locationName;
          }
        } catch (error) {
          console.warn("Failed to reverse geocode, using coordinates", error);
        }

        formData.append("location", locationName);

        // Use date/time from EXIF metadata or manual input for past sightings - required
        if (sightingType === "past") {
          let captureDateStr: string;
          let captureTimeStr: string;

          if (img.captureDate) {
            // Use metadata date/time
            captureDateStr = format(img.captureDate, "yyyy-MM-dd");
            captureTimeStr = format(img.captureDate, "HH:mm");
          } else if (img.manualDate && img.manualTime) {
            // Use manual input
            captureDateStr = img.manualDate;
            captureTimeStr = img.manualTime;
          } else {
            console.warn("Skipping past sighting image - no date/time data");
            failCount++;
            continue;
          }

          // Check if image date is within hunt date range (unless override is enabled)
          if (!overrideDateValidation && isImageOutsideHuntDateRange(img)) {
            console.warn("Skipping image - date is outside hunt period");
            failCount++;
            continue;
          }

          formData.append("sightingDate", captureDateStr);
          formData.append("sightingTime", captureTimeStr);
          // Use photo's timezone if available, otherwise use hunt's timezone
          const effectiveTimezone = img.timezone || img.manualTimezone || hunt?.timezone || "UTC";
          formData.append("timezone", effectiveTimezone);
        }

        try {
          const response = await fetch("/api/sightings/create", {
            method: "POST",
            body: formData,
          });

          const data = await response.json();

          if (response.ok) {
            successCount++;
          } else {
            console.error("Failed to upload image:", data.error);
            failCount++;
          }
        } catch (error) {
          console.error("Error uploading individual image:", error);
          failCount++;
        }
      }

      // Show results
      if (successCount > 0) {
        toast.success(`${successCount} sighting(s) added to shared album!`);
        setShowUploadForm(false);
        setImages([]);
        setCaption("");
        setSightingType("realtime");
        fetchHuntAndSightings();
      }

      if (failCount > 0) {
        toast.error(`${failCount} image(s) failed to upload`);
      }
    } catch (error) {
      console.error("Error uploading sightings:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!hunt) {
    return null;
  }

  const canPost = hunt.isUserParticipant || hunt.isCreator;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black pb-24">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/hunts")}
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
            Back to Hunt
          </button>

          {/* Title and Action Button */}
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-3xl font-bold text-white">Shared Album</h1>
            {canPost && !showUploadForm && (
              <button
                onClick={() => setShowUploadForm(true)}
                className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:from-green-500 hover:to-blue-600 transition-colors"
              >
                + Add Sighting
              </button>
            )}
          </div>

          {/* Hunt Name and Participants */}
          <div className="flex items-center gap-3">
            <h2 className="text-lg text-gray-300 font-medium">{hunt.name}</h2>
            <div className="w-px h-5 bg-gray-600"></div>
            {/* Participants */}
            {(() => {
              // Get all participants (including creator)
              const allParticipants = [
                { user: hunt.user },
                ...hunt.participants.map(p => ({ user: p.user }))
              ];

              // Remove duplicates by user id
              const uniqueParticipants = allParticipants.filter((participant, index, self) =>
                index === self.findIndex(p => p.user.id === participant.user.id)
              );

              return (
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {uniqueParticipants.slice(0, 5).map((participant) => (
                      <button
                        key={participant.user.id}
                        onClick={() => router.push(`/profile/${participant.user.username || participant.user.id}`)}
                        className="hover:scale-110 hover:z-10 transition-transform"
                        title={participant.user.name}
                      >
                        <img
                          src={participant.user.image || "/default-avatar.png"}
                          alt={participant.user.name}
                          className="w-9 h-9 rounded-full ring-2 ring-black hover:ring-aurora-green transition-all"
                        />
                      </button>
                    ))}
                  </div>
                  {uniqueParticipants.length > 5 && (
                    <span className="text-sm text-gray-400 ml-1">
                      +{uniqueParticipants.length - 5}
                    </span>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Upload Form */}
        {showUploadForm && canPost && (
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Add to Shared Album
            </h2>
            <form onSubmit={handleUpload} className="space-y-6">
              {/* Sighting Type */}
              <div>
                <label className="block text-white font-medium mb-3">
                  Sighting Type *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setSightingType("realtime")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      sightingType === "realtime"
                        ? "border-aurora-green bg-aurora-green/10 text-white"
                        : "border-gray-600 bg-white/5 text-gray-400 hover:border-gray-500"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="font-semibold">Real-time</div>
                      <div className="text-xs text-center">
                        Happening now
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSightingType("past")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      sightingType === "past"
                        ? "border-aurora-blue bg-aurora-blue/10 text-white"
                        : "border-gray-600 bg-white/5 text-gray-400 hover:border-gray-500"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <div className="font-semibold">Past Sighting</div>
                      <div className="text-xs text-center">
                        From a previous occasion
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Date Validation Override Toggle (for Past Sightings only) */}
              {sightingType === "past" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="overrideDateValidation"
                      checked={overrideDateValidation}
                      onChange={(e) => setOverrideDateValidation(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 text-aurora-blue focus:ring-aurora-blue focus:ring-offset-0"
                    />
                    <label htmlFor="overrideDateValidation" className="text-sm text-gray-300 cursor-pointer">
                      Override date validation (allow photos outside hunt dates)
                    </label>
                  </div>

                  {overrideDateValidation && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                      <div className="flex gap-3">
                        <svg
                          className="w-6 h-6 text-red-400 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        <div className="text-sm text-gray-300">
                          <p className="font-semibold text-red-300 mb-2">
                            ⚠️ Data Integrity Warning
                          </p>
                          <p className="mb-2">
                            You have enabled manual date override. This may compromise the accuracy and reliability of the shared album data.
                          </p>
                          <p className="text-xs text-red-400/80">
                            <strong>Common reasons for incorrect dates:</strong>
                          </p>
                          <ul className="text-xs text-red-400/80 list-disc list-inside mt-1 space-y-1">
                            <li>Camera date/time settings were incorrect</li>
                            <li>Camera timezone was not set properly</li>
                            <li>Photos were edited and metadata was modified</li>
                          </ul>
                          <p className="text-xs text-red-400/80 mt-2">
                            Please only use this override if you are certain the photo metadata is unreliable and you can manually verify the correct date.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Real-time: Camera only on mobile */}
              {sightingType === "realtime" && !isMobile && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <div className="flex gap-3">
                    <svg
                      className="w-6 h-6 text-yellow-400 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <div className="text-sm text-gray-300">
                      <p className="font-semibold text-white mb-1">
                        Mobile Device Required
                      </p>
                      <p>
                        Real-time sightings can only be posted from mobile devices using the camera.
                        Please switch to "Past Sighting" to upload from desktop.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Image Upload */}
              {(sightingType === "past" || (sightingType === "realtime" && isMobile)) && (
                <div>
                  <label className="block text-white font-medium mb-2">
                    Photos {images.length > 0 && `(${images.length}/${sightingType === "past" ? 10 : 5})`}
                  </label>

                  {images.length < (sightingType === "past" ? 10 : 5) && (
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                        isDragActive
                          ? "border-aurora-green bg-aurora-green/10"
                          : "border-gray-600 hover:border-gray-500"
                      }`}
                    >
                      <input
                        {...getInputProps()}
                        accept="image/*"
                        capture={sightingType === "realtime" ? "environment" : undefined}
                      />
                      <svg
                        className="w-12 h-12 mx-auto mb-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {isDragActive ? (
                        <p className="text-aurora-green">Drop your photos here</p>
                      ) : (
                        <>
                          <p className="text-gray-300 mb-2">
                            {sightingType === "realtime"
                              ? "Tap to take a photo"
                              : "Drag & drop photos here, or click to select"}
                          </p>
                          <p className="text-sm text-gray-500">
                            Up to {sightingType === "past" ? 10 : 5} images (JPEG, PNG, WebP)
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {/* Image Previews */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {images.map((img, index) => (
                        <div key={index} className="space-y-2">
                          <div className="relative group">
                            <img
                              src={img.preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-48 object-cover rounded-lg"
                            />
                            <div className="absolute top-2 left-2 flex flex-col gap-1">
                              {img.latitude && img.longitude && (
                                <div className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                                  GPS ✓
                                </div>
                              )}
                              {img.captureDate && (
                                <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                  <span>📅 {format(img.captureDate, "dd MMM HH:mm")}</span>
                                  {img.timezone && (
                                    <span className="text-blue-100">🌍</span>
                                  )}
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                          {/* Per-photo Editable Metadata */}
                          <div className="space-y-3 bg-white/5 p-3 rounded-lg">
                            {/* Caption */}
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Caption</label>
                              <textarea
                                value={img.caption || ""}
                                onChange={(e) => updateImageData(index, "caption", e.target.value)}
                                placeholder="Describe this photo..."
                                className="w-full bg-white/10 border border-gray-600 rounded px-2 py-1.5 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-aurora-green resize-none"
                                rows={2}
                                maxLength={500}
                              />
                            </div>

                            {/* Location Search */}
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">
                                📍 Location {img.latitude && img.longitude && <span className="text-green-400">✓ Auto-detected</span>}
                              </label>
                              <LocationAutocomplete
                                value={img.locationSearchValue || (img.latitude && img.longitude ? `${img.latitude.toFixed(4)}, ${img.longitude.toFixed(4)}` : "")}
                                onChange={async (loc, lat, lng) => {
                                  updateImageData(index, "locationSearchValue", loc);
                                  if (lat && lng) {
                                    updateImageData(index, "manualLatitude", lat);
                                    updateImageData(index, "manualLongitude", lng);

                                    // Auto-update timezone based on location
                                    try {
                                      const response = await fetch(`/api/timezone?lat=${lat}&lng=${lng}`);
                                      const data = await response.json();
                                      if (data.timezone) {
                                        updateImageData(index, "manualTimezone", data.timezone);
                                      }
                                    } catch (error) {
                                      console.warn("Failed to fetch timezone for location:", error);
                                    }
                                  }
                                }}
                                placeholder="Search for location..."
                                className="w-full bg-white/10 border border-gray-600 rounded px-2 py-1.5 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-aurora-green"
                              />
                            </div>

                            {/* Date and Time */}
                            {sightingType === "past" && (
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">
                                  📅 Date & Time {img.captureDate && <span className="text-blue-400">✓ Auto-detected</span>}
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    type="date"
                                    value={img.manualDate || (img.captureDate ? getDateString(img.captureDate, img.manualTimezone || img.timezone) : "")}
                                    onChange={(e) => updateImageData(index, "manualDate", e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                    className="w-full bg-white/10 border border-gray-600 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-aurora-blue"
                                  />
                                  <input
                                    type="time"
                                    value={img.manualTime || (img.captureDate ? getTimeString(img.captureDate, img.manualTimezone || img.timezone) : "")}
                                    onChange={(e) => updateImageData(index, "manualTime", e.target.value)}
                                    className="w-full bg-white/10 border border-gray-600 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-aurora-blue"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Timezone */}
                            {sightingType === "past" && (
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">
                                  🌍 Timezone {img.timezone && <span className="text-blue-300">✓ Auto-detected</span>}
                                </label>
                                <TimezoneSelect
                                  value={img.manualTimezone || img.timezone || hunt?.timezone || "UTC"}
                                  onChange={(tz) => updateImageData(index, "manualTimezone", tz)}
                                  className="w-full bg-white/10 border border-gray-600 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-aurora-blue"
                                />
                              </div>
                            )}

                            {/* GPS Coordinates Display */}
                            {(img.latitude || img.manualLatitude) && (
                              <div className="text-xs text-gray-400">
                                <span className="text-green-400">GPS:</span> {(img.latitude || parseFloat(img.manualLatitude!)).toFixed(6)}, {(img.longitude || parseFloat(img.manualLongitude!)).toFixed(6)}
                              </div>
                            )}

                            {/* Warning if image is outside hunt dates */}
                            {sightingType === "past" && !overrideDateValidation && isImageOutsideHuntDateRange(img) && hunt && (
                              <div className="bg-orange-500/10 border border-orange-500/30 rounded px-2 py-2">
                                <div className="flex items-start gap-2">
                                  <span className="text-orange-400">⚠️</span>
                                  <div className="text-orange-300 text-xs">
                                    <p className="font-semibold mb-1">Date outside hunt period</p>
                                    <p className="text-orange-400/80">
                                      Outside 24-hour window: {formatValidationWindow(hunt.startDate, hunt.endDate, hunt.timezone, 24).start} - {formatValidationWindow(hunt.startDate, hunt.endDate, hunt.timezone, 24).end}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {extractingGPS && (
                    <p className="text-sm text-aurora-blue mt-2">
                      Extracting metadata (GPS, date/time, timezone) from images...
                    </p>
                  )}
                </div>
              )}


              {/* Caption */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Caption (Optional)
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Describe your aurora experience..."
                  className="w-full bg-white/5 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-aurora-blue resize-none"
                  rows={4}
                  maxLength={500}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {caption.length}/500 characters
                </p>
              </div>

              {/* Metadata Info */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex gap-3">
                  <svg
                    className="w-6 h-6 text-blue-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="text-sm text-gray-300">
                    <p className="font-semibold text-white mb-2">
                      Automatic Metadata Extraction
                    </p>
                    <p className="mb-2">
                      📍 Location (GPS coordinates) will be automatically extracted from photo metadata
                    </p>
                    <p className="mb-2">
                      📅 Date and time will be automatically extracted from photo metadata for past sightings
                    </p>
                    <p>
                      🌍 Timezone will be detected from GPS coordinates if available
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadForm(false);
                    setImages([]);
                    setCaption("");
                    setSightingType("realtime");
                  }}
                  className="flex-1 bg-gray-700 text-white py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || images.length === 0}
                  className="flex-1 bg-gradient-to-r from-green-400 to-blue-500 text-white py-3 rounded-lg font-medium hover:from-green-500 hover:to-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? "Adding..." : "Add to Album"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Album Stats */}
        {sightings.length > 0 && (() => {
          // Calculate total pictures
          const totalPictures = sightings.reduce((sum, sighting) => sum + (sighting.images?.length || 0), 0);

          // Calculate unique nights with sightings
          const uniqueNights = new Set(
            sightings
              .filter(s => s.sightingDate)
              .map(s => format(new Date(s.sightingDate!), "yyyy-MM-dd"))
          ).size;

          // Calculate total hunt nights
          const totalNights = differenceInDays(new Date(hunt.endDate), new Date(hunt.startDate)) + 1;

          // Calculate success rate
          const successRate = totalNights > 0 ? Math.round((uniqueNights / totalNights) * 100) : 0;

          // Get all participants (including creator)
          const allParticipants = [
            { user: hunt.user },
            ...hunt.participants.map(p => ({ user: p.user }))
          ];

          // Remove duplicates by user id
          const uniqueParticipants = allParticipants.filter((participant, index, self) =>
            index === self.findIndex(p => p.user.id === participant.user.id)
          );

          // Extract countries from sightings locations
          const getCountryCode = (location: string): string | null => {
            // Country mappings - including native names
            const countryMap: { [key: string]: string } = {
              'united states': 'US',
              'new zealand': 'NZ',
              'norway': 'NO',
              'norge': 'NO', // Norwegian
              'sweden': 'SE',
              'sverige': 'SE', // Swedish
              'finland': 'FI',
              'suomi': 'FI', // Finnish
              'iceland': 'IS',
              'ísland': 'IS', // Icelandic
              'canada': 'CA',
              'usa': 'US',
              'greenland': 'GL',
              'grønland': 'GL', // Danish
              'kalaallit nunaat': 'GL', // Greenlandic
              'denmark': 'DK',
              'danmark': 'DK', // Danish
              'alaska': 'US',
              'scotland': 'GB',
              'united kingdom': 'GB',
              'russia': 'RU',
              'россия': 'RU', // Russian
              'faroe islands': 'FO',
              'føroyar': 'FO', // Faroese
            };

            const locationLower = location.toLowerCase().trim();

            // Split by comma and check the last part first (usually contains the country)
            const parts = locationLower.split(',').map(p => p.trim());

            // Check from last part to first
            for (let i = parts.length - 1; i >= 0; i--) {
              const part = parts[i];
              for (const [country, code] of Object.entries(countryMap)) {
                if (part === country || part.includes(country)) {
                  return code;
                }
              }
            }

            return null;
          };

          // Get unique countries
          const countryCodes = new Set<string>();
          sightings.forEach(sighting => {
            if (sighting.location) {
              const code = getCountryCode(sighting.location);
              if (code) {
                countryCodes.add(code);
              }
            }
          });

          const uniqueCountries = Array.from(countryCodes);

          return (
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">Album Stats</h2>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-aurora-green mb-1">{totalPictures}</div>
                  <div className="text-sm text-gray-400">Pictures Posted</div>
                </div>

                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-aurora-blue mb-1">
                    {uniqueNights}/{totalNights}
                  </div>
                  <div className="text-sm text-gray-400">Nights with Sightings</div>
                </div>

                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-aurora-purple mb-1">{successRate}%</div>
                  <div className="text-sm text-gray-400">Success Rate</div>
                </div>
              </div>

              {/* Countries */}
              {uniqueCountries.length > 0 && (
                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  <span className="text-sm text-gray-400 font-medium">Countries:</span>
                  <div className="flex gap-2">
                    {uniqueCountries.map(code => (
                      <span
                        key={code}
                        className="text-2xl"
                        title={code}
                      >
                        {String.fromCodePoint(...[...code].map(c => 0x1F1E6 - 65 + c.charCodeAt(0)))}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Gallery with Date Separators */}
        <div>
          {sightings.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-12 text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-gray-400 mb-4">
                No sightings yet. Be the first to share!
              </p>
              {canPost && !showUploadForm && (
                <button
                  onClick={() => setShowUploadForm(true)}
                  className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:from-green-500 hover:to-blue-600 transition-colors"
                >
                  Add First Sighting
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {(() => {
                // Group sightings by date
                const sightingsByDate: { [key: string]: { sighting: Sighting; image: string; imgIndex: number; globalIndex: number }[] } = {};
                let globalIndex = 0;

                sightings
                  .filter((sighting) => sighting.images && sighting.images.length > 0)
                  .sort((a, b) => {
                    const dateA = a.sightingDate ? new Date(a.sightingDate).getTime() : new Date(a.createdAt).getTime();
                    const dateB = b.sightingDate ? new Date(b.sightingDate).getTime() : new Date(b.createdAt).getTime();
                    return dateA - dateB; // Sort ascending (earliest first)
                  })
                  .forEach((sighting) => {
                    sighting.images.forEach((image, imgIndex) => {
                      const date = sighting.sightingDate
                        ? format(new Date(sighting.sightingDate), "yyyy-MM-dd")
                        : format(new Date(sighting.createdAt), "yyyy-MM-dd");

                      if (!sightingsByDate[date]) {
                        sightingsByDate[date] = [];
                      }

                      sightingsByDate[date].push({ sighting, image, imgIndex, globalIndex });
                      globalIndex++;
                    });
                  });

                // Render grouped by date
                return Object.entries(sightingsByDate)
                  .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
                  .map(([date, items]) => (
                    <div key={date}>
                      {/* Date Header */}
                      <div className="sticky top-0 bg-black/80 backdrop-blur-sm z-10 px-4 py-2 -mx-4 mb-3">
                        <h3 className="text-lg font-semibold text-white">
                          {format(new Date(date), "EEEE, MMMM d, yyyy")}
                        </h3>
                      </div>

                      {/* Images Grid */}
                      <div className="grid grid-cols-3 gap-1">
                        {items.map((item) => (
                          <div
                            key={`${item.sighting.id}-${item.imgIndex}`}
                            onClick={() => {
                              setSelectedImageIndex(item.globalIndex);
                              setShowFeedView(true);
                            }}
                            className="relative aspect-square cursor-pointer overflow-hidden hover:opacity-80 transition-opacity"
                          >
                            <Image
                              src={item.image}
                              alt={item.sighting.caption || "Aurora sighting"}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
              })()}
            </div>
          )}
        </div>

        {/* Feed View Modal */}
        {showFeedView && (
          <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={() => setShowFeedView(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Navigation buttons */}
            {selectedImageIndex > 0 && (
              <button
                onClick={() => setSelectedImageIndex(prev => prev - 1)}
                className="absolute left-4 text-white hover:text-gray-300 z-10"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {selectedImageIndex < sightings.filter((sighting) => sighting.images && sighting.images.length > 0).flatMap(s => s.images).length - 1 && (
              <button
                onClick={() => setSelectedImageIndex(prev => prev + 1)}
                className="absolute right-4 text-white hover:text-gray-300 z-10"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Content */}
            <div className="max-w-6xl w-full h-full flex items-center justify-center p-4">
              {(() => {
                const allImages = sightings
                  .filter((sighting) => sighting.images && sighting.images.length > 0)
                  .flatMap((sighting) =>
                    sighting.images.map((image, imgIndex) => ({
                      image,
                      sighting,
                      imgIndex
                    }))
                  );
                const currentItem = allImages[selectedImageIndex];
                if (!currentItem) return null;

                // Helper function to get country code from location
                const getCountryCode = (location: string): string | null => {
                  const countryMap: { [key: string]: string } = {
                    'united states': 'US',
                    'new zealand': 'NZ',
                    'norway': 'NO',
                    'norge': 'NO',
                    'sweden': 'SE',
                    'sverige': 'SE',
                    'finland': 'FI',
                    'suomi': 'FI',
                    'iceland': 'IS',
                    'ísland': 'IS',
                    'canada': 'CA',
                    'usa': 'US',
                    'greenland': 'GL',
                    'grønland': 'GL',
                    'kalaallit nunaat': 'GL',
                    'denmark': 'DK',
                    'danmark': 'DK',
                    'alaska': 'US',
                    'scotland': 'GB',
                    'united kingdom': 'GB',
                    'russia': 'RU',
                    'россия': 'RU',
                    'faroe islands': 'FO',
                    'føroyar': 'FO',
                  };

                  const locationLower = location.toLowerCase().trim();
                  const parts = locationLower.split(',').map(p => p.trim());

                  for (let i = parts.length - 1; i >= 0; i--) {
                    const part = parts[i];
                    for (const [country, code] of Object.entries(countryMap)) {
                      if (part === country || part.includes(country)) {
                        return code;
                      }
                    }
                  }
                  return null;
                };

                // Helper function to convert country code to flag emoji
                const getCountryFlag = (countryCode: string): string => {
                  return String.fromCodePoint(...[...countryCode].map(c => 0x1F1E6 - 65 + c.charCodeAt(0)));
                };

                // Get country code and flag for current sighting
                const countryCode = currentItem.sighting.location ? getCountryCode(currentItem.sighting.location) : null;
                const countryFlag = countryCode ? getCountryFlag(countryCode) : null;

                return (
                  <div className="w-full max-h-full flex flex-col md:flex-row gap-0 bg-black overflow-hidden">
                    {/* Image */}
                    <div className="flex-1 relative flex items-center justify-center bg-black">
                      <img
                        src={currentItem.image}
                        alt={currentItem.sighting.caption || "Aurora sighting"}
                        className="max-h-[80vh] max-w-full object-contain"
                      />
                    </div>

                    {/* Sidebar with details */}
                    <div className="w-full md:w-96 bg-[#0a0e17] flex flex-col max-h-[80vh]">
                      {/* User Info */}
                      <div className="p-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                          <img
                            src={currentItem.sighting.user.image || "/default-avatar.png"}
                            alt={currentItem.sighting.user.name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-white">
                              {currentItem.sighting.user.name}
                            </div>
                            <div className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(currentItem.sighting.createdAt), {
                                addSuffix: true,
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Caption and Location */}
                      <div className="flex-1 overflow-y-auto p-4">
                        {currentItem.sighting.caption ? (
                          <p className="text-gray-300 text-sm whitespace-pre-wrap mb-3">
                            {currentItem.sighting.caption}
                          </p>
                        ) : (
                          <p className="text-gray-500 text-sm italic mb-3">No caption</p>
                        )}
                        {(currentItem.sighting.location || currentItem.sighting.sightingDate) && (
                          <p className="text-gray-400 text-sm">
                            {currentItem.sighting.location && currentItem.sighting.sightingDate ? (
                              `${formatSightingLocation(currentItem.sighting.location)} on ${format(new Date(currentItem.sighting.sightingDate), "dd MMM yyyy")}`
                            ) : currentItem.sighting.location ? (
                              formatSightingLocation(currentItem.sighting.location)
                            ) : currentItem.sighting.sightingDate ? (
                              `on ${format(new Date(currentItem.sighting.sightingDate), "dd MMM yyyy")}`
                            ) : null}
                          </p>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="p-4 border-t border-white/10">
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-6 h-6"
                              fill={currentItem.sighting.isLiked ? "currentColor" : "none"}
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                              />
                            </svg>
                            <span className="text-white">{currentItem.sighting._count.likes}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                              />
                            </svg>
                            <span className="text-white">{currentItem.sighting._count.comments}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
