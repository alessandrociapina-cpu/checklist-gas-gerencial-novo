/**
 * Servidor HTTP local para o app Gás Novo Gerencial.
 * Execute:  node serve.js
 */
const http   = require('http')
const fs     = require('fs')
const path   = require('path')
const { exec } = require('child_process')

const PORT = 3001
const BASE = '/checklist-gas-gerencial-novo'
const DIST = path.join(__dirname, 'dist')

const MIME = {
  '.html':        'text/html; charset=utf-8',
  '.js':          'application/javascript',
  '.css':         'text/css',
  '.png':         'image/png',
  '.svg':         'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.json':        'application/json',
  '.woff2':       'font/woff2',
  '.ico':         'image/x-icon',
}

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0]

  if (urlPath === '/') {
    res.writeHead(302, { Location: BASE + '/' })
    res.end()
    return
  }

  if (urlPath.startsWith(BASE)) urlPath = urlPath.slice(BASE.length)
  if (!urlPath || urlPath === '/') urlPath = '/index.html'

  const filePath = path.join(DIST, urlPath)

  if (!filePath.startsWith(DIST)) {
    res.writeHead(403)
    res.end('Proibido')
    return
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    const index = path.join(DIST, 'index.html')
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(fs.readFileSync(index))
    return
  }

  const ext = path.extname(filePath)
  const contentType = MIME[ext] || 'application/octet-stream'
  res.writeHead(200, { 'Content-Type': contentType })
  res.end(fs.readFileSync(filePath))
})

server.listen(PORT, '127.0.0.1', () => {
  const url = `http://localhost:${PORT}${BASE}/`
  console.log('╔══════════════════════════════════════════════╗')
  console.log('║   Gás Novo Gerencial — servidor iniciado     ║')
  console.log('╚══════════════════════════════════════════════╝')
  console.log(`\n  Acesse:  ${url}\n`)
  console.log('  Abra o endereço acima no Chrome ou Edge.')
  console.log('  Para instalar como app: clique no ícone')
  console.log('  de instalação na barra do navegador.\n')
  console.log('  Pressione Ctrl+C para encerrar.\n')

  const cmd = process.platform === 'win32'  ? `start ${url}`
            : process.platform === 'darwin' ? `open ${url}`
            : `xdg-open ${url}`
  exec(cmd)
})

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nErro: a porta ${PORT} já está em uso.`)
    console.error(`Tente encerrar outro processo ou altere a constante PORT em serve.js.\n`)
  } else {
    console.error(err)
  }
  process.exit(1)
})
