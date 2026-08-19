"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Upload, Pin, X, Link as LinkIcon, Loader2 } from "lucide-react";

export default function CreateForm({ onCardCreated, editingCard, onCardUpdated, onCancelEdit }) {
  const [formData, setFormData] = useState({
    team_name: "",
    member1_name: "",
    member1_student_id: "",
    member2_name: "",
    member2_student_id: "",
    message: "",
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoMode, setPhotoMode] = useState("upload"); // "upload" | "url"
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (editingCard) {
      setFormData({
        team_name: editingCard.team_name,
        member1_name: editingCard.member1_name,
        member1_student_id: editingCard.member1_student_id,
        member2_name: editingCard.member2_name,
        member2_student_id: editingCard.member2_student_id,
        message: editingCard.message || "",
      });
      if (editingCard.photo_url) {
        setPhotoPreview(editingCard.photo_url);
        setPhotoUrl(editingCard.photo_url);
        if (editingCard.photo_url.startsWith("http")) {
          setPhotoMode("url");
        }
      }
    }
  }, [editingCard]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const uploadFileToServer = async (file) => {
    setIsUploading(true);
    setError("");
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: uploadData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload image");
      setPhotoUrl(data.url);
      return data.url;
    } catch (err) {
      setError(err.message);
      setPhotoPreview(null);
      setPhotoUrl("");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show instant preview
    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview(objectUrl);

    // Upload to server
    await uploadFileToServer(file);
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setPhotoUrl(url);
    setPhotoPreview(url);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setPhotoUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resetForm = () => {
    setFormData({
      team_name: "",
      member1_name: "",
      member1_student_id: "",
      member2_name: "",
      member2_student_id: "",
      message: "",
    });
    setPhotoPreview(null);
    setPhotoUrl("");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      let finalPhotoUrl = photoUrl;

      // If user selected a file but it hasn't finished uploading yet
      if (fileInputRef.current?.files?.[0] && !photoUrl) {
        finalPhotoUrl = await uploadFileToServer(fileInputRef.current.files[0]);
        if (!finalPhotoUrl) {
          throw new Error("Please wait for photo upload to finish or try again.");
        }
      }

      const payload = { ...formData, photo_url: finalPhotoUrl || "" };

      if (editingCard) {
        const res = await fetch(`/api/wall/${editingCard.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update card");
        onCardUpdated(data);
        onCancelEdit();
      } else {
        const res = await fetch("/api/wall", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create card");
        onCardCreated(data);
      }

      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-cream/80 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-cork/20">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-warm-brown" />
          <h2 className="font-serif text-lg sm:text-xl text-brown-text">
            {editingCard ? "Edit Polaroid" : "Create Your Polaroid"}
          </h2>
        </div>
        {editingCard && (
          <button onClick={() => { onCancelEdit(); resetForm(); }} className="text-brown-text/50 hover:text-pushpin">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-brown-text mb-1">Team Name *</label>
          <input
            type="text"
            name="team_name"
            value={formData.team_name}
            onChange={handleChange}
            required
            placeholder="e.g. Retro Rockets"
            className="w-full px-3 py-2 bg-white/70 border border-cork/30 rounded-lg text-sm text-brown-text placeholder:text-brown-text/30 focus:outline-none focus:ring-2 focus:ring-cork/50"
          />
        </div>

        {/* Member 1: Stack on mobile, side-by-side on tablet/desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-brown-text mb-1">Member 1 Name *</label>
            <input
              type="text"
              name="member1_name"
              value={formData.member1_name}
              onChange={handleChange}
              required
              placeholder="Name"
              className="w-full px-3 py-2 bg-white/70 border border-cork/30 rounded-lg text-sm text-brown-text placeholder:text-brown-text/30 focus:outline-none focus:ring-2 focus:ring-cork/50"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-brown-text mb-1">Student ID *</label>
            <input
              type="text"
              name="member1_student_id"
              value={formData.member1_student_id}
              onChange={handleChange}
              required
              placeholder="e.g. 64010001"
              className="w-full px-3 py-2 bg-white/70 border border-cork/30 rounded-lg text-sm text-brown-text placeholder:text-brown-text/30 focus:outline-none focus:ring-2 focus:ring-cork/50"
            />
          </div>
        </div>

        {/* Member 2: Stack on mobile, side-by-side on tablet/desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-brown-text mb-1">Member 2 Name *</label>
            <input
              type="text"
              name="member2_name"
              value={formData.member2_name}
              onChange={handleChange}
              required
              placeholder="Name"
              className="w-full px-3 py-2 bg-white/70 border border-cork/30 rounded-lg text-sm text-brown-text placeholder:text-brown-text/30 focus:outline-none focus:ring-2 focus:ring-cork/50"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-brown-text mb-1">Student ID *</label>
            <input
              type="text"
              name="member2_student_id"
              value={formData.member2_student_id}
              onChange={handleChange}
              required
              placeholder="e.g. 64010002"
              className="w-full px-3 py-2 bg-white/70 border border-cork/30 rounded-lg text-sm text-brown-text placeholder:text-brown-text/30 focus:outline-none focus:ring-2 focus:ring-cork/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-semibold text-brown-text mb-1">Message</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={2}
            placeholder="Say something to the team..."
            className="w-full px-3 py-2 bg-white/70 border border-cork/30 rounded-lg text-sm text-brown-text placeholder:text-brown-text/30 focus:outline-none focus:ring-2 focus:ring-cork/50 resize-none"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs sm:text-sm font-semibold text-brown-text">Team Photo</label>
            <div className="flex gap-1 text-xs">
              <button
                type="button"
                onClick={() => setPhotoMode("upload")}
                className={`px-2 py-0.5 rounded transition-colors ${photoMode === "upload" ? "bg-warm-brown text-cream font-medium" : "text-brown-text/60 hover:text-brown-text"}`}
              >
                Upload
              </button>
              <button
                type="button"
                onClick={() => setPhotoMode("url")}
                className={`px-2 py-0.5 rounded transition-colors ${photoMode === "url" ? "bg-warm-brown text-cream font-medium" : "text-brown-text/60 hover:text-brown-text"}`}
              >
                URL
              </button>
            </div>
          </div>

          {photoMode === "upload" ? (
            <div>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative border-2 border-dashed border-cork/40 rounded-lg p-3 text-center cursor-pointer hover:border-cork hover:bg-white/50 transition-colors min-h-[110px] sm:min-h-[120px] flex items-center justify-center overflow-hidden"
              >
                {photoPreview ? (
                  <div className="relative w-full h-28 sm:h-32 group">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePhoto();
                      }}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-pushpin transition-colors"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/40 rounded-md flex items-center justify-center gap-2 text-white text-xs font-medium">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-brown-text/40 py-2">
                    {isUploading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin text-warm-brown" />
                        <span className="text-xs">Uploading photo...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
                        <span className="text-xs font-medium">Click to choose photo</span>
                        <span className="text-[10px] text-brown-text/30">JPG, PNG, GIF, WebP (Max 5MB)</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="w-3.5 h-3.5 text-brown-text/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={handleUrlChange}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white/70 border border-cork/30 rounded-lg text-xs text-brown-text placeholder:text-brown-text/30 focus:outline-none focus:ring-2 focus:ring-cork/50"
                  />
                </div>
                {photoUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-2 py-1 text-xs text-brown-text/50 hover:text-pushpin border border-cork/30 rounded-lg"
                  >
                    Clear
                  </button>
                )}
              </div>
              {photoPreview && (
                <div className="relative w-full h-24 rounded-md overflow-hidden border border-cork/30">
                  <img
                    src={photoPreview}
                    alt="URL Preview"
                    className="w-full h-full object-cover"
                    onError={() => setError("Image URL failed to load")}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <p className="text-pushpin text-xs bg-red-50 p-2 rounded border border-red-200">{error}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="w-full flex items-center justify-center gap-2 bg-warm-brown hover:bg-wood-dark text-cream font-serif text-base sm:text-lg py-2.5 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 active:scale-[0.99]"
        >
          <Pin className="w-4 h-4 sm:w-5 sm:h-5" />
          {isSubmitting
            ? "Pinning..."
            : isUploading
            ? "Uploading photo..."
            : editingCard
            ? "Update Polaroid"
            : "Pin to Board"}
        </button>
      </form>
    </div>
  );
}
