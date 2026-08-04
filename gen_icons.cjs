// Gera os ícones do PWA a partir do logo da Sabesp.
//
// Desenho: figura de gerente (cabeça, ombros, colarinho e gravata) em branco
// sobre o azul escuro da Sabesp, com um selo circular contendo o símbolo "S"
// no canto inferior direito. O símbolo é recortado do logo oficial — a palavra
// "sabesp" é descartada porque ficaria ilegível no tamanho real do ícone.
//
// Rodar com:  node gen_icons.cjs

const sharp = require('sharp')
const fs    = require('fs')
const path  = require('path')

const LOGO_PATH = path.join(__dirname, 'public/icons/sabesp-logo.png')
const OUT_DIR   = path.join(__dirname, 'public/icons')

const CIANO = '#00AEEF'
const NAVY  = '#003B5C'

// Região do logo que contém apenas o símbolo "S" (sem o texto "sabesp")
const RECORTE_SIMBOLO = { left: 0, top: 0, width: 2244, height: 2270 }

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

// Silhueta de gerente desenhada em um espaço de 100x100
function pessoa(cor, corFundo, corGravata) {
  return `
    <circle cx="50" cy="27" r="15.5" fill="${cor}"/>
    <path d="M50 47 C33 47 19 57 16 72 C15 77 14.5 81 14.5 85 L85.5 85
             C85.5 81 85 77 84 72 C81 57 67 47 50 47 Z" fill="${cor}"/>
    <path d="M41.5 49.5 L50 62 L58.5 49.5" fill="none" stroke="${corFundo}"
      stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M50 61 L46.6 66 L50 80 L53.4 66 Z" fill="${corGravata}"/>`
}

function makeSVG(size, simboloB64) {
  const r  = size * 0.22        // raio dos cantos
  const pw = size * 0.62        // largura da figura
  const px = (size - pw) / 2
  const py = size * 0.13
  const escala = pw / 100

  // Selo circular branco com o símbolo da Sabesp
  const selR = size * 0.185
  const selX = size * 0.775
  const selY = size * 0.775
  const simD = selR * 1.28

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="${NAVY}"/>
  <g transform="translate(${px},${py}) scale(${escala})">
    ${pessoa('#ffffff', NAVY, CIANO)}
  </g>
  <circle cx="${selX}" cy="${selY}" r="${selR}" fill="#ffffff"/>
  <image href="data:image/png;base64,${simboloB64}"
    x="${selX - simD / 2}" y="${selY - simD / 2}" width="${simD}" height="${simD}"
    preserveAspectRatio="xMidYMid meet"/>
</svg>`
}

async function run() {
  // Recorta o símbolo "S" do logo oficial e remove as bordas transparentes
  const simbolo = await sharp(LOGO_PATH)
    .extract(RECORTE_SIMBOLO)
    .trim()
    .png()
    .toBuffer()
  const simboloB64 = simbolo.toString('base64')

  fs.mkdirSync(OUT_DIR, { recursive: true })

  const gerar = async (size, nome) => {
    await sharp(Buffer.from(makeSVG(size, simboloB64)), { density: 300 })
      .resize(size, size)
      .png()
      .toFile(path.join(OUT_DIR, nome))
    console.log(`✓ ${nome}`)
  }

  for (const s of SIZES) await gerar(s, `icon-${s}.png`)
  await gerar(180, 'apple-touch-icon.png')
  await gerar(32, 'favicon-32.png')

  console.log('\nPronto!')
}

run().catch(e => { console.error(e); process.exit(1) })
