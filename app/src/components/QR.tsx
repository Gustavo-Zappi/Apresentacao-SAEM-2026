import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export default function QR({ url, className }: { url: string; className?: string }) {
  const [svg, setSvg] = useState('')
  useEffect(() => {
    QRCode.toString(url, {
      type: 'svg',
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#201E4B', light: '#FFFFFF' },
    }).then(setSvg)
  }, [url])
  return <div className={className} dangerouslySetInnerHTML={{ __html: svg }} role="img" aria-label={`QR code para ${url}`} />
}
