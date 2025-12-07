import { ExternalLink, User } from 'lucide-react';

interface Member {
  id: number;
  name: string;
  role: string;
  profile_url?: string | null;
  avatar_url?: string | null;
}

interface MemberCardProps {
  member: Member;
}

const MemberCard = ({ member }: MemberCardProps) => {
  const isLeader = member.name === 'легион86' || member.id === 1;

  return (
    <div className={`member-card ${isLeader ? 'member-card-leader' : ''}`}>
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
        <h3 className={`font-heading text-lg uppercase tracking-wide ${isLeader ? 'text-primary' : 'text-foreground'}`}>
          {member.name}
        </h3>
        <p className="font-body text-sm text-muted-foreground mt-1">
          {member.role}
        </p>
        
        {isLeader && (
          <div className="mt-2 text-primary font-display text-xs tracking-widest">
            ★ ГЛАВА КЛАНА ★
          </div>
        )}

        {member.profile_url && (
          <a 
            href={member.profile_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <ExternalLink size={14} />
            <span className="text-xs">Профиль</span>
          </a>
        )}
      </div>
    </div>
  );
};

export default MemberCard;
