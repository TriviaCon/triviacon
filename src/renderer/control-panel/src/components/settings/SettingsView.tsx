import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AVAILABLE_LANGUAGES } from '@shared/locales'
import { Label } from '@renderer/components/ui/label'
import { NativeSelect } from '@renderer/components/ui/native-select'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { THEMES, applyTheme } from '@renderer/lib/theme'
import { setCurrentTheme } from '../../main'

const COLOR_MODES = ['heatmap', 'rainbow', 'gradient'] as const
const TIMER_SOUND_MODES = ['beeps-and-buzz', 'beeps', 'buzz', 'silent'] as const
const FANFARE_MODES = ['ff5', 'nfl', 'pokemon'] as const

export const SettingsView = () => {
  const { t, i18n } = useTranslation()
  const [volume, setVolume] = useState(0.1)
  const [colorMode, setColorMode] = useState('heatmap')
  const [barCount, setBarCount] = useState(48)
  const [timerSound, setTimerSound] = useState('beeps-and-buzz')
  const [fanfare, setFanfare] = useState('ff5')
  const [theme, setTheme] = useState('system')

  useEffect(() => {
    window.api.getDefaultVolume().then(setVolume)
    window.api.getVisualizer().then((v) => {
      setColorMode(v.colorMode)
      setBarCount(v.barCount)
    })
    window.api.getTimerSound().then(setTimerSound)
    window.api.getFanfare?.().then(setFanfare)
    window.api.getTheme().then(setTheme)
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

  const handleThemeChange = (id: string) => {
    setTheme(id)
    setCurrentTheme(id)
    applyTheme(id)
    window.api.setTheme(id)
  }

  return (
    <div className="max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Label className="w-24 text-right shrink-0">{t('settings.theme')}</Label>
            <NativeSelect value={theme} onChange={(e) => handleThemeChange(e.target.value)}>
              {THEMES.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {t(entry.labelKey as 'settings.themeSystem')}
                </option>
              ))}
            </NativeSelect>
          </div>

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

          <div className="flex items-center gap-4">
            <Label className="w-24 text-right shrink-0">{t('settings.timerSound')}</Label>
            <NativeSelect
              value={timerSound}
              onChange={(e) => {
                setTimerSound(e.target.value)
                window.api.setTimerSound(e.target.value)
              }}
            >
              {TIMER_SOUND_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {t(`settings.timerSound_${mode}` as 'settings.timerSound_beeps-and-buzz')}
                </option>
              ))}
            </NativeSelect>
          </div>
          <p className="text-sm text-muted-foreground ml-28">
            {t(`settings.timerSound_${timerSound}_desc` as 'settings.timerSound_beeps-and-buzz_desc')}
          </p>

          <div className="flex items-center gap-4">
            <Label className="w-24 text-right shrink-0">{t('settings.fanfare')}</Label>
            <NativeSelect
              value={fanfare}
              onChange={(e) => {
                setFanfare(e.target.value)
                window.api.setFanfare(e.target.value)
              }}
            >
              {FANFARE_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {t(`settings.fanfare_${mode}` as 'settings.fanfare_ff5')}
                </option>
              ))}
            </NativeSelect>
          </div>
          <p className="text-sm text-muted-foreground ml-28">
            {t('settings.fanfareDescription')}
          </p>

          <div className="flex items-center gap-4">
            <Label className="w-24 text-right shrink-0">{t('settings.visualizerColor')}</Label>
            <NativeSelect
              value={colorMode}
              onChange={(e) => {
                setColorMode(e.target.value)
                window.api.setVisualizer({ colorMode: e.target.value })
              }}
            >
              {COLOR_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {t(`settings.color${mode.charAt(0).toUpperCase()}${mode.slice(1)}` as 'settings.colorHeatmap')}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="flex items-center gap-4">
            <Label className="w-24 text-right shrink-0">{t('settings.visualizerBars')}</Label>
            <input
              type="range"
              min={16}
              max={128}
              step={8}
              value={barCount}
              onChange={(e) => {
                const v = Number(e.target.value)
                setBarCount(v)
                window.api.setVisualizer({ barCount: v })
              }}
              className="flex-1 h-1.5 accent-primary cursor-pointer"
            />
            <span className="text-sm text-muted-foreground tabular-nums w-10">
              {barCount}
            </span>
          </div>
          <p className="text-sm text-muted-foreground ml-28">
            {t('settings.visualizerDescription')}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
