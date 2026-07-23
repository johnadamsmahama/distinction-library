'use client';

import { useState } from 'react';
import Reveal from './Reveal';

const FAQS = [
  {
    q: 'Who can join?',
    a: 'Exclusive to verified UPSA students with a valid @st.upsa.edu.gh email.',
  },
  {
    q: 'Is it free?',
    a: 'Completely free. No subscriptions, premium tiers, or hidden costs.',
  },
  {
    q: 'How are uploads moderated?',
    a: "Submissions enter a pending queue. Approved papers get a DL watermark. Poor submissions result in a strike on the uploader's account.",
  },
  {
    q: 'Is my Study Vault private?',
    a: 'Yes — AI quizzes, sessions, and summaries are visible only to you. No admin access.',
  },
  {
    q: 'What AI features are included?',
    a: 'AI Quiz Generator (PDF → MCQs / true-false / short-answer) and AI Study Companion (explains, summarises, generates revision notes). All saved to your Study Vault.',
  },
  {
    q: 'What is the Distinction Programme?',
    a: 'A separate peer-led initiative — tutorials and revision sessions via WhatsApp and Google Classroom. Optional and independent from Distinction Library access.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-[70px] px-7 bg-white">
      <div className="max-w-content mx-auto">
        <Reveal className="text-center max-w-[520px] mx-auto mb-11">
          <div className="eyebrow">Questions</div>
          <h2 className="font-display font-bold text-[clamp(26px,4vw,36px)] text-navy mt-[10px]">
            Frequently asked.
          </h2>
        </Reveal>

        <Reveal>
          <div className="max-w-faq mx-auto">
            {FAQS.map((item, i) => (
              <div key={item.q} className="border-b border-g100">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between py-[22px] px-1 text-left font-condensed font-semibold text-[15.5px] text-g800"
                >
                  {item.q}
                  <span
                    className={`font-body text-xl text-gold ml-4 flex-shrink-0 transition-transform ${
                      open === i ? 'rotate-45' : ''
                    }`}
                  >
                    +
                  </span>
                </button>
                {open === i && (
                  <div className="px-1 pb-[22px] font-body text-sm leading-[1.7] text-g600">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
