import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { membersAPI, settingsAPI, Member, type ClanWidgetSettings } from '@/lib/api';
import { Trash2, Edit, Plus, Star, Upload, CheckCircle, Sparkles, AlertCircle, Crown } from 'lucide-react';
import MemberForm from './MemberForm';

interface ImportResult {
  success: boolean;
  updated: number;
  created: number;
  processed: Array<{ name: string; action: string; error?: string }>;
}

const normalizeClanWidgetSettings = (settings: Partial<ClanWidgetSettings> | null | undefined): ClanWidgetSettings => ({
  enabled: settings?.enabled ?? true,
  title: settings?.title ?? 'Информация для сокланов',
  body: settings?.body ?? '',
  fights: Array.isArray(settings?.fights)
    ? settings!.fights
        .map((fight) => ({
          date: typeof fight?.date === 'string' ? fight.date : '',
          opponent: typeof fight?.opponent === 'string' ? fight.opponent : '',
        }))
        .filter((fight) => fight.date && fight.opponent)
    : [],
});

const MembersAdmin = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [cardScale, setCardScale] = useState(100);
  const [membersVisible, setMembersVisible] = useState(false);
  const [isVisibilityLoading, setIsVisibilityLoading] = useState(true);
  const [isSavingVisibility, setIsSavingVisibility] = useState(false);
  const [clanWidget, setClanWidget] = useState<ClanWidgetSettings>({
    enabled: true,
    title: 'Информация для сокланов',
    body: '',
    fights: []
  });
  const [isSavingClanWidget, setIsSavingClanWidget] = useState(false);
  const [isFightsImportOpen, setIsFightsImportOpen] = useState(false);
  const [fightRows, setFightRows] = useState<Array<{ date: string; opponent: string }>>([
    { date: '', opponent: '' },
  ]);
  
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

  useEffect(() => {
    const loadMembersVisibility = async () => {
      try {
        const settings = await settingsAPI.getMembersVisibility();
        setMembersVisible(settings.visible);
      } catch (error) {
        toast.error('Ошибка загрузки видимости состава');
      } finally {
        setIsVisibilityLoading(false);
      }
    };

    loadMembersVisibility();
  }, []);

  useEffect(() => {
    const loadClanWidgetSettings = async () => {
      try {
        const settings = await settingsAPI.getClanWidget();
        setClanWidget(normalizeClanWidgetSettings(settings));
      } catch (error) {
        toast.error('Ошибка загрузки настроек окна сокланов');
      }
    };

    loadClanWidgetSettings();
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

  const handleSetLeader = async (id: number, name: string) => {
    if (!confirm(`Назначить "${name}" главой клана?`)) return;
    
    try {
      await membersAPI.setLeader(id);
      toast.success(`${name} назначен главой клана`);
      loadMembers();
    } catch (error) {
      toast.error('Ошибка назначения главы');
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

  const handleVisibilityChange = async (checked: boolean) => {
    const previousValue = membersVisible;
    setMembersVisible(checked);
    setIsSavingVisibility(true);

    try {
      const settings = await settingsAPI.updateMembersVisibility(checked);
      setMembersVisible(settings.visible);
      toast.success(settings.visible ? 'Состав отображается на сайте' : 'Состав скрыт на сайте');
    } catch (error) {
      setMembersVisible(previousValue);
      toast.error('Не удалось обновить видимость состава');
    } finally {
      setIsSavingVisibility(false);
    }
  };

  const handleClanWidgetSave = async () => {
    setIsSavingClanWidget(true);
    try {
      const saved = await settingsAPI.updateClanWidget(clanWidget);
      setClanWidget(normalizeClanWidgetSettings(saved));
      toast.success('Настройки окна сокланов сохранены');
    } catch (error) {
      toast.error('Не удалось сохранить настройки окна сокланов');
    } finally {
      setIsSavingClanWidget(false);
    }
  };

  const parseFightsTable = (raw: string) => {
    const lines = raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const parsed = lines
      .map((line) => {
        const cols = line.split(/\t|;|\|/).map((col) => col.trim()).filter(Boolean);
        if (cols.length < 2) return null;
        const date = cols[0];
        const opponent = cols.slice(1).join(' ');
        if (!date || !opponent) return null;
        if (date.toLowerCase().includes('дата') && opponent.toLowerCase().includes('сопер')) {
          return null;
        }
        return { date, opponent };
      })
      .filter((item): item is { date: string; opponent: string } => Boolean(item));

    return parsed;
  };

  const parseFightsFromRows = (rows: Array<{ date: string; opponent: string }>) =>
    rows
      .map((row) => ({
        date: (row.date || '').trim(),
        opponent: (row.opponent || '').trim(),
      }))
      .filter((row) => row.date && row.opponent);

  const handleFightRowChange = (index: number, field: 'date' | 'opponent', value: string) => {
    setFightRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const addFightRow = () => {
    setFightRows((prev) => [...prev, { date: '', opponent: '' }]);
  };

  const removeFightRow = (index: number) => {
    setFightRows((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [{ date: '', opponent: '' }];
    });
  };

  const handleFightTablePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData('text/plain') || '';
    if (!text.includes('\n') && !text.includes('\t')) return;
    const fights = parseFightsTable(text);
    if (fights.length === 0) return;

    event.preventDefault();
    setFightRows(fights);
    toast.success(`Распознано строк: ${fights.length}`);
  };

  const openFightsImportDialog = () => {
    const current = clanWidget.fights && clanWidget.fights.length > 0
      ? clanWidget.fights
      : [{ date: '', opponent: '' }];
    setFightRows(current);
    setIsFightsImportOpen(true);
  };

  const handleImportFights = async () => {
    const fights = parseFightsFromRows(fightRows);
    if (fights.length === 0) {
      toast.error('Добавьте хотя бы один бой: дата + соперник');
      return;
    }

    const nextSettings = { ...clanWidget, fights };
    setClanWidget(nextSettings);
    setIsSavingClanWidget(true);
    try {
      const saved = await settingsAPI.updateClanWidget(nextSettings);
      setClanWidget(normalizeClanWidgetSettings(saved));
      setIsFightsImportOpen(false);
      toast.success(`Список боёв сохранён: ${fights.length}`);
    } catch (error) {
      toast.error('Не удалось сохранить список боёв');
    } finally {
      setIsSavingClanWidget(false);
    }
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
          <Button type="button" variant="outline" onClick={resetImport}>
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

        <Button type="button" onClick={() => window.location.href = '/members'} className="w-full">
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
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
            <Upload className="w-4 h-4 mr-2" />
            Массовая загрузка
          </Button>
          <Button type="button" onClick={() => setShowForm(true)}>
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
      <div className="mb-6 rounded-lg bg-muted/50 p-4">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <label className="mb-3 block text-sm font-medium text-muted-foreground">
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
            <p className="mt-2 text-xs text-muted-foreground">
              Применяется на сайте и в админке
            </p>
          </div>

          <div className="flex min-w-[260px] items-start justify-between gap-4 rounded-lg border border-border bg-background/70 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Видимость состава</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {membersVisible ? 'Состав отображается на сайте' : 'Страница состава заменена на 404-заглушку'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {membersVisible ? 'Отобразить' : 'Скрыть'}
              </span>
              <Switch
                checked={membersVisible}
                onCheckedChange={handleVisibilityChange}
                disabled={isVisibilityLoading || isSavingVisibility}
                aria-label="Переключить видимость состава"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-border bg-muted/50 p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Окно для сокланов на главной</p>
            <p className="text-xs text-muted-foreground mt-1">
              Показывается только авторизованным участникам клана «Свирепые кролики».
            </p>
          </div>
          <Switch
            checked={clanWidget.enabled}
            onCheckedChange={(checked) => setClanWidget((prev) => ({ ...prev, enabled: checked }))}
            disabled={isSavingClanWidget}
            aria-label="Включить окно сокланов"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="clan-widget-title">Заголовок</Label>
          <Input
            id="clan-widget-title"
            value={clanWidget.title}
            onChange={(e) => setClanWidget((prev) => ({ ...prev, title: e.target.value }))}
            disabled={isSavingClanWidget}
            maxLength={120}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="clan-widget-body">Текст</Label>
          <Textarea
            id="clan-widget-body"
            value={clanWidget.body}
            onChange={(e) => setClanWidget((prev) => ({ ...prev, body: e.target.value }))}
            disabled={isSavingClanWidget}
            rows={4}
          />
        </div>

        <div className="space-y-2 rounded border border-border bg-background/40 p-3">
          <div className="flex items-center justify-between gap-3">
            <Label className="text-sm font-medium">Ближайший бой</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openFightsImportDialog}
              disabled={isSavingClanWidget}
            >
              Массовая загрузка
            </Button>
          </div>
          {(clanWidget.fights || []).length > 0 ? (
            <div className="space-y-1 text-xs">
              {(clanWidget.fights || []).map((fight, index) => (
                <div key={`${fight.date}-${fight.opponent}-${index}`} className="text-muted-foreground">
                  {fight.date} Свирепые кролики - {fight.opponent}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Бои не добавлены</p>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={handleClanWidgetSave} disabled={isSavingClanWidget}>
            {isSavingClanWidget ? 'Сохранение...' : 'Сохранить окно сокланов'}
          </Button>
        </div>
      </div>

      <Dialog open={isFightsImportOpen} onOpenChange={setIsFightsImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Массовая загрузка боёв</DialogTitle>
            <DialogDescription>
              Таблица с двумя колонками: дата и соперник. Можно вставить напрямую из Excel/Google Sheets в первое поле.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded border border-border overflow-hidden">
              <div className="grid grid-cols-12 bg-muted/40 text-xs font-medium">
                <div className="col-span-4 px-2 py-2 border-r border-border">Дата</div>
                <div className="col-span-7 px-2 py-2 border-r border-border">Соперник</div>
                <div className="col-span-1 px-2 py-2 text-center">-</div>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {fightRows.map((row, index) => (
                  <div key={index} className="grid grid-cols-12 border-t border-border">
                    <div className="col-span-4 border-r border-border">
                      <Input
                        value={row.date}
                        onChange={(e) => handleFightRowChange(index, 'date', e.target.value)}
                        onPaste={index === 0 ? handleFightTablePaste : undefined}
                        placeholder={index === 0 ? '20.03.2026' : ''}
                        className="h-9 rounded-none border-0"
                      />
                    </div>
                    <div className="col-span-7 border-r border-border">
                      <Input
                        value={row.opponent}
                        onChange={(e) => handleFightRowChange(index, 'opponent', e.target.value)}
                        placeholder={index === 0 ? 'Клан соперника' : ''}
                        className="h-9 rounded-none border-0"
                      />
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFightRow(index)}
                        className="h-7 w-7 p-0"
                        title="Удалить строку"
                      >
                        x
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-start">
              <Button type="button" variant="outline" size="sm" onClick={addFightRow}>
                Добавить строку
              </Button>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsFightsImportOpen(false)}>
                Отмена
              </Button>
              <Button type="button" onClick={handleImportFights} disabled={isSavingClanWidget}>
                Загрузить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                  {!leader && (
                    <Button type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetLeader(member.id, member.name)}
                      title="Назначить главой клана"
                    >
                      <Crown className="w-4 h-4" />
                    </Button>
                  )}
                  <Button type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(member)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button type="button"
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


