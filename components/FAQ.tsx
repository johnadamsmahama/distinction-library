'use client';

import { useState } from 'react';
import Reveal from './Reveal';

const FAQS = [
  {
    q: 'Who can join?',
    a: 'Exclusive to verified UPSA students with a valid @upsamail.edu.gh email.',
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
    <section id="faq" className="py-[70px] px-7 bg-[#E4E0D3]">
      <div className="max-w-content mx-auto">
        <Reveal>
          <div className="max-w-[640px] mx-auto">
            <div
              className="relative bg-[#FBF9F2] border border-[#D8D2C0] py-[34px] pr-[30px] pl-[56px] shadow-[0_6px_0_-3px_#D8D2C0]"
              style={{ fontFamily: 'var(--font-courier-prime), monospace', color: '#1B1E24' }}
            >
              <div className="absolute top-0 bottom-0 left-10 w-px bg-[#A23B2E] opacity-55" />

              <h2
                className="font-[600] text-[clamp(24px,4vw,30px)] leading-[1.2] text-navy mb-[26px]"
                style={{ fontFamily: 'var(--font-playfair-display), serif' }}
              >
                Frequently <em className="italic text-gold">Asked</em> Questions
              </h2>

              <div
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(180deg, transparent 0 20px, #C7D2E0 20px 21px, transparent 21px 28px)',
                }}
              >
                {FAQS.map((item, i) => (
                  <div key={item.q}>
                    <button
                      onClick={() => setOpen(open === i ? null : i)}
                      className="w-full flex items-baseline gap-2 leading-[28px] text-left"
                    >
                      <span className="text-[13px] font-bold text-navy">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-[13.5px] text-navy flex-1">{item.q}</span>
                      <span className="text-xs text-gold flex-shrink-0">
                        {open === i ? '−' : '+'}
                      </span>
                    </button>
                    {open === i && (
                      <div className="pl-[22px]">
                        <p className="m-0 text-[13.5px] leading-[28px] text-[#3F4450] max-w-[440px]">
                          {item.a}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
