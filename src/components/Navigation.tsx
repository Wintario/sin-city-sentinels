import { useState } from 'react';
import { Menu, X, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { clearToken } from '@/lib/api';
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
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const loggedIn = isAuthenticated();

  const navItems = [
    { label: 'О нас', href: '#about', isExternal: false },
    { label: 'Новости', href: '#news', isExternal: false },
    { label: 'Устав', href: '/charter', isExternal: true },
    { label: 'Состав клана', href: '/members', isExternal: true },
  ];

  const handleMouseEnter = () => onHover(true);
  const handleMouseLeave = () => onHover(false);

  const handleLogout = () => {
    clearToken();
    toast.success('Вы вышли из системы');
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <a href="#" className="font-display text-2xl tracking-wider text-foreground">
            СВИРЕПЫЕ <span className="text-primary">КРОЛИКИ</span>
          </a>

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
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;