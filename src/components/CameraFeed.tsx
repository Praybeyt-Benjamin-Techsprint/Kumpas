import React, { useEffect, useRef, useState } from 'react'
import { Video, VideoOff } from 'lucide-react'

export type CameraStatus = 'off' | 'starting' | 'live' | 'denied' | 'unsupported' | 'error'

interface CameraFeedProps {
  isActive: boolean
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

const CameraFeed: React.FC<CameraFeedProps> = ({
  isActive,
  inferenceIntervalMs = DEFAULT_INFERENCE_INTERVAL_MS,
  onFrame,
  onStatusChange,
  onStreamChange,
  theme,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [resolution, setResolution] = useState<Resolution>(TARGET_RESOLUTION)
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('off')

  useEffect(() => {
    let stream: MediaStream | null = null

    const updateCameraStatus = (status: CameraStatus) => {
      setCameraStatus(status)
      onStatusChange?.(status)
    }

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        updateCameraStatus('unsupported')
        setResolution(TARGET_RESOLUTION)
        onStreamChange?.(null)
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
          updateCameraStatus('live')
          onStreamChange?.(stream)
        }
      } catch (error) {
        const errorName = error instanceof DOMException ? error.name : ''
        updateCameraStatus(
          errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError'
            ? 'denied'
            : 'error',
        )
        setResolution(TARGET_RESOLUTION)
        onStreamChange?.(null)
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

  const hasCameraFailure = ['denied', 'unsupported', 'error'].includes(cameraStatus)
  const shouldRenderVideo = isActive && !hasCameraFailure
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
            border: `1px solid ${theme.primary}59`,
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

          {shouldRenderVideo ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              {cameraStatus === 'starting' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <span
                    className="font-inter text-xs uppercase tracking-[0.12em]"
                    style={{ color: theme.text, opacity: 0.6 }}
                  >
                    Starting camera
                  </span>
                </div>
              )}
            </>
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
          <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
        </div>
      </div>

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
      </div>
    </div>
  )
}

export default CameraFeed
