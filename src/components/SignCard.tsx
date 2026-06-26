import React from 'react'

interface GuideSign {
  key: string
  label: string
  description: string
}

interface SignCardProps {
  sign: GuideSign
  theme: {
    primary: string
    glow: string
    text: string
    bgPanel: string
    bgDeep: string
  }
  index: number
}

const SignCard: React.FC<SignCardProps> = ({ sign, theme, index }) => {
  const isLastRow = index >= 5
  const isLastInRow = index % 5 === 4

  return (
    <div
      style={{
        background: 'transparent',
        borderBottom: !isLastRow ? `1px solid ${theme.primary}30` : 'none',
        borderRight: !isLastInRow ? `1px solid ${theme.primary}30` : 'none',
        cursor: 'default',
        display: 'flex',
        flexDirection: 'column',
        transition: 'background 0.2s ease',
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.background = 'rgba(255,255,255,0.03)'
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background = 'transparent'
      }}
    >
      <div
        style={{
          alignItems: 'center',
          aspectRatio: '4 / 3',
          background: theme.bgDeep,
          borderBottom: `1px solid ${theme.primary}25`,
          display: 'flex',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          width: '100%',
        }}
      >
        <img
          src={`/images/signs/${sign.key}.png`}
          alt={sign.label}
          style={{
            display: 'block',
            height: '100%',
            objectFit: 'cover',
            width: '100%',
          }}
          onError={(event) => {
            event.currentTarget.style.display = 'none'
            const placeholder = event.currentTarget
              .nextElementSibling as HTMLElement | null
            if (placeholder) placeholder.style.display = 'flex'
          }}
        />
        <div
          style={{
            alignItems: 'center',
            display: 'none',
            flexDirection: 'column',
            gap: '8px',
            inset: 0,
            justifyContent: 'center',
            position: 'absolute',
          }}
        >
          <div
            style={{
              alignItems: 'center',
              border: `1.5px dashed ${theme.primary}40`,
              borderRadius: '4px',
              display: 'flex',
              height: '56px',
              justifyContent: 'center',
              width: '56px',
            }}
          >
            <span
              style={{
                color: theme.text,
                fontFamily: 'Inter, sans-serif',
                fontSize: '9px',
                letterSpacing: '0.06em',
                opacity: 0.25,
                textTransform: 'uppercase',
              }}
            >
              IMG
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          padding: '10px 12px 12px',
        }}
      >
        <span
          style={{
            color: theme.text,
            fontFamily: "'Cinzel', serif",
            fontSize: '11px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          {sign.label}
        </span>
        <span
          style={{
            color: theme.text,
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            letterSpacing: '0.03em',
            lineHeight: 1.5,
            opacity: 0.5,
          }}
        >
          {sign.description}
        </span>
      </div>
    </div>
  )
}

export default SignCard
