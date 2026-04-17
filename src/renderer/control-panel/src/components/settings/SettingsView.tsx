import { useTranslation } from 'react-i18next'
import { AVAILABLE_LANGUAGES } from '@shared/locales'
import { Label } from '@renderer/components/ui/label'
import { NativeSelect } from '@renderer/components/ui/native-select'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'

export const SettingsView = () => {
  const { t, i18n } = useTranslation()

  const handleLanguageChange = async (lang: string) => {
    await window.api.setLanguage(lang)
    i18n.changeLanguage(lang)
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
        </CardContent>
      </Card>
    </div>
  )
}
