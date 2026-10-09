import { useState } from 'react'
import { AlertTriangle, Contrast, Eye, Type } from 'lucide-react'
import { strings } from '@/content/strings/id'
import { localStorageRepo } from '@/infra/storage/localStorageRepo'
import { useSettingsStore, type FontScale } from '@/stores/settingsStore'
import { useProgressStore } from '@/stores/progressStore'
import { Button } from '@/components/ui/Button'

const SCALES: Array<{ value: FontScale; label: string }> = [
  { value: 'normal', label: strings.guide.fontScale.normal },
  { value: 'large', label: strings.guide.fontScale.large },
  { value: 'xlarge', label: strings.guide.fontScale.xlarge },
]

export function SettingsForm() {
  const nickname = useSettingsStore((state) => state.nickname)
  const setNickname = useSettingsStore((state) => state.setNickname)
  const fontScale = useSettingsStore((state) => state.fontScale)
  const setFontScale = useSettingsStore((state) => state.setFontScale)
  const highContrast = useSettingsStore((state) => state.highContrast)
  const toggleHighContrast = useSettingsStore((state) => state.toggleHighContrast)
  const hintsEnabled = useSettingsStore((state) => state.hintsEnabled)
  const toggleHintsEnabled = useSettingsStore((state) => state.toggleHintsEnabled)
  const clearProgress = useProgressStore((state) => state.clear)
  const [confirming, setConfirming] = useState(false)
  const storageOk = localStorageRepo.isAvailable()

  const handleClear = () => {
    if (!confirming) {
      setConfirming(true)
      return
    }
    clearProgress()
    localStorageRepo.clearPrefix('pdp:')
    useSettingsStore.setState({
      nickname: '',
      fontScale: 'normal',
      highContrast: false,
      hintsEnabled: true,
    })
    setConfirming(false)
  }

  return (
    <div className="space-y-5">
      {!storageOk && (
        <p className="rounded-xl bg-amber-50 p-3 fs-small text-amber-800" role="status">
          {strings.errors.storageBlocked}
        </p>
      )}

      <div>
        <label htmlFor="nickname" className="label-caps">
          {strings.guide.nicknameLabel} ({strings.common.optional})
        </label>
        <input
          id="nickname"
          type="text"
          value={nickname}
          maxLength={24}
          autoComplete="off"
          placeholder={strings.guide.nicknamePlaceholder}
          onChange={(event) => setNickname(event.target.value)}
          className="mt-2 w-full rounded-xl border border-ink-200 px-3 py-2.5 fs-body"
        />
        <p className="mt-1 fs-small text-ink-500">{strings.home.nicknameHint}</p>
      </div>

      <fieldset>
        <legend className="label-caps">{strings.guide.fontScaleLabel}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {SCALES.map((scale) => (
            <label
              key={scale.value}
              className={`inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border px-3 fs-button font-semibold ${
                fontScale === scale.value
                  ? 'border-brand-500 bg-brand-50 text-brand-800'
                  : 'border-ink-200 bg-white text-ink-700'
              }`}
            >
              <input
                type="radio"
                name="font-scale"
                value={scale.value}
                checked={fontScale === scale.value}
                onChange={() => setFontScale(scale.value)}
                className="sr-only"
              />
              <Type size={14} aria-hidden="true" />
              {scale.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded-xl border border-ink-200 px-3 py-2">
        <span className="flex items-center gap-2 fs-button font-semibold text-ink-800">
          <Contrast size={16} aria-hidden="true" />
          {strings.guide.highContrastLabel}
        </span>
        <input
          type="checkbox"
          checked={highContrast}
          onChange={toggleHighContrast}
          className="h-5 w-5"
        />
      </label>

      <label className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded-xl border border-ink-200 px-3 py-2">
        <span className="flex items-center gap-2 fs-button font-semibold text-ink-800">
          <Eye size={16} aria-hidden="true" />
          {strings.guide.hintsLabel}
        </span>
        <input
          type="checkbox"
          checked={hintsEnabled}
          onChange={toggleHintsEnabled}
          className="h-5 w-5"
        />
      </label>

      <div className="rounded-xl border border-accent-200 bg-accent-50/60 p-3">
        <p className="fs-body font-semibold text-accent-800">{strings.guide.privacyTitle}</p>
        <p className="mt-1 fs-body text-ink-700">{strings.guide.privacyBody}</p>
        <Button
          variant="danger"
          className="mt-3 w-full"
          icon={<AlertTriangle size={16} aria-hidden="true" />}
          onClick={handleClear}
        >
          {confirming ? strings.guide.clearLocalDataTitle : strings.guide.clearLocalData}
        </Button>
        {confirming && (
          <p className="mt-2 fs-small text-accent-800" role="status">
            {strings.guide.clearLocalDataBody} — {strings.common.confirm}
          </p>
        )}
      </div>
    </div>
  )
}
