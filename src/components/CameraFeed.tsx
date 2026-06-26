import React, { useEffect, useRef, useState } from 'react'
import { Video, VideoOff } from 'lucide-react'

export type CameraStatus = 'off' | 'starting' | 'live' | 'denied' | 'unsupported' | 'error'

interface CameraFeedProps {
  isActive: boolean
  footerStatus?: string
  inferenceIntervalMs?: number
  onFrame?: (imageDataUrl: string) => void
  onStatusChange?: (status: CameraStatus) => void
  onStreamChange?: (stream: MediaStream | null) => void
  theme: {
    primary: string
    glow: string
    text: string
    bg: string
    bgPanel: string
    bgDeep: string
  }
  onIdleTimeout: () => void
}

const TARGET_RESOLUTION = { w: 1920, h: 1080 } as const
const INFERENCE_CAPTURE_WIDTH = 640
const DEFAULT_INFERENCE_INTERVAL_MS = 100
const TARGET_FPS = 30
type Resolution = {
  w: number
  h: number
}
const THEME_TRANSITION =
  'background-color 0.5s ease, border-color 0.4s ease, color 0.4s ease'
const IDLE_THRESHOLD = 30
const IDLE_DIFF_PERCENT = 0.98
const IDLE_TIMEOUT_MS = 5000

