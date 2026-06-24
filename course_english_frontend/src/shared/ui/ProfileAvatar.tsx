import { useEffect, useState, type ReactNode } from "react";

type ProfileAvatarProps = {
  avatarUrl: string | null;
  initials: ReactNode;
  className?: string;
  imgClassName?: string;
  hasImageClassName?: string;
};

/** Avatar circle: Google/external photos need referrerPolicy=no-referrer. */
export function ProfileAvatar({
  avatarUrl,
  initials,
  className = "",
  imgClassName,
  hasImageClassName = "",
}: ProfileAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [avatarUrl]);

  const showImage = Boolean(avatarUrl) && !imageFailed;
  const rootClass = [className, showImage ? hasImageClassName : ""].filter(Boolean).join(" ");

  return (
    <span className={rootClass || undefined} aria-hidden>
      {showImage ? (
        <img
          src={avatarUrl!}
          alt=""
          className={imgClassName}
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
        />
      ) : (
        initials
      )}
    </span>
  );
}

type AvatarImageProps = {
  src: string;
  alt?: string;
  className?: string;
  onError?: () => void;
};

/** Standalone avatar img with Google-safe referrer policy + error callback. */
export function AvatarImage({ src, alt = "", className, onError }: AvatarImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={onError}
    />
  );
}
