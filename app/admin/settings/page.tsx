import { createClient } from "@/lib/supabase/server"
import { SettingsForm } from "@/components/admin/settings-form"

export default async function SettingsPage() {
  const supabase = createClient()

  const { data: settings } = await supabase
    .from('platform_settings')
    .select('*')

  const settingsMap = Object.fromEntries(
    settings?.map(s => [s.key, s.value]) ?? []
  )

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-black text-[#1B4332]">Platform Settings</h1>
        <p className="text-gray-500 font-medium">Configure pricing, limits, and system status</p>
      </div>

      <SettingsForm settings={settingsMap} />
    </div>
  )
}
