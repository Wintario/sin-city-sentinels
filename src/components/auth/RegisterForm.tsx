import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
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
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

const registerSchema = z.object({
  username: z.string()
    .min(2, 'Ник должен быть не менее 2 символов')
    .max(50, 'Ник слишком длинный')
    .regex(/^[a-zA-Zа-яА-Я0-9_ ]+$/, 'Ник может содержать только буквы, цифры, пробелы и подчеркивание'),
  password: z.string()
    .min(6, 'Пароль должен быть не менее 6 символов')
    .max(72, 'Пароль слишком длинный'),
  confirmPassword: z.string(),
  characterUrl: z.string()
    .url('Неверный формат URL')
    .refine(
      url => url.includes('apeha.ru'),
      'URL должен вести на страницу персонажа на apeha.ru'
    ),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onRegisterSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

const RegisterForm = ({ onRegisterSuccess, onSwitchToLogin }: RegisterFormProps) => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isUrlValid, setIsUrlValid] = useState<boolean | null>(null);
  const [isCheckingUrl, setIsCheckingUrl] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const characterUrl = watch('characterUrl');

  // Проверка URL персонажа при изменении
  useEffect(() => {
    if (characterUrl && characterUrl.length > 10) {
      setIsCheckingUrl(true);
      try {
        const url = new URL(characterUrl);
        const isValid = url.hostname.includes('apeha.ru');
        setIsUrlValid(isValid);
      } catch {
        setIsUrlValid(false);
      } finally {
        setIsCheckingUrl(false);
      }
    } else {
      setIsUrlValid(null);
    }
  }, [characterUrl]);

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);

    try {
      const result = await registerUser({
        username: data.username,
        password: data.password,
        characterUrl: data.characterUrl,
      });

      // Сохраняем токен верификации
      if (result.verificationToken) {
        setVerificationToken(result.verificationToken);
        toast.success('Регистрация успешна! Разместите код верификации в профиле персонажа.');
      } else {
        toast.success('Регистрация успешна!');
        onRegisterSuccess?.();
        navigate('/');
      }
    } catch (error: any) {
      console.error('Register error:', error);
      // Извлекаем полезное сообщение об ошибке
      const errorMessage = error.response?.data?.message || error.message || 'Ошибка регистрации';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCharacter = async () => {
    if (!verificationToken) return;

    setIsLoading(true);
    try {
      const { authAPI } = await import('@/lib/api');
      await authAPI.verifyCharacter(verificationToken);
      toast.success('Верификация успешна! Теперь вы можете комментировать новости.');
      onRegisterSuccess?.();
      navigate('/');
    } catch (error: any) {
      console.error('Verify character error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Ошибка верификации';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Если токен получен, показываем инструкцию по верификации
  if (verificationToken) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Верификация персонажа</CardTitle>
          <CardDescription>
            Подтвердите, что вы владеете этим персонажем
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Ваш код верификации:</p>
            <p className="text-2xl font-mono font-bold text-center tracking-wider py-2 bg-background rounded border">
              {verificationToken}
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-medium">Инструкция:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Зайдите в игру на страницу персонажа</li>
              <li>Откройте раздел "О себе" для редактирования</li>
              <li>Вставьте код верификации в текст</li>
              <li>Сохраните изменения</li>
              <li>Нажмите кнопку "Я разместил код"</li>
            </ol>
          </div>

          <Button 
            onClick={handleVerifyCharacter} 
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
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Регистрация</CardTitle>
        <CardDescription>
          Создайте аккаунт для комментирования новостей
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Ник в Арене</Label>
            <Input
              id="username"
              type="text"
              placeholder="Ваш никнейм в игре (как на странице персонажа)"
              disabled={isLoading}
              {...register('username')}
            />
            {errors.username && (
              <p className="text-sm text-red-500">{errors.username.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Должен совпадать с именем персонажа на странице
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="characterUrl">
              Ссылка на персонажа *
            </Label>
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
              Пример: https://kovcheg2.apeha.ru/info.html?user=123456 или https://kovcheg2.apeha.ru/pers.html?id=123456
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
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
                Регистрация...
              </>
            ) : (
              'Зарегистрироваться'
            )}
          </Button>

          {onSwitchToLogin && (
            <p className="text-center text-sm text-muted-foreground">
              Уже есть аккаунт?{' '}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={onSwitchToLogin}
              >
                Войти
              </button>
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default RegisterForm;
