import React, { useState } from 'react'
import { ArrowLeft, ChevronDown, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import FadeIn from '../components/FadeIn'

const faqItems = [
  {
    question: 'What is KUMPAS?',
    answer:
      'KUMPAS is a web-based application that uses machine learning to recognize Filipino Sign Language (FSL) gestures in real time and translate them into Filipino (Tagalog) and various Philippine regional languages including Cebuano, Ilocano, Waray, Hiligaynon, and Kapampangan. It is designed to bridge communication between the Deaf community and hearing speakers of different local languages.',
  },
  {
    question: 'Do I need to install anything to use KUMPAS?',
    answer:
      'No installation is required. KUMPAS runs entirely in your web browser. You only need a device with a working webcam and a modern browser such as Google Chrome 90+, Microsoft Edge 90+, or Firefox 88+.',
  },
  {
    question: 'Is my camera footage recorded or stored?',
    answer:
      'No. KUMPAS never records, stores, or transmits your video feed. All gesture recognition processing happens locally in your browser using TensorFlow.js and MediaPipe Hands. Your camera data never leaves your device.',
  },
  {
    question: 'Which Filipino Sign Language signs does KUMPAS recognize?',
    answer:
      'KUMPAS currently supports a defined vocabulary of FSL signs. The vocabulary is actively being expanded. For best results, perform signs clearly and hold each gesture for approximately 1-2 seconds. Note that FSL is different from ASL (American Sign Language) - make sure you are using Filipino Sign Language gestures.',
  },
  {
    question: 'Why is my camera not working?',
    answer:
      'First, make sure you clicked "Allow" when the browser asked for camera permission. If you clicked "Block" by accident, click the lock icon in your browser address bar, find Camera permissions, set it to Allow, and refresh the page. Also check that no other application (Zoom, Teams, OBS) is currently using your webcam - only one app can access the camera at a time.',
  },
  {
    question: 'Why are my gestures not being recognized?',
    answer:
      'Ensure your hands are well-lit, clearly visible in the frame, and roughly 40-80 cm from the camera. Avoid backlit conditions (bright windows behind you). Perform gestures at a steady pace and hold each sign for 1-2 seconds. If recognition is still poor, try a plain, uncluttered background behind your hands.',
  },
  {
    question: 'Can I use KUMPAS on my phone?',
    answer:
      'Yes. KUMPAS is responsive and works on modern mobile browsers. Use Chrome on Android or Safari on iOS. Tap the Turn On button to activate your front-facing camera. For best results, prop your device upright so both hands are visible in the frame.',
  },
  {
    question: 'What languages can KUMPAS translate into?',
    answer:
      'Currently supported output languages are: Filipino (Tagalog), Cebuano, Ilocano, Waray, Hiligaynon, and Kapampangan. More Philippine languages are planned for future releases.',
  },
  {
    question: 'Does the Text-to-Speech work for all languages?',
    answer:
      'Text-to-Speech availability depends on your device installed language packs. Filipino/Tagalog and regional language voices may require installing the relevant language pack in your system settings. On Windows: Settings -> Time & Language -> Language. On macOS: System Preferences -> Language & Region.',
  },
  {
    question: 'Is KUMPAS free to use?',
    answer:
      'Yes, KUMPAS is free to use. It is an academic project aimed at promoting inclusive communication and supporting the Philippine Deaf community.',
  },
] as const

const termsItems = [
  {
    title: 'Purpose of Use',
    body: 'KUMPAS is provided as an academic and accessibility-focused tool for Filipino Sign Language learning, recognition, and multilingual translation support. It should not be treated as a certified interpreter or as a replacement for professional communication support in legal, medical, emergency, or other high-stakes settings.',
  },
  {
    title: 'Camera and Privacy',
    body: 'KUMPAS requires camera permission so it can detect hand gestures. Camera access is used only while the translator is active. Video is not recorded, stored, sold, or intentionally shared by the application.',
  },
  {
    title: 'Data Privacy Act',
    body: 'The project is designed with respect for the Philippine Data Privacy Act of 2012, also known as Republic Act No. 10173. Users should avoid entering or showing sensitive personal information while using the application.',
  },
  {
    title: 'Accuracy and Limitations',
    body: 'Machine learning recognition can be affected by lighting, camera quality, hand position, background clutter, and differences in signing style. Translations may be incomplete or incorrect, so users should verify important messages before relying on them.',
  },
  {
    title: 'User Responsibility',
    body: 'By using KUMPAS, you agree to use it respectfully, lawfully, and only for its intended educational and communication-support purposes. Do not use the app to misrepresent, harm, discriminate against, or exclude any person or community.',
  },
] as const

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (index: number) => {
    setOpenIndex((previous) => (previous === index ? null : index))
  }

  return (
    <main className="flex-1 bg-maroon-deep px-6 py-14">
      <div className="mx-auto max-w-5xl">
        <FadeIn delay={120}>
          <div className="mt-8">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 border border-gold bg-gold px-6 py-3 font-inter text-[13px] font-semibold uppercase tracking-[0.1em] text-maroon-deep shadow-[0_12px_30px_rgba(0,0,0,0.25)] transition hover:bg-gold-light hover:shadow-[0_16px_36px_rgba(0,0,0,0.32)] focus:outline-none focus:ring-2 focus:ring-gold-light focus:ring-offset-2 focus:ring-offset-maroon-deep"
            >
              <ArrowLeft size={16} strokeWidth={2.5} />
              Back to Home
            </Link>
          </div>
        </FadeIn>
        <FadeIn>
          <h1 className="mt-4 font-cinzel text-4xl font-bold text-gold-light md:text-5xl">
            FAQ
          </h1>
          <p className="mt-4 font-inter text-[15px] leading-[1.75] text-gold-light/80">
            Everything you need to know about using KUMPAS.
          </p>
        </FadeIn>

        <section className="mt-10 space-y-4">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index

            return (
              <FadeIn key={item.question} delay={index * 80}>
                <article
                  className={`overflow-hidden border bg-black/20 transition-colors duration-300 ${
                    isOpen ? 'border-gold' : 'border-gold/30'
                  }`}
                >
                  <button
                    onClick={() => toggle(index)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="font-cinzel text-lg font-semibold text-gold-light">
                      {item.question}
                    </span>
                    <ChevronDown
                      size={20}
                      className="shrink-0 transition-transform duration-300"
                      style={{
                        color: '#C49A14',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    />
                  </button>
                  <div
                    className="transition-all duration-300 ease-in-out"
                    style={{
                      maxHeight: isOpen ? '260px' : '0',
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <p className="border-l-4 border-gold px-5 pb-5 pt-1 font-inter text-[15px] leading-[1.75] text-gold-light/80">
                      {item.answer}
                    </p>
                  </div>
                </article>
              </FadeIn>
            )
          })}
        </section>

        <FadeIn delay={180}>
          <section
            id="terms-and-conditions"
            className="mt-14 scroll-mt-24 border border-gold/30 bg-black/20 p-6 md:p-8"
          >
            <div className="flex flex-col gap-4 border-b border-gold/20 pb-6 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-inter text-[11px] font-medium uppercase text-gold/70 tracking-[0.12em]">
                  Terms & Conditions
                </p>
                <h2 className="mt-3 font-cinzel text-3xl font-bold text-gold-light">
                  Privacy and responsible use
                </h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center border border-gold/50 bg-gold/10 text-gold-light">
                <ShieldCheck size={24} />
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {termsItems.map((item) => (
                <article key={item.title} className="border-l-4 border-gold pl-4">
                  <h3 className="font-cinzel text-lg font-semibold text-gold-light">
                    {item.title}
                  </h3>
                  <p className="mt-2 font-inter text-[14px] leading-[1.75] text-gold-light/78">
                    {item.body}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </FadeIn>
      </div>
    </main>
  )
}

export default FAQ
