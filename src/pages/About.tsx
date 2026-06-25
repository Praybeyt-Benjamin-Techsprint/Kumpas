import React from 'react'

const frontendTech = ['React', 'TypeScript', 'Vite', 'Tailwind CSS'] as const

const mlTech = [
  'TensorFlow',
  'MediaPipe Hands',
  'Custom Hand Gesture Classification Model',
] as const

const objectives = [
  'Bridge communication between the Deaf and hearing communities',
  'Improve accessibility through ML-powered sign language recognition',
  'Promote Philippine languages through multilingual translation',
  'Encourage inclusive communication regardless of language or hearing ability',
] as const

const futureImprovements = [
  'Expand the FSL vocabulary',
  'Support additional Philippine languages',
  'Improve gesture recognition accuracy with larger training datasets',
  'Add voice output through Text-to-Speech',
  'Develop a mobile application',
  'Enable offline recognition and translation',
] as const

const About: React.FC = () => {
  return (
    <main className="flex-1 px-6 py-14">
      <div className="mx-auto max-w-5xl space-y-12">
        <section>
          <p className="font-inter text-[11px] font-medium uppercase text-gold/70 tracking-[0.12em]">
            Mission
          </p>
          <h1 className="mt-4 font-cinzel text-4xl font-bold text-gold-light md:text-5xl">
            KUMPAS
          </h1>
          <p className="mt-5 font-inter text-[15px] leading-[1.75] text-gold-light/90">
            KUMPAS envisions a Philippines where communication is no longer
            limited by hearing ability or language diversity. By combining
            machine learning with multilingual translation, the platform
            empowers more inclusive conversations while celebrating the rich
            linguistic heritage of the Philippines.
          </p>
        </section>

        <section className="border-t border-gold/20 pt-10">
          <p className="font-inter text-[11px] font-medium uppercase text-gold/70 tracking-[0.12em]">
            What is KUMPAS?
          </p>
          <p className="mt-4 font-inter text-[15px] leading-[1.75] text-gold-light/90">
            The Philippines is home to more than 180 languages, creating a rich
            but complex communication landscape. For the Deaf community,
            conversations can become even more difficult when sign language,
            spoken Filipino, and regional languages meet in everyday life.
            KUMPAS addresses this barrier by using machine learning to recognize
            Filipino Sign Language gestures and translate them into Filipino and
            selected Philippine regional languages.
          </p>
        </section>

        <section className="border-t border-gold/20 pt-10">
          <p className="font-inter text-[11px] font-medium uppercase text-gold/70 tracking-[0.12em]">
            Technologies Used
          </p>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <TechColumn title="Frontend" items={frontendTech} />
            <TechColumn title="Machine Learning" items={mlTech} />
          </div>
        </section>

        <InfoList title="Objectives" items={objectives} />
        <InfoList title="Future Improvements" items={futureImprovements} />
      </div>
    </main>
  )
}

interface ListProps {
  title: string
  items: readonly string[]
}

const TechColumn: React.FC<ListProps> = ({ title, items }) => (
  <article className="border border-gold/30 bg-black/20 p-5">
    <h2 className="font-cinzel text-xl font-semibold text-gold-light">
      {title}
    </h2>
    <ul className="mt-4 space-y-3">
      {items.map((item) => (
        <li
          key={item}
          className="font-inter text-[15px] leading-7 text-gold-light/85"
        >
          {item}
        </li>
      ))}
    </ul>
  </article>
)

const InfoList: React.FC<ListProps> = ({ title, items }) => (
  <section className="border-t border-gold/20 pt-10">
    <p className="font-inter text-[11px] font-medium uppercase text-gold/70 tracking-[0.12em]">
      {title}
    </p>
    <ul className="mt-5 space-y-3">
      {items.map((item) => (
        <li
          key={item}
          className="border-l border-gold/40 pl-4 font-inter text-[15px] leading-7 text-gold-light/90"
        >
          {item}
        </li>
      ))}
    </ul>
  </section>
)

export default About
