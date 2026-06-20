import sharp from 'sharp'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const svg = readFileSync(join(root, 'icons/icon.svg'))

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

for (const size of sizes) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(join(root, `icons/icon-${size}.png`))
  console.log(`✓ icon-${size}.png`)
}

await sharp(svg).resize(180, 180).png().toFile(join(root, 'icons/apple-touch-icon.png'))
console.log('✓ apple-touch-icon.png')

await sharp(svg).resize(32, 32).png().toFile(join(root, 'icons/favicon-32.png'))
console.log('✓ favicon-32.png')

console.log('\nÍcones gerados com sucesso.')
