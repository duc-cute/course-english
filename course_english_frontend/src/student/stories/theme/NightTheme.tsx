import { useEffect, useState } from "react";

type TwinkleStar = {
  id: number;
  left: number;
  top: number;
  delay: number;
  duration: number;
};

type ShootingStar = {
  id: number;
  delay: number;
};

export function NightTheme() {
  const [stars, setStars] = useState<TwinkleStar[]>([]);
  const [shooters, setShooters] = useState<ShootingStar[]>([]);

  useEffect(() => {
    // Generate twinkling stars background
    const starList: TwinkleStar[] = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 80, // mostly top part
      delay: Math.random() * -5,
      duration: Math.random() * 3 + 3,
    }));
    setStars(starList);

    // Generate occasional shooting stars
    const shooterList: ShootingStar[] = Array.from({ length: 2 }).map((_, i) => ({
      id: i,
      delay: Math.random() * 10 + i * 15,
    }));
    setShooters(shooterList);
  }, []);

  return (
    <div className="particle-overlay">
      {stars.map((s) => (
        <div
          key={`star-${s.id}`}
          className="particle star-twinkle"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}
      {shooters.map((sh) => (
        <div
          key={`shooter-${sh.id}`}
          className="particle shooting-star"
          style={{
            animationDelay: `${sh.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
