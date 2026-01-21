'use client';

import { useState } from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    title?: string | null;
    content: string;
    images: string[];
    verifiedPurchase: boolean;
    createdAt: Date | string;
    helpfulCount: number;
    reviewer: {
      id: string;
      name: string | null;
      image: string | null;
      username: string | null;
    };
    response?: {
      id: string;
      content: string;
      createdAt: Date | string;
      isEdited: boolean;
      responder: {
        name: string | null;
        businessName: string | null;
      };
    } | null;
  };
  currentUserId?: string;
  onMarkHelpful?: (reviewId: string) => Promise<void>;
}

export default function ReviewCard({ review, currentUserId, onMarkHelpful }: ReviewCardProps) {
  const [isMarkingHelpful, setIsMarkingHelpful] = useState(false);
  const [localHelpfulCount, setLocalHelpfulCount] = useState(review.helpfulCount);
  const [hasMarkedHelpful, setHasMarkedHelpful] = useState(false);
  const [showAllImages, setShowAllImages] = useState(false);

  const handleMarkHelpful = async () => {
    if (!currentUserId) {
      toast.error('Please sign in to mark reviews as helpful');
      return;
    }

    if (hasMarkedHelpful) {
      return;
    }

    setIsMarkingHelpful(true);
    try {
      if (onMarkHelpful) {
        await onMarkHelpful(review.id);
        setLocalHelpfulCount(prev => prev + 1);
        setHasMarkedHelpful(true);
        toast.success('Marked as helpful');
      }
    } catch (error) {
      console.error('Error marking review as helpful:', error);
      toast.error('Failed to mark as helpful');
    } finally {
      setIsMarkingHelpful(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'text-aurora-green fill-aurora-green' : 'text-gray-600 fill-gray-600'
            }`}
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
    );
  };

  const formattedDate = typeof review.createdAt === 'string'
    ? new Date(review.createdAt)
    : review.createdAt;

  const displayImages = showAllImages ? review.images : review.images.slice(0, 3);

  return (
    <div className="bg-white/5 rounded-lg border border-white/10 p-6 hover:border-aurora-green/20 transition-all">
      {/* Reviewer Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
            {review.reviewer.image ? (
              <Image
                src={review.reviewer.image}
                alt={review.reviewer.name || 'Reviewer'}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            )}
          </div>

          {/* Name & Date */}
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-white font-semibold">
                {review.reviewer.name || review.reviewer.username || 'Anonymous'}
              </h4>
              {review.verifiedPurchase && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-aurora-green/20 text-aurora-green text-xs font-medium rounded-full">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                  Verified Purchase
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm">
              {formatDistanceToNow(formattedDate, { addSuffix: true })}
            </p>
          </div>
        </div>

        {/* Rating */}
        <div>{renderStars(review.rating)}</div>
      </div>

      {/* Review Title */}
      {review.title && (
        <h3 className="text-lg font-semibold text-white mb-2">{review.title}</h3>
      )}

      {/* Review Content */}
      <p className="text-gray-300 leading-relaxed mb-4">{review.content}</p>

      {/* Review Images */}
      {review.images.length > 0 && (
        <div className="mb-4">
          <div className="grid grid-cols-3 gap-2">
            {displayImages.map((image, index) => (
              <div
                key={index}
                className="relative aspect-square rounded-lg overflow-hidden bg-gray-800 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <Image
                  src={image}
                  alt={`Review image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 33vw, 200px"
                />
              </div>
            ))}
          </div>
          {review.images.length > 3 && !showAllImages && (
            <button
              onClick={() => setShowAllImages(true)}
              className="mt-2 text-aurora-green hover:text-aurora-green/80 text-sm font-medium"
            >
              +{review.images.length - 3} more photos
            </button>
          )}
        </div>
      )}

      {/* Helpful Button */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <button
          onClick={handleMarkHelpful}
          disabled={isMarkingHelpful || hasMarkedHelpful || !currentUserId}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
            transition-all disabled:cursor-not-allowed
            ${
              hasMarkedHelpful
                ? 'bg-aurora-green/20 text-aurora-green'
                : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white disabled:opacity-50'
            }
          `}
        >
          <svg
            className={`w-4 h-4 ${isMarkingHelpful ? 'animate-pulse' : ''}`}
            fill={hasMarkedHelpful ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
            />
          </svg>
          {hasMarkedHelpful ? 'Marked as helpful' : 'Helpful'}
          {localHelpfulCount > 0 && (
            <span className="text-xs">({localHelpfulCount})</span>
          )}
        </button>

        {!currentUserId && (
          <p className="text-xs text-gray-500">Sign in to mark as helpful</p>
        )}
      </div>

      {/* Business Response */}
      {review.response && (
        <div className="mt-4 ml-8 p-4 bg-aurora-blue/10 border border-aurora-blue/20 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-aurora-blue/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-aurora-blue" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h5 className="text-white font-semibold text-sm">
                  Response from {review.response.responder.businessName || review.response.responder.name}
                </h5>
                {review.response.isEdited && (
                  <span className="text-xs text-gray-500">(edited)</span>
                )}
              </div>
              <p className="text-gray-400 text-xs mb-2">
                {formatDistanceToNow(
                  typeof review.response.createdAt === 'string'
                    ? new Date(review.response.createdAt)
                    : review.response.createdAt,
                  { addSuffix: true }
                )}
              </p>
              <p className="text-gray-300 text-sm leading-relaxed">
                {review.response.content}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
