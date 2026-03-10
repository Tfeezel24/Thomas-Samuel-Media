import { Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollReveal } from '@/components/ScrollReveal';
import type { Testimonial } from '@/types';

interface EnhancedTestimonialsProps {
  testimonials: Testimonial[];
}

export function EnhancedTestimonials({ testimonials }: EnhancedTestimonialsProps) {
  return (
    <section className="py-20 px-4 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">What Clients Say</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
              Trusted by real estate agents, contractors, and brands
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial: Testimonial, index: number) => (
            <ScrollReveal key={testimonial.id} delay={index * 100}>
              <div className="group relative h-full">
                {/* Glow effect behind card */}
                <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-b from-[#cbb26a]/0 via-[#cbb26a]/0 to-[#cbb26a]/0 group-hover:from-[#cbb26a]/20 group-hover:via-[#cbb26a]/10 group-hover:to-transparent transition-all duration-500 blur-sm" />

                <div className="relative h-full rounded-xl border border-[#cbb26a]/20 bg-card p-6 group-hover:border-[#cbb26a]/40 transition-all duration-500 group-hover:shadow-[0_0_30px_rgba(203,178,106,0.08)]">
                  {/* Decorative quote mark */}
                  <div className="absolute -top-3 left-6 text-5xl font-serif text-[#cbb26a]/20 leading-none select-none">"</div>

                  {/* Stars */}
                  <div className="flex items-center gap-1 mb-4 pt-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#cbb26a] text-[#cbb26a]" />
                    ))}
                  </div>

                  {/* Content */}
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed italic">
                    "{testimonial.content}"
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3 mt-auto">
                    <Avatar className="w-10 h-10 ring-2 ring-[#cbb26a]/20">
                      <AvatarImage src={testimonial.avatar} />
                      <AvatarFallback className="bg-[#cbb26a]/10 text-[#cbb26a]">{testimonial.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.company}</p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
