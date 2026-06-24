import { useEffect, useState } from "react";
import { apiGetAccount, apiGetUserById } from "../../../shared/api/user";
import {
  cacheLoginUserProfile,
  getCachedAvatarUrl,
  getCachedDisplayName,
} from "../../../shared/auth/userProfileCache";
import { getUserIdFromAccessToken } from "../../../shared/auth/jwtUtils";
import { getAccessToken } from "../../../shared/auth/token";
import { getStudentAccountInfo, type StudentAccountInfo } from "./getStudentAccountInfo";

export type StudentAccountProfile = StudentAccountInfo & {
  avatarUrl: string | null;
};

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed || null;
}

type AccountUser = {
  name?: string | null;
  avatarUrl?: string | null;
};

function readUserFromAccountResponse(response: {
  data?: { user?: AccountUser };
  user?: AccountUser;
}): AccountUser | null {
  return response?.data?.user ?? response?.user ?? null;
}

export function useStudentAccountProfile(): StudentAccountProfile {
  const jwtInfo = getStudentAccountInfo();
  const [displayName, setDisplayName] = useState(() => jwtInfo.displayName);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => getCachedAvatarUrl());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const accountResponse = await apiGetAccount();
        const accountUser = readUserFromAccountResponse(accountResponse);
        if (accountUser) {
          const fromAccountName = normalizeText(accountUser.name);
          const fromAccountAvatar = normalizeText(accountUser.avatarUrl);

          if (!cancelled) {
            cacheLoginUserProfile({ name: fromAccountName, avatarUrl: fromAccountAvatar });
            if (fromAccountName) {
              setDisplayName(fromAccountName);
            }
            setAvatarUrl(fromAccountAvatar);
          }
          return;
        }

        const token = getAccessToken();
        const userId = token ? getUserIdFromAccessToken(token) : null;
        if (!userId) {
          return;
        }

        const userResponse = await apiGetUserById(userId);
        const detail =
          (userResponse as { data?: AccountUser; result?: AccountUser })?.data ??
          (userResponse as { result?: AccountUser })?.result;
        if (!cancelled && detail) {
          const fromUserName = normalizeText(detail.name);
          const fromUserAvatar = normalizeText(detail.avatarUrl);
          cacheLoginUserProfile({ name: fromUserName, avatarUrl: fromUserAvatar });
          if (fromUserName) {
            setDisplayName(fromUserName);
          }
          setAvatarUrl(fromUserAvatar);
        }
      } catch {
        const cachedName = getCachedDisplayName();
        if (!cancelled && cachedName) {
          setDisplayName(cachedName);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    displayName: displayName || jwtInfo.displayName,
    email: jwtInfo.email,
    avatarUrl,
  };
}
