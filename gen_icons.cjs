const sharp = require('sharp')
const fs    = require('fs')
const path  = require('path')

const LOGO_PATH = '/root/.claude/uploads/c148d687-5406-5064-8a9c-bf7efee8a2d3/f66d1e77-sabesplogo.png'
const OUT_DIR   = '/home/user/checklist-gas-gerencial-novo/public/icons'
const SABESP    = '#00AEEF'
const DARK      = '#003B5C'

// Logo original: 2244×3125  → ratio altura/largura = 3125/2244 ≈ 1.3927
const LOGO_RATIO = 3125 / 2244

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

const logoB64 = fs.readFileSync(LOGO_PATH).toString('base64')

function makeSVG(size) {
  const pad   = Math.round(size * 0.07)
  const r     = Math.round(size * 0.14) // raio dos cantos

  // Logo ocupa 60% da altura total (área de cima)
  const logoAreaH = Math.round(size * 0.60)
  const logoW     = Math.round(logoAreaH / LOGO_RATIO)
  const logoX     = Math.round((size - logoW) / 2)
  const logoY     = pad

  const showText = size >= 128
  const fs1 = Math.round(size * 0.075)
  const fs2 = Math.round(size * 0.065)
  const ty1 = logoY + logoAreaH + Math.round(size * 0.045) + fs1
  const ty2 = ty1 + Math.round(fs1 * 1.35)

  const textBlock = showText ? `
    <text x="${size/2}" y="${ty1}"
      font-family="Arial Black, Arial, sans-serif" font-size="${fs1}" font-weight="900"
      fill="${DARK}" text-anchor="middle">Check-list Gás</text>
    <text x="${size/2}" y="${ty2}"
      font-family="Arial, sans-serif" font-size="${fs2}" font-weight="700"
      fill="${SABESP}" text-anchor="middle">Gerencial</text>` : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" fill="white" rx="${r}"/>
  <image href="data:image/png;base64,${logoB64}"
    x="${logoX}" y="${logoY}" width="${logoW}" height="${logoAreaH}"
    preserveAspectRatio="xMidYMid meet"/>
  ${textBlock}
</svg>`
}

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  for (const s of SIZES) {
    await sharp(Buffer.from(makeSVG(s)), { density: 144 }).resize(s,s).png()
      .toFile(path.join(OUT_DIR, `icon-${s}.png`))
    console.log(`✓ icon-${s}.png`)
  }
  await sharp(Buffer.from(makeSVG(180)), { density: 144 }).resize(180,180).png()
    .toFile(path.join(OUT_DIR, 'apple-touch-icon.png'))
  console.log('✓ apple-touch-icon.png')
  await sharp(Buffer.from(makeSVG(32)), { density: 144 }).resize(32,32).png()
    .toFile(path.join(OUT_DIR, 'favicon-32.png'))
  console.log('✓ favicon-32.png')
  console.log('\nPronto!')
}

run().catch(e => { console.error(e); process.exit(1) })
