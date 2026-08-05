"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { createRoommateProfile } from "@/app/roommate-actions"
import { UNIVERSITIES } from "@/lib/constants"
import { Check, Loader2, Home, User } from "lucide-react"

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

export default function CreateRoommateProfilePage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
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
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-display-md text-3xl md:text-4xl text-primary mb-3">Create Roommate Profile</h1>
          <p className="text-gray-500 font-medium">Tell us what you're looking for to find the perfect match.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white p-6 md:p-10 rounded-3xl border border-gray-100 shadow-sm">
          
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl font-medium border border-red-100 text-sm text-center">
              {error}
            </div>
          )}

          {/* Section 1: Intent */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">1. What's your situation?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className={`relative flex flex-col p-5 rounded-2xl border-2 cursor-pointer transition-all ${currentIntent === 'teaming_up' ? 'border-[#1B4332] bg-green-50/30' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="radio" value="teaming_up" {...register("intent")} className="sr-only" />
                <User className={`h-6 w-6 mb-3 ${currentIntent === 'teaming_up' ? 'text-[#1B4332]' : 'text-gray-400'}`} />
                <span className={`font-bold ${currentIntent === 'teaming_up' ? 'text-[#1B4332]' : 'text-gray-700'}`}>Looking to Team Up</span>
                <span className="text-sm text-gray-500 mt-1">I don't have a place yet and want to hunt with someone.</span>
                {currentIntent === 'teaming_up' && <Check className="absolute top-4 right-4 h-5 w-5 text-[#1B4332]" />}
              </label>

              <label className={`relative flex flex-col p-5 rounded-2xl border-2 cursor-pointer transition-all ${currentIntent === 'have_room' ? 'border-[#F59E0B] bg-amber-50/30' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="radio" value="have_room" {...register("intent")} className="sr-only" />
                <Home className={`h-6 w-6 mb-3 ${currentIntent === 'have_room' ? 'text-[#F59E0B]' : 'text-gray-400'}`} />
                <span className={`font-bold ${currentIntent === 'have_room' ? 'text-[#F59E0B]' : 'text-gray-700'}`}>I Have a Room</span>
                <span className="text-sm text-gray-500 mt-1">I already secured a place and need someone to move in.</span>
                {currentIntent === 'have_room' && <Check className="absolute top-4 right-4 h-5 w-5 text-[#F59E0B]" />}
              </label>
            </div>
          </section>

          {/* Conditional: Have a Room Address */}
          {currentIntent === 'have_room' && (
            <section className="animate-in fade-in slide-in-from-top-4 duration-300">
              <label className="block text-sm font-bold text-gray-700 mb-2">Property Address / Area <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                placeholder="e.g. Aluu, close to back gate" 
                {...register("room_address")}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#1B4332] focus:ring-1 focus:ring-[#1B4332]"
              />
            </section>
          )}

          {/* Section 2: Basic Info */}
          <section className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 border-t border-gray-100 pt-6">2. Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">University <span className="text-red-500">*</span></label>
                <select {...register("university")} className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#1B4332] focus:ring-1 focus:ring-[#1B4332] bg-white">
                  <option value="">Select your university</option>
                  {UNIVERSITIES.map(u => (
                    <option key={u.id} value={u.name}>{u.name}</option>
                  ))}
                </select>
                {errors.university && <p className="text-red-500 text-xs mt-1">{errors.university.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">WhatsApp Number <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  placeholder="080XXXXXXXX" 
                  {...register("phone_number")}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#1B4332] focus:ring-1 focus:ring-[#1B4332]"
                />
                {errors.phone_number && <p className="text-red-500 text-xs mt-1">{errors.phone_number.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Your Gender <span className="text-red-500">*</span></label>
                <select {...register("gender")} className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#1B4332] focus:ring-1 focus:ring-[#1B4332] bg-white">
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Preferred Roommate Gender <span className="text-red-500">*</span></label>
                <select {...register("preferred_gender")} className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#1B4332] focus:ring-1 focus:ring-[#1B4332] bg-white">
                  <option value="">Select preference</option>
                  <option value="Male Only">Male Only</option>
                  <option value="Female Only">Female Only</option>
                  <option value="Any">Any / Don't mind</option>
                </select>
                {errors.preferred_gender && <p className="text-red-500 text-xs mt-1">{errors.preferred_gender.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {currentIntent === 'have_room' ? "Rent Share Amount (₦) per year" : "Budget Range (₦) per year"} <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                <input 
                  type="number" 
                  placeholder={currentIntent === 'have_room' ? "Rent amount" : "Min budget"} 
                  {...register("budget_min")}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#1B4332] focus:ring-1 focus:ring-[#1B4332]"
                />
                <span className="hidden sm:block text-gray-400 font-bold">-</span>
                <input 
                  type="number" 
                  placeholder={currentIntent === 'have_room' ? "Same as amount" : "Max budget"} 
                  {...register("budget_max")}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#1B4332] focus:ring-1 focus:ring-[#1B4332]"
                />
              </div>
              {(errors.budget_min || errors.budget_max) && <p className="text-red-500 text-xs mt-1">Please enter valid amounts (min 10,000).</p>}
            </div>
          </section>

          {/* Section 3: Lifestyle & Bio */}
          <section className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 border-t border-gray-100 pt-6">3. Lifestyle & Preferences</h2>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Select up to 5 tags that describe you best <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-2">
                {LIFESTYLE_TAGS.map(tag => {
                  const isSelected = currentTags.includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        isSelected 
                          ? 'bg-[#1B4332] text-white border border-[#1B4332]' 
                          : 'bg-white text-gray-600 border border-gray-200 hover:border-[#1B4332]/50'
                      }`}
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>
              {errors.lifestyle_tags && <p className="text-red-500 text-xs mt-2">{errors.lifestyle_tags.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Short Bio <span className="text-red-500">*</span></label>
              <textarea 
                {...register("bio")}
                placeholder="Introduce yourself! E.g. I'm a 300L Med student, I like keeping my space very tidy and I'm looking for someone with a similar vibe..."
                rows={4}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#1B4332] focus:ring-1 focus:ring-[#1B4332] resize-none"
              />
              {errors.bio && <p className="text-red-500 text-xs mt-1">{errors.bio.message}</p>}
            </div>
          </section>

          {/* Submit */}
          <div className="pt-6 border-t border-gray-100">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-[#F59E0B] text-white py-4 rounded-xl font-black text-lg hover:brightness-105 transition active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <><Loader2 className="h-6 w-6 animate-spin" /> Publishing...</>
              ) : (
                "Publish Roommate Profile"
              )}
            </button>
            <p className="text-center text-xs text-gray-500 mt-4 font-medium">
              By publishing, you agree to HousePlug's community safety guidelines.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
