"use client";

import { useEffect, useState } from 'react';

const phrases = [
  'Find the right skill for your agent',
  'Discover MCP servers for your workflow',
  'Explore skills for Claude, Cursor & more',
];

type Phase = 'typing' | 'waiting' | 'deleting';

export function TypewriterTitle() {
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<Phase>('typing');
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const phrase = phrases[phraseIndex];
    
    if (phase === 'typing') {
      if (text.length < phrase.length) {
        const timer = setTimeout(() => {
          setText(phrase.slice(0, text.length + 1));
        }, 60);
        return () => clearTimeout(timer);
      } else {
        // Done typing, switch to waiting
        const timer = setTimeout(() => setPhase('deleting'), 2000);
        return () => clearTimeout(timer);
      }
    } else if (phase === 'deleting') {
      if (text.length > 0) {
        const timer = setTimeout(() => {
          setText(text.slice(0, -1));
        }, 30);
        return () => clearTimeout(timer);
      } else {
        // Done deleting, move to next phrase
        const timer = setTimeout(() => {
          setPhraseIndex((current) => (current + 1) % phrases.length);
          setPhase('typing');
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [text, phase, phraseIndex]);

  const renderText = () => {
    // Check for "Claude, Cursor & more" FIRST (most specific) - only for phrase 2
    if (phraseIndex === 2 && text.includes('Claude, Cursor & more')) {
      const parts = text.split('Claude, Cursor & more');
      return (
        <>
          {parts[0]}
          <span className="text-[var(--accent-cyan)]">Claude, Cursor & more</span>
          {parts[1]}
        </>
      );
    }
    
    // Check for "MCP servers" - only for phrase 1
    if (phraseIndex === 1 && text.includes('MCP servers')) {
      const parts = text.split('MCP servers');
      return (
        <>
          {parts[0]}
          <span className="text-[var(--accent-cyan)]">MCP servers</span>
          {parts.slice(1).join('MCP servers')}
        </>
      );
    }
    
    // Check for "skill" - only for phrase 0
    if (phraseIndex === 0 && text.includes('skill')) {
      const parts = text.split('skill');
      return (
        <>
          {parts[0]}
          <span className="text-[var(--accent-cyan)]">skill</span>
          {parts.slice(1).join('skill')}
        </>
      );
    }
    
    return text;
  };

  return (
    <h1 className="max-w-2xl text-3xl font-black tracking-tight md:text-5xl text-white">
      {renderText()}
      <span className="animate-pulse">|</span>
    </h1>
  );
}
