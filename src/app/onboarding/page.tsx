"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const BUSINESS_CATEGORIES = [
  { value: "accommodation", label: "Accommodation" },
  { value: "tour_operator", label: "Tour Operator" },
  { value: "photography", label: "Photography Service" },
  { value: "restaurant", label: "Restaurant/Café" },
  { value: "shop", label: "Shop/Retail" },
  { value: "other", label: "Other" },
];

const BUSINESS_SERVICES = [
  { value: "accommodation", label: "Accommodation" },
  { value: "restaurant", label: "Restaurant/Café" },
  { value: "shop", label: "Shop/Retail" },
  { value: "tours", label: "Tour Operations" },
  { value: "photography", label: "Photography Service" },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [userType, setUserType] = useState<"personal" | "business">("personal");
  const [businessData, setBusinessData] = useState({
    businessName: "",
    businessCategory: "",
    businessServices: [] as string[],
    businessDescription: "",
    businessWebsite: "",
    businessPhone: "",
    businessEmail: "",
    businessAddress: "",
    businessCity: "",
    businessCountry: "Finland",
  });
  const { data: session } = useSession();
  const router = useRouter();

  const introSteps = [
    {
      title: "Welcome to Aurora Intel",
      description: "Your professional aurora hunting platform connecting tour operators, accommodations, and aurora chasers worldwide.",
      icon: "🌌",
    },
    {
      title: "Real-Time Intelligence",
      description: "Access aurora forecasts, cloud coverage, and verified sightings on an interactive map with business insights.",
      icon: "📊",
    },
  ];

  const totalSteps = userType === "business" ? 4 : 3;

  const handleNext = async () => {
    // Intro screens
    if (currentStep < introSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      return;
    }

    // User type selection screen
    if (currentStep === introSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      return;
    }

    // Business info screen (only for business users)
    if (userType === "business" && currentStep === introSteps.length) {
      // Validate business data
      if (!businessData.businessName.trim()) {
        toast.error("Please enter your business name");
        return;
      }
      if (businessData.businessServices.length === 0) {
        toast.error("Please select at least one service");
        return;
      }
      if (!businessData.businessCity.trim()) {
        toast.error("Please enter your business city");
        return;
      }
      setCurrentStep(currentStep + 1);
      return;
    }

    // Final step - complete onboarding
    try {
      const response = await fetch("/api/user/complete-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userType,
          ...(userType === "business" ? businessData : {}),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to complete onboarding");
      }

      // Force page reload to refresh session
      window.location.href = "/";
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    try {
      await fetch("/api/user/complete-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userType: "personal" }),
      });
      window.location.href = "/";
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const toggleService = (service: string) => {
    setBusinessData(prev => ({
      ...prev,
      businessServices: prev.businessServices.includes(service)
        ? prev.businessServices.filter(s => s !== service)
        : [...prev.businessServices, service],
    }));
  };

  const renderStepContent = () => {
    // Intro steps
    if (currentStep < introSteps.length) {
      const step = introSteps[currentStep];
      return (
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{step.icon}</div>
          <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
          <p className="text-gray-400">{step.description}</p>
        </div>
      );
    }

    // User type selection
    if (currentStep === introSteps.length) {
      return (
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-4">Choose Your Account Type</h2>
          <p className="text-gray-400 mb-8">Select the type of account that best describes you</p>
          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => setUserType("personal")}
              className={`p-6 rounded-lg border-2 transition-all text-left ${
                userType === "personal"
                  ? "border-aurora-green bg-aurora-green/10"
                  : "border-white/20 hover:border-white/40"
              }`}
            >
              <div className="text-3xl mb-2">🧑</div>
              <h3 className="text-lg font-semibold mb-1">Personal Account</h3>
              <p className="text-sm text-gray-400">
                For aurora enthusiasts and photographers tracking and sharing sightings
              </p>
            </button>
            <button
              onClick={() => setUserType("business")}
              className={`p-6 rounded-lg border-2 transition-all text-left ${
                userType === "business"
                  ? "border-aurora-green bg-aurora-green/10"
                  : "border-white/20 hover:border-white/40"
              }`}
            >
              <div className="text-3xl mb-2">🏢</div>
              <h3 className="text-lg font-semibold mb-1">Business Account</h3>
              <p className="text-sm text-gray-400">
                For tour operators, accommodations, and businesses in aurora tourism
              </p>
            </button>
          </div>
        </div>
      );
    }

    // Business information form
    if (userType === "business" && currentStep === introSteps.length + 1) {
      return (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-center">Business Information</h2>
          <p className="text-gray-400 mb-6 text-center text-sm">
            Tell us about your business to get started
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Business Name *</label>
              <input
                type="text"
                value={businessData.businessName}
                onChange={(e) => setBusinessData({ ...businessData, businessName: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-aurora-green"
                placeholder="Your Business Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Services Offered *</label>
              <div className="grid grid-cols-2 gap-2">
                {BUSINESS_SERVICES.map((service) => (
                  <button
                    key={service.value}
                    onClick={() => toggleService(service.value)}
                    className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                      businessData.businessServices.includes(service.value)
                        ? "border-aurora-green bg-aurora-green/10 text-white"
                        : "border-white/20 hover:border-white/40"
                    }`}
                  >
                    {service.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={businessData.businessDescription}
                onChange={(e) => setBusinessData({ ...businessData, businessDescription: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-aurora-green resize-none"
                rows={3}
                placeholder="Brief description of your business..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">City *</label>
                <input
                  type="text"
                  value={businessData.businessCity}
                  onChange={(e) => setBusinessData({ ...businessData, businessCity: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-aurora-green"
                  placeholder="e.g., Rovaniemi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Country</label>
                <input
                  type="text"
                  value={businessData.businessCountry}
                  onChange={(e) => setBusinessData({ ...businessData, businessCountry: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-aurora-green"
                  placeholder="Finland"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Website</label>
              <input
                type="url"
                value={businessData.businessWebsite}
                onChange={(e) => setBusinessData({ ...businessData, businessWebsite: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-aurora-green"
                placeholder="https://yourbusiness.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Business Email</label>
              <input
                type="email"
                value={businessData.businessEmail}
                onChange={(e) => setBusinessData({ ...businessData, businessEmail: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-aurora-green"
                placeholder="contact@yourbusiness.com"
              />
            </div>
          </div>
        </div>
      );
    }

    // Final step - confirmation
    return (
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold mb-2">
          {userType === "business" ? "You're All Set!" : "Ready to Hunt Auroras!"}
        </h2>
        <p className="text-gray-400">
          {userType === "business"
            ? "Your business profile has been created. You can complete verification and add services later from your profile."
            : "Start exploring aurora intelligence, track sightings, and connect with the community."}
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#0a0e17] via-[#1a1f2e] to-[#0a0e17] px-4 py-8">
      <div className="max-w-md w-full">
        {renderStepContent()}

        <div className="flex justify-center gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? "w-8 bg-aurora-green"
                  : "w-2 bg-white/20"
              }`}
            />
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex gap-4">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="flex-1 border border-white/20 hover:border-white/40 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className={`${currentStep > 0 ? 'flex-1' : 'w-full'} bg-aurora-green hover:bg-aurora-green/80 text-black font-semibold py-3 px-4 rounded-lg transition-colors`}
            >
              {currentStep === totalSteps - 1 ? "Get Started" : "Next"}
            </button>
          </div>

          {currentStep < introSteps.length && (
            <button
              onClick={handleSkip}
              className="w-full text-gray-400 hover:text-white py-2 transition-colors"
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
