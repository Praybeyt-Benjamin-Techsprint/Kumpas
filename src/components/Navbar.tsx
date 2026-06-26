import React from 'react'
import { Link } from 'react-router-dom'

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Tutorial', to: '/tutorial' },
  { label: 'About', to: '/about' },
  { label: 'FAQ', to: '/faq' },
] as const

const Navbar: React.FC = () => {
  return (
    <header
      className="flex min-h-[56px] w-full items-center justify-between px-4 py-2"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background:
          'linear-gradient(180deg, #8A6B0E 0%, #C49A14 35%, #B8920F 100%)',
        borderBottom: '2px solid #8A6B0E',
        boxShadow:
          '0 4px 24px 0 rgba(0,0,0,0.5), 0 1px 0 rgba(196,154,20,0.18)',
        filter: 'drop-shadow(0 6px 1px rgba(0,0,0,0.5))',
      }}
    >
      <div className="flex items-center gap-3">
        <img
          src="/images/logotech.png"
          alt="KUMPAS logo"
          className="h-10 w-auto object-contain"
        />
      </div>

      <nav className="flex items-center gap-8">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.label}
            to={link.to}
            className="nav-link"
            style={{ color: '#3A0008' }}
            onMouseEnter={(event) => {
              event.currentTarget.style.color = '#1A0004'
              event.currentTarget.style.textShadow =
                '0 0 8px rgba(90,0,20,0.4)'
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.color = '#3A0008'
              event.currentTarget.style.textShadow = 'none'
            }}
          >
            {link.label.toUpperCase()}
          </Link>
        ))}
      </nav>
    </header>
  )
}

export default Navbar
