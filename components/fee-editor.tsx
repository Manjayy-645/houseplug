"use client";
import type { FeeItem } from "@/lib/housing";
export const initialFees: FeeItem[] = [
  {
    type: "agency",
    label: "Agency fee",
    amount: null,
    mandatory: true,
    refundable: false,
  },
  {
    type: "caution",
    label: "Caution deposit",
    amount: null,
    mandatory: true,
    refundable: true,
  },
  {
    type: "legal",
    label: "Legal fee",
    amount: null,
    mandatory: true,
    refundable: false,
  },
  {
    type: "service",
    label: "Service charge",
    amount: null,
    mandatory: true,
    refundable: false,
  },
  {
    type: "other",
    label: "Other mandatory charges",
    amount: null,
    mandatory: true,
    refundable: false,
  },
  {
    type: "inspection",
    label: "Inspection fee",
    amount: null,
    mandatory: false,
    refundable: false,
  },
];
export function FeeEditor({
  value,
  onChange,
}: {
  value: FeeItem[];
  onChange: (f: FeeItem[]) => void;
}) {
  return (
    <fieldset className="space-y-4">
      <legend className="font-bold text-lg">Move-in charges (₦)</legend>
      <p className="text-sm">
        Leave an unknown amount blank. Enter 0 only when the charge is
        explicitly confirmed as zero. Enter charges due at move-in only. Annual
        rent is entered separately; confirm recurring costs and renewal terms
        directly.
      </p>
      {value.map((f, i) => (
        <div
          className="border rounded-xl p-4 grid gap-3 sm:grid-cols-2"
          key={i}
        >
          <label>
            {f.label}
            <input
              aria-label={`${f.label} amount`}
              type="number"
              min="0"
              step="1"
              value={f.amount ?? ""}
              onChange={(e) =>
                onChange(
                  value.map((x, j) =>
                    j === i
                      ? {
                          ...x,
                          amount:
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                        }
                      : x,
                  ),
                )
              }
              className="block border rounded p-3 w-full"
            />
          </label>
          <label>
            Who receives this fee?
            <input
              value={f.recipient ?? ""}
              maxLength={120}
              onChange={(e) =>
                onChange(
                  value.map((x, j) =>
                    j === i ? { ...x, recipient: e.target.value } : x,
                  ),
                )
              }
              className="block border rounded p-3 w-full"
            />
          </label>
          <label className="flex gap-2">
            <input
              type="checkbox"
              checked={f.mandatory}
              onChange={(e) =>
                onChange(
                  value.map((x, j) =>
                    j === i ? { ...x, mandatory: e.target.checked } : x,
                  ),
                )
              }
            />
            Mandatory
          </label>
          <label className="flex gap-2">
            <input
              type="checkbox"
              checked={f.refundable}
              onChange={(e) =>
                onChange(
                  value.map((x, j) =>
                    j === i ? { ...x, refundable: e.target.checked } : x,
                  ),
                )
              }
            />
            Refundable
          </label>
        </div>
      ))}
    </fieldset>
  );
}
