import { Mail, Phone, MapPin } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-[#1B4332]">Contact Us</h1>
        <p className="mt-4 text-lg text-gray-600">Have questions or need help? We're here for you.</p>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1B4332] text-white">
            <Mail className="h-6 w-6" />
          </div>
          <h3 className="mt-6 font-bold text-gray-900">Email</h3>
          <p className="mt-2 text-gray-500">support@houseplug.ng</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1B4332] text-white">
            <Phone className="h-6 w-6" />
          </div>
          <h3 className="mt-6 font-bold text-gray-900">Phone</h3>
          <p className="mt-2 text-gray-500">+234 800 HOUSEPLUG</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1B4332] text-white">
            <MapPin className="h-6 w-6" />
          </div>
          <h3 className="mt-6 font-bold text-gray-900">Office</h3>
          <p className="mt-2 text-gray-500">Choba, Port Harcourt</p>
        </div>
      </div>
    </div>
  )
}
