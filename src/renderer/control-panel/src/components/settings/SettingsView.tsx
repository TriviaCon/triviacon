import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AVAILABLE_LANGUAGES } from '@shared/locales'
import { Label } from '@renderer/components/ui/label'
import { NativeSelect } from '@renderer/components/ui/native-select'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'

export const SettingsView = () => {
  const { t, i18n } = useTranslation()
  const [volume, setVolume] = useState(0.1)

  useEffect(() => {
    window.api.getDefaultVolume().then(setVolume)
  }, [])

  const handleLanguageChange = async (lang: string) => {
    await window.api.setLanguage(lang)
    i18n.changeLanguage(lang)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value)
    setVolume(v)
    window.api.setDefaultVolume(v)
  }

  return (
    <div className="max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Label className="w-24 text-right shrink-0">{t('settings.language')}</Label>
            <NativeSelect
              value={i18n.language}
              onChange={(e) => handleLanguageChange(e.target.value)}
            >
              {AVAILABLE_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </NativeSelect>
          </div>
          <p className="text-sm text-muted-foreground ml-28">
            {t('settings.languageDescription')}
          </p>

          <div className="flex items-center gap-4">
            <Label className="w-24 text-right shrink-0">{t('settings.defaultVolume')}</Label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 h-1.5 accent-primary cursor-pointer"
            />
            <span className="text-sm text-muted-foreground tabular-nums w-10">
              {Math.round(volume * 100)}%
            </span>
          </div>
          <p className="text-sm text-muted-foreground ml-28">
            {t('settings.defaultVolumeDescription')}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
