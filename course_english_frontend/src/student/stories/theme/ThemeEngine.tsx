import { OceanTheme } from "./OceanTheme";
import { ForestTheme } from "./ForestTheme";
import { NightTheme } from "./NightTheme";
import { SnowTheme } from "./SnowTheme";
import { AutumnTheme } from "./AutumnTheme";
import { FantasyTheme } from "./FantasyTheme";
import { SpaceTheme } from "./SpaceTheme";
import type { ReactNode } from "react";

type ThemeEngineProps = {
  theme: string;
  children: ReactNode;
};

export function ThemeEngine({ theme, children }: ThemeEngineProps) {
  const normalizedTheme = theme.toLowerCase();

  const renderParticles = () => {
    switch (normalizedTheme) {
      case "ocean":
        return <OceanTheme />;
      case "forest":
        return <ForestTheme />;
      case "night":
        return <NightTheme />;
      case "snow":
        return <SnowTheme />;
      case "autumn":
        return <AutumnTheme />;
      case "fantasy":
        return <FantasyTheme />;
      case "space":
        return <SpaceTheme />;
      default:
        return null;
    }
  };

  return (
    <div className={`theme-container theme-container--${normalizedTheme}`}>
      <div className="theme-overlay-blend" />
      {renderParticles()}
      <div style={{ position: "relative", zIndex: 2 }}>{children}</div>
    </div>
  );
}
