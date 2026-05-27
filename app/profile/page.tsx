"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { AvatarUpload } from "@/components/profile/avatar-upload"
import { X } from "lucide-react"
import type { Profile } from "@/types"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export default function StudentProfilePage() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [updatingPassword, setUpdatingPassword] = useState(false)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [deleting, setDeleting] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/login")
        return
      }
      setUser(user)
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()
      setProfile(data)
      setLoading(false)
    })
  }, [router])

  const handleSave = async () => {
    if (!user || !profile) return
    setSaving(true)
    const supabase = createClient()
    await supabase
      .from("profiles")
      .update({ full_name: profile.full_name, phone: profile.phone })
      .eq("id", user.id)
    setSaving(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2500)
  }

  const closePasswordModal = () => {
    setShowPasswordModal(false)
    setPasswordError("")
    setNewPassword("")
    setConfirmPassword("")
    setPasswordSuccess(false)
  }

  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.")
      return
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.")
      return
    }
    setPasswordError("")
    setUpdatingPassword(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setUpdatingPassword(false)
    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordSuccess(true)
      setTimeout(closePasswordModal, 1500)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return
    setDeleting(true)
    const res = await fetch("/api/profile/delete", { method: "POST" })
    if (res.ok) {
      router.push("/")
    } else {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="w-8 h-8 rounded-full border-4 border-[#1B4332] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!profile || !user) return null

  return (
    <div className="min-h-screen bg-[#F9FAFB] pt-20">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your account details</p>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center">
          <AvatarUpload
            currentAvatarUrl={profile.avatar_url}
            userId={user.id}
            fullName={profile.full_name}
            onUploadComplete={(url) => setProfile({ ...profile, avatar_url: url })}
          />
          <p className="text-xs text-gray-400 text-center mt-2">Tap photo to change</p>
        </div>

        {/* Profile Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Personal Information</h2>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Full Name
            </label>
            <input
              type="text"
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Phone
            </label>
            <input
              type="tel"
              value={profile.phone ?? ""}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="e.g. 08012345678"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full border border-gray-100 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400">Contact support to change email</p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#1B4332] text-white rounded-lg py-3 text-sm font-semibold hover:bg-[#2D5A47] disabled:opacity-60 transition-colors"
          >
            {saving ? "Saving…" : saveSuccess ? "✓ Saved!" : "Save Changes"}
          </button>
        </div>

        {/* Account */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Account</h2>

          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Change Password
          </button>

          <div className="pt-2 border-t border-gray-100">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="text-sm text-red-400 hover:text-red-500 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Change Password</h3>
              <button onClick={closePasswordModal}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
              />
              {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
              {passwordSuccess && <p className="text-xs text-green-600">Password updated!</p>}
            </div>
            <button
              onClick={handlePasswordUpdate}
              disabled={updatingPassword}
              className="w-full bg-[#1B4332] text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-[#2D5A47] disabled:opacity-60 transition-colors"
            >
              {updatingPassword ? "Updating…" : "Update Password"}
            </button>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-red-600">Delete Account</h3>
              <button onClick={() => { setShowDeleteModal(false); setDeleteConfirmText("") }}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-600">
              This action is permanent and cannot be undone. All your data will be deleted.
            </p>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500">
                Type <span className="font-bold text-red-500">DELETE</span> to confirm
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              />
            </div>
            <button
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== "DELETE" || deleting}
              className="w-full bg-red-500 text-white rounded-lg py-2.5 text-sm font-semibold disabled:opacity-40 transition-opacity"
            >
              {deleting ? "Deleting…" : "Delete My Account"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
