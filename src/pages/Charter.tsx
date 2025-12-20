import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import RainEffect from '@/components/RainEffect';
import FilmGrain from '@/components/FilmGrain';
import heroRabbit from '@/assets/hero-rabbit.png';

const Charter = () => {
  const [rainIntensity, setRainIntensity] = useState(1);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleBackHover = useCallback((isHovering: boolean) => {
    setRainIntensity(isHovering ? 2 : 1);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ 
          backgroundImage: `url(${heroRabbit})`,
          filter: 'contrast(1.2) brightness(0.5)',
        }}
      />
      
      <div className="fixed inset-0 bg-background/70 z-0" />

      <RainEffect intensity={rainIntensity} />
      
      <FilmGrain />

      <div className="relative z-20 min-h-screen">
        <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b border-border z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link 
                to="/" 
                className="nav-btn inline-flex items-center gap-2"
                onMouseEnter={() => handleBackHover(true)}
                onMouseLeave={() => handleBackHover(false)}
              >
                <ArrowLeft size={18} />
                Ha glavnuyu
              </Link>
              <h1 className="font-display text-xl md:text-2xl tracking-wider">
                SVIREPYE <span className="text-primary">KROLIKI</span>
              </h1>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12">
          <div className="comic-panel inline-block bg-card px-8 py-4 mb-12 transform -rotate-1">
            <h2 className="font-display text-4xl md:text-5xl text-foreground tracking-wider">
              USTAV <span className="text-primary">KLANA</span>
            </h2>
          </div>

          <div className="space-y-8">
            {/* Basic Principles */}
            <div className="comic-panel bg-card/50 border-2 border-primary/50 p-6">
              <h3 className="font-display text-2xl text-primary mb-6 pb-3 border-b border-primary/30">
                Osnovnye polozheniya
              </h3>
              <div className="space-y-4">
                <p className="font-body text-sm md:text-base text-foreground/80 leading-relaxed">Klan yavlyaetsya organizaciey dejstvuyushchey v ramkakh Areny, opiraysya na zakony Areny.</p>
                <p className="font-body text-sm md:text-base text-foreground/80 leading-relaxed">Klan ne yavlyaetsya isklyuchitelno voennoj organizaciey. Vse chleny klana imeyut ravnoe znachenie.</p>
                <p className="font-body text-sm md:text-base text-foreground/80 leading-relaxed">V klane sostoyat tolko neobhodimye emu lyudi. Lishnikh sredi nas net.</p>
              </div>
            </div>

            {/* Goals */}
            <div className="comic-panel bg-card/50 border-2 border-primary/50 p-6">
              <h3 className="font-display text-2xl text-primary mb-6 pb-3 border-b border-primary/30">
                Celi
              </h3>
              <div className="space-y-4">
                <p className="font-body text-sm md:text-base text-foreground/80 leading-relaxed">Klan ne prinimaet ni odnu iz storon - sveta ili tmi, dobra ili zla, khaosa ili ravnovesiya, - do tekh por, poka v tom net dlya nego vygody.</p>
                <p className="font-body text-sm md:text-base text-foreground/80 leading-relaxed">Klan yavlyaetsya nejtralnym. Vse konflikty, ne zatragivayushchie nashi interesy, ne imeyut dlya nas znacheniya.</p>
                <p className="font-body text-sm md:text-base text-foreground/80 leading-relaxed">Esli klan vmeshivaetsya v konflikt - eto ne znachit, chto on podderzhivaet odnu iz storon. Eto lissh znachit, chto on protivostoit odnoj iz nikh.</p>
                <p className="font-body text-sm md:text-base text-foreground/80 leading-relaxed">Edinstvenno, chem rukovodstvuetsya klan - blagopoluchie klana i ego chlenov. My ponimaniem i prinimaem ponyatiya chesti, sovesti i blagorodstva.</p>
              </div>
            </div>

            {/* Internal Relations */}
            <div className="comic-panel bg-card/50 border-2 border-primary/50 p-6">
              <h3 className="font-display text-2xl text-primary mb-6 pb-3 border-b border-primary/30">
                Vzaimoootnosheniya vnutri klana
              </h3>
              <div className="space-y-4">
                <p className="font-body text-sm md:text-base text-foreground/80 leading-relaxed">Vse chleny klana - bratya. U vsekh odni celi. Poetomu kazhdy novyj chlen dolzhen byt prinyat so vsej blagozhelatelnostyu.</p>
                <p className="font-body text-sm md:text-base text-foreground/80 leading-relaxed">Bojcy klana obyazany po vozmozhnosti pomogat drug drugu.</p>
                <p className="font-body text-sm md:text-base text-foreground/80 leading-relaxed">Boj dlya bojcov klana - sposob sdelat sebya, a znachit, i klan, silnee.</p>
              </div>
            </div>

            {/* Clan-Fighter Relations */}
            <div className="comic-panel bg-card/50 border-2 border-primary/50 p-6">
              <h3 className="font-display text-2xl text-primary mb-6 pb-3 border-b border-primary/30">
                Vzaimoootnosheniya klana i bojca
              </h3>
              <div className="space-y-4">
                <p className="font-body text-sm md:text-base text-foreground/80 leading-relaxed">Klan - eto vse dlya ego chlena. No klan v svoyu ochered zabotitsya o blagopoluchii kazhdogo bojca v otdelnosti.</p>
                <p className="font-body text-sm md:text-base text-foreground/80 leading-relaxed">Bojc obyzany sledovat ustafu klana. Razresheno vse, chto ne zapreshcheno ustavom.</p>
                <p className="font-body text-sm md:text-base text-foreground/80 leading-relaxed">Bojc imeet pravo poluchat lyubuyu pomoshch ot klana - boevuyu, materialnuyu, moralnuyu.</p>
                <p className="font-body text-sm md:text-base text-foreground/80 leading-relaxed">Bojc obyzany delat dlya klana vse, chto v ego silakh.</p>
              </div>
            </div>
          </div>
        </main>

        <footer className="relative py-12 px-4 bg-background/90 border-t border-border">
          <div className="container mx-auto text-center">
            <p className="font-body text-muted-foreground mb-4">
              Klan -- eto semya. <span className="text-primary">Chest i dostoinstvo kazhdogo chlena -- chest i dostoinstvo klana.</span>
            </p>
            <p className="font-body text-sm text-muted-foreground/70">
              (C) Svirepye Kroliki | Klan Areny
            </p>
            
            <div className="mt-8 flex justify-center items-center gap-4">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-border" />
              <span className="text-primary font-display text-sm tracking-widest">*</span>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-border" />
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Charter;