import { useEffect, useRef, useState } from 'react';
import MemberCard from './MemberCard';

// Mock data for 30 members
const mockMembers = [
  { id: 1, name: 'легион86', role: 'Глава клана', profile_url: 'https://apeha.ru', avatar_url: null },
  ...Array.from({ length: 29 }, (_, i) => ({
    id: i + 2,
    name: `Участник ${i + 2}`,
    role: 'Член клана',
    profile_url: null,
    avatar_url: null,
  })),
];

const MembersSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      id="members" 
      ref={sectionRef}
      className="relative py-24 px-4"
    >
      <div className="container mx-auto">
        {/* Section Title */}
        <div 
          className={`comic-panel inline-block bg-card px-8 py-4 mb-12 transform -rotate-1 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <h2 className="font-display text-4xl md:text-5xl text-foreground tracking-wider">
            СОСТАВ <span className="text-primary">КЛАНА</span>
          </h2>
        </div>

        {/* Members Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {mockMembers.map((member, index) => (
            <div
              key={member.id}
              className={`transition-all duration-500 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: `${Math.min(index * 50, 500)}ms` }}
            >
              <MemberCard member={member} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MembersSection;
