import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import CameraFeed, { CameraStatus } from '../components/CameraFeed'
import SignCard from '../components/SignCard'
import TranslationOutput, { Language } from '../components/TranslationOutput'

const INFERENCE_API_URL = 'http://127.0.0.1:8765'

type InferenceResponse = {
  ok: boolean
  error?: string
  phase?: string
  sequenceLength?: number
  recordingFrames?: number
  handsVisible?: boolean
  isMoving?: boolean
  motionScore?: number
  prediction?: string
  confidence?: number
  topPrediction?: string
  topConfidence?: number
  sentence?: string[]
  labelCount?: number
  flip?: boolean
}

const DIALECT_THEME: Record<
  Language,
  {
    primary: string
    glow: string
    text: string
    bg: string
    bgPanel: string
    bgDeep: string
  }
> = {
  Filipino: {
    primary: '#C49A14',
    glow: 'rgba(196,154,20,0.30)',
    text: '#E8B84B',
    bg: '#1A0004',
    bgPanel: '#2A0008',
    bgDeep: '#0F0002',
  },
  Cebuano: {
    primary: '#C49A14',
    glow: 'rgba(196,154,20,0.30)',
    text: '#E8B84B',
    bg: '#1A0004',
    bgPanel: '#2A0008',
    bgDeep: '#0F0002',
  },
  Ilocano: {
    primary: '#C49A14',
    glow: 'rgba(196,154,20,0.30)',
    text: '#E8B84B',
    bg: '#0A0F2E',
    bgPanel: '#111840',
    bgDeep: '#060A1F',
  },
  Waray: {
    primary: '#C49A14',
    glow: 'rgba(196,154,20,0.30)',
    text: '#E8B84B',
    bg: '#071A0D',
    bgPanel: '#0D2714',
    bgDeep: '#040F08',
  },
  Hiligaynon: {
    primary: '#C49A14',
    glow: 'rgba(196,154,20,0.30)',
    text: '#E8B84B',
    bg: '#130820',
    bgPanel: '#1E0E30',
    bgDeep: '#0B0415',
  },
  Kapampangan: {
    primary: '#C49A14',
    glow: 'rgba(196,154,20,0.30)',
    text: '#E8B84B',
    bg: '#1A0D00',
    bgPanel: '#2A1500',
    bgDeep: '#0F0800',
  },
}

const THEME_TRANSITION =
  'background-color 0.5s ease, border-color 0.4s ease, color 0.4s ease'

interface GuideSign {
  key: string
  label: string
  description: string
}

const GUIDE_SIGNS: GuideSign[] = [
  {
    key: 'hello',
    label: 'Hello',
    description: 'Open palm facing out, wave gently side to side',
  },
  {
    key: 'thank_you',
    label: 'Thank You',
    description: 'Flat hand starts at chin, moves forward and down',
  },
  {
    key: 'yes',
    label: 'Yes',
    description: 'Closed fist, bend wrist up and down like nodding',
  },
  {
    key: 'no',
    label: 'No',
    description: 'Index and middle finger tap the thumb twice',
  },
  {
    key: 'help',
    label: 'Help',
    description: 'Thumbs-up hand placed on flat palm, lift upward',
  },
  {
    key: 'please',
    label: 'Please',
    description: 'Flat hand on chest, move in a circular motion',
  },
  {
    key: 'sorry',
    label: 'Sorry',
    description: 'Closed fist on chest, move in a slow circle',
  },
  {
    key: 'eat',
    label: 'Eat',
    description: 'Fingertips together, bring hand toward mouth',
  },
  {
    key: 'water',
    label: 'Water',
    description: 'W handshape, tap index finger on chin twice',
  },
  {
    key: 'danger',
    label: 'Danger',
    description: 'Both fists, dominant hand brushes up over other',
  },
]

const TERMS_SUMMARY = [
  'KUMPAS is an academic communication-support tool and is not a certified interpreter for legal, medical, emergency, or other high-stakes use.',
  'Camera access is required for gesture recognition. Video is used only while the translator is active and is not recorded, stored, sold, or intentionally shared by the application.',
  'KUMPAS is designed with respect for the Philippine Data Privacy Act of 2012, also known as Republic Act No. 10173.',
  'Recognition and translation may be affected by lighting, camera quality, background, hand position, and signing style. Please verify important messages.',
  'Use KUMPAS respectfully, lawfully, and only for learning, accessibility, and communication-support purposes.',
] as const

