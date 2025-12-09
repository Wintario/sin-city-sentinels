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
      // Загружаем всех участников для админки
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
      case 'Глава клана': return 'bg-red-500/20 text-red-500 border-red-500/30';
      case 'Офицер': return 'bg-purple-500/20 text-purple-500 border-purple-500/30';
      case 'Ветеран': return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
      case 'Боец': return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'Новобранец': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return { className: 'bg-green-500/20 text-green-500', label: 'Активен' };
      case 'inactive': return { className: 'bg-gray-500/20 text-gray-500', label: 'Неактивен' };
      case 'reserve': return { className: 'bg-yellow-500/20 text-yellow-500', label: 'В резерве' };
      default: return { className: 'bg-muted text-muted-foreground', label: status };
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

      <div className="mb-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
        <p>💡 На сайте отображаются только участники со статусом "Активен"</p>
        <p>💡 При редактировании можно менять только имя, аватар, профиль и порядок</p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Загрузка...</p>
      ) : members.length === 0 ? (
        <p className="text-muted-foreground">Участников пока нет</p>
      ) : (
        <div className="space-y-3">
          {members.map((member) => {
            const statusInfo = getStatusBadge(member.status);
            const isLeader = member.name === 'легион86' || member.role === 'Глава клана';
            
            return (
              <div
                key={member.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  isLeader 
                    ? 'bg-red-500/10 border-red-500/30' 
                    : member.status !== 'active'
                      ? 'bg-muted/30 border-border/50'
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
                      isLeader ? 'bg-red-500/20' : 'bg-muted'
                    }`}>
                      <span className={`text-sm ${isLeader ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-medium ${isLeader ? 'text-red-500' : ''}`}>
                        {member.name}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded border ${getRoleBadgeColor(member.role)}`}>
                        {member.role}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${statusInfo.className}`}>
                        {statusInfo.label}
                      </span>
                      {member.order_index !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          #{member.order_index}
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
                    onClick={() => handleDelete(member.id)}
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
