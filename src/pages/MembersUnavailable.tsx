import { Link } from 'react-router-dom';

const MembersUnavailable = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-4 py-12">
        <div className="w-full overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
          <img
            src="/news-images/404.png"
            alt="404"
            className="h-auto max-h-[70vh] w-full object-cover"
          />

          <div className="border-t border-border bg-background/95 px-6 py-8 text-center">
            <p className="font-display text-5xl tracking-[0.2em] text-primary md:text-6xl">404</p>
            <h1 className="mt-3 font-display text-2xl tracking-wide md:text-3xl">
              Состав временно скрыт
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
              Страница состава сейчас недоступна. Вернитесь позже или перейдите на главную.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center rounded-md border border-primary/40 px-5 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
            >
              На главную
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembersUnavailable;
