import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { membersAPI, Member } from '@/lib/api';
import { Trash2, Edit, Plus } from 'lucide-react';
import MemberForm from './MemberForm';

const MembersAdmin = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const loadMembers = async () => {
    try {
      setIsLoading(true);
      const data = await membersAPI.getAll();
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

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить этого участника?')) return;
    
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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Leader': return 'bg-red-500/20 text-red-500 border-red-500/30';
      case 'AWP': return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
      case 'Support': return 'bg-green-500/20 text-green-500 border-green-500/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-500';
      case 'inactive': return 'bg-gray-500/20 text-gray-500';
      case 'reserve': return 'bg-yellow-500/20 text-yellow-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

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

      {isLoading ? (
        <p className="text-muted-foreground">Загрузка...</p>
      ) : members.length === 0 ? (
        <p className="text-muted-foreground">Участников пока нет</p>
      ) : (
        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-muted/50 border-border"
            >
              <div className="flex items-center gap-4">
                {member.avatar_url ? (
                  <img 
                    src={member.avatar_url} 
                    alt={member.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground text-sm">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{member.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded border ${getRoleBadgeColor(member.role)}`}>
                      {member.role}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${getStatusBadge(member.status)}`}>
                      {member.status}
                    </span>
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
                  onClick={() => handleDelete(member.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MembersAdmin;
