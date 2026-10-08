"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { createRoommateProfile } from "@/app/roommate-actions"
import { UNIVERSITIES } from "@/lib/constants"
import { Check, Loader2, Home, User, ChevronRight, ChevronLeft, Info } from "lucide-react"
import { fireCelebrationConfetti } from "@/lib/confetti"
import { SuggestUniversityModal } from "@/components/university/SuggestUniversityModal"

const LIFESTYLE_TAGS = [
  "Neat freak", "Relaxed", "Night owl", "Early bird", 
  "Quiet study", "Group study", "No visitors", 
  "Occasional guests", "Smoker", "Non-smoker", 
  "Shared cooking", "Separate meals"
]

const formSchema = z.object({
  intent: z.enum(["have_room", "teaming_up"]),
  university: z.string().min(1, "Please select a university"),
  budget_min: z.coerce.number().min(10000, "Minimum budget must be at least 10,000"),
  budget_max: z.coerce.number().min(10000, "Maximum budget must be at least 10,000"),
  gender: z.string().min(1, "Please select your gender"),
  preferred_gender: z.string().min(1, "Please select preferred gender"),
  lifestyle_tags: z.array(z.string()).min(1, "Select at least one lifestyle tag").max(5, "Select up to 5 tags"),
  bio: z.string().min(20, "Bio must be at least 20 characters").max(300, "Bio is too long"),
  phone_number: z.string().min(11, "Enter a valid phone number (e.g., 08012345678)"),
  room_address: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

export default function CreateRoommateForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState(1)
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<z.input<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      intent: "teaming_up",
      lifestyle_tags: [],
    }
  })

  const currentIntent = watch("intent") as string
  const currentTags = (watch("lifestyle_tags") as string[]) || []

  const toggleTag = (tag: string) => {
    if (currentTags.includes(tag)) {
      setValue("lifestyle_tags", currentTags.filter(t => t !== tag), { shouldValidate: true })
    } else {
      if (currentTags.length >= 5) return // Max 5 tags
      setValue("lifestyle_tags", [...currentTags, tag], { shouldValidate: true })
    }
  }

  const handleNext = async () => {
    let fieldsToValidate: any[] = []
    if (step === 1) {
      fieldsToValidate = ["intent"]
      if (currentIntent === "have_room") fieldsToValidate.push("room_address")
    } else if (step === 2) {
      fieldsToValidate = ["university", "phone_number", "gender", "preferred_gender", "budget_min", "budget_max"]
    }
    
    const isValid = await trigger(fieldsToValidate)
    if (isValid) {
      setStep(prev => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrev = () => {
    setStep(prev => prev - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const onSubmit = async (data: any) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      const result = await createRoommateProfile({
        ...data,
        room_photos: [] // Would handle photo uploads here later
      })

      if (result.error) {
        setError(result.error)
      } else {
        fireCelebrationConfetti()
        router.push("/roommates")
      }
    } catch (e: any) {
      setError("An unexpected error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] pt-28 pb-20 px-5">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-display-md text-3xl md:text-4xl text-primary mb-3">Create Roommate Profile</h1>
          <p className="text-gray-500 font-medium">Tell us what you're looking for to find the perfect match.</p>
        </div>

        {/* Progress Tracker */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex flex-col items-center relative z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                  step >= i ? 'bg-[#1B4332] text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {i}
                </div>
              </div>
            ))}
            {/* Background line */}
            <div className="absolute left-0 right-0 top-4 h-1 bg-gray-200 -z-0 mx-8">
              <div 
                className="h-full bg-[#1B4332] transition-all duration-300" 
                style={{ width: `${(step - 1) * 50}%` }}
              ></div>
            </div>
          </div>
          <div className="flex justify-between px-2 text-xs font-bold text-gray-500 mt-2 relative">
            <span className={step >= 1 ? 'text-[#1B4332]' : ''}>Situation</span>
            <span className={`text-center ${step >= 2 ? 'text-[#1B4332]' : ''}`}>Details</span>
            <span className={`text-right ${step >= 3 ? 'text-[#1B4332]' : ''}`}>Lifestyle</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40 relative">
          
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl font-medium border border-red-100 text-sm text-center mb-6">
              {error}
            </div>
          )}

          {/* Step 1: Intent */}
          {step === 1 && (
            <section className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-8">
              <div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">What's your situation?</h2>
                <p className="text-gray-500 mb-6">Let us know if you already have a place or if you're looking to team up and hunt together.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className={`relative flex flex-col p-6 rounded-3xl border-2 cursor-pointer transition-all ${currentIntent === 'teaming_up' ? 'border-[#1B4332] bg-emerald-50/50 shadow-md' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                    <input type="radio" value="teaming_up" {...register("intent")} className="sr-only" />
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${currentIntent === 'teaming_up' ? 'bg-[#1B4332] text-white' : 'bg-gray-100 text-gray-400'}`}>
                      <User className="h-6 w-6" />
                    </div>
                    <span className={`text-lg font-black ${currentIntent === 'teaming_up' ? 'text-[#1B4332]' : 'text-gray-700'}`}>Looking to Team Up</span>
                    <span className="text-sm text-gray-500 mt-2 font-medium">I don't have a place yet and want to hunt with someone.</span>
                    {currentIntent === 'teaming_up' && <Check className="absolute top-6 right-6 h-6 w-6 text-[#1B4332]" />}
                  </label>

                  <label className={`relative flex flex-col p-6 rounded-3xl border-2 cursor-pointer transition-all ${currentIntent === 'have_room' ? 'border-[#F59E0B] bg-amber-50/50 shadow-md' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                    <input type="radio" value="have_room" {...register("intent")} className="sr-only" />
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${currentIntent === 'have_room' ? 'bg-[#F59E0B] text-white' : 'bg-gray-100 text-gray-400'}`}>
                      <Home className="h-6 w-6" />
                    </div>
                    <span className={`text-lg font-black ${currentIntent === 'have_room' ? 'text-[#F59E0B]' : 'text-gray-700'}`}>I Have a Room</span>
                    <span className="text-sm text-gray-500 mt-2 font-medium">I already secured a place and need someone to move in.</span>
                    {currentIntent === 'have_room' && <Check className="absolute top-6 right-6 h-6 w-6 text-[#F59E0B]" />}
                  </label>
                </div>
              </div>

              {currentIntent === 'have_room' && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                  <label className="block text-sm font-black text-gray-700 mb-3">Property Address / Area <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    placeholder="e.g. Aluu, close to back gate" 
                    {...register("room_address")}
                    className="w-full rounded-2xl border border-gray-200 px-5 py-4 outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/20 transition-all text-base font-medium"
                  />
                  {errors.room_address && <p className="text-red-500 text-xs mt-2 font-bold">{errors.room_address.message}</p>}
                </div>
              )}
            </section>
          )}

          {/* Step 2: Basic Info */}
          {step === 2 && (
            <section className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-8">
              <div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">The Details</h2>
                <p className="text-gray-500 mb-6">Help potential roommates know the essentials.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-3">University <span className="text-red-500">*</span></label>
                  <select {...register("university")} className="w-full rounded-2xl border border-gray-200 px-5 py-4 outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/20 bg-white transition-all text-base font-medium cursor-pointer">
                    <option value="">Select your university</option>
                    {UNIVERSITIES.map(u => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                  {errors.university && <p className="text-red-500 text-xs mt-2 font-bold">{errors.university.message}</p>}
                  
                  <div className="mt-3 flex items-start gap-2 bg-amber-50 p-3 rounded-xl border border-amber-100">
                    <Info className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-amber-900 leading-snug">
                        Roommate matching is currently restricted to Rivers State institutions.
                      </p>
                      <button 
                        type="button" 
                        onClick={() => setIsSuggestModalOpen(true)}
                        className="text-xs font-bold text-[#F59E0B] hover:text-amber-600 underline mt-1"
                      >
                        Want HousePlug at your school? Let us know.
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-black text-gray-700 mb-3">WhatsApp Number <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    placeholder="080XXXXXXXX" 
                    {...register("phone_number")}
                    className="w-full rounded-2xl border border-gray-200 px-5 py-4 outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/20 transition-all text-base font-medium"
                  />
                  {errors.phone_number && <p className="text-red-500 text-xs mt-2 font-bold">{errors.phone_number.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-3">Your Gender <span className="text-red-500">*</span></label>
                  <select {...register("gender")} className="w-full rounded-2xl border border-gray-200 px-5 py-4 outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/20 bg-white transition-all text-base font-medium cursor-pointer">
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  {errors.gender && <p className="text-red-500 text-xs mt-2 font-bold">{errors.gender.message}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-3">Preferred Roommate Gender <span className="text-red-500">*</span></label>
                  <select {...register("preferred_gender")} className="w-full rounded-2xl border border-gray-200 px-5 py-4 outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/20 bg-white transition-all text-base font-medium cursor-pointer">
                    <option value="">Select preference</option>
                    <option value="Male Only">Male Only</option>
                    <option value="Female Only">Female Only</option>
                    <option value="Any">Any / Don't mind</option>
                  </select>
                  {errors.preferred_gender && <p className="text-red-500 text-xs mt-2 font-bold">{errors.preferred_gender.message}</p>}
                </div>
              </div>

              <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100">
                <label className="block text-sm font-black text-gray-700 mb-3">
                  {currentIntent === 'have_room' ? "Rent Share Amount (₦) per year" : "Budget Range (₦) per year"} <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <input 
                    type="number" 
                    placeholder={currentIntent === 'have_room' ? "Rent amount" : "Min budget"} 
                    {...register("budget_min")}
                    className="w-full rounded-2xl border border-amber-200 px-5 py-4 outline-none focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 transition-all text-base font-medium"
                  />
                  <span className="hidden sm:block text-amber-300 font-black text-xl">-</span>
                  <input 
                    type="number" 
                    placeholder={currentIntent === 'have_room' ? "Same as amount" : "Max budget"} 
                    {...register("budget_max")}
                    className="w-full rounded-2xl border border-amber-200 px-5 py-4 outline-none focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 transition-all text-base font-medium"
                  />
                </div>
                {(errors.budget_min || errors.budget_max) && <p className="text-red-500 text-xs mt-3 font-bold">Please enter valid amounts (min ₦10,000).</p>}
              </div>
            </section>
          )}

          {/* Step 3: Lifestyle & Bio */}
          {step === 3 && (
            <section className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-8">
              <div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Lifestyle & Bio</h2>
                <p className="text-gray-500 mb-6">The fun part! Who are you behind the rent money?</p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                <label className="block text-sm font-black text-gray-700 mb-4">Select up to 5 tags that describe you best <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2.5">
                  {LIFESTYLE_TAGS.map(tag => {
                    const isSelected = currentTags.includes(tag)
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm active:scale-95 ${
                          isSelected 
                            ? 'bg-[#1B4332] text-white border-none shadow-emerald-900/20' 
                            : 'bg-white text-gray-600 border border-gray-200 hover:border-[#1B4332] hover:text-[#1B4332]'
                        }`}
                      >
                        {tag}
                      </button>
                    )
                  })}
                </div>
                {errors.lifestyle_tags && <p className="text-red-500 text-xs mt-3 font-bold">{errors.lifestyle_tags.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-3">Short Bio <span className="text-red-500">*</span></label>
                <textarea 
                  {...register("bio")}
                  placeholder="Introduce yourself! E.g. I'm a 300L Med student, I like keeping my space very tidy and I'm looking for someone with a similar vibe..."
                  rows={5}
                  className="w-full rounded-2xl border border-gray-200 px-5 py-4 outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/20 resize-none transition-all text-base font-medium leading-relaxed"
                />
                {errors.bio && <p className="text-red-500 text-xs mt-2 font-bold">{errors.bio.message}</p>}
              </div>
            </section>
          )}

          {/* Navigation Buttons */}
          <div className="pt-10 mt-10 border-t border-gray-100 flex items-center justify-between">
            {step > 1 ? (
              <button 
                type="button" 
                onClick={handlePrev}
                className="px-6 py-4 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="h-5 w-5" /> Back
              </button>
            ) : (
              <div></div>
            )}

            {step < 3 ? (
              <button 
                type="button" 
                onClick={handleNext}
                className="bg-[#1B4332] text-white px-8 py-4 rounded-xl font-black hover:bg-emerald-900 transition shadow-lg shadow-emerald-900/20 active:scale-95 flex items-center gap-2 ml-auto"
              >
                Next Step <ChevronRight className="h-5 w-5" />
              </button>
            ) : (
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-[#F59E0B] text-white px-8 py-4 rounded-xl font-black text-lg hover:brightness-105 transition shadow-lg shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
              >
                {isSubmitting ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Publishing...</>
                ) : (
                  "Publish Profile"
                )}
              </button>
            )}
          </div>
        </form>
      </div>
      <SuggestUniversityModal 
        isOpen={isSuggestModalOpen}
        onClose={() => setIsSuggestModalOpen(false)}
      />
    </div>
  )
}