const CameraFeed: React.FC<CameraFeedProps> = ({
  isActive,
  footerStatus,
  inferenceIntervalMs = DEFAULT_INFERENCE_INTERVAL_MS,
  onFrame,
  onStatusChange,
  onStreamChange,
  onIdleTimeout,
  theme,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lastFrameDataRef = useRef<ImageData | null>(null)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [resolution, setResolution] = useState<Resolution>(TARGET_RESOLUTION)
  const [streamError, setStreamError] = useState(false)
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('off')
  const [showIdleWarning, setShowIdleWarning] = useState(false)

  const updateCameraStatus = (status: CameraStatus) => {
    setCameraStatus(status)
    onStatusChange?.(status)
  }

  const clearIdleTimers = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }

    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current)
      warningTimerRef.current = null
    }
  }

  const resetIdleTimer = () => {
    clearIdleTimers()
    setShowIdleWarning(false)

    warningTimerRef.current = setTimeout(() => {
      setShowIdleWarning(true)
    }, IDLE_TIMEOUT_MS - 2000)

    idleTimerRef.current = setTimeout(() => {
      setShowIdleWarning(false)
      onIdleTimeout()
    }, IDLE_TIMEOUT_MS)
  }

  const checkMotion = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 160
    canvas.height = 90
    ctx.drawImage(video, 0, 0, 160, 90)
    const currentFrame = ctx.getImageData(0, 0, 160, 90)

    if (lastFrameDataRef.current) {
      const previous = lastFrameDataRef.current.data
      const current = currentFrame.data
      let samePixels = 0
      const total = current.length / 4

      for (let index = 0; index < current.length; index += 4) {
        const dr = Math.abs(current[index] - previous[index])
        const dg = Math.abs(current[index + 1] - previous[index + 1])
        const db = Math.abs(current[index + 2] - previous[index + 2])

        if (dr < IDLE_THRESHOLD && dg < IDLE_THRESHOLD && db < IDLE_THRESHOLD) {
          samePixels++
        }
      }

      const idleRatio = samePixels / total
      if (idleRatio < IDLE_DIFF_PERCENT) {
        resetIdleTimer()
      }
    }

    lastFrameDataRef.current = currentFrame
  }

  useEffect(() => {
    let stream: MediaStream | null = null

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStreamError(true)
        setResolution(TARGET_RESOLUTION)
        onStreamChange?.(null)
        updateCameraStatus('unsupported')
        return
      }

      try {
        updateCameraStatus('starting')
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: TARGET_RESOLUTION.w },
            height: { ideal: TARGET_RESOLUTION.h },
            frameRate: TARGET_FPS,
          },
          audio: false,
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          const track = stream.getVideoTracks()[0]
          const settings = track.getSettings()

          setResolution({
            w: settings.width ?? TARGET_RESOLUTION.w,
            h: settings.height ?? TARGET_RESOLUTION.h,
          })
          setStreamError(false)
          onStreamChange?.(stream)
          updateCameraStatus('live')
        }
      } catch (error) {
        const errorName = error instanceof DOMException ? error.name : ''
        setStreamError(true)
        setResolution(TARGET_RESOLUTION)
        onStreamChange?.(null)
        updateCameraStatus(
          errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError'
            ? 'denied'
            : 'error',
        )
      }
    }

    const stopCamera = () => {
      if (videoRef.current?.srcObject) {
        const activeStream = videoRef.current.srcObject as MediaStream
        activeStream.getTracks().forEach((track) => track.stop())
        videoRef.current.srcObject = null
      }
      onStreamChange?.(null)
      updateCameraStatus('off')
    }

    if (isActive) {
      void startCamera()
    } else {
      stopCamera()
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
      onStreamChange?.(null)
    }
  }, [isActive, onStatusChange, onStreamChange])

  useEffect(() => {
    if (!isActive) {
      clearIdleTimers()
      setShowIdleWarning(false)
      lastFrameDataRef.current = null
      return
    }

    resetIdleTimer()
    const motionInterval = setInterval(checkMotion, 500)

    return () => {
      clearInterval(motionInterval)
      clearIdleTimers()
      setShowIdleWarning(false)
    }
  }, [isActive])

  useEffect(() => {
    if (!isActive || cameraStatus !== 'live' || !onFrame) return

    const captureFrame = () => {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        return
      }

      const sourceWidth = video.videoWidth || resolution.w
      const sourceHeight = video.videoHeight || resolution.h
      if (!sourceWidth || !sourceHeight) return

      const scale = INFERENCE_CAPTURE_WIDTH / sourceWidth
      canvas.width = INFERENCE_CAPTURE_WIDTH
      canvas.height = Math.round(sourceHeight * scale)

      const context = canvas.getContext('2d')
      if (!context) return

      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      onFrame(canvas.toDataURL('image/jpeg', 0.72))
    }

    const intervalId = window.setInterval(captureFrame, inferenceIntervalMs)
    return () => window.clearInterval(intervalId)
  }, [cameraStatus, inferenceIntervalMs, isActive, onFrame, resolution.h, resolution.w])

  const cameraMessage =
    cameraStatus === 'starting'
      ? 'Starting camera'
      : cameraStatus === 'denied'
        ? 'Camera permission denied'
        : cameraStatus === 'unsupported'
          ? 'Camera unavailable'
          : 'Camera unavailable'

  return (
    <div
      className="flex h-full flex-col"
      style={{ backgroundColor: theme.bgPanel, transition: THEME_TRANSITION }}
    >
      <div
        className="flex items-center gap-2 px-4 py-2"
        style={{
          backgroundColor: theme.bgPanel,
          borderBottom: `1px solid ${theme.primary}59`,
          borderTop: `1px solid ${theme.primary}59`,
          transition: THEME_TRANSITION,
        }}
      >
        <div
          className="flex h-4 w-4 items-center justify-center"
          style={{
            border: `1px solid ${theme.primary}`,
            opacity: 0.8,
            transition: THEME_TRANSITION,
          }}
        >
          <div
            className="h-1.5 w-2"
            style={{ backgroundColor: theme.primary, transition: THEME_TRANSITION }}
          />
        </div>
        <span
          className="font-inter text-[11px] font-medium uppercase tracking-[0.12em]"
          style={{ color: theme.text, opacity: 0.7, transition: THEME_TRANSITION }}
        >
          Camera Feed
        </span>
      </div>

      <div className="flex flex-1 items-center justify-center p-4">
        <div
          className="relative h-full w-full overflow-visible"
          style={{
            backgroundColor: theme.bgDeep,
            border: `1px solid ${theme.primary}`,
            boxShadow:
              `inset 0 0 30px rgba(0,0,0,0.9), 0 0 8px ${theme.glow}`,
            transition: THEME_TRANSITION,
          }}
        >
          <span
            className="absolute left-2 top-2 z-10 h-3 w-3 pointer-events-none"
            style={{
              borderTop: `1.5px solid ${theme.primary}`,
              borderLeft: `1.5px solid ${theme.primary}`,
              opacity: 0.6,
              transition: THEME_TRANSITION,
            }}
          />
          <span
            className="absolute right-2 top-2 z-10 h-3 w-3 pointer-events-none"
            style={{
              borderTop: `1.5px solid ${theme.primary}`,
              borderRight: `1.5px solid ${theme.primary}`,
              opacity: 0.6,
              transition: THEME_TRANSITION,
            }}
          />
          <span
            className="absolute bottom-2 left-2 z-10 h-3 w-3 pointer-events-none"
            style={{
              borderBottom: `1.5px solid ${theme.primary}`,
              borderLeft: `1.5px solid ${theme.primary}`,
              opacity: 0.6,
              transition: THEME_TRANSITION,
            }}
          />
          <span
            className="absolute bottom-2 right-2 z-10 h-3 w-3 pointer-events-none"
            style={{
              borderBottom: `1.5px solid ${theme.primary}`,
              borderRight: `1.5px solid ${theme.primary}`,
              opacity: 0.6,
              transition: THEME_TRANSITION,
            }}
          />

          {isActive && !streamError ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3">
              {isActive ? (
                <>
                  <VideoOff
                    size={32}
                    style={{ color: theme.primary, opacity: 0.4 }}
                  />
                  <span
                    className="font-inter text-xs"
                    style={{ color: theme.text, opacity: 0.4 }}
                  >
                    {cameraMessage}
                  </span>
                </>
              ) : (
                <Video size={36} style={{ color: theme.primary, opacity: 0.2 }} />
              )}
            </div>
          )}

          {showIdleWarning && isActive && (
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.75)',
                border: `1px solid ${theme.primary}`,
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '11px',
                color: theme.text,
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '0.08em',
                whiteSpace: 'nowrap',
                zIndex: 20,
              }}
            >
              Camera turning off due to inactivity...
            </div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div
        className="flex items-center gap-4 px-5 pb-3"
        style={{
          backgroundColor: theme.bgDeep,
          borderTop: `1px solid ${theme.primary}26`,
          transition: THEME_TRANSITION,
        }}
      >
        <span
          className="font-inter font-normal uppercase"
          style={{
            color: theme.text,
            opacity: 0.5,
            fontSize: '10px',
            fontVariantNumeric: 'tabular-nums',
            transition: THEME_TRANSITION,
          }}
        >
          RES {resolution.w} x {resolution.h}
        </span>
        <span
          className="font-inter font-normal uppercase"
          style={{
            color: theme.text,
            opacity: 0.5,
            fontSize: '10px',
            fontVariantNumeric: 'tabular-nums',
            transition: THEME_TRANSITION,
          }}
        >
          {TARGET_FPS} FPS
        </span>
        {footerStatus && (
          <span
            className="ml-auto whitespace-nowrap font-inter font-normal uppercase"
            style={{
              color: theme.text,
              opacity: 0.75,
              fontSize: '10px',
              fontVariantNumeric: 'tabular-nums',
              transition: THEME_TRANSITION,
            }}
          >
            {footerStatus}
          </span>
        )}
      </div>
    </div>
  )
}

export default CameraFeed
