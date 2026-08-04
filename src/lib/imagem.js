// Compactação de fotos para exportação.
//
// As fotos chegam do app de campo como dataUrl em base64, na resolução cheia da
// câmera do celular. Isso gera arquivos de backup grandes demais para enviar por
// e-mail. Aqui reduzimos a resolução e reencodamos em JPEG apenas na cópia que
// vai para o arquivo — o banco local mantém as fotos originais intactas.

const MIME_JPEG = 'image/jpeg'

export const PRESETS_QUALIDADE = {
  original: { label: 'Originais (sem compactar)', descricao: 'Qualidade máxima, arquivo muito grande', maxLado: null, qualidade: null },
  alta:     { label: 'Alta qualidade',            descricao: 'Reduz bastante, perda quase imperceptível', maxLado: 2000, qualidade: 0.82 },
  media:    { label: 'Média (recomendado)',       descricao: 'Melhor equilíbrio para enviar por e-mail',  maxLado: 1600, qualidade: 0.70 },
  maxima:   { label: 'Máxima compactação',        descricao: 'Menor arquivo possível mantendo as fotos',  maxLado: 1200, qualidade: 0.60 },
  semFotos: { label: 'Sem fotos',                 descricao: 'Só os dados dos checklists, arquivo mínimo', maxLado: null, qualidade: null },
}

function carregarImagem(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload  = () => resolve(img)
    img.onerror = () => reject(new Error('Imagem inválida'))
    img.src = dataUrl
  })
}

/**
 * Reduz e reencoda uma foto. Em qualquer erro devolve o dataUrl original —
 * é preferível um arquivo maior do que perder o registro fotográfico.
 */
export async function comprimirFoto(dataUrl, { maxLado, qualidade }) {
  if (!maxLado || !qualidade) return dataUrl

  try {
    const img = await carregarImagem(dataUrl)
    const { width: w, height: h } = img
    if (!w || !h) return dataUrl

    const escala = Math.min(1, maxLado / Math.max(w, h))
    const nw = Math.max(1, Math.round(w * escala))
    const nh = Math.max(1, Math.round(h * escala))

    const canvas = document.createElement('canvas')
    canvas.width  = nw
    canvas.height = nh

    const ctx = canvas.getContext('2d')
    // JPEG não suporta transparência: pinta o fundo de branco antes de desenhar
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, nw, nh)
    ctx.drawImage(img, 0, 0, nw, nh)

    const saida = canvas.toDataURL(MIME_JPEG, qualidade)
    // Se a compactação não reduziu (foto já pequena), mantém a original
    return saida.length < dataUrl.length ? saida : dataUrl
  } catch {
    return dataUrl
  }
}
