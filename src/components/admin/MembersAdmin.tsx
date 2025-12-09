import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { membersAPI, Member } from '@/lib/api';
import { Trash2, Edit, Plus, Star } from 'lucide-react';
import MemberForm from './MemberForm';

const MembersAdmin = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [cardScale, setCardScale] = useState(100);

  // Загрузка масштаба из localStorage
  useEffect(() => {
    const savedScale = localStorage.getItem('clan_member_scale');
    if (savedScale) {
      setCardScale(parseInt(savedScale, 10));
    }
  }, []);

  // Сохранение масштаба в localStorage и применение CSS переменной
  useEffect(() => {
    localStorage.setItem('clan_member_scale', cardScale.toString());
    document.documentElement.style.setProperty('--member-scale', `${cardScale / 100}`);
  }, [cardScale]);

  const loadMembers = async () => {
    try {
      setIsLoading(true);
      const data = await membersAPI.getAdminList();
      setMembers(data);
    } catch (error) {
      toast.error('Ошибка загрузки участников');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Удалить участника "${name}"?`)) return;
    
    try {
      await membersAPI.delete(id);
      toast.success('Участник удалён');
      loadMembers();
    } catch (error) {
      toast.error('Ошибка удаления');
    }
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingMember(null);
  };

  const handleFormSuccess = () => {
    handleFormClose();
    loadMembers();
  };

  // Определяем главу клана по полю is_leader
  const isLeader = (member: Member) => !!member.is_leader;

  if (showForm) {
    return (
      <MemberForm
        member={editingMember}
        onCancel={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Управление составом</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить участника
        </Button>
      </div>

      {/* Ползунок масштабирования */}
      <div className="mb-6 p-4 bg-muted/50 rounded-lg">
        <label className="block text-sm font-medium text-muted-foreground mb-3">
          Размер карточек на сайте: {cardScale}%
        </label>
        <Slider
          value={[cardScale]}
          onValueChange={(value) => setCardScale(value[0])}
          min={50}
          max={150}
          step={5}
          className="w-full max-w-md"
        />
        <p className="text-xs text-muted-foreground mt-2">
          Применяется на сайте и в админке
        </p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Загрузка...</p>
      ) : members.length === 0 ? (
        <p className="text-muted-foreground">Участников пока нет</p>
      ) : (
        <div className="space-y-3">
          {members.map((member) => {
            const leader = isLeader(member);
            
            return (
              <div
                key={member.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  leader 
                    ? 'bg-yellow-500/10 border-yellow-500/50' 
                    : 'bg-muted/50 border-border'
                }`}
              >
                <div className="flex items-center gap-4">
                  {member.avatar_url ? (
                    <img 
                      src={member.avatar_url} 
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      leader ? 'bg-yellow-500/20' : 'bg-muted'
                    }`}>
                      <span className={`text-sm ${leader ? 'text-yellow-500 font-bold' : 'text-muted-foreground'}`}>
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`font-medium ${leader ? 'text-yellow-500' : ''}`}>
                        {member.name}
                      </h3>
                      {leader && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">
                          <Star className="w-3 h-3" />
                          Глава клана
                        </span>
                      )}
                    </div>
                    {member.profile_url && (
                      <a 
                        href={member.profile_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Профиль
                      </a>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(member)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(member.id, member.name)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MembersAdmin;