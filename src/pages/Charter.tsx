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
                className="font-display text-xl md:text-2xl tracking-wider hover:text-primary transition-colors"
              >
                СВИРЕПЫЕ <span className="text-primary">КРОЛИКИ</span>
              </Link>
              <Link 
                to="/" 
                className="nav-btn inline-flex items-center gap-2"
                onMouseEnter={() => handleBackHover(true)}
                onMouseLeave={() => handleBackHover(false)}
              >
                <ArrowLeft size={18} />
                На главную
              </Link>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12">
          <div className="comic-panel inline-block bg-card px-8 py-4 mb-12 transform -rotate-1">
            <h2 className="font-display text-4xl md:text-5xl text-foreground tracking-wider">
              УСТАВ <span className="text-primary">КЛАНА</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Основные положения */}
            <div className="comic-panel bg-card/50 border-2 border-primary/50 p-5 hover:border-primary/80 transition-colors">
              <h3 className="font-display text-xl text-primary mb-4 pb-2 border-b border-primary/30">Основные положения</h3>
              <div className="space-y-3 text-sm text-foreground/80 leading-relaxed">
                <p>Клан является организацией, действующей в рамках Арены, опираясь на законы Арены.</p>
                <p>Клан не является исключительно военной организацией. Все члены клана имеют равное значение.</p>
                <p>В клане состоят только необходимые ему люди. Лишних среди нас нет.</p>
              </div>
            </div>

            {/* Цели */}
            <div className="comic-panel bg-card/50 border-2 border-primary/50 p-5 hover:border-primary/80 transition-colors">
              <h3 className="font-display text-xl text-primary mb-4 pb-2 border-b border-primary/30">Цели</h3>
              <div className="space-y-3 text-sm text-foreground/80 leading-relaxed">
                <p>Клан не принимает ни одну из сторон - света или тьмы, добра или зла, хаоса или равновесия, - до тех пор, пока в том нет для него выгоды.</p>
                <p>Клан является нейтральным. Все конфликты, не затрагивающие наши интересы, не имеют для нас значения.</p>
                <p>Если клан вмешивается в конфликт - это не значит, что он поддерживает одну из сторон. Это лишь значит, что он противостоит одной из них.</p>
                <p>Единственное, чем руководствуется клан - благополучие клана и его членов. Мы понимаем и принимаем понятия чести, совести и благородства. Но клан для нас семья, и потому ради клана или его членов мы готовы поступиться этими понятиями. Никто не будет думать о совести и чести, когда над семьей нависла угроза.</p>
              </div>
            </div>

            {/* Взаимоотношения внутри клана */}
            <div className="comic-panel bg-card/50 border-2 border-primary/50 p-5 hover:border-primary/80 transition-colors">
              <h3 className="font-display text-xl text-primary mb-4 pb-2 border-b border-primary/30">Взаимоотношения внутри клана</h3>
              <div className="space-y-3 text-sm text-foreground/80 leading-relaxed">
                <p>Все члены клана - братья. У всех одни цели. Поэтому каждый новый член должен быть принят со всей благожелательностью.</p>
                <p>Бойцы клана обязаны по возможности помогать друг другу.</p>
                <p>Бой для бойцов клана - способ сделать себя, а значит, и клан, сильнее. Поэтому боец имеет право принимать участие в любых боях и вмешиваться в любые бои, в том числе и против соклановца, однако обязан перед этим спросить, согласен ли тот на его вмешательство.</p>
              </div>
            </div>

            {/* Взаимоотношения клана и бойца */}
            <div className="comic-panel bg-card/50 border-2 border-primary/50 p-5 hover:border-primary/80 transition-colors">
              <h3 className="font-display text-xl text-primary mb-4 pb-2 border-b border-primary/30">Взаимоотношения клана и бойца</h3>
              <div className="space-y-3 text-sm text-foreground/80 leading-relaxed">
                <p>Клан - это все для его члена. Но клан в свою очередь заботится о благополучии каждого бойца в отдельности, так как совокупность бойцов и составляет наш клан, нашу семью.</p>
                <p>Боец обязан следовать уставу клана. Разрешено все, что не запрещено уставом. Нарушители устава будут подвергаться наказаниям вплоть до исключения из клана.</p>
                <p>Боец имеет право получать любую помощь от клана - боевую, материальную, моральную.</p>
                <p>Боец обязан делать для клана все, что в его силах.</p>
              </div>
            </div>
          </div>
        </main>

        <footer className="relative py-12 px-4 bg-background/90 border-t border-border">
          <div className="container mx-auto text-center">
            <p className="font-body text-muted-foreground mb-4">
              Клан — это семья. <span className="text-primary">Честь и достоинство каждого члена — честь и достоинство клана.</span>
            </p>
            <p className="font-body text-sm text-muted-foreground/70">
              © Свирепые Кролики | Клан Арены
            </p>
            
            <div className="mt-8 flex justify-center items-center gap-4">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-border" />
              <span className="text-primary font-display text-sm tracking-widest">★</span>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-border" />
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Charter;