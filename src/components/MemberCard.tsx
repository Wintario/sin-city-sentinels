import { User, Star } from 'lucide-react';

interface Member {
  id: number;
  name: string;
  role?: string;
  profile_url?: string | null;
  avatar_url?: string | null;
  is_leader?: number;
}

interface MemberCardProps {
  member: Member;
}

const MemberCard = ({ member }: MemberCardProps) => {
  // Используем is_leader из данных участника
  const isLeader = !!member.is_leader;
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
      <div className="text-center overflow-hidden">
        <h3 className={`font-heading uppercase tracking-tight line-clamp-3 ${
          isLeader ? 'text-yellow-400' : 'text-foreground'
        }`}
        style={{
          fontSize: 'clamp(0.5rem, 3vw, 0.95rem)',
          lineHeight: '1.1',
          wordBreak: 'break-word'
        }}
        >
          {member.name}
        </h3>
        
        {isLeader && (
          <div className="mt-1 flex items-center justify-center gap-0.5 text-yellow-400 font-display tracking-widest" 
          style={{
            fontSize: 'clamp(0.35rem, 1.8vw, 0.65rem)'
          }}>
            <Star className="w-2 h-2 fill-yellow-400 flex-shrink-0" />
            <span className="break-words">ГЛАВА КЛАНА</span>
            <Star className="w-2 h-2 fill-yellow-400 flex-shrink-0" />
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