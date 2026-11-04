/* =========================================================
   ALL USERS (shared loader)

   Reads every user from the admin all-users API once and keeps
   the result for a few minutes. The revenue card and both charts
   use it, so the dashboard only makes one set of requests.
========================================================= */

const ALL_USERS_URL = "https://meemaw.sands.com.ng/api/v1/admin/all-users";

const PAGE_SIZE = 100;

const CACHE_MINUTES = 5;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiUser = any;

let cache: { at: number; users: ApiUser[] } | null = null;

let inflight: Promise<ApiUser[]> | null = null;

const getToken = (): string =>
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken") ||
  localStorage.getItem("token") ||
  localStorage.getItem("access_token") ||
  "";

async function fetchAllPages(): Promise<ApiUser[]> {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication token was not found.");
  }

  const allUsers: ApiUser[] = [];

  let page = 1;

  while (page <= 200) {
    const response = await fetch(`${ALL_USERS_URL}?page=${page}&limit=${PAGE_SIZE}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const json = await response.json();

    if (!response.ok) {
      throw new Error(json?.message || `Request failed with status ${response.status}`);
    }

    const users: unknown =
      json?.data?.users ?? json?.data?.customers ?? json?.users ?? json?.data ?? [];

    if (!Array.isArray(users) || users.length === 0) {
      break;
    }

    allUsers.push(...users);

    const pagination = json?.data?.pagination ?? json?.pagination;
    const total = Number(pagination?.total);
    const limit = Number(pagination?.limit) || PAGE_SIZE;

    if (Number.isFinite(total) && total > 0) {
      if (allUsers.length >= total) {
        break;
      }
    } else if (users.length < limit) {
      break;
    }

    page += 1;
  }

  return allUsers;
}

export async function loadAllUsers(force = false): Promise<ApiUser[]> {
  if (!force && cache && Date.now() - cache.at < CACHE_MINUTES * 60 * 1000) {
    return cache.users;
  }

  if (!inflight) {
    inflight = fetchAllPages()
      .then((users) => {
        cache = { at: Date.now(), users };
        return users;
      })
      .finally(() => {
        inflight = null;
      });
  }

  return inflight;
}