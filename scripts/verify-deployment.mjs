#!/usr/bin/env node
import fs from 'fs'
import { execSync } from 'child_process'

const SUCCESS = '✅'
const WARNING = '⚠️'
const ERROR = '❌'

function log(msg, icon) {
  console.log(`${icon} ${msg}`)
}

console.log('\n🎬 THE FILM LINK - PRE-DEPLOYMENT CHECK\n')

let passed = true

log('Checking config files...', '▶️')
const files = ['wrangler.jsonc', 'package.json', 'nuxt.config.ts', '.env']
for (const f of files) {
  if (fs.existsSync(f)) {
    log(f, SUCCESS)
  }
  else {
    log(`${f} - NOT FOUND`, ERROR)
    passed = false
  }
}

console.log('')
log('Checking dependencies...', '▶️')
if (fs.existsSync('node_modules')) {
  log('node_modules', SUCCESS)
}
else {
  log('node_modules - installing...', WARNING)
  try {
    execSync('npm install', { stdio: 'inherit' })
  }
  catch {
    passed = false
  }
}

console.log('')
log('Running checks...', '▶️')
try {
  execSync('npm run typecheck', { stdio: 'inherit' })
  log('TypeScript check', SUCCESS)
}
catch {
  log('TypeScript check', ERROR)
  passed = false
}

try {
  execSync('npm run lint', { stdio: 'inherit' })
  log('ESLint', SUCCESS)
}
catch {
  log('ESLint', ERROR)
  passed = false
}

console.log('')
log('Building...', '▶️')
try {
  execSync('npm run build', { stdio: 'inherit' })
  log('Build successful', SUCCESS)
}
catch {
  log('Build failed', ERROR)
  passed = false
}

console.log('')
if (passed) {
  console.log('✅ Ready to deploy! Run: npm run deploy')
  process.exit(0)
}
else {
  console.log('❌ Fix errors above and try again')
  process.exit(1)
}
