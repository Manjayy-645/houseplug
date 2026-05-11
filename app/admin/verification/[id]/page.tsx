"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  ShieldAlert, 
  Loader2,
  ChevronLeft,
  MessageSquare,
  User,
  Phone,
  Mail,
  FileText,
  Calendar,
  ExternalLink,
  Image as ImageIcon,
  Camera,
  Clock
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function AdminVerificationDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [landlord, setLandlord] = useState<any>(null)
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")

  useEffect(() => {
    async function fetchLandlordData() {
      setLoading(true)
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single()
      
      if (error) {
        console.error("Error fetching landlord:", error)
        router.push("/admin/verification")
        return
      }

      setLandlord(data)

      // Get signed URLs for private images
      const files = [
        { key: 'id_front', path: `${id}/id_front` },
        { key: 'id_back', path: `${id}/id_back` },
        { key: 'selfie', path: `${id}/selfie` },
        { key: 'property_doc', path: `${id}/property_doc` }
      ]

      const urls: Record<string, string> = {}
      for (const file of files) {
        const { data: signedData, error: signedError } = await supabase.storage
          .from('verifications')
          .createSignedUrl(file.path, 3600)
        
        if (signedData) {
          urls[file.key] = signedData.signedUrl
        }
      }
      setSignedUrls(urls)
      setLoading(false)
    }
    fetchLandlordData()
  }, [id, supabase, router])

  const handleApprove = async () => {
    if (!confirm("Are you sure you want to verify this landlord?")) return

    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from("profiles")
      .update({
        verification_status: 'verified',
        verified_at: new Date().toISOString(),
        verified_by: user?.id,
        verification_note: null
      })
      .eq("id", id)

    if (error) {
      alert("Error approving: " + error.message)
    } else {
      router.push("/admin/verification")
      router.refresh()
    }
    setSubmitting(false)
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason.")
      return
    }

    setSubmitting(true)
    const { error } = await supabase
      .from("profiles")
      .update({
        verification_status: 'rejected',
        verification_note: rejectionReason
      })
      .eq("id", id)

    if (error) {
      alert("Error rejecting: " + error.message)
    } else {
      router.push("/admin/verification")
      router.refresh()
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B4332]" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8">
      <header className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-full transition"
        >
          <ChevronLeft className="h-6 w-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Review Verification</h1>
          <p className="text-gray-600">Landlord ID: {id}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Documents */}
        <div className="lg:col-span-2 space-y-8">
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-gray-400" /> ID Documents
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Front of ID</p>
                <a href={signedUrls.id_front} target="_blank" rel="noreferrer" className="block relative aspect-[4/3] rounded-2xl border border-gray-100 overflow-hidden bg-gray-50 hover:opacity-90 transition">
                  {signedUrls.id_front ? (
                    <img src={signedUrls.id_front} alt="ID Front" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400">Not provided</div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/50 p-1.5 rounded-lg text-white">
                    <ExternalLink className="h-4 w-4" />
                  </div>
                </a>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Back of ID</p>
                <a href={signedUrls.id_back} target="_blank" rel="noreferrer" className="block relative aspect-[4/3] rounded-2xl border border-gray-100 overflow-hidden bg-gray-50 hover:opacity-90 transition">
                  {signedUrls.id_back ? (
                    <img src={signedUrls.id_back} alt="ID Back" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400">Not provided</div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/50 p-1.5 rounded-lg text-white">
                    <ExternalLink className="h-4 w-4" />
                  </div>
                </a>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Camera className="h-5 w-5 text-gray-400" /> Identity Verification (Selfie)
            </h2>
            <a href={signedUrls.selfie} target="_blank" rel="noreferrer" className="block relative h-[400px] rounded-2xl border border-gray-100 overflow-hidden bg-gray-50 hover:opacity-90 transition">
              {signedUrls.selfie ? (
                <img src={signedUrls.selfie} alt="Selfie" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-gray-400">Not provided</div>
              )}
              <div className="absolute bottom-4 right-4 bg-black/50 p-2 rounded-lg text-white">
                <ExternalLink className="h-5 w-5" />
              </div>
            </a>
          </section>

          {landlord.property_document_url && (
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-400" /> Property Document
              </h2>
              <a href={signedUrls.property_doc} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-6 rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 transition">
                <FileText className="h-10 w-10 shrink-0" />
                <div className="flex-1">
                  <p className="font-bold">Property Ownership Document</p>
                  <p className="text-sm opacity-80">Click to view full document</p>
                </div>
                <ExternalLink className="h-5 w-5" />
              </a>
            </section>
          )}
        </div>

        {/* Right: Info & Actions */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center">
                <User className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{landlord.full_name}</h3>
                <p className="text-sm text-gray-500">Registered {new Date(landlord.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Mail className="h-4 w-4" /> {landlord.email}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Phone className="h-4 w-4" /> {landlord.phone}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Calendar className="h-4 w-4" /> ID Type: <span className="font-bold uppercase">{landlord.id_document_type?.replace('_', ' ')}</span>
              </div>
              {landlord.nin_number && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <ShieldCheck className="h-4 w-4" /> NIN: <span className="font-bold">{landlord.nin_number}</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Current Status</p>
              {landlord.verification_status === 'pending' ? (
                <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Under Review
                </div>
              ) : landlord.verification_status === 'verified' ? (
                <div className="bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Verified Landlord
                </div>
              ) : (
                <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                  <XCircle className="h-4 w-4" /> Rejected
                </div>
              )}
            </div>

            {landlord.verification_status === 'pending' && (
              <div className="grid grid-cols-1 gap-3 pt-4">
                <button 
                  onClick={handleApprove}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-[#1B4332] text-white py-3 rounded-xl font-bold transition hover:brightness-110 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4" /> Verify Identity</>}
                </button>
                <button 
                  onClick={() => setShowRejectModal(true)}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 py-3 rounded-xl font-bold transition hover:bg-red-50 disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" /> Reject Documents
                </button>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
             <h3 className="font-bold text-gray-900 mb-4">Verification Tips</h3>
             <ul className="text-xs text-gray-500 space-y-2 list-disc pl-4">
                <li>Ensure the name on ID matches the profile name.</li>
                <li>Verify that the face in the selfie matches the ID photo.</li>
                <li>Check that the ID is not expired.</li>
                <li>If property documents are provided, ensure they mention the landlord's name or area.</li>
             </ul>
          </section>
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Rejection Reason</h3>
            <p className="text-sm text-gray-600 mb-4">Please specify why you are rejecting these documents. This will be shown to the landlord.</p>
            
            <textarea 
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. ID card photo is blurry, name does not match profile..."
              className="w-full h-32 rounded-xl border border-gray-200 p-4 text-sm focus:ring-2 focus:ring-[#1B4332]/20 outline-none resize-none mb-4"
            />

            <div className="flex gap-3">
              <button 
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-3 rounded-xl border border-gray-100 font-bold text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleReject}
                disabled={submitting || !rejectionReason.trim()}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold transition hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
