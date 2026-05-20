import { createClient } from "@/lib/supabase/server"
import { Users, Home, CreditCard, Star, Download } from "lucide-react"
import { ExportButton } from "@/components/admin/export-button"

export default async function ExportPage() {
  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-black text-[#1B4332]">Data Export</h1>
        <p className="text-gray-500 font-medium">Download platform data in CSV format for offline analysis</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <ExportCard 
            title="Users" 
            description="Export all students, landlords and admins with contact details."
            icon={Users}
            type="users"
         />
         <ExportCard 
            title="Listings" 
            description="Export all property listings including prices, types and status."
            icon={Home}
            type="listings"
         />
         <ExportCard 
            title="Payments" 
            description="Export all transaction records, plans and billing details."
            icon={CreditCard}
            type="payments"
         />
         <ExportCard 
            title="Reviews" 
            description="Export all student reviews and landlord replies."
            icon={Star}
            type="reviews"
         />
      </div>
    </div>
  )
}

function ExportCard({ title, description, icon: Icon, type }: any) {
   return (
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-6 hover:shadow-md transition-shadow">
         <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center text-[#1B4332]">
               <Icon className="h-6 w-6" />
            </div>
            <div>
               <h3 className="text-lg font-bold text-gray-900">{title}</h3>
               <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-0.5">CSV FORMAT</p>
            </div>
         </div>
         <p className="text-sm text-gray-600 font-medium leading-relaxed">
            {description}
         </p>
         <div className="mt-auto pt-4">
            <ExportButton type={type} />
         </div>
      </div>
   )
}
