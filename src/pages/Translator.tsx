import React, { useState } from 'react'
import CameraFeed from '../components/CameraFeed'
import TranslationOutput, { Language } from '../components/TranslationOutput'

const PLACEHOLDER_TEXT =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat...'

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

const Translator: React.FC = () => {
  const [isActive, setIsActive] = useState(false)
  const [selectedLang, setSelectedLang] = useState<Language>('Filipino')
  const [translationText] = useState(PLACEHOLDER_TEXT)
  const theme = DIALECT_THEME[selectedLang]

  return (
    <main
      className="flex flex-1 flex-col md:flex-row"
      style={{
        backgroundColor: theme.bg,
        borderTop: `1px solid ${theme.primary}33`,
        transition: THEME_TRANSITION,
      }}
    >
      <section
        className="flex min-h-[480px] flex-col md:w-1/2"
        style={{
          backgroundColor: theme.bgPanel,
          borderRight: `1px solid ${theme.primary}66`,
          transition: THEME_TRANSITION,
        }}
      >
        <CameraFeed isActive={isActive} theme={theme} />

        <div className="flex justify-center pb-6 pt-2">
          <button
            onClick={() => setIsActive((v) => !v)}
            className="power-btn relative flex flex-col items-center rounded-full px-8 py-2"
            style={{
              background: isActive
                ? `linear-gradient(180deg, ${theme.primary}33 0%, ${theme.primary}14 100%)`
                : 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)',
              border: `1px solid ${
                isActive ? theme.primary : `${theme.primary}80`
              }`,
              cursor: 'pointer',
              minWidth: '160px',
              transition: THEME_TRANSITION,
              boxShadow: isActive
                ? `0 2px 12px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.1)`
                : '0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            <div className="flex items-center gap-2">
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isActive ? '#4caf50' : `${theme.primary}80`,
                  boxShadow: isActive ? '0 0 6px #4caf50' : 'none',
                  transition: THEME_TRANSITION,
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
    </main>
  )
}

export default Translator
