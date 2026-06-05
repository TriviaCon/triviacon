// Generate the Tauri icon set from the shared app icon (build/icon.png) at
// build time, so the generated icons don't need to be committed to the repo.
// Runs before `tauri dev` / `tauri build` (see beforeDev/BuildCommand); skips
// when icons already exist, so incremental builds stay fast.
import { existsSync } from 'node:fs'
import { execSync } from 'node:child_process'

const SENTINEL = 'src-tauri/icons/icon.icns'
const SOURCE = 'build/icon.png'

if (existsSync(SENTINEL)) process.exit(0)

if (!existsSync(SOURCE)) {
  console.error(`gen-icons: source icon "${SOURCE}" not found`)
  process.exit(1)
}

console.log(`gen-icons: generating Tauri icons from ${SOURCE}`)
execSync(`pnpm tauri icon ${SOURCE}`, { stdio: 'inherit' })
