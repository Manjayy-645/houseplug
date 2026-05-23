"use client"

import { useRef, useEffect } from "react"

interface OTPInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function OTPInput({ value, onChange, disabled }: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Ensure value is at least 6 chars (empty or partial)
  const otpArray = value.split("").slice(0, 6)
  while (otpArray.length < 6) otpArray.push("")

  const handleChange = (index: number, val: string) => {
    if (disabled) return
    
    // Only allow digits
    const cleanVal = val.replace(/[^0-9]/g, "")
    if (!cleanVal && val !== "") return // Ignore non-numeric input

    const newOtp = value.split("")
    newOtp[index] = cleanVal.substring(cleanVal.length - 1) // Take last char entered
    const joined = newOtp.join("").substring(0, 6)
    onChange(joined)

    // Auto-advance
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpArray[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    if (disabled) return

    const pastedData = e.clipboardData.getData("text").replace(/[^0-9]/g, "").substring(0, 6)
    if (pastedData) {
      onChange(pastedData)
      // Focus last filled box or next empty
      const nextIndex = Math.min(pastedData.length, 5)
      inputRefs.current[nextIndex]?.focus()
    }
  }

  return (
    <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
      {otpArray.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          className={`h-12 w-12 rounded-xl border-2 text-center text-xl font-bold outline-none transition-all
            ${digit 
              ? "border-[#F59E0B] bg-amber-50 text-[#1B4332]" 
              : "border-gray-200 bg-white text-gray-400 focus:border-[#1B4332] focus:ring-2 focus:ring-green-100"
            }
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        />
      ))}
    </div>
  )
}
