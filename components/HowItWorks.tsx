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
    <section id="how" className="py-[70px] px-7 bg-white">
      <div className="max-w-content mx-auto">
        <Reveal className="text-center max-w-[520px] mx-auto mb-11">
          <div className="eyebrow">Simple By Design</div>
          <h2 className="font-display font-bold text-[clamp(26px,4vw,36px)] text-navy mt-[10px]">
            Up and running in minutes.
          </h2>
        </Reveal>

        <Reveal>
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="hidden md:block absolute top-[31px] left-[calc(16.66%+31px)] right-[calc(16.66%+31px)] h-0.5 bg-gradient-to-r from-gold to-gold/15" />
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative text-center">
                <div className="relative w-[62px] h-[62px] mx-auto mb-[22px]">
                  <div className="w-[62px] h-[62px] bg-navy rounded-full flex items-center justify-center relative z-[1]">
                    <svg viewBox="0 0 24 24" className="w-[26px] h-[26px] stroke-gold fill-none" strokeWidth={1.8}>
                      <path d={s.path} />
                    </svg>
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gold text-navy font-condensed font-extrabold text-[10.5px] flex items-center justify-center z-[2]">
                    {i + 1}
                  </div>
                </div>
                <h3 className="font-display font-bold text-lg text-navy mb-[10px]">{s.title}</h3>
                <p className="font-body text-[13.5px] leading-[1.6] text-g600 max-w-[280px] mx-auto">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