const Translator: React.FC = () => {
  const [isActive, setIsActive] = useState(false)
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('off')
  const [hasCameraStream, setHasCameraStream] = useState(false)
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false)
  const [inferenceState, setInferenceState] = useState<InferenceResponse | null>(null)
  const [inferenceError, setInferenceError] = useState('')
  const [selectedLang, setSelectedLang] = useState<Language>('Filipino')
  const requestInFlight = useRef(false)
  const pendingFrameRef = useRef<Blob | null>(null)
  const navigate = useNavigate()
  const theme = DIALECT_THEME[selectedLang]

  const denyTerms = () => {
    setIsActive(false)
    navigate('/', { replace: true })
  }

  const handleCameraStatusChange = useCallback((status: CameraStatus) => {
    setCameraStatus(status)
  }, [])

  const handleCameraStreamChange = useCallback((stream: MediaStream | null) => {
    setHasCameraStream(Boolean(stream))
  }, [])

  const sendInferenceFrame = useCallback(async (imageBlob: Blob) => {
    requestInFlight.current = true
    try {
      const response = await fetch(`${INFERENCE_API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': imageBlob.type || 'image/jpeg' },
        body: imageBlob,
      })
      const payload = (await response.json()) as InferenceResponse
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'Inference request failed.')
      }
      setInferenceState(payload)
      setInferenceError('')
    } catch (error) {
      setInferenceError(error instanceof Error ? error.message : 'Inference server unavailable.')
    } finally {
      requestInFlight.current = false
      const pendingFrame = pendingFrameRef.current
      pendingFrameRef.current = null
      if (pendingFrame) {
        void sendInferenceFrame(pendingFrame)
      }
    }
  }, [])

  const handleCameraFrame = useCallback((imageBlob: Blob) => {
    if (requestInFlight.current) {
      pendingFrameRef.current = imageBlob
      return
    }

    void sendInferenceFrame(imageBlob)
  }, [sendInferenceFrame])

  useEffect(() => {
    if (isActive) return
    setInferenceState(null)
    setInferenceError('')
    requestInFlight.current = false
    pendingFrameRef.current = null
    void fetch(`${INFERENCE_API_URL}/reset`, { method: 'POST' }).catch(() => {
      // The Python inference server may not be running yet.
    })
  }, [isActive])

  const translationText = useMemo(() => {
    if (!isActive || cameraStatus === 'off') return ''
    if (cameraStatus === 'starting') return 'Starting camera...'
    if (cameraStatus === 'denied') return 'Camera permission denied.'
    if (cameraStatus === 'unsupported') return 'Camera is unavailable in this browser.'
    if (cameraStatus === 'error') return 'Camera could not be started.'
    if (inferenceError) return `TensorFlow server: ${inferenceError}`
    if (inferenceState?.sentence?.length) return inferenceState.sentence.join(' ')
    if (inferenceState?.phase === 'RECORDING') return ''
    if (inferenceState?.phase === 'WAITING_FOR_RESET') {
      return inferenceState.prediction
        ? `${inferenceState.prediction} (${Math.round((inferenceState.confidence ?? 0) * 100)}%)`
        : 'Prediction complete.'
    }
    if (hasCameraStream) return 'Waiting for movement...'
    return ''
  }, [cameraStatus, hasCameraStream, inferenceError, inferenceState, isActive])

  const cameraFooterStatus = useMemo(() => {
    if (!isActive || cameraStatus !== 'live') return ''
    if (inferenceError) return 'TensorFlow server offline'
    if (inferenceState?.phase === 'RECORDING') {
      return `Recording: ${inferenceState.recordingFrames ?? 0}/${inferenceState.sequenceLength ?? 30} frames`
    }
    if (inferenceState?.phase === 'WAITING_FOR_RESET') return 'Stop movement to reset'
    if (inferenceState?.topPrediction) {
      return `Top: ${inferenceState.topPrediction} ${Math.round((inferenceState.topConfidence ?? 0) * 100)}%`
    }
    if (hasCameraStream) return 'Waiting for movement'
    return ''
  }, [cameraStatus, hasCameraStream, inferenceError, inferenceState, isActive])

  return (
    <main
      className="flex flex-1 flex-col"
      style={{
        backgroundColor: theme.bg,
        borderTop: `1px solid ${theme.primary}33`,
        transition: THEME_TRANSITION,
      }}
    >
      {!hasAcceptedTerms && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="translator-terms-title"
        >
          <section className="w-full max-w-2xl border border-gold bg-maroon-deep shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
            <div className="border-b border-gold/25 bg-black/25 px-6 py-5 md:px-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-gold/50 bg-gold/10 text-gold-light">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="font-inter text-[11px] font-medium uppercase text-gold/70 tracking-[0.12em]">
                    Before using translator
                  </p>
                  <h1
                    id="translator-terms-title"
                    className="mt-2 font-cinzel text-2xl font-bold text-gold-light md:text-3xl"
                  >
                    Terms and conditions
                  </h1>
                </div>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-6 py-5 md:px-8">
              <p className="font-inter text-[15px] leading-[1.75] text-gold-light/82">
                Please review and accept these terms before opening the camera
                translator. You can also read the full{' '}
                <Link
                  to="/faq#terms-and-conditions"
                  className="font-semibold text-gold underline decoration-gold/60 underline-offset-4 transition hover:text-gold-light hover:decoration-gold-light"
                >
                  Terms and Conditions
                </Link>
                {' '}on the FAQ page.
              </p>

              <ul className="mt-5 space-y-4">
                {TERMS_SUMMARY.map((term) => (
                  <li
                    key={term}
                    className="border-l-4 border-gold pl-4 font-inter text-[14px] leading-[1.7] text-gold-light/78"
                  >
                    {term}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-3 border-t border-gold/25 bg-black/20 px-6 py-5 sm:flex-row sm:justify-end md:px-8">
              <button
                type="button"
                onClick={denyTerms}
                className="inline-flex items-center justify-center border border-gold/40 px-6 py-3 font-inter text-[13px] font-semibold uppercase tracking-[0.1em] text-gold-light transition hover:border-gold hover:bg-gold/10"
              >
                Deny
              </button>
              <button
                type="button"
                onClick={() => setHasAcceptedTerms(true)}
                className="inline-flex items-center justify-center border border-gold bg-gold px-6 py-3 font-inter text-[13px] font-semibold uppercase tracking-[0.1em] text-maroon-deep transition hover:bg-gold-light focus:outline-none focus:ring-2 focus:ring-gold-light focus:ring-offset-2 focus:ring-offset-maroon-deep"
              >
                Agree
              </button>
            </div>
          </section>
        </div>
      )}

      <div className="flex flex-1 flex-col md:flex-row">
        <section
          className="flex min-h-[480px] flex-col md:w-1/2"
          style={{
            backgroundColor: theme.bgPanel,
            borderRight: `1px solid ${theme.primary}66`,
            transition: THEME_TRANSITION,
          }}
        >
          <CameraFeed
            footerStatus={cameraFooterStatus}
            isActive={isActive}
            onFrame={handleCameraFrame}
            onIdleTimeout={() => setIsActive(false)}
            onStatusChange={handleCameraStatusChange}
            onStreamChange={handleCameraStreamChange}
            theme={theme}
          />

          <div className="flex justify-center pb-6 pt-2">
            <button
              onClick={() => setIsActive((value) => !value)}
              className="power-btn relative flex flex-col items-center rounded-full px-8 py-2"
              style={{
                background: isActive
                  ? `linear-gradient(180deg, ${theme.primary}33 0%, ${theme.primary}14 100%)`
                  : 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)',
                border: `1px solid ${
                  isActive ? theme.primary : `${theme.primary}80`
                }`,
                boxShadow: isActive
                  ? `0 2px 12px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.1)`
                  : '0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
                cursor: 'pointer',
                minWidth: '160px',
                transition: THEME_TRANSITION,
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  style={{
                    background: isActive ? '#4caf50' : `${theme.primary}80`,
                    borderRadius: '50%',
                    boxShadow: isActive ? '0 0 6px #4caf50' : 'none',
                    height: '8px',
                    transition: THEME_TRANSITION,
                    width: '8px',
                  }}
                />
                <span
                  className="font-inter text-[11px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: theme.text, transition: THEME_TRANSITION }}
                >
                  {isActive ? 'TURN OFF' : 'TURN ON'}
                </span>
              </div>
            </button>
          </div>
        </section>

        <section
          className="flex min-h-[480px] flex-col md:w-1/2"
          style={{
            backgroundColor: theme.bgPanel,
            transition: THEME_TRANSITION,
          }}
        >
          <TranslationOutput
            selectedLang={selectedLang}
            setSelectedLang={setSelectedLang}
            theme={theme}
            translationText={isActive ? translationText : ''}
          />
        </section>
      </div>

      <section
        style={{
          background: theme.bgPanel,
          borderTop: `1px solid ${theme.primary}66`,
          width: '100%',
        }}
      >
        <div
          style={{
            alignItems: 'center',
            borderBottom: `1px solid ${theme.primary}33`,
            display: 'flex',
            gap: '10px',
            padding: '10px 20px',
          }}
        >
          <span
            style={{
              color: theme.text,
              fontFamily: "'Cinzel', serif",
              fontSize: '11px',
              letterSpacing: '0.18em',
              opacity: 0.7,
              textTransform: 'uppercase',
            }}
          >
            Sign Language Guidebook
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gridTemplateRows: 'repeat(2, auto)',
          }}
        >
          {GUIDE_SIGNS.map((sign, index) => (
            <SignCard
              key={sign.key}
              sign={sign}
              theme={theme}
              index={index}
            />
          ))}
        </div>
      </section>
    </main>
  )
}

export default Translator
