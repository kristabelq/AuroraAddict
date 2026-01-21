'use client';

import { useState, useEffect } from 'react';
import ReviewCard from './ReviewCard';
import toast from 'react-hot-toast';

interface Review {
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
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface ReviewListProps {
  businessId: string;
  currentUserId?: string;
}

type SortOption = 'recent' | 'helpful' | 'rating_high' | 'rating_low';

export default function ReviewList({ businessId, currentUserId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const reviewsPerPage = 10;

  // Fetch reviews and stats
  useEffect(() => {
    fetchReviews();
  }, [businessId, page, selectedRating, sortBy]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        businessId,
        page: page.toString(),
        limit: reviewsPerPage.toString(),
        sortBy,
      });

      if (selectedRating) {
        params.append('rating', selectedRating.toString());
      }

      const response = await fetch(`/api/reviews?${params}`);
      const data = await response.json();

      if (response.ok) {
        setReviews(data.reviews);
        setStats(data.stats);
        setHasMore(data.hasMore);
        setTotalPages(data.totalPages);
      } else {
        toast.error(data.error || 'Failed to load reviews');
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    try {
      const response = await fetch('/api/reviews/helpful', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to mark as helpful');
      }

      // Update local state
      setReviews(reviews.map(review =>
        review.id === reviewId
          ? { ...review, helpfulCount: review.helpfulCount + 1 }
          : review
      ));
    } catch (error) {
      throw error;
    }
  };

  const handleRatingFilter = (rating: number) => {
    if (selectedRating === rating) {
      setSelectedRating(null);
    } else {
      setSelectedRating(rating);
    }
    setPage(1); // Reset to first page
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    setPage(1); // Reset to first page
  };

  const renderStars = (rating: number, size: 'sm' | 'lg' = 'sm') => {
    const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`${sizeClass} ${
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

  const renderRatingBar = (rating: number, count: number, total: number) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <button
        onClick={() => handleRatingFilter(rating)}
        className={`
          flex items-center gap-3 w-full p-2 rounded-lg transition-all
          ${selectedRating === rating ? 'bg-aurora-green/10 border border-aurora-green/30' : 'hover:bg-white/5'}
        `}
      >
        <span className="text-sm text-gray-400 w-8">{rating} star</span>
        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-aurora-green transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm text-gray-400 w-12 text-right">{count}</span>
      </button>
    );
  };

  if (loading && page === 1) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-aurora-green" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-400">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reviews Header & Stats */}
      {stats && stats.totalReviews > 0 && (
        <div className="bg-white/5 rounded-lg border border-white/10 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Average Rating */}
            <div className="flex flex-col items-center md:items-start gap-2">
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold text-white">
                  {stats.averageRating.toFixed(1)}
                </span>
                <span className="text-gray-400">out of 5</span>
              </div>
              {renderStars(Math.round(stats.averageRating), 'lg')}
              <p className="text-gray-400 text-sm">
                Based on {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating}>
                  {renderRatingBar(
                    rating,
                    stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution],
                    stats.totalReviews
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters & Sort */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Rating Filter Pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setSelectedRating(null);
              setPage(1);
            }}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${
                selectedRating === null
                  ? 'bg-aurora-green text-black'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }
            `}
          >
            All ratings
          </button>
          {[5, 4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => handleRatingFilter(rating)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1
                ${
                  selectedRating === rating
                    ? 'bg-aurora-green text-black'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }
              `}
            >
              {rating}
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
            className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-aurora-green/50 transition-colors"
          >
            <option value="recent">Most Recent</option>
            <option value="helpful">Most Helpful</option>
            <option value="rating_high">Highest Rating</option>
            <option value="rating_low">Lowest Rating</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="bg-white/5 rounded-lg border border-white/10 p-12 text-center">
          <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          <h3 className="text-xl font-semibold text-white mb-2">No reviews yet</h3>
          <p className="text-gray-400">
            {selectedRating
              ? `No ${selectedRating}-star reviews found`
              : 'Be the first to leave a review!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUserId={currentUserId}
              onMarkHelpful={handleMarkHelpful}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-6">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1 || loading}
            className="
              px-4 py-2 rounded-lg bg-white/5 text-white font-medium
              hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed
              transition-all flex items-center gap-2
            "
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          <div className="flex items-center gap-2">
            {[...Array(totalPages)].map((_, index) => {
              const pageNumber = index + 1;
              // Show first page, last page, current page, and pages around current
              if (
                pageNumber === 1 ||
                pageNumber === totalPages ||
                (pageNumber >= page - 1 && pageNumber <= page + 1)
              ) {
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setPage(pageNumber)}
                    disabled={loading}
                    className={`
                      w-10 h-10 rounded-lg font-medium transition-all
                      ${
                        page === pageNumber
                          ? 'bg-aurora-green text-black'
                          : 'bg-white/5 text-white hover:bg-white/10'
                      }
                      disabled:cursor-not-allowed
                    `}
                  >
                    {pageNumber}
                  </button>
                );
              } else if (pageNumber === page - 2 || pageNumber === page + 2) {
                return (
                  <span key={pageNumber} className="text-gray-500">
                    ...
                  </span>
                );
              }
              return null;
            })}
          </div>

          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages || loading}
            className="
              px-4 py-2 rounded-lg bg-white/5 text-white font-medium
              hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed
              transition-all flex items-center gap-2
            "
          >
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Loading indicator for pagination */}
      {loading && page > 1 && (
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin h-6 w-6 text-aurora-green" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      )}
    </div>
  );
}
