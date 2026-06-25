import React, { useState } from 'react'

const prerequisites = [
  {
    title: 'Device with a webcam',
    body: 'A laptop, desktop with USB camera, or mobile device with a front-facing camera. Minimum recommended: 720p resolution.',
  },
  {
    title: 'Modern browser',
    body: 'Google Chrome 90+, Microsoft Edge 90+, or Firefox 88+. Safari is supported but may have limited camera permissions on iOS.',
  },
  {
    title: 'Good lighting',
    body: 'Face a light source. Avoid backlighting from bright windows behind you. Even, diffuse light gives the best gesture detection accuracy.',
  },
  {
    title: 'Clear background',
    body: 'A plain, uncluttered background behind your hands helps the MediaPipe hand detection model isolate your gestures more accurately.',
  },
  {
    title: 'Internet connection',
    body: 'Required to load the machine learning model on first visit. Once loaded, recognition runs locally in your browser.',
  },
] as const

const guideSteps = [
  {
    title: 'Open KUMPAS and navigate to the Translator',
    description:
      'From the home page, click the "Start Translating" button. This opens the Translator page which is split into two panels: the left panel shows your live camera feed, and the right panel displays the translated text output.',
    tips:
      'Make sure you are using a supported browser. If the page does not load correctly, try a hard refresh (Ctrl+Shift+R / Cmd+Shift+R).',
  },
  {
    title: 'Grant webcam access',
    description:
      'When you first click "Turn On", your browser will ask for permission to access your camera. Click "Allow". KUMPAS never records, stores, or transmits your video — all processing happens locally in your browser using TensorFlow.js and MediaPipe Hands.',
    tips:
      'If you accidentally clicked "Block", go to your browser site settings by clicking the lock icon in the address bar and reset camera permissions for this site, then refresh.',
  },
  {
    title: 'Select your target language',
    description:
      'Before or after turning on the camera, click the language selector button at the bottom of the right panel. Choose from: Filipino (Tagalog), Cebuano, Ilocano, Waray, Hiligaynon, or Kapampangan. The interface accent color will change to reflect your selected language, and all translations will output in that language.',
    tips:
      'You can switch languages mid-session at any time. The translation output will update to the new language immediately.',
  },
  {
    title: 'Position your hands correctly',
    description:
      'Hold your hands within the camera frame — roughly centered, with your palms visible. Keep your hands between 40–80 cm from the camera for best results. The MediaPipe Hands model tracks 21 keypoints on each hand in real time. Avoid wearing gloves or accessories that cover the back of the hand, as these reduce detection confidence.',
    tips:
      'If the model struggles to detect your hands, try adjusting your distance from the camera or improving the room lighting. A hand skeleton overlay may appear on the feed to show what the model is currently tracking.',
  },
  {
    title: 'Perform a Filipino Sign Language gesture',
    description:
      'Perform a single FSL gesture clearly and hold it for approximately 1–2 seconds. KUMPAS currently supports a defined vocabulary of FSL signs. The gesture classifier analyzes the landmark positions from MediaPipe and matches them to the closest known FSL sign in the model.',
    tips:
      'Perform gestures at a natural, steady pace, not too fast. Blurry motion reduces recognition accuracy. Start with simpler signs like letters or common words to get familiar with how the system responds.',
  },
  {
    title: 'Read the translation output',
    description:
      'Once a gesture is recognized, the Filipino (Tagalog) equivalent appears first, then it is automatically translated into your selected Philippine language. The text appears in the right panel. You can click the copy icon to copy the text to your clipboard, or click the speaker icon to hear the text read aloud using your browser Text-to-Speech engine.',
    tips:
      'The translation builds progressively — you can perform multiple gestures in sequence and the output will accumulate into a sentence.',
  },
  {
    title: 'Turn off when done',
    description:
      'Click the "Turn Off" button to stop the camera feed and end the session. The webcam indicator light on your device will turn off. Your translated text remains visible in the output panel until you navigate away or refresh.',
    tips:
      'Always turn off the camera when not in use. KUMPAS does not automatically stop the webcam if you close the tab — your browser may keep the camera active in the background until you explicitly stop it.',
  },
] as const

const dos = [
  'Keep your signing hand fully visible in the frame',
  'Use good, even lighting from the front',
  'Hold gestures steadily for 1–2 seconds',
  'Start with the FSL alphabet to calibrate',
  'Keep your background plain and uncluttered',
] as const

const donts = [
  "Don't sign too fast — the model needs time to classify",
  "Don't sign outside the camera frame",
  "Don't cover your wrist or palm with accessories",
  "Don't use KUMPAS in very dim or backlit conditions",
  "Don't confuse FSL with ASL (American Sign Language) — they are different systems",
] as const

const troubleshooting = [
  {
    question: 'The camera shows a black screen after I click Turn On.',
    answer:
      'Check that no other application is currently using your webcam, such as Zoom, Teams, or OBS. Only one application can access the camera at a time. Close other apps and try again.',
  },
  {
    question: 'My gestures are not being recognized.',
    answer:
      "Make sure your hands are clearly visible, well-lit, and within 40–80 cm of the camera. Try slowing down your signing. If the issue persists, the gesture may not yet be in KUMPAS's current vocabulary — check the supported signs list.",
  },
  {
    question: 'The browser keeps asking for camera permission every time.',
    answer:
      'Click the lock icon in your browser address bar, find the Camera permission, and set it to "Allow" permanently for this site.',
  },
  {
    question: 'The Text-to-Speech voice does not match the language I selected.',
    answer:
      'Browser TTS voice availability depends on your operating system installed language packs. For Filipino/Tagalog and regional languages, you may need to install the relevant language pack in your system settings. On Windows: Settings → Time & Language → Language. On macOS: System Preferences → Language & Region.',
  },
  {
    question: 'Can I use KUMPAS on mobile?',
    answer:
      'Yes, KUMPAS is responsive and works on modern mobile browsers. Use Chrome on Android or Safari on iOS. Tap the Turn On button to activate the front-facing camera. For best results, prop your device upright so your hands are visible in the frame.',
  },
] as const

