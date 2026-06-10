/**
 * Quiz PDF export — builds a self-contained HTML document from the in-memory
 * quiz store and renders it to PDF via a hidden BrowserWindow + printToPDF.
 *
 * The exported document contains:
 *   - Title page (splash image, name, author, location, date)
 *   - Table of contents (categories + question counts)
 *   - One chapter per category; questions with all answer options
 *
 * Media is referenced by filename only (no file embedding).
 */

import { BrowserWindow, dialog } from 'electron'
import { writeFile, unlink } from 'fs/promises'
import { basename } from 'path'
import { tmpdir } from 'os'
import { join } from 'path'
import * as store from '../../data/quizStore'
import { getSetting } from '../settings'

const LABELS = {
  pl: { toc: 'Spis treści', question: 'Pytanie' },
  en: { toc: 'Table of Contents', question: 'Question' }
} as const

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildHtml(): string {
  const meta = store.metaGet()
  const categories = store.categoriesAll()
  const lang = getSetting('language') as 'pl' | 'en'
  const labels = LABELS[lang] ?? LABELS.en

  const letterAt = (i: number) => String.fromCharCode(65 + i)

  // Splash is stored as a data URI; only render if it is actually an image.
  const splashHtml =
    meta.splash && /^data:image\//.test(meta.splash)
      ? `<img src="${meta.splash}" alt="" />`
      : ''

  const dateDisplay = (() => {
    if (!meta.date) return ''
    try {
      return new Date(meta.date).toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-GB')
    } catch {
      return meta.date
    }
  })()

  const renderQuestion = (
    q: ReturnType<typeof store.questionsAllByCategoryId>[0],
    num: number
  ): string => {
    const opts = store.answerOptionsByQuestionId(q.id)

    const mediaHtml = q.media
      ? `<div class="media-ref">📎 ${esc(basename(q.media))}</div>`
      : ''

    let answersHtml = ''
    if (q.type === 'list') {
      answersHtml = `<ul class="list-answers">${
        opts.map((opt) => `<li>${opt.text}</li>`).join('')
      }</ul>`
    } else {
      answersHtml = `<div class="answers">${
        opts
          .map(
            (opt, i) => `
          <div class="answer${opt.correct ? ' correct' : ''}">
            <span class="answer-label">${letterAt(i)})</span>
            <span class="answer-text">${opt.text}</span>
            ${opt.correct ? '<span class="answer-check">✓</span>' : ''}
          </div>`
          )
          .join('')
      }</div>`
    }

    return `
      <div class="question">
        <div class="question-number">${labels.question} ${num}</div>
        ${mediaHtml}
        <div class="question-text">${q.text}</div>
        ${answersHtml}
      </div>`
  }

  const tocRows = categories
    .map((cat, i) => {
      const count = store.questionsAllByCategoryId(cat.id).length
      return `<tr>
        <td class="toc-num">${i + 1}.</td>
        <td class="toc-name">${esc(cat.name)}</td>
        <td class="toc-count">(${count})</td>
      </tr>`
    })
    .join('')

  const chaptersHtml = categories
    .map((cat) => {
      const questions = store.questionsAllByCategoryId(cat.id)
      return `
      <div class="chapter">
        <h1>${esc(cat.name)}</h1>
        ${questions.map((q, i) => renderQuestion(q, i + 1)).join('')}
      </div>`
    })
    .join('')

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: A4; margin: 2cm 2.2cm; }
  * { box-sizing: border-box; }
  body {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 11pt;
    color: #111;
    line-height: 1.55;
  }

  /* ── Title page ──────────────────────── */
  .title-page {
    height: 240mm;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 1.4rem;
    page-break-after: always;
  }
  .title-page img {
    max-width: 56%;
    max-height: 44mm;
    object-fit: contain;
    border-radius: 6px;
  }
  .title-page h1 {
    font-size: 26pt;
    margin: 0;
    font-weight: bold;
    letter-spacing: -0.02em;
  }
  .title-page .meta {
    font-size: 11.5pt;
    color: #555;
    line-height: 2;
  }

  /* ── Table of contents ───────────────── */
  .toc { page-break-after: always; }
  .toc h2 {
    font-size: 17pt;
    margin: 0 0 1.2rem 0;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid #222;
  }
  .toc table { width: 100%; border-collapse: collapse; font-size: 11pt; }
  .toc tr { border-bottom: 1px solid #e8e8e8; }
  .toc td { padding: 0.35rem 0.4rem; vertical-align: baseline; }
  .toc-num { width: 2rem; font-weight: bold; color: #666; }
  .toc-count { width: 4.5rem; text-align: right; color: #aaa; }

  /* ── Chapter ─────────────────────────── */
  .chapter { page-break-before: always; }
  .chapter h1 {
    font-size: 21pt;
    margin: 0 0 1.6rem 0;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid #222;
  }

  /* ── Question ────────────────────────── */
  .question {
    margin-bottom: 1.7rem;
    padding-left: 0.9rem;
    border-left: 3px solid #ddd;
  }
  .question-number {
    font-size: 8pt;
    color: #bbb;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 0.2rem;
  }
  .media-ref {
    font-size: 9pt;
    color: #aaa;
    font-style: italic;
    margin-bottom: 0.35rem;
  }
  .question-text {
    font-size: 11.5pt;
    margin-bottom: 0.55rem;
  }
  .question-text p { margin: 0 0 0.2rem 0; }

  /* ── ABCD answers ────────────────────── */
  .answers { font-size: 10.5pt; }
  .answer {
    display: flex;
    gap: 0.4rem;
    padding: 0.18rem 0;
    align-items: baseline;
  }
  .answer-label {
    min-width: 1.4rem;
    font-weight: bold;
    color: #888;
    flex-shrink: 0;
  }
  .answer-text p { margin: 0; display: inline; }
  .answer.correct .answer-label { color: #1a6b1a; }
  .answer.correct .answer-text { color: #1a6b1a; font-weight: 600; }
  .answer-check {
    color: #1a6b1a;
    font-weight: bold;
    margin-left: 0.2rem;
    flex-shrink: 0;
  }

  /* ── List answers ────────────────────── */
  .list-answers {
    margin: 0.2rem 0 0 1rem;
    padding: 0;
    font-size: 10.5pt;
  }
  .list-answers li { margin: 0.2rem 0; }
  .list-answers li p { margin: 0; display: inline; }
</style>
</head>
<body>

<div class="title-page">
  ${splashHtml}
  <h1>${esc(meta.name || '—')}</h1>
  <div class="meta">
    ${meta.author ? `<div>${esc(meta.author)}</div>` : ''}
    ${meta.location ? `<div>${esc(meta.location)}</div>` : ''}
    ${dateDisplay ? `<div>${esc(dateDisplay)}</div>` : ''}
  </div>
</div>

<div class="toc">
  <h2>${labels.toc}</h2>
  <table>${tocRows}</table>
</div>

${chaptersHtml}

</body>
</html>`
}

export async function exportQuizPdf(parentWindow: BrowserWindow): Promise<void> {
  const html = buildHtml()
  const tmpPath = join(tmpdir(), `triviacon-export-${Date.now()}.html`)

  await writeFile(tmpPath, html, 'utf-8')

  const win = new BrowserWindow({
    show: false,
    skipTaskbar: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  })

  try {
    await win.loadFile(tmpPath)

    const pdfBuffer = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4'
    })

    // eslint-disable-next-line no-control-regex
    const safeName = (store.metaGet().name || 'quiz').replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    const result = await dialog.showSaveDialog(parentWindow, {
      defaultPath: `${safeName}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    })

    if (!result.canceled && result.filePath) {
      await writeFile(result.filePath, pdfBuffer)
    }
  } finally {
    win.destroy()
    await unlink(tmpPath).catch(() => {})
  }
}
