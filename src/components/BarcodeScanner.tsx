import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { X } from 'lucide-react'

/**
 * Celoobrazovkový skener čárových kódů z kamery (ZXing).
 * Po prvním úspěšném načtení zavolá onDetected a zastaví kameru.
 */
export function BarcodeScanner({
  onDetected,
  onClose,
}: {
  onDetected: (code: string) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    let controls: IScannerControls | undefined
    let active = true

    ;(async () => {
      try {
        controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current ?? undefined,
          (result, _err, ctrl) => {
            if (result && active) {
              active = false
              ctrl.stop()
              onDetected(result.getText())
            }
          },
        )
        if (!active) controls.stop()
      } catch {
        setError(t('scanner.permission'))
      }
    })()

    return () => {
      active = false
      controls?.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between p-4 text-white">
        <span className="font-medium">{t('scanner.title')}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="rounded-full bg-white/10 p-2"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted
          playsInline
        />
        {!error && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-32 w-72 max-w-[80vw] rounded-xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
          </div>
        )}
        {error && (
          <p className="absolute bottom-10 mx-6 rounded-lg bg-red-600 px-4 py-2 text-center text-sm text-white">
            {error}
          </p>
        )}
      </div>

      <p className="p-4 text-center text-sm text-white/80">{t('scanner.point')}</p>
    </div>
  )
}
