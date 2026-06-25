import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import About from './pages/About'
import Home from './pages/Home'
import Tutorial from './pages/Tutorial'
import Translator from './pages/Translator'

const PlaceholderPage: React.FC<{ title: string; description: string }> = ({
  title,
  description,
}) => (
  <main className="flex flex-1 items-center justify-center px-6 py-20">
    <section className="w-full max-w-2xl text-center">
      <p className="font-inter text-[11px] font-medium uppercase text-gold/70 tracking-[0.12em]">
        KUMPAS
      </p>
      <h1 className="mt-4 font-cinzel text-4xl font-bold text-gold-light">
        {title}
      </h1>
      <p className="mt-4 font-inter text-[15px] leading-7 text-gold-light/80">
        {description}
      </p>
    </section>
  </main>
)

const App: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-maroon-deep">
      <Navbar />

      <div
        style={{
          height: '2px',
          background:
            'linear-gradient(to right, transparent, #C49A14 20%, #C49A14 80%, transparent)',
        }}
      />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/translate" element={<Translator />} />
        <Route path="/about" element={<About />} />
        <Route path="/tutorial" element={<Tutorial />} />
        <Route
          path="/faq"
          element={
            <PlaceholderPage
              title="FAQ"
              description="Frequently asked questions about KUMPAS will be added here."
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <footer
        className="flex items-center justify-center px-6 py-1"
        style={{
          borderTop: '1px solid rgba(196,154,20,0.25)',
          background: 'rgba(0,0,0,0.3)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            style={{
              height: '1px',
              width: '60px',
              background:
                'linear-gradient(to right, transparent, rgba(196,154,20,0.4))',
            }}
          />
          <span
            className="font-inter font-normal uppercase tracking-[0.14em]"
            style={{ color: 'rgba(196,154,20,0.35)', fontSize: '10px' }}
          >
            KUMPAS — FILIPINO SIGN LANGUAGE TRANSLATION SYSTEM
          </span>
          <div
            style={{
              height: '1px',
              width: '60px',
              background:
                'linear-gradient(to left, transparent, rgba(196,154,20,0.4))',
            }}
          />
        </div>
      </footer>
    </div>
  )
}

export default App
