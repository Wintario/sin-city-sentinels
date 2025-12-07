import { useEffect, useRef, useState } from 'react';

interface RainEffectProps {
  intensity?: number;
}

const RainEffect = ({ intensity = 1 }: RainEffectProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentIntensity, setCurrentIntensity] = useState(intensity);
  const animationRef = useRef<number>();

  useEffect(() => {
    setCurrentIntensity(intensity);
  }, [intensity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    interface Drop {
      x: number;
      y: number;
      length: number;
      speed: number;
      opacity: number;
    }

    const drops: Drop[] = [];
    const baseDropCount = 150;

    const createDrops = () => {
      const dropCount = Math.floor(baseDropCount * currentIntensity);
      drops.length = 0;
      
      for (let i = 0; i < dropCount; i++) {
        drops.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          length: Math.random() * 20 + 10,
          speed: Math.random() * 15 + 10,
          opacity: Math.random() * 0.3 + 0.1,
        });
      }
    };

    createDrops();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drops.forEach((drop) => {
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + 1, drop.y + drop.length);
        ctx.strokeStyle = `rgba(200, 200, 220, ${drop.opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        drop.y += drop.speed * currentIntensity;
        drop.x += 0.5;

        if (drop.y > canvas.height) {
          drop.y = -drop.length;
          drop.x = Math.random() * canvas.width;
        }
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentIntensity]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default RainEffect;
