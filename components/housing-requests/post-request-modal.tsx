"use client";

import { useState } from "react";
import { X, Sparkles, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { submitHousingRequest } from "@/app/actions/housing-requests";
import { CAMPUS_ZONES, HOUSING_PROPERTY_TYPES, MOVE_IN_TIMELINES } from "@/lib/constants";

type PostRequestModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (requestCode: string) => void;
  initialCampusZone?: string;
  initialNotes?: string;
};

export function PostRequestModal({
  isOpen,
  onClose,
  onSuccess,
  initialCampusZone,
  initialNotes,
}: PostRequestModalProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    student_name: "",
    student_whatsapp: "",
    campus_zone:
      initialCampusZone && (CAMPUS_ZONES as readonly string[]).includes(initialCampusZone)
        ? initialCampusZone
        : "Choba",
    property_type: "Self-Contain",
    min_budget: "200000",
    max_budget: "350000",
    move_in_timeline: "Within 2 Weeks",
    extra_notes: initialNotes || "",
  });

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const res = await submitHousingRequest({
      student_name: formData.student_name,
      student_whatsapp: formData.student_whatsapp,
      campus_zone: formData.campus_zone as any,
      property_type: formData.property_type as any,
      min_budget: Number(formData.min_budget),
      max_budget: Number(formData.max_budget),
      move_in_timeline: formData.move_in_timeline as any,
      extra_notes: formData.extra_notes,
    });

    setBusy(false);

    if (!res.success) {
      setError(res.error || "Failed to submit your request");
      return;
    }

    setCreatedCode(res.request_code || "HP-SUCCESS");
    if (onSuccess && res.request_code) {
      onSuccess(res.request_code);
    }
  };

  const handleReset = () => {
    setCreatedCode(null);
    setError(null);
    setFormData({
      student_name: "",
      student_whatsapp: "",
      campus_zone: "Choba",
      property_type: "Self-Contain",
      min_budget: "200000",
      max_budget: "350000",
      move_in_timeline: "Within 2 Weeks",
      extra_notes: "",
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="request-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Accent Bar */}
        <div className="h-2 w-full bg-linear-to-r from-[#1B4332] via-[#10B981] to-[#F59E0B]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100 bg-[#1B4332]/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1B4332] text-white flex items-center justify-center font-bold text-lg shadow-xs">
              🏠
            </div>
            <div>
              <h2 id="request-modal-title" className="text-lg sm:text-xl font-extrabold text-[#111827]">
                Post a Free Lodge Request
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                100% Free · We broadcast directly to verified partner agents
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View */}
        {createdCode ? (
          <div className="p-6 sm:p-8 text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#10B981] flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-bold text-[#10B981] uppercase tracking-wider block mb-1">
                Request Broadcasted
              </span>
              <h3 className="text-2xl font-black text-[#111827]">
                Your Request is Live!
              </h3>
              <div className="inline-block my-3 px-4 py-2 rounded-xl bg-gray-100 border border-gray-200 font-mono text-base font-extrabold text-[#1B4332]">
                #{createdCode}
              </div>
              <p className="text-sm text-gray-600 max-w-sm mx-auto leading-relaxed">
                We’ve received your lodge requirements. Our partner agents are actively matching vacant lodges. You will receive direct WhatsApp photos and details when a match is found.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#1B4332] text-white font-bold text-sm hover:bg-[#133024] shadow-sm transition-all"
              >
                View Request Board
              </button>
            </div>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-medium"
              >
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Student Name */}
            <div>
              <label htmlFor="student_name" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Your Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="student_name"
                name="student_name"
                type="text"
                required
                value={formData.student_name}
                onChange={handleChange}
                placeholder="e.g. Samuel Okon"
                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B4332] transition-colors"
              />
            </div>

            {/* Student WhatsApp */}
            <div>
              <label htmlFor="student_whatsapp" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                WhatsApp Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                id="student_whatsapp"
                name="student_whatsapp"
                type="tel"
                required
                value={formData.student_whatsapp}
                onChange={handleChange}
                placeholder="08012345678 or 090..."
                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B4332] transition-colors"
              />
              <span className="text-[11px] text-gray-600 block mt-1">
                🔒 Kept confidential. Only shared with verified agents or HousePlug brokers.
              </span>
            </div>

            {/* Preferred Area & Property Type Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="campus_zone" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Preferred Area <span className="text-red-500">*</span>
                </label>
                <select
                  id="campus_zone"
                  name="campus_zone"
                  value={formData.campus_zone}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B4332] transition-colors"
                >
                  {CAMPUS_ZONES.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="property_type" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Lodge Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="property_type"
                  name="property_type"
                  value={formData.property_type}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B4332] transition-colors"
                >
                  {HOUSING_PROPERTY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Annual Budget Range */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Annual Rent Budget (₦) <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-gray-600 block mb-0.5">Minimum (₦)</span>
                  <input
                    type="number"
                    name="min_budget"
                    required
                    step="5000"
                    min="20000"
                    value={formData.min_budget}
                    onChange={handleChange}
                    placeholder="200,000"
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-gray-600 block mb-0.5">Maximum (₦)</span>
                  <input
                    type="number"
                    name="max_budget"
                    required
                    step="5000"
                    min="20000"
                    value={formData.max_budget}
                    onChange={handleChange}
                    placeholder="350,000"
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                  />
                </div>
              </div>
            </div>

            {/* Move-In Timeline */}
            <div>
              <label htmlFor="move_in_timeline" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Move-In Timeline <span className="text-red-500">*</span>
              </label>
              <select
                id="move_in_timeline"
                name="move_in_timeline"
                value={formData.move_in_timeline}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B4332] transition-colors"
              >
                {MOVE_IN_TIMELINES.map((timeline) => (
                  <option key={timeline} value={timeline}>
                    {timeline}
                  </option>
                ))}
              </select>
            </div>

            {/* Extra Notes */}
            <div>
              <label htmlFor="extra_notes" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Extra Requirements (Optional)
              </label>
              <textarea
                id="extra_notes"
                name="extra_notes"
                rows={3}
                value={formData.extra_notes}
                onChange={handleChange}
                placeholder="e.g. Female only lodge, fenced compound with borehole, prepaid meter, personal balcony"
                className="w-full rounded-xl border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B4332] transition-colors resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={busy}
                className="w-full py-3.5 px-4 rounded-xl bg-[#1B4332] hover:bg-[#133024] active:scale-[0.99] text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {busy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Broadcasting Your Request...</span>
                  </>
                ) : (
                  <>
                    <span>Post Free Request 🚀</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-center text-gray-600 mt-2">
                No fee required. HousePlug connects you directly with verified lodges.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
