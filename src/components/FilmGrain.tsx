import { useEffect, useState } from 'react';

const FilmGrain = () => {
  const [opacity, setOpacity] = useState(0.05);

  useEffect(() => {
    const flickerInterval = setInterval(() => {
      setOpacity(0.03 + Math.random() * 0.04);
    }, 100);

    return () => clearInterval(flickerInterval);
  }, []);

  return (
    <div
      className="film-grain"
      style={{ opacity }}
    />
  );
};

export default FilmGrain;
