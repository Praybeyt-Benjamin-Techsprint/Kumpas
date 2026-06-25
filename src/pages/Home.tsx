import React from "react";
import { Link } from "react-router-dom";

const steps = [
  "Open KUMPAS in your browser",
  "Allow webcam access when prompted",
  "Perform a Filipino Sign Language gesture",
  "The ML model recognizes the gesture",
  "The gesture is translated to Filipino (Tagalog)",
  "Output is shown in your chosen Philippine language",
] as const;

const features = [
  "Real-time FSL Recognition",
  "Multilingual Philippine Output",
  "ML-Powered Accuracy",
  "Webcam-Based Detection",
  "Inclusive Design",
  "Multiple Regional Languages",
] as const;

const languages = [
  "Filipino (Tagalog)",
  "Cebuano",
  "Ilocano",
  "Hiligaynon",
  "Waray",
  "Kapampangan",
] as const;

const Home: React.FC = () => {
  return (
    <main className="flex-1">
      <section className="px-6 pb-16 pt-14 md:pb-20 md:pt-20">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <p className="font-inter text-[11px] font-medium uppercase text-gold/70 tracking-[0.12em]">
              Filipino Sign Language Translator
            </p>
            <h1 className="mt-5 max-w-4xl font-cinzel text-4xl font-bold leading-tight text-gold-light md:text-6xl">
              Breaking barriers in Filipino Sign Language
            </h1>
            <p className="mt-6 max-w-3xl font-inter text-base leading-8 text-gold-light/80 md:text-lg">
              KUMPAS uses machine learning to recognize Filipino Sign Language
              gestures in real time and translate them into Filipino and
              regional Philippine languages — making communication more
              inclusive for the Deaf community.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                to="/translate"
                className="inline-flex items-center justify-center border border-gold bg-gold px-6 py-3 font-inter text-[13px] font-semibold uppercase tracking-[0.1em] text-maroon-deep transition hover:bg-gold-light"
              >
                Start Translating →
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center px-1 py-3 font-inter text-[13px] font-semibold uppercase tracking-[0.1em] text-gold-light transition hover:text-white"
              >
                Learn how it works →
              </a>
            </div>
          </div>

          <div
            className="relative min-h-[340px] overflow-hidden border border-gold/40 bg-maroon-dark"
            style={{
              boxShadow:
                "inset 0 0 50px rgba(0,0,0,0.65), 0 20px 60px rgba(0,0,0,0.25)",
            }}
          >
            <div className="absolute inset-6 border border-gold/30" />
            <div className="absolute left-10 top-10 h-20 w-20 border-2 border-gold/70" />
            <div className="absolute bottom-10 right-10 h-28 w-28 border-2 border-gold/50" />
            <div className="absolute inset-x-10 top-1/2 h-px bg-gold/40" />
            <div className="absolute inset-y-10 left-1/2 w-px bg-gold/30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="font-cinzel text-8xl font-black text-gold-light">
                  <img src="/images/logotech.png"></img>
                </span>
                <p className="mt-4 font-inter text-[11px] font-medium uppercase text-gold/70 tracking-[0.12em]">
                  ML Gesture Recognition
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-gold/20 px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <p className="font-inter text-[11px] font-medium uppercase text-gold/70 tracking-[0.12em]">
            How It Works
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <article
                key={step}
                className="border border-gold/30 bg-black/20 p-5"
              >
                <span className="font-cinzel text-3xl font-bold text-gold-light">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="mt-4 font-inter text-[15px] leading-7 text-gold-light/85">
                  {step}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <p className="font-inter text-[11px] font-medium uppercase text-gold/70 tracking-[0.12em]">
            Features
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature}
                className="border border-gold/30 bg-maroon-dark/60 p-5"
              >
                <h2 className="font-cinzel text-xl font-semibold text-gold-light">
                  {feature}
                </h2>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="mx-auto max-w-6xl">
          <p className="font-inter text-[11px] font-medium uppercase text-gold/70 tracking-[0.12em]">
            Supported Languages
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {languages.map((language) => (
              <span
                key={language}
                className="border border-gold/40 bg-black/20 px-4 py-2 font-inter text-[13px] text-gold-light/90"
              >
                {language}
              </span>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
