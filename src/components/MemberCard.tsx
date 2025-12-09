import { User, Star } from 'lucide-react';

interface Member {
  id: number;
  name: string;
  role?: string;
  profile_url?: string | null;
  avatar_url?: string | null;
}

interface MemberCardProps {
  member: Member;
  isLeader?: boolean;
}

const MemberCard = ({ member, isLeader = false }: MemberCardProps) => {
  const hasLink = !!member.profile_url;

  const CardContent = (
    <>
      {/* Avatar */}
      <div className="aspect-square bg-secondary flex items-center justify-center mb-3 overflow-hidden">
        {member.avatar_url ? (
          <img 
            src={member.avatar_url} 
            alt={member.name}
            className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-300"
          />
        ) : (
          <User className="w-12 h-12 text-muted-foreground" />
        )}
      </div>

      {/* Info */}
      <div className="text-center">
        <h3 className={`font-heading text-lg uppercase tracking-wide ${isLeader ? 'text-yellow-400' : 'text-foreground'}`}>
          {member.name}
        </h3>
        
        {isLeader && (
          <div className="mt-2 flex items-center justify-center gap-1 text-yellow-400 font-display text-xs tracking-widest">
            <Star className="w-3 h-3 fill-yellow-400" />
            ГЛАВА КЛАНА
            <Star className="w-3 h-3 fill-yellow-400" />
          </div>
        )}
      </div>
    </>
  );

  // Стили для главы клана - золотая рамка
  const leaderStyles = isLeader 
    ? 'border-2 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.4)]' 
    : '';

  if (hasLink) {
    return (
      <a 
        href={member.profile_url!}
        target="_blank"
        rel="noopener noreferrer"
        className={`member-card block cursor-pointer ${leaderStyles}`}
      >
        {CardContent}
      </a>
    );
  }

  return (
    <div className={`member-card ${leaderStyles}`}>
      {CardContent}
    </div>
  );
};

export default MemberCard;