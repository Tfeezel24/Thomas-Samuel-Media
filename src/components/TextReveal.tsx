import { useEffect, useState } from 'react';

interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number;
  staggerMs?: number;
}

export function TextReveal({ text, className = '', delay = 200, staggerMs = 120 }: TextRevealProps) {
  const [visibleWords, setVisibleWords] = useState(0);
  const words = text.split(' ');

  useEffect(() => {
    const timeout = setTimeout(() => {
      let current = 0;
      const interval = setInterval(() => {
        current++;
        setVisibleWords(current);
        if (current >= words.length) {
          clearInterval(interval);
        }
      }, staggerMs);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [words.length, delay, staggerMs]);

  return (
    <span className={className}>
      {words.map((word, i) => (
        <span
          key={i}
          className="inline-block mr-[0.3em]"
          style={{
            opacity: i < visibleWords ? 1 : 0,
            transform: i < visibleWords ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 500ms cubic-bezier(0.16, 1, 0.3, 1), transform 500ms cubic-bezier(0.16, 1, 0.3, 1)',
            willChange: 'opacity, transform',
          }}
        >
          {word}
        </span>
      ))}
    </span>
  );
}
