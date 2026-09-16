import i18n from '@shared/i18n'

declare const __APP_VERSION__: string

const platformLabel: Record<string, string> = {
  win32: 'Windows',
  linux: 'Linux',
  darwin: 'macOS'
}

export function buildIssueUrl(): string {
  const platform = platformLabel[window.api.platform] ?? window.api.platform
  const body = `**${i18n.t('header.issueVersion')}:** ${__APP_VERSION__}\n**${i18n.t('header.issueSystem')}:** ${platform}\n\n${i18n.t('header.issueBodyHint')}`
  const params = new URLSearchParams({
    template: 'bug_report.yml',
    title: 'Bug: ',
    labels: 'bug',
    body
  })
  return `https://github.com/TriviaCon/triviacon/issues/new?${params.toString()}`
}

export function buildFeatureUrl(): string {
  const params = new URLSearchParams({ template: 'feature_request.yml' })
  return `https://github.com/TriviaCon/triviacon/issues/new?${params.toString()}`
}
