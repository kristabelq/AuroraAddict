'use client';

import { useRouter } from 'next/navigation';
import { getCategoryConfig, formatPrice } from '@/lib/business-category-config';

interface CategoryPreview {
  count: number;
  minPrice?: number;
  currency?: string;
  highlights?: string[];
  hasBookingOptions?: boolean;
}

interface CategoryPreviewCardProps {
  businessId: string;
  service: string;
  preview: CategoryPreview;
}

export default function CategoryPreviewCard({
  businessId,
  service,
  preview
}: CategoryPreviewCardProps) {
  const router = useRouter();
  const config = getCategoryConfig(service);

  if (!config) {
    return null; // Invalid service type
  }

  const { icon, label, ctaText, route } = config;

  const handleClick = () => {
    router.push(`/businesses/${businessId}/${route}`);
  };

  return (
    <div className="bg-white/5 rounded-lg p-6 border border-white/10 hover:border-aurora-green/30 transition-all">
      <div className="flex items-start justify-between gap-4">
        {/* Left side: Icon and info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{icon}</span>
            <h3 className="text-xl font-semibold text-white">{label}</h3>
          </div>

          {/* Preview info based on service type */}
          {service === 'accommodation' && preview.count > 0 && (
            <div className="space-y-2">
              <p className="text-gray-400">
                {preview.count} room {preview.count === 1 ? 'type' : 'types'} available
              </p>

              {preview.minPrice && (
                <p className="text-aurora-green font-semibold text-lg">
                  From {formatPrice(preview.minPrice, preview.currency || 'EUR')}/night
                </p>
              )}

              {preview.highlights && preview.highlights.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {preview.highlights.slice(0, 3).map((highlight, index) => (
                    <span
                      key={index}
                      className="text-xs bg-white/10 text-gray-300 px-2 py-1 rounded"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Placeholder for future service types */}
          {service === 'restaurant' && (
            <p className="text-gray-400">Menu items coming soon</p>
          )}
          {service === 'tour_operator' && (
            <p className="text-gray-400">Tours & experiences coming soon</p>
          )}
          {service === 'photography' && (
            <p className="text-gray-400">Portfolio coming soon</p>
          )}
          {service === 'shop' && (
            <p className="text-gray-400">Products coming soon</p>
          )}
        </div>

        {/* Right side: CTA button */}
        <button
          onClick={handleClick}
          className="flex-shrink-0 px-6 py-3 bg-aurora-green text-black font-semibold rounded-lg hover:bg-aurora-green/80 transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          {ctaText}
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
