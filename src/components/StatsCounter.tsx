import { useScrollReveal, useCountUp } from '@/hooks/useScrollReveal';
import { Camera, Users, Clock, Star } from 'lucide-react';

interface StatItem {
  icon: typeof Camera;
  value: number;
  suffix: string;
  label: string;
}

const stats: StatItem[] = [
  { icon: Camera, value: 500, suffix: '+', label: 'Properties Photographed' },
  { icon: Users, value: 150, suffix: '+', label: 'Happy Clients' },
  { icon: Clock, value: 24, suffix: 'hr', label: 'Avg Delivery' },
  { icon: Star, value: 5, suffix: '.0', label: 'Star Rating' },
];

function StatNumber({ value, suffix, isVisible }: { value: number; suffix: string; isVisible: boolean }) {
  const count = useCountUp(value, 2000, isVisible);
  return (
    <span className="text-4xl md:text-5xl font-bold text-[#cbb26a]">
      {count}{suffix}
    </span>
  );
}

export function StatsCounter() {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>({ threshold: 0.3 });

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Subtle background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#cbb26a]/[0.03] to-transparent pointer-events-none" />

      <div ref={ref} className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="text-center"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: `all 700ms cubic-bezier(0.16, 1, 0.3, 1) ${index * 150}ms`,
              }}
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-[#cbb26a]/20 mb-4">
                <stat.icon className="w-6 h-6 text-[#cbb26a]/70" />
              </div>
              <div className="mb-2">
                <StatNumber value={stat.value} suffix={stat.suffix} isVisible={isVisible} />
              </div>
              <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
