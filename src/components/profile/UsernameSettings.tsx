"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface UsernameSettingsProps {
  currentUsername: string | null;
  onUpdate?: (newUsername: string) => void;
}

export default function UsernameSettings({
  currentUsername,
  onUpdate,
}: UsernameSettingsProps) {
  const [username, setUsername] = useState(currentUsername || "");
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setUsername(currentUsername || "");
  }, [currentUsername]);

  useEffect(() => {
    // Debounce availability check
    if (!username || username === currentUsername) {
      setAvailable(null);
      setError("");
      return;
    }

    const timeoutId = setTimeout(async () => {
      await checkAvailability(username);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username, currentUsername]);

  const checkAvailability = async (usernameToCheck: string) => {
    if (!usernameToCheck || usernameToCheck === currentUsername) {
      setAvailable(null);
      return;
    }

    setChecking(true);
    setError("");

    try {
      const response = await fetch(
        `/api/users/check-username?username=${encodeURIComponent(usernameToCheck)}`
      );
      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setAvailable(false);
      } else {
        setAvailable(data.available);
        setError("");
      }
    } catch (err) {
      setError("Failed to check availability");
      setAvailable(false);
    } finally {
      setChecking(false);
    }
  };

  const handleSave = async () => {
    if (!username || username === currentUsername) {
      return;
    }

    if (!available) {
      toast.error("Please choose an available username");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/users/username", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Username updated successfully!");
        if (onUpdate) {
          onUpdate(data.username);
        }
        // Reload the page to update the session
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error(data.error || "Failed to update username");
      }
    } catch (err) {
      toast.error("Failed to update username");
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = () => {
    if (checking) return "text-gray-400";
    if (error) return "text-red-400";
    if (available) return "text-green-400";
    if (available === false) return "text-red-400";
    return "text-gray-400";
  };

  const getStatusText = () => {
    if (checking) return "Checking...";
    if (error) return error;
    if (available) return "Username is available!";
    if (available === false) return "Username is taken";
    return "Choose a unique username";
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Username (Handle)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            @
          </span>
          <input
            type="text"
            value={username}
            onChange={(e) => {
              const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
              setUsername(value);
            }}
            placeholder="username"
            className="w-full pl-8 pr-4 py-2 bg-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-aurora-green"
            maxLength={20}
          />
        </div>
        <p className={`text-sm mt-1 ${getStatusColor()}`}>
          {getStatusText()}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Use lowercase letters, numbers, and underscores only (3-20 characters)
        </p>
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !available || username === currentUsername}
        className="w-full px-4 py-2 bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? "Saving..." : "Save Username"}
      </button>
    </div>
  );
}
