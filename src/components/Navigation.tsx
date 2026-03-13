import { MouseEvent, useState } from 'react';
import { Menu, X, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface NavigationProps {
  onHover: (isHovering: boolean) => void;
}

const Navigation = ({ onHover }: NavigationProps) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const loggedIn = isAuthenticated;

  const navItems = [
    { label: 'О нас', href: '/#about', isExternal: true },
    { label: 'Новости', href: '/#news', isExternal: true },
    { label: 'Устав', href: '/charter', isExternal: true },
    { label: 'Состав клана', href: '/members', isExternal: true },
  ];

  const handleMouseEnter = () => onHover(true);
  const handleMouseLeave = () => onHover(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Вы вышли из системы');
    navigate('/');
  };

  const handleLogoClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setIsOpen(false);
    navigate('/');
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    });
    window.setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }, 120);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" onClick={handleLogoClick} className="font-display text-2xl tracking-wider text-foreground">
            СВИРЕПЫЕ <span className="text-primary">КРОЛИКИ</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              item.isExternal ? (
                <Link
                  key={item.href}
                  to={item.href}
                  className="nav-btn"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.href}
                  href={item.href}
                  className="nav-btn"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  {item.label}
                </a>
              )
            ))}

            {/* Auth Button */}
            {loggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <UserIcon className="h-4 w-4" />
                    {user?.displayName || user?.username || 'Профиль'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <UserIcon className="h-4 w-4 mr-2" />
                    Профиль
                  </DropdownMenuItem>
                  {(user?.role === 'admin' || user?.role === 'author') && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        Перейти в админку
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate('/auth')}
                className="gap-2"
              >
                <LogIn className="h-4 w-4" />
                Войти
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border">
            {navItems.map((item) => (
              item.isExternal ? (
                <Link
                  key={item.href}
                  to={item.href}
                  className="block py-3 px-4 font-heading uppercase tracking-wider text-foreground hover:text-primary hover:bg-secondary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.href}
                  href={item.href}
                  className="block py-3 px-4 font-heading uppercase tracking-wider text-foreground hover:text-primary hover:bg-secondary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </a>
              )
            ))}
            
            {/* Mobile Auth Button */}
            {loggedIn ? (
              <div className="border-t border-border mt-2 pt-2">
                <div className="block py-3 px-4 font-heading uppercase tracking-wider text-foreground">
                  <UserIcon className="inline h-4 w-4 mr-2" />
                  {user?.displayName || user?.username || 'Профиль'}
                </div>
                <button
                  className="w-full text-left py-3 px-4 font-heading uppercase tracking-wider text-foreground hover:text-primary hover:bg-secondary transition-colors"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/profile');
                  }}
                >
                  Профиль
                </button>
                {(user?.role === 'admin' || user?.role === 'author') && (
                  <button
                    className="w-full text-left py-3 px-4 font-heading uppercase tracking-wider text-foreground hover:text-primary hover:bg-secondary transition-colors"
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/admin');
                    }}
                  >
                    Админка
                  </button>
                )}
                <button
                  className="w-full text-left py-3 px-4 font-heading uppercase tracking-wider text-red-500 hover:text-red-400 hover:bg-secondary transition-colors"
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                >
                  <LogOut className="inline h-4 w-4 mr-2" />
                  Выйти
                </button>
              </div>
            ) : (
              <button
                className="w-full text-left py-3 px-4 font-heading uppercase tracking-wider text-primary hover:text-primary/80 hover:bg-secondary transition-colors border-t border-border mt-2"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/auth');
                }}
              >
                <LogIn className="inline h-4 w-4 mr-2" />
                Войти
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;



