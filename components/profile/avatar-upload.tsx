"use client"

import { useState, useRef } from "react"
import { Camera, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { compressImage } from "@/lib/image-compress"
import { getInitials } from "@/lib/utils"

type UploadState = "idle" | "uploading" | "success" | "error"

type Props = {
  currentAvatarUrl?: string
  userId: string
  fullName: string
  onUploadComplete: (url: string) => void
}

export function AvatarUpload({ currentAvatarUrl, userId, fullName, onUploadComplete }: Props) {
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl ?? null)
  const [uploadState, setUploadState] = useState<UploadState>("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please choose an image file.")
      return
    }

    setErrorMsg(null)
    setUploadState("uploading")

    try {
      // Downscale + convert to WebP so large phone photos (and iPhone HEIC) are
      // accepted instead of rejected. Falls back to the original if it can't.
      let uploadFile = file
      try {
        uploadFile = await compressImage(file, { maxDimension: 512, quality: 0.85, skipUnder: 0 })
      } catch {
        uploadFile = file
      }

      // Safety net in case compression was skipped and the original is huge.
      if (uploadFile.size > 8 * 1024 * 1024) {
        throw new Error("Image is too large. Please choose a smaller photo.")
      }

      const supabase = createClient()
      const ext = (uploadFile.type.split("/")[1] || "jpg").replace("jpeg", "jpg")
      const filePath = `${userId}/avatar.${ext}` // bucket implied by .from("avatars")

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, uploadFile, { upsert: true })

      if (uploadError) {
        console.error("Storage upload error:", uploadError)
        throw new Error(uploadError.message)
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath)

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ avatar_url: data.publicUrl })
        .eq("id", userId)

      if (profileError) {
        console.error("Profile update error:", profileError)
        throw new Error(profileError.message)
      }

      // Trigger onAuthStateChange in header so it re-fetches profile
      await supabase.auth.refreshSession()

      const cacheBustedUrl = `${data.publicUrl}?t=${Date.now()}`
      setPreview(cacheBustedUrl)
      setUploadState("success")
      onUploadComplete(cacheBustedUrl)

      setTimeout(() => setUploadState("idle"), 2000)
    } catch (err: any) {
      setUploadState("error")
      setErrorMsg(err.message || "Upload failed. Please try again.")
      setTimeout(() => setUploadState("idle"), 3000)
    }

    e.target.value = ""
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative cursor-pointer"
        style={{ width: 96, height: 96 }}
        onClick={() => fileInputRef.current?.click()}
        title="Change photo"
      >
        {/* Avatar circle */}
        {preview ? (
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/20">
            <img src={preview} alt={fullName} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-24 h-24 rounded-full bg-[#1B4332] flex items-center justify-center text-white font-bold text-2xl select-none">
            {getInitials(fullName)}
          </div>
        )}

        {/* State overlays */}
        {uploadState === "uploading" && (
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}
        {uploadState === "success" && (
          <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-400" />
          </div>
        )}
        {uploadState === "error" && (
          <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center">
            <XCircle className="h-8 w-8 text-red-400" />
          </div>
        )}

        {/* Camera badge — always visible when idle */}
        {uploadState === "idle" && (
          <div className="absolute bottom-0 right-0 w-7 h-7 bg-[#F59E0B] rounded-full flex items-center justify-center shadow-md pointer-events-none">
            <Camera className="h-3.5 w-3.5 text-white" />
          </div>
        )}
      </div>

      {errorMsg && (
        <p className="text-xs text-red-500 text-center max-w-[200px]">{errorMsg}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