const Tutorial: React.FC = () => {
  const [openItems, setOpenItems] = useState<ReadonlySet<number>>(
    () => new Set([0]),
  )

  const toggleItem = (index: number) => {
    setOpenItems((current) => {
      const next = new Set(current)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  return (
    <main className="flex-1 bg-maroon-deep px-6 py-14">
      <div className="mx-auto max-w-6xl">
        <section className="max-w-4xl">
          <p className="font-inter text-[11px] font-medium uppercase tracking-[0.12em] text-gold/70">
            Tutorial
          </p>
          <h1 className="mt-4 font-cinzel text-4xl font-bold text-gold-light md:text-5xl">
            How to use KUMPAS
          </h1>
          <p className="mt-5 font-inter text-[15px] leading-[1.75] text-gold-light/80">
            A step-by-step guide to recognizing Filipino Sign Language gestures
            and translating them into Philippine languages.
          </p>
        </section>

        <Section title="Before You Begin">
          <div className="grid gap-4 md:grid-cols-3">
            {prerequisites.map((item) => (
              <article
                key={item.title}
                className="corner-deco relative border border-gold/30 bg-black/20 p-5"
              >
                <div className="mb-4 flex h-7 w-7 items-center justify-center border border-gold/70 font-cinzel text-sm font-bold text-gold-light">
                  ✓
                </div>
                <h3 className="font-cinzel text-lg font-semibold text-gold-light">
                  {item.title}
                </h3>
                <p className="mt-3 font-inter text-[14px] leading-7 text-gold-light/80">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </Section>

        <Section title="Step-by-Step Guide">
          <div className="space-y-5">
            {guideSteps.map((step, index) => (
              <article
                key={step.title}
                className="corner-deco relative border border-gold/30 bg-black/20 p-5 md:p-6"
              >
                <div className="flex flex-col gap-5 md:flex-row">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-gold font-cinzel text-2xl font-bold text-gold-light">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-cinzel text-2xl font-semibold text-gold-light">
                      {step.title}
                    </h3>
                    <p className="mt-3 font-inter text-[15px] leading-[1.75] text-gold-light/80">
                      {step.description}
                    </p>
                    <div className="mt-5 border-l border-gold/50 bg-[#2A0008] px-4 py-3">
                      <p className="font-inter text-[14px] leading-7 text-gold-light/80">
                        <span className="font-semibold text-gold-light">Tip: </span>
                        {step.tips}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Section>

        <Section title="FSL Gesture Tips">
          <div className="grid gap-5 md:grid-cols-2">
            <TipColumn title="Do's" items={dos} accent="#C49A14" />
            <TipColumn
              title="Don'ts"
              items={donts}
              accent="rgba(200,60,60,0.7)"
            />
          </div>
        </Section>

        <Section title="Troubleshooting">
          <div className="space-y-3">
            {troubleshooting.map((item, index) => {
              const isOpen = openItems.has(index)
              return (
                <article
                  key={item.question}
                  className="overflow-hidden border border-gold/30 bg-black/20"
                >
                  <button
                    onClick={() => toggleItem(index)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="font-cinzel text-lg font-semibold text-gold-light">
                      {item.question}
                    </span>
                    <span className="font-cinzel text-2xl text-gold-light">
                      {isOpen ? '-' : '+'}
                    </span>
                  </button>
                  <div
                    className="transition-all duration-300 ease-in-out"
                    style={{
                      maxHeight: isOpen ? '220px' : '0',
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <p className="border-t border-gold/20 px-5 pb-5 pt-4 font-inter text-[15px] leading-[1.75] text-gold-light/80">
                      {item.answer}
                    </p>
                  </div>
                </article>
              )
            })}
          </div>
        </Section>
      </div>
    </main>
  )
}

interface SectionProps {
  children: React.ReactNode
  title: string
}

const Section: React.FC<SectionProps> = ({ children, title }) => (
  <section className="mt-14 border-t border-gold/20 pt-10">
    <h2 className="mb-6 font-cinzel text-3xl font-semibold text-gold-light">
      {title}
    </h2>
    {children}
  </section>
)

interface TipColumnProps {
  accent: string
  items: readonly string[]
  title: string
}

const TipColumn: React.FC<TipColumnProps> = ({ accent, items, title }) => (
  <article className="border border-gold/30 bg-black/20 p-5">
    <h3
      className="font-cinzel text-2xl font-semibold"
      style={{ color: accent }}
    >
      {title}
    </h3>
    <ul className="mt-5 space-y-3">
      {items.map((item) => (
        <li
          key={item}
          className="border-l pl-4 font-inter text-[15px] leading-7 text-gold-light/80"
          style={{ borderColor: accent }}
        >
          {item}
        </li>
      ))}
    </ul>
  </article>
)

export default Tutorial
