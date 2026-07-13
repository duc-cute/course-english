import { useEffect, useState } from "react";

type TwinkleStar = {
  id: number;
  left: number;
  top: number;
  delay: number;
  duration: number;
};

type SpaceMeteor = {
  id: number;
  delay: number;
};

export function SpaceTheme() {
  const [stars, setStars] = useState<TwinkleStar[]>([]);
  const [meteors, setMeteors] = useState<SpaceMeteor[]>([]);

  useEffect(() => {
    // Twinkling stardust
    const starList: TwinkleStar[] = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 90,
      delay: Math.random() * -6,
      duration: Math.random() * 4 + 4,
    }));
    setStars(starList);

    // Meteors
    const meteorList: SpaceMeteor[] = Array.from({ length: 3 }).map((_, i) => ({
      id: i,
      delay: Math.random() * 8 + i * 10,
    }));
    setMeteors(meteorList);
  }, []);

  return (
    <div className="particle-overlay">
      {stars.map((s) => (
        <div
          key={`dust-${s.id}`}
          className="particle star-twinkle"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}
      {meteors.map((m) => (
        <div
          key={`meteor-${m.id}`}
          className="particle space-meteor"
          style={{
            animationDelay: `${m.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
