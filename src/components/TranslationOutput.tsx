import React, { useState } from 'react'
import { ChevronDown, Copy, Volume2 } from 'lucide-react'

export const LANGUAGES = [
  'Filipino',
  'Cebuano',
  'Ilocano',
  'Waray',
  'Hiligaynon',
  'Kapampangan',
] as const

export type Language = (typeof LANGUAGES)[number]

interface TranslationTheme {
  primary: string
  glow: string
  text: string
  bg: string
  bgPanel: string
  bgDeep: string
}

interface TranslationOutputProps {
  selectedLang: Language
  setSelectedLang: (language: Language) => void
  theme: TranslationTheme
  translationText: string
}
const THEME_TRANSITION =
  'background-color 0.5s ease, border-color 0.4s ease, color 0.4s ease'

const TranslationOutput: React.FC<TranslationOutputProps> = ({
  selectedLang,
  setSelectedLang,
  theme,
  translationText,
}) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!translationText) return
    try {
      await navigator.clipboard.writeText(translationText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard not available
    }
  }

  const handleSpeak = () => {
    if (!translationText || !window.speechSynthesis) return
    const utterance = new SpeechSynthesisUtterance(translationText)
    utterance.lang = 'fil-PH'
    window.speechSynthesis.speak(utterance)
  }

  const dividerBackground = (direction: 'left' | 'right') =>
    `linear-gradient(to ${direction}, transparent, ${theme.primary}66)`

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
          <span
            style={{
              color: theme.primary,
              fontSize: '9px',
              fontWeight: 700,
              lineHeight: 1,
              transition: THEME_TRANSITION,
            }}
          >
            Tr
          </span>
        </div>
        <span
          className="font-inter text-[11px] font-medium uppercase tracking-[0.12em]"
          style={{ color: theme.text, opacity: 0.7, transition: THEME_TRANSITION }}
        >
          Translation Output
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 pb-2 pt-4">
        <div
          className="translation-scroll relative flex-1 overflow-visible p-4"
          style={{
            backgroundColor: theme.bgDeep,
            border: `1px solid ${theme.primary}`,
            boxShadow: `0 0 12px ${theme.glow}, inset 0 0 20px rgba(0,0,0,0.6)`,
            minHeight: '160px',
            transition: THEME_TRANSITION,
          }}
        >
          <span
            className="absolute left-2 top-2 z-10 h-3 w-3 pointer-events-none"
            style={{
              borderTop: `1.5px solid ${theme.primary}`,
              borderLeft: `1.5px solid ${theme.primary}`,
              opacity: 0.5,
              transition: THEME_TRANSITION,
            }}
          />
          <span
            className="absolute right-2 top-2 z-10 h-3 w-3 pointer-events-none"
            style={{
              borderTop: `1.5px solid ${theme.primary}`,
              borderRight: `1.5px solid ${theme.primary}`,
              opacity: 0.5,
              transition: THEME_TRANSITION,
            }}
          />
          <span
            className="absolute bottom-2 left-2 z-10 h-3 w-3 pointer-events-none"
            style={{
              borderBottom: `1.5px solid ${theme.primary}`,
              borderLeft: `1.5px solid ${theme.primary}`,
              opacity: 0.5,
              transition: THEME_TRANSITION,
            }}
          />
          <span
            className="absolute bottom-2 right-2 z-10 h-3 w-3 pointer-events-none"
            style={{
              borderBottom: `1.5px solid ${theme.primary}`,
              borderRight: `1.5px solid ${theme.primary}`,
              opacity: 0.5,
              transition: THEME_TRANSITION,
            }}
          />

          {translationText ? (
            <p
              className="font-inter font-normal"
              style={{
                color: theme.text,
                fontSize: '15px',
                lineHeight: 1.75,
                opacity: 0.9,
                textAlign: 'left',
                transition: THEME_TRANSITION,
              }}
            >
              {translationText}
            </p>
          ) : (
            <p
              className="font-inter text-sm italic"
              style={{
                color: theme.text,
                marginTop: '40px',
                opacity: 0.3,
                textAlign: 'center',
                transition: THEME_TRANSITION,
              }}
            >
              Translation will appear here...
            </p>
          )}

          <div className="mt-4 flex items-center justify-center gap-2">
            <div
              style={{
                background: dividerBackground('right'),
                flex: 1,
                height: '1px',
                transition: THEME_TRANSITION,
              }}
            />
            <div
              style={{
                background: theme.primary,
                height: '6px',
                opacity: 0.6,
                transform: 'rotate(45deg)',
                transition: THEME_TRANSITION,
                width: '6px',
              }}
            />
            <div
              style={{
                background: dividerBackground('left'),
                flex: 1,
                height: '1px',
                transition: THEME_TRANSITION,
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <button
            onClick={handleCopy}
            title="Copy text"
            className="icon-btn"
            style={{
              border: `1px solid ${theme.primary}66`,
              boxShadow: `0 0 10px ${theme.glow}`,
              cursor: 'pointer',
              transition: THEME_TRANSITION,
            }}
          >
            <Copy size={16} style={{ color: copied ? '#fff' : theme.primary }} />
          </button>

          <button
            onClick={handleSpeak}
            title="Read aloud"
            className="icon-btn"
            style={{
              border: `1px solid ${theme.primary}66`,
              boxShadow: `0 0 10px ${theme.glow}`,
              cursor: 'pointer',
              transition: THEME_TRANSITION,
            }}
          >
            <Volume2 size={16} style={{ color: theme.primary }} />
          </button>
        </div>

        <div className="flex justify-center pb-2">
          <div className="relative">
            <button
              onClick={() => setShowDropdown((value) => !value)}
              className="lang-selector flex items-center gap-3 rounded-full px-6 py-2"
              style={{
                border: `2px solid ${theme.primary}`,
                boxShadow: `0 0 16px ${theme.glow}, inset 0 0 8px rgba(0,0,0,0.4)`,
                cursor: 'pointer',
                minWidth: '180px',
                transition: THEME_TRANSITION,
              }}
            >
              <span
                className="font-cinzel flex-1 text-center text-[12px] font-bold uppercase tracking-[0.16em]"
                style={{ color: theme.text, transition: THEME_TRANSITION }}
              >
                {selectedLang}
              </span>
              <ChevronDown
                size={16}
                style={{
                  color: theme.primary,
                  transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: THEME_TRANSITION,
                }}
              />
            </button>

            {showDropdown && (
              <div
                className="absolute bottom-full left-0 right-0 z-50 mb-2 overflow-hidden rounded"
                style={{
                  backgroundColor: theme.bgDeep,
                  border: `1px solid ${theme.primary}`,
                  boxShadow: `0 0 20px ${theme.glow}`,
                  transition: THEME_TRANSITION,
                }}
              >
                {LANGUAGES.map((language) => (
                  <button
                    key={language}
                    onClick={() => {
                      setSelectedLang(language)
                      setShowDropdown(false)
                    }}
                    className="w-full px-4 py-2 text-left transition-colors duration-150"
                    style={{
                      background:
                        language === selectedLang ? `${theme.primary}26` : 'transparent',
                      borderBottom: `1px solid ${theme.primary}1a`,
                      color:
                        language === selectedLang ? theme.text : `${theme.text}99`,
                      cursor: 'pointer',
                      fontFamily: "'Cinzel', serif",
                      fontSize: '12px',
                      letterSpacing: '0.12em',
                    }}
                    onMouseEnter={(event) => {
                      if (language !== selectedLang) {
                        event.currentTarget.style.background = `${theme.primary}14`
                      }
                    }}
                    onMouseLeave={(event) => {
                      if (language !== selectedLang) {
                        event.currentTarget.style.background = 'transparent'
                      }
                    }}
                  >
                    {language.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TranslationOutput
