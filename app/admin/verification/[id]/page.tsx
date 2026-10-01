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
  User,
  Phone,
  Mail,
  FileText,
  Calendar,
  ExternalLink,
  Camera,
  Clock,
  LayoutDashboard,
  Crown,
  Check,
  AlertCircle
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { DocumentLightbox } from "@/components/admin/document-lightbox"
import { formatNaira } from "@/lib/utils"
import Link from "next/link"

export default function AdminVerificationDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [landlord, setLandlord] = useState<any>(null)
  const [listings, setListings] = useState<any[]>([])
  const [subscription, setSubscription] = useState<any>(null)
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("ID document is unclear or unreadable")
  const [rejectionNote, setRejectionNote] = useState("")
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  
  // Checklist state
  const [checklist, setChecklist] = useState({
    faceMatches: false,
    idGenuine: false,
    nameMatches: false,
    notExpired: false,
    phoneVerified: false,
    propertyReviewed: false
  })

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [profileRes, listingsRes, subRes, docsRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", id).single(),
          supabase.from("listings").select("*").eq("landlord_id", id),
          supabase.from("subscriptions").select("*").eq("landlord_id", id).eq("active", true).maybeSingle(),
          fetch(`/api/admin/verification-docs?id=${id}`).then(res => res.json())
        ])
        
        if (profileRes.error) {
          console.error("Error fetching landlord:", profileRes.error)
          router.push("/admin/verification")
          return
        }

        setLandlord(profileRes.data)
        setListings(listingsRes.data || [])
        setSubscription(subRes.data)
        setSignedUrls(docsRes.urls || {})
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id, supabase, router])

  const handleApprove = async () => {
    if (!confirm("Are you sure you want to verify this landlord?")) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/verify-landlord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landlord_id: id, action: 'approve' })
      })
      if (!res.ok) throw new Error(await res.text())
      router.push("/admin/verification")
      router.refresh()
    } catch (error: any) {
      alert("Error approving: " + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/verify-landlord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          landlord_id: id, 
          action: 'reject', 
          rejection_reason: rejectionReason,
          rejection_note: rejectionNote
        })
      })
      if (!res.ok) throw new Error(await res.text())
      router.push("/admin/verification")
      router.refresh()
    } catch (error: any) {
      alert("Error rejecting: " + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const isApproveDisabled = !checklist.faceMatches || !checklist.idGenuine || !checklist.nameMatches || !checklist.notExpired || submitting

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const lightboxImages = [
    { url: signedUrls.idFront, label: "Government ID — Front" },
    { url: signedUrls.idBack, label: "Government ID — Back" },
    { url: signedUrls.selfie, label: "Selfie holding ID" },
    { url: signedUrls.propertyDoc, label: "Property Ownership Document" }
  ].filter(img => img.url)

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center gap-4">
        <button 
          onClick={() => router.push("/admin/verification")}
          className="p-2 hover:bg-white rounded-xl border border-gray-100 shadow-sm transition"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Review Verification</h1>
          <p className="text-gray-500 font-medium">Verify identity for {landlord.full_name}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Info */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm flex flex-col md:flex-row gap-8">
            <div className="h-24 w-24 rounded-3xl bg-primary/5 flex items-center justify-center text-primary font-black text-3xl border border-primary/10 shrink-0">
              {landlord.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-3xl font-black text-gray-900">{landlord.full_name}</h2>
                <div className="flex flex-wrap gap-4 mt-2">
                   <div className="flex items-center gap-1.5 text-sm font-bold text-gray-400">
                      <Mail className="h-4 w-4" /> {landlord.email}
                   </div>
                   <div className="flex items-center gap-1.5 text-sm font-bold text-gray-400">
                      <Phone className="h-4 w-4" /> 
                      {landlord.phone}
                      {landlord.phone && (
                        <a
                          href={`https://wa.me/${landlord.phone.replace(/\D/g, "").replace(/^0/, "234")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 px-2 py-0.5 rounded text-xs text-green-700 bg-green-50 hover:bg-green-100 transition-colors inline-flex items-center gap-1"
                          title="Contact on WhatsApp"
                        >
                          <Phone className="h-3 w-3" />
                          WhatsApp
                        </a>
                      )}
                   </div>
                   <div className="flex items-center gap-1.5 text-sm font-bold text-gray-400">
                      <Calendar className="h-4 w-4" /> Joined {new Date(landlord.created_at).toLocaleDateString()}
                   </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                 <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                    landlord.verification_status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    landlord.verification_status === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-red-100 text-red-700'
                 }`}>
                    {landlord.verification_status}
                 </div>
                 <div className="px-4 py-1.5 rounded-full bg-primary text-white text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Crown className="h-3 w-3" /> {subscription?.plan || 'Free'} Plan
                 </div>
                 <div className="px-4 py-1.5 rounded-full bg-gray-100 text-gray-600 text-xs font-black uppercase tracking-widest">
                    {listings.length} Listings
                 </div>
              </div>

              {landlord.verification_note && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black uppercase text-red-800">Previous Rejection Note</p>
                    <p className="text-sm text-red-700 font-medium mt-1">{landlord.verification_note}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ID FRONT */}
            <DocumentCard 
              label="Government ID — Front"
              url={signedUrls.idFront}
              idType={landlord.id_document_type}
              nin={landlord.nin_number}
              onClick={() => setLightboxIndex(0)}
            />
            {/* ID BACK */}
            <DocumentCard 
              label="Government ID — Back"
              url={signedUrls.idBack}
              onClick={() => setLightboxIndex(1)}
            />
            {/* SELFIE */}
            <DocumentCard 
              label="Selfie holding ID"
              url={signedUrls.selfie}
              note="Verify face matches ID document"
              onClick={() => setLightboxIndex(2)}
            />
            {/* PROPERTY */}
            <DocumentCard 
              label="Property Ownership Document"
              url={signedUrls.propertyDoc}
              optional
              onClick={() => setLightboxIndex(3)}
            />
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
             <h3 className="text-xl font-black text-gray-900 mb-6">Verification Checklist</h3>
             <div className="space-y-4">
                {[
                  { key: 'faceMatches', label: 'Face in selfie matches ID photo', required: true },
                  { key: 'idGenuine', label: 'ID document appears genuine (not edited)', required: true },
                  { key: 'nameMatches', label: 'Name on ID matches profile name', required: true },
                  { key: 'notExpired', label: 'ID is not expired', required: true },
                  { key: 'phoneVerified', label: 'Phone number verified', required: false },
                  { key: 'propertyReviewed', label: 'Property document reviewed (if submitted)', required: false }
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer group">
                    <input 
                      type="checkbox"
                      checked={(checklist as any)[item.key]}
                      onChange={(e) => setChecklist(prev => ({ ...prev, [item.key]: e.target.checked }))}
                      className="h-6 w-6 rounded-lg border-2 border-gray-200 text-primary focus:ring-primary transition-all"
                    />
                    <div className="flex-1">
                      <p className="font-bold text-gray-700">{item.label}</p>
                      {item.required && <span className="text-[10px] font-black uppercase text-red-400">Required</span>}
                    </div>
                  </label>
                ))}
             </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm sticky top-24">
            <h3 className="font-black text-gray-900 mb-4 uppercase tracking-widest text-xs">Admin Actions</h3>
            <div className="space-y-3">
              <button
                onClick={handleApprove}
                disabled={isApproveDisabled}
                className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ShieldCheck className="h-5 w-5" /> Verify Landlord</>}
              </button>
              
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={submitting}
                className="w-full border-2 border-red-100 text-red-500 py-4 rounded-2xl font-black hover:bg-red-50 transition-all flex items-center justify-center gap-2"
              >
                <XCircle className="h-5 w-5" /> Reject Verification
              </button>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-50 space-y-4">
              <div className="flex justify-between items-center text-sm font-bold text-gray-400">
                <span>Active Listings</span>
                <span className="text-gray-900">{listings.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-gray-400">
                <span>Member Since</span>
                <span className="text-gray-900">{new Date(landlord.created_at).toLocaleDateString()}</span>
              </div>
              <Link 
                href={`/admin/listings?landlord=${id}`}
                className="flex items-center justify-center gap-2 text-primary font-black text-xs uppercase tracking-widest hover:underline pt-2"
              >
                <LayoutDashboard className="h-4 w-4" /> View All Listings
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <DocumentLightbox 
          images={lightboxImages} 
          initialIndex={lightboxIndex} 
          onClose={() => setLightboxIndex(null)} 
        />
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-gray-900 mb-2">Reject Verification</h3>
            <p className="text-gray-500 font-medium mb-8">Please specify why you are rejecting these documents. This will be shown to the landlord.</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase text-gray-400 mb-2 tracking-widest">Reason Category</label>
                <select 
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full rounded-2xl border-2 border-gray-100 p-4 font-bold text-gray-700 focus:border-primary outline-none transition-all"
                >
                  <option>ID document is unclear or unreadable</option>
                  <option>Face does not match ID</option>
                  <option>ID appears to be edited or fake</option>
                  <option>ID is expired</option>
                  <option>Name mismatch between ID and profile</option>
                  <option>Wrong document type submitted</option>
                  <option>Other (specify below)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-gray-400 mb-2 tracking-widest">Additional Notes</label>
                <textarea 
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder="e.g. Please retake the selfie in better lighting..."
                  className="w-full h-32 rounded-2xl border-2 border-gray-100 p-4 font-bold text-gray-700 focus:border-primary outline-none resize-none transition-all"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button 
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-4 rounded-2xl border-2 border-gray-100 font-black text-gray-400 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleReject}
                disabled={submitting || (rejectionReason.includes('Other') && !rejectionNote.trim())}
                className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-black shadow-lg shadow-red-500/20 transition hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DocumentCard({ label, url, idType, nin, note, optional, onClick }: any) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col">
       <div className="flex items-center justify-between mb-4">
          <h4 className="font-black text-gray-900 uppercase tracking-widest text-[10px]">{label}</h4>
          {optional && <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[8px] font-black uppercase">Optional</span>}
       </div>
       
       <div 
          onClick={url ? onClick : undefined}
          className={`relative aspect-[4/3] rounded-2xl border-2 border-dashed overflow-hidden bg-gray-50 transition-all ${url ? 'cursor-pointer border-primary/20 hover:border-primary group' : 'border-gray-100'}`}
        >
          {url ? (
            <>
              <img src={url} alt={label} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <ExternalLink className="text-white h-8 w-8" />
              </div>
            </>
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center text-gray-300 gap-2">
               <FileText className="h-10 w-10" />
               <span className="text-[10px] font-black uppercase tracking-tighter">Not submitted</span>
            </div>
          )}
        </div>

        {(idType || nin || note) && (
          <div className="mt-4 p-4 rounded-2xl bg-gray-50 space-y-2">
            {idType && <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ID Type: <span className="text-gray-900">{idType.replace('_', ' ')}</span></p>}
            {nin && <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">NIN: <span className="text-primary font-mono tracking-normal">{nin}</span></p>}
            {note && <p className="text-[10px] font-medium text-gray-500 leading-tight italic">{note}</p>}
          </div>
        )}
    </div>
  )
}
