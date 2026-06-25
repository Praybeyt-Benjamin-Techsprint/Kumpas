import React, { useEffect, useRef, useState } from 'react'
import { Video, VideoOff } from 'lucide-react'

interface CameraFeedProps {
  isActive: boolean
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
const TARGET_FPS = 30
type Resolution = {
  w: number
  h: number
}
const THEME_TRANSITION =
  'background-color 0.5s ease, border-color 0.4s ease, color 0.4s ease'

const CameraFeed: React.FC<CameraFeedProps> = ({ isActive, theme }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [resolution, setResolution] = useState<Resolution>(TARGET_RESOLUTION)
  const [streamError, setStreamError] = useState(false)

  useEffect(() => {
    let stream: MediaStream | null = null

    const startCamera = async () => {
      try {
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
          const track = stream.getVideoTracks()[0]
          const settings = track.getSettings()

          setResolution({
            w: settings.width ?? TARGET_RESOLUTION.w,
            h: settings.height ?? TARGET_RESOLUTION.h,
          })
          setStreamError(false)
        }
      } catch {
        setStreamError(true)
        setResolution(TARGET_RESOLUTION)
      }
    }

    const stopCamera = () => {
      if (videoRef.current?.srcObject) {
        const activeStream = videoRef.current.srcObject as MediaStream
        activeStream.getTracks().forEach((track) => track.stop())
        videoRef.current.srcObject = null
      }
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
    }
  }, [isActive])

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
                    Camera permission denied
                  </span>
                </>
              ) : (
                <Video size={36} style={{ color: theme.primary, opacity: 0.2 }} />
              )}
            </div>
          )}
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
