import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { membersAPI, Member } from '@/lib/api';
import { Trash2, Edit, Plus, Star, Upload, CheckCircle, Sparkles, AlertCircle } from 'lucide-react';
import MemberForm from './MemberForm';

interface ImportResult {
  success: boolean;
  updated: number;
  created: number;
  processed: Array<{ name: string; action: string; error?: string }>;
}

const MembersAdmin = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [cardScale, setCardScale] = useState(100);
  
  // Массовая загрузка
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Обработка выбора файла для импорта
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка типа файла
    if (!file.name.endsWith('.json')) {
      toast.error('Пожалуйста, выберите JSON файл');
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Валидация структуры
      if (!data.members || !Array.isArray(data.members)) {
        toast.error('Неверная структура JSON: отсутствует массив members');
        return;
      }

      // Проверка полей
      for (const m of data.members) {
        if (!m.user_id || !m.nickname || !m.filename) {
          toast.error('Неверная структура: каждый member должен содержать user_id, nickname и filename');
          return;
        }
      }

      // Подтверждение
      if (!confirm(`Загрузить ${data.members.length} участников? Существующие будут обновлены, новые — созданы.`)) {
        return;
      }

      // Начинаем импорт
      setIsImporting(true);
      setImportProgress(10);
      setImportResult(null);

      // Имитация прогресса
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 80));
      }, 200);

      const result = await membersAPI.import(data);

      clearInterval(progressInterval);
      setImportProgress(100);

      setImportResult(result);
      toast.success(`Импорт завершён: ${result.updated} обновлено, ${result.created} создано`);
      
      // Обновляем список
      loadMembers();

    } catch (error) {
      console.error('Import error:', error);
      if (error instanceof SyntaxError) {
        toast.error('Ошибка парсинга JSON файла');
      } else {
        toast.error('Ошибка импорта: ' + (error as Error).message);
      }
      setIsImporting(false);
    }

    // Сброс input для возможности повторной загрузки того же файла
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetImport = () => {
    setIsImporting(false);
    setImportProgress(0);
    setImportResult(null);
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

  // UI результатов импорта
  if (importResult) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Результаты импорта</h2>
          <Button variant="outline" onClick={resetImport}>
            Закрыть
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">{importResult.updated} обновлено</span>
            </div>
          </div>
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-blue-500">
              <Sparkles className="w-5 h-5" />
              <span className="font-medium">{importResult.created} создано</span>
            </div>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto space-y-2">
          <h3 className="font-medium text-sm text-muted-foreground">Обработанные участники:</h3>
          {importResult.processed.map((item, index) => (
            <div 
              key={index} 
              className={`flex items-center gap-2 p-2 rounded text-sm ${
                item.action === 'error' 
                  ? 'bg-red-500/10 text-red-500' 
                  : item.action === 'created'
                    ? 'bg-blue-500/10 text-blue-400'
                    : 'bg-muted/50'
              }`}
            >
              {item.action === 'error' ? (
                <AlertCircle className="w-4 h-4" />
              ) : item.action === 'created' ? (
                <Sparkles className="w-4 h-4" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
              <span>{item.name}</span>
              <span className="text-muted-foreground">
                ({item.action === 'updated' ? 'обновлён' : item.action === 'created' ? 'создан' : item.error})
              </span>
            </div>
          ))}
        </div>

        <Button onClick={() => window.location.href = '/members'} className="w-full">
          Перейти на страницу участников
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Управление составом</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
            <Upload className="w-4 h-4 mr-2" />
            Массовая загрузка
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Добавить участника
          </Button>
        </div>
      </div>

      {/* Скрытый input для файла */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Прогресс импорта */}
      {isImporting && !importResult && (
        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium mb-2">Импорт участников...</p>
          <Progress value={importProgress} className="h-2" />
        </div>
      )}

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
