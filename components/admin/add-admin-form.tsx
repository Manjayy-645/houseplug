"use client"

import { useState } from "react"
import { Search, Loader2, ShieldCheck, UserPlus, AlertCircle } from "lucide-react"
import { Profile } from "@/types"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function AddAdminForm() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState("")
  const [searching, setSearching] = useState(false)
  const [foundUser, setFoundUser] = useState<Profile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setSearching(true)
    setError(null)
    setFoundUser(null)

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single()

      if (error) {
        setError("No account found with this email. Ask them to sign up on HousePlug first.")
      } else {
        setFoundUser(data)
      }
    } catch (err) {
      setError("An unexpected error occurred.")
    } finally {
      setSearching(false)
    }
  }

  const handleMakeAdmin = async () => {
    if (!foundUser) return

    setLoading(true)
    try {
      const res = await fetch('/api/admin/manage-admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'promote', userId: foundUser.id })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      setFoundUser(null)
      setEmail("")
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="flex gap-4">
        <div className="flex-1 relative">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
           <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter user email..." 
              required
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 text-sm font-medium outline-none focus:border-[#1B4332] transition shadow-sm"
           />
        </div>
        <button 
           type="submit"
           disabled={searching}
           className="px-8 py-3 bg-[#1B4332] text-white rounded-2xl text-sm font-black shadow-lg shadow-[#1B4332]/10 hover:brightness-110 active:scale-95 transition disabled:opacity-50"
        >
           {searching ? <Loader2 className="h-5 w-5 animate-spin" /> : "Search"}
        </button>
      </form>

      {error && (
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-3 text-amber-800 text-sm font-medium">
           <AlertCircle className="h-5 w-5 shrink-0" />
           {error}
        </div>
      )}

      {foundUser && (
        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-[#1B4332] font-black border border-emerald-100 shadow-sm">
                 {foundUser.full_name[0].toUpperCase()}
              </div>
              <div>
                 <p className="text-sm font-bold text-gray-900">{foundUser.full_name}</p>
                 <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Current Role: {foundUser.role}</p>
              </div>
           </div>
           {['admin', 'super_admin'].includes(foundUser.role) ? (
              <span className="text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-100/50 px-4 py-2 rounded-xl">
                 Already Admin
              </span>
           ) : (
              <button
                onClick={handleMakeAdmin}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Make Admin
              </button>
           )}
        </div>
      )}
    </div>
  )
}
