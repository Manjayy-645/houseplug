"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { 
  ShieldCheck, 
  ShieldAlert, 
  Shield, 
  Upload, 
  CheckCircle2, 
  Loader2,
  Camera,
  FileText,
  ChevronRight,
  ChevronLeft
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { notifyAdminsVerificationSubmitted } from "@/app/actions"
import { formatNaira } from "@/lib/utils"

const verificationSchema = z.object({
  id_document_type: z.enum(["nin", "drivers_license", "national_id", "voters_card"]),
  nin_number: z.string().optional(),
  confirm_details: z.boolean().refine(v => v === true, "You must confirm your details")
}).refine((data) => {
  if (data.id_document_type === 'nin' && (!data.nin_number || data.nin_number.length !== 11)) {
    return false;
  }
  return true;
}, {
  message: "NIN must be 11 digits",
  path: ["nin_number"]
});

type VerificationValues = z.infer<typeof verificationSchema>

export default function VerificationPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState<any>(null)
  
  // Files
  const [idFront, setIdFront] = useState<File | null>(null)
  const [idBack, setIdBack] = useState<File | null>(null)
  const [selfie, setSelfie] = useState<File | null>(null)
  const [propertyDoc, setPropertyDoc] = useState<File | null>(null)
  
  // Previews
  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null)
  const [idBackPreview, setIdBackPreview] = useState<string | null>(null)
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null)
  const [propertyDocPreview, setPropertyDocPreview] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<VerificationValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      id_document_type: "nin",
      confirm_details: false
    }
  })

  const selectedIdType = watch("id_document_type")

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
      
      setProfile(data)
      setLoading(false)
    }
    getProfile()
  }, [supabase, router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back' | 'selfie' | 'property') => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      if (type === 'front') {
        setIdFront(file)
        setIdFrontPreview(result)
      } else if (type === 'back') {
        setIdBack(file)
        setIdBackPreview(result)
      } else if (type === 'selfie') {
        setSelfie(file)
        setSelfiePreview(result)
      } else if (type === 'property') {
        setPropertyDoc(file)
        setPropertyDocPreview(result)
      }
    }
    reader.readAsDataURL(file)
  }

  const onSubmit = async (values: VerificationValues) => {
    if (!idFront || !idBack || !selfie) {
      alert("Please upload all required ID documents.")
      return
    }

    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const userId = user.id

      // Upload files
      const uploadFile = async (file: File, path: string) => {
        const { data, error } = await supabase.storage
          .from('verifications')
          .upload(`${userId}/${path}`, file, { upsert: true })
        if (error) throw error
        return supabase.storage.from('verifications').getPublicUrl(data.path).data.publicUrl
      }

      const [idFrontUrl, idBackUrl, selfieUrl, propertyUrl] = await Promise.all([
        uploadFile(idFront, 'id_front'),
        uploadFile(idBack, 'id_back'),
        uploadFile(selfie, 'selfie'),
        propertyDoc ? uploadFile(propertyDoc, 'property_doc') : Promise.resolve(null)
      ])

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          verification_status: 'pending',
          id_document_type: values.id_document_type,
          nin_number: values.nin_number,
          id_document_url: idFrontUrl,
          id_document_back_url: idBackUrl,
          selfie_url: selfieUrl,
          property_document_url: propertyUrl,
          verification_type: propertyUrl ? 'property' : 'identity'
        })
        .eq('id', userId)

      if (updateError) throw updateError

      // Notify admins that verification docs were submitted (best-effort).
      void notifyAdminsVerificationSubmitted()

      router.refresh()
      setStep(4) // Success step
    } catch (error: any) {
      console.error("Verification submission failed:", error)
      alert("Submission failed: " + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B4332]" />
      </div>
    )
  }

  const status = profile?.verification_status || 'unverified'

  if (status === 'pending') {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-8 text-center">
          <Shield className="mx-auto h-16 w-16 text-blue-500" />
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Verification Under Review</h1>
          <p className="mt-4 text-gray-600">
            Your documents are under review. We'll notify you via email and update your dashboard within 24 hours.
          </p>
          <button 
            onClick={() => router.push("/landlord/dashboard")}
            className="mt-8 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (status === 'verified') {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-8 text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Identity Verified</h1>
          <p className="mt-4 text-gray-600">
            Your identity has been verified by HousePlug. You now have the verified badge on all your listings.
          </p>
          <button 
            onClick={() => router.push("/landlord/dashboard")}
            className="mt-8 rounded-xl bg-[#1B4332] px-6 py-3 font-bold text-white transition hover:brightness-110"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-6 lg:p-10">
      <header className="mb-10">
        <h1 className="text-3xl font-black text-gray-900">Get Verified</h1>
        <p className="mt-2 text-gray-600">
          Verified landlords get 3x more inquiries and a trust badge on their listings.
        </p>
      </header>

      {status === 'rejected' && (
        <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-4 flex gap-3">
          <ShieldAlert className="h-5 w-5 text-red-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-900">Verification Rejected</p>
            <p className="mt-1 text-sm text-red-700">{profile.verification_note || "Your documents were not clear enough. Please resubmit."}</p>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-12">
        <div className="flex justify-between mb-2">
          {["ID Document", "Property", "Confirm"].map((s, i) => (
            <span key={s} className={`text-xs font-bold uppercase tracking-widest ${step > i ? 'text-[#1B4332]' : 'text-gray-400'}`}>
              {s}
            </span>
          ))}
        </div>
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#1B4332] transition-all duration-500" 
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Step 1: Identity Document</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID Type</label>
                  <select 
                    {...register("id_document_type")}
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-[#1B4332]/20"
                  >
                    <option value="nin">NIN (National Identity Number)</option>
                    <option value="drivers_license">Driver's License</option>
                    <option value="national_id">National ID Card</option>
                    <option value="voters_card">Voter's Card</option>
                  </select>
                </div>
                {selectedIdType === 'nin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NIN Number (11 digits)</label>
                    <input 
                      type="text" 
                      placeholder="Enter 11 digit NIN"
                      {...register("nin_number")}
                      className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-[#1B4332]/20"
                    />
                    {errors.nin_number && <p className="mt-1 text-xs text-red-600">{errors.nin_number.message}</p>}
                  </div>
                )}
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">ID Card (Front)</p>
                <label className={`relative flex flex-col items-center justify-center aspect-[4/3] rounded-2xl border-2 border-dashed transition cursor-pointer overflow-hidden ${idFrontPreview ? 'border-[#1B4332]' : 'border-gray-200 hover:border-[#1B4332]'}`}>
                  {idFrontPreview ? (
                    <img src={idFrontPreview} alt="ID Front" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-gray-400">
                      <Upload className="h-8 w-8 mb-2" />
                      <span className="text-xs font-bold uppercase">Upload Front</span>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'front')} />
                </label>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">ID Card (Back)</p>
                <label className={`relative flex flex-col items-center justify-center aspect-[4/3] rounded-2xl border-2 border-dashed transition cursor-pointer overflow-hidden ${idBackPreview ? 'border-[#1B4332]' : 'border-gray-200 hover:border-[#1B4332]'}`}>
                  {idBackPreview ? (
                    <img src={idBackPreview} alt="ID Back" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-gray-400">
                      <Upload className="h-8 w-8 mb-2" />
                      <span className="text-xs font-bold uppercase">Upload Back</span>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'back')} />
                </label>
              </div>
            </section>

            <section>
              <p className="text-sm font-medium text-gray-700 mb-3">Selfie holding ID Card</p>
              <p className="text-xs text-gray-500 mb-4">Hold your ID card next to your face clearly. This prevents identity fraud.</p>
              <label className={`relative flex flex-col items-center justify-center h-64 rounded-2xl border-2 border-dashed transition cursor-pointer overflow-hidden ${selfiePreview ? 'border-[#1B4332]' : 'border-gray-200 hover:border-[#1B4332]'}`}>
                {selfiePreview ? (
                  <img src={selfiePreview} alt="Selfie" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-gray-400">
                    <Camera className="h-10 w-10 mb-2" />
                    <span className="text-sm font-bold uppercase">Take/Upload Selfie</span>
                  </div>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'selfie')} />
              </label>
            </section>

            <div className="pt-6">
              <button 
                type="button"
                onClick={() => setStep(2)}
                disabled={!idFront || !idBack || !selfie}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1B4332] py-4 font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next Step <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Step 2: Property Ownership (Optional)</h2>
              <p className="text-sm text-gray-600">
                Uploading a property document increases student trust significantly and gives you a "Property Verified" sub-badge.
              </p>
              
              <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-xs text-amber-800">
                Acceptable: Tenancy agreement, Land certificate, Property ownership document.
              </div>

              <label className={`relative flex flex-col items-center justify-center h-64 rounded-2xl border-2 border-dashed transition cursor-pointer overflow-hidden ${propertyDocPreview ? 'border-[#1B4332]' : 'border-gray-200 hover:border-[#1B4332]'}`}>
                {propertyDocPreview ? (
                  <div className="flex flex-col items-center p-4">
                    <FileText className="h-16 w-16 text-[#1B4332] mb-2" />
                    <span className="text-sm font-medium text-gray-900">{propertyDoc?.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-gray-400">
                    <Upload className="h-10 w-10 mb-2" />
                    <span className="text-sm font-bold uppercase">Upload Property Document</span>
                  </div>
                )}
                <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => handleFileChange(e, 'property')} />
              </label>
            </section>

            <div className="flex gap-4 pt-6">
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-4 font-bold text-gray-700 transition hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              <button 
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#1B4332] py-4 font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:brightness-110"
              >
                Continue to Confirm <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
            <section className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900">Step 3: Confirm Details</h2>
              
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 space-y-4">
                <div className="flex justify-between border-b border-gray-200 pb-3">
                  <span className="text-sm text-gray-500">Full Name</span>
                  <span className="text-sm font-bold text-gray-900">{profile?.full_name}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-3">
                  <span className="text-sm text-gray-500">Phone Number</span>
                  <span className="text-sm font-bold text-gray-900">{profile?.phone}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-3">
                  <span className="text-sm text-gray-500">ID Document</span>
                  <span className="text-sm font-bold text-gray-900 uppercase">{selectedIdType.replace('_', ' ')}</span>
                </div>
                {propertyDoc && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Property Document</span>
                    <span className="text-sm font-bold text-emerald-600">Attached</span>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-3">
                <input 
                  type="checkbox" 
                  id="confirm_details"
                  {...register("confirm_details")}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-[#1B4332] focus:ring-[#1B4332]" 
                />
                <label htmlFor="confirm_details" className="text-sm text-gray-600">
                  I confirm these documents belong to me and the information provided is accurate. I understand that providing false documents will lead to permanent account deactivation.
                </label>
              </div>
              {errors.confirm_details && <p className="text-xs text-red-600">{errors.confirm_details.message}</p>}
            </section>

            <div className="flex gap-4 pt-6">
              <button 
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-4 font-bold text-gray-700 transition hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              <button 
                type="submit"
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#1B4332] py-4 font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>Submit for Verification <CheckCircle2 className="h-4 w-4" /></>
                )}
              </button>
            </div>
          </div>
        )}
      </form>

      {step === 4 && (
        <div className="text-center animate-in zoom-in-95 duration-500">
           <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <h1 className="mb-4 text-3xl font-black text-gray-900">Documents Submitted!</h1>
            <p className="mb-8 text-gray-600">
              We've received your documents. Our team will review them within 24 hours. 
              You can track your status on your dashboard.
            </p>
            <button
              onClick={() => router.push("/landlord/dashboard")}
              className="w-full max-w-sm rounded-xl bg-[#1B4332] py-4 font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:brightness-110"
            >
              Back to Dashboard
            </button>
        </div>
      )}
    </div>
  )
}
