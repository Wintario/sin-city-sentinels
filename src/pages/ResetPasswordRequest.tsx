import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle, KeyRound } from 'lucide-react';

const resetPasswordRequestSchema = z.object({
  username: z.string()
    .min(2, 'Ник должен быть не менее 2 символов')
    .max(50, 'Ник слишком длинный'),
  characterUrl: z.string()
    .url('Неверный формат URL')
    .refine(
      url => url.includes('apeha.ru') && (url.includes('info') || url.includes('pers')),
      'URL должен вести на страницу персонажа на apeha.ru'
    ),
});

type ResetPasswordRequestForm = z.infer<typeof resetPasswordRequestSchema>;

const ResetPasswordRequest = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isUrlValid, setIsUrlValid] = useState<boolean | null>(null);
  const [isCheckingUrl, setIsCheckingUrl] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordRequestForm>({
    resolver: zodResolver(resetPasswordRequestSchema),
  });

  const characterUrl = watch('characterUrl');

  // Проверка URL персонажа при изменении
  useState(() => {
    if (characterUrl && characterUrl.length > 10) {
      setIsCheckingUrl(true);
      try {
        const url = new URL(characterUrl);
        const isValid = url.hostname.includes('apeha.ru') &&
          (url.pathname.includes('info') || url.pathname.includes('pers'));
        setIsUrlValid(isValid);
      } catch {
        setIsUrlValid(false);
      } finally {
        setIsCheckingUrl(false);
      }
    } else {
      setIsUrlValid(null);
    }
  });

  const onSubmit = async (data: ResetPasswordRequestForm) => {
    setIsLoading(true);

    try {
      const result = await authAPI.resetPasswordRequest({
        username: data.username,
        characterUrl: data.characterUrl,
      });

      if (result.resetToken) {
        setResetToken(result.resetToken);
        toast.success('Токен сброса пароля создан. Разместите его в профиле персонажа.');
      }
    } catch (error: any) {
      console.error('Reset password request error:', error);
      toast.error(error.response?.data?.message || error.message || 'Ошибка запроса');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetToken) return;

    setIsLoading(true);
    try {
      await authAPI.resetPassword(resetToken, '');
      // Этот вызов вернёт ошибку, так как мы не передали пароль
      // Но токен будет проверен
    } catch (error: any) {
      // Ожидаем ошибку валидации пароля
      // Перенаправляем на страницу ввода пароля
      navigate(`/auth/reset-password/${resetToken}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Если токен получен, показываем инструкцию
  if (resetToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <KeyRound className="h-12 w-12 mx-auto mb-4 text-primary" />
            <CardTitle className="text-center">Сброс пароля</CardTitle>
            <CardDescription className="text-center">
              Подтвердите владение персонажем
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Ваш код сброса пароля:</p>
              <p className="text-2xl font-mono font-bold text-center tracking-wider py-2 bg-background rounded border">
                {resetToken}
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <p className="font-medium">Инструкция:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Зайдите в игру на страницу персонажа</li>
                <li>Откройте раздел "О себе" для редактирования</li>
                <li>Вставьте код сброса пароля в текст</li>
                <li>Сохраните изменения</li>
                <li>Нажмите кнопку "Я разместил код"</li>
              </ol>
            </div>

            <Button 
              onClick={handleResetPassword} 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Проверка...
                </>
              ) : (
                'Я разместил код'
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Код действителен в течение 24 часов
            </p>

            <div className="text-center">
              <Link to="/auth" className="text-sm text-primary hover:underline">
                Вернуться ко входу
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <KeyRound className="h-12 w-12 mx-auto mb-4 text-primary" />
          <CardTitle className="text-center">Сброс пароля</CardTitle>
          <CardDescription className="text-center">
            Восстановление доступа через персонажа
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Ник в Арене</Label>
              <Input
                id="username"
                type="text"
                placeholder="Ваш никнейм в игре"
                disabled={isLoading}
                {...register('username')}
              />
              {errors.username && (
                <p className="text-sm text-red-500">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="characterUrl">Ссылка на персонажа</Label>
              <div className="flex gap-2">
                <Input
                  id="characterUrl"
                  type="url"
                  placeholder="https://kovcheg2.apeha.ru/info.html?user=123"
                  disabled={isLoading}
                  {...register('characterUrl')}
                />
                {isCheckingUrl && (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                )}
                {isUrlValid === true && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
                {isUrlValid === false && (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              {errors.characterUrl && (
                <p className="text-sm text-red-500">{errors.characterUrl.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Пример: https://kovcheg2.apeha.ru/info.html?user=123456
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Создание токена...
                </>
              ) : (
                'Получить код сброса'
              )}
            </Button>

            <div className="text-center">
              <Link to="/auth" className="text-sm text-primary hover:underline">
                Вернуться ко входу
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordRequest;
