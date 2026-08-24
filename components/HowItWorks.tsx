import Reveal from './Reveal';

const STEPS = [
  {
    title: 'Sign in with your official UPSA student email',
    desc: 'Your official student email is your key - just confirm and you\'re in.',
    path: 'M4 4h16v16H4z M4 7l8 6 8-6',
  },
  {
    title: 'Find your courses',
    desc: 'Search by course code, department, or level. Bookmark to personalise your dashboard.',
    path: 'M11 4a7 7 0 100 14 7 7 0 000-14z M21 21l-4.3-4.3',
  },
  {
    title: 'Study smarter',
    desc: 'Download past questions, access materials, and use AI tools to turn notes into quizzes.',
    path: 'M12 3l8 4-8 4-8-4 8-4z M4 11l8 4 8-4M4 15l8 4 8-4',
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="py-[46px] px-7 bg-white">
      <div className="max-w-content mx-auto">
        <Reveal className="text-center max-w-[520px] mx-auto mb-7">
          <div className="eyebrow">Simple By Design</div>
          <h2 className="font-display font-bold text-[clamp(26px,4vw,36px)] text-navy mt-[8px]">
            Up and running in minutes.
          </h2>
        </Reveal>

        <Reveal>
          <div className="border-[3px] border-navy py-5 px-[30px] bg-[#F1E7C6]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {STEPS.map((s, i) => (
                <div key={s.title} className="text-center">
                  <div className="font-condensed font-extrabold text-[11px] tracking-[1.5px] text-gold mb-[6px]">
                    STEP 0{i + 1}
                  </div>
                  <div className="w-[52px] h-[52px] mx-auto mb-4 bg-navy flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-[22px] h-[22px] stroke-gold fill-none" strokeWidth={2}>
                      <path d={s.path} />
                    </svg>
                  </div>
                  <h3 className="font-display font-bold text-lg text-navy mb-2">{s.title}</h3>
                  <p className="font-body text-[13px] leading-[1.6] text-g600">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
