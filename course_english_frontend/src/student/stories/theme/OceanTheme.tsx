import { useEffect, useState } from "react";

type Particle = {
  id: number;
  size: number;
  left: number;
  delay: number;
  duration: number;
};

export function OceanTheme() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate a fixed set of slow floating bubbles
    const list: Particle[] = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      size: Math.random() * 15 + 8, // bubble diameter
      left: Math.random() * 100, // percentage offset
      delay: Math.random() * -15, // pre-start so they appear immediately
      duration: Math.random() * 10 + 12, // extremely slow float
    }));
    setParticles(list);
  }, []);

  return (
    <div className="particle-overlay">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle bubble"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
