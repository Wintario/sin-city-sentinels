import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="relative z-20 py-12 px-4 bg-background/90 border-t border-border">
      <div className="container mx-auto text-center">
        {/* Main Copyright */}
        <p className="font-body text-muted-foreground mb-4">
          © 2025 Клан "Свирепые Кролики". <span className="text-primary">Величие вечно.</span>
        </p>

        {/* Founded Date */}
        <p className="font-body text-sm text-muted-foreground/70 mb-6">
          Основан: 26.09.2006
        </p>

        {/* Arena Link */}
        <a 
          href="https://apeha.ru"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block font-body text-sm text-muted-foreground/50 hover:text-primary transition-colors duration-300"
        >
          Вернуться в АРЕНУ →
        </a>

        {/* Decorative Elements */}
        <div className="mt-8 flex justify-center items-center gap-4">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-border" />
          <span className="text-primary font-display text-sm tracking-widest">★</span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-border" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;