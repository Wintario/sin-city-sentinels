import { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface NavigationProps {
  onHover: (isHovering: boolean) => void;
}

const Navigation = ({ onHover }: NavigationProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: 'О нас', href: '#about' },
    { label: 'Состав', href: '#members' },
    { label: 'Новости', href: '#news' },
    { label: 'Достижения', href: '#achievements' },
  ];

  const handleMouseEnter = () => onHover(true);
  const handleMouseLeave = () => onHover(false);

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
              <a
                key={item.href}
                href={item.href}
                className="nav-btn"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {item.label}
              </a>
            ))}
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
              <a
                key={item.href}
                href={item.href}
                className="block py-3 px-4 font-heading uppercase tracking-wider text-foreground hover:text-primary hover:bg-secondary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
