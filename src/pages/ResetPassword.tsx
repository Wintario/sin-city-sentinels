import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
import { Loader2, KeyRound } from 'lucide-react';

const resetPasswordSchema = z.object({
  password: z.string()
    .min(6, 'Пароль должен быть не менее 6 символов')
    .max(72, 'Пароль слишком длинный'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

const ResetPassword = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Проверяем токен при загрузке
  useEffect(() => {
    if (!token) {
      toast.error('Токен сброса не найден');
      navigate('/auth/reset-password-request');
      return;
    }

    // Проверяем токен (попытка сброса с пустым паролем вернёт ошибку валидации, но подтвердит существование токена)
    // В будущем можно добавить отдельный эндпоинт для проверки токена
    setIsTokenValid(true); // Пока считаем токен валидным
  }, [token, navigate]);

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      toast.error('Токен сброса не найден');
      return;
    }

    setIsLoading(true);

    try {
      await authAPI.resetPassword(token, data.password);
      setIsReset(true);
      toast.success('Пароль успешно сброшен');

      // Редирект на страницу входа через 3 секунды
      setTimeout(() => {
        navigate('/auth');
      }, 3000);
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error(error.response?.data?.message || error.message || 'Ошибка сброса пароля');
    } finally {
      setIsLoading(false);
    }
  };

  if (isTokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <KeyRound className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <CardTitle className="text-center">Неверный токен</CardTitle>
            <CardDescription className="text-center">
              Токен сброса пароля не найден или истёк
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/auth/reset-password-request">Запросить новый токен</Link>
            </Button>
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
          <CardTitle className="text-center">
            {isReset ? 'Пароль сброшен' : 'Новый пароль'}
          </CardTitle>
          <CardDescription className="text-center">
            {isReset
              ? 'Ваш пароль успешно изменён'
              : 'Придумайте новый пароль'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isReset ? (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground">
                Теперь вы можете войти с новым паролем.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/auth">Перейти ко входу</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Новый пароль</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  disabled={isLoading}
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Подтверждение пароля</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  disabled={isLoading}
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  'Сбросить пароль'
                )}
              </Button>

              <div className="text-center">
                <Link to="/auth" className="text-sm text-primary hover:underline">
                  Вернуться ко входу
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
