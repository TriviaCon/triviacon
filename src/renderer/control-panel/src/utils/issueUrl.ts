declare const __APP_VERSION__: string

const platformLabel: Record<string, string> = {
  win32: 'Windows',
  linux: 'Linux',
  darwin: 'macOS'
}

export function buildIssueUrl(): string {
  const platform = platformLabel[window.api.platform] ?? window.api.platform
  const body = `**Wersja:** ${__APP_VERSION__}\n**System:** ${platform}\n\n<!-- Opisz błąd poniżej -->`
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
