// Borrowed from [The Epic Stack](https://github.com/epicweb-dev/epic-stack) by [Kent C. Dodds](https://kentcdodds.com/).
// https://github.com/kentcdodds/epic-stack-example-confetti/blob/768051d3fe07a9e981b5eb04abf928175adb93eb/app/utils/confetti.server.ts

import { redirect } from "@remix-run/node";
import * as cookie from "cookie";
import { combineHeaders } from "./misc.server.ts";

const cookieName = "en_confetti";

export function getConfetti(request: Request) {
  const cookieHeader = request.headers.get("cookie");
  const confettiId = cookieHeader
    ? cookie.parse(cookieHeader)[cookieName]
    : null;
  return {
    confettiId,
    headers: confettiId ? createConfettiHeaders(null) : null,
  };
}

/**
 * This defaults the value to something reasonable if you want to show confetti.
 * If you want to clear the cookie, pass null and it will make a set-cookie
 * header that will delete the cookie
 *
 * @param value the value for the cookie in the set-cookie header
 * @returns Headers with a set-cookie header set to the value
 */
export function createConfettiHeaders(
  value: string | null = String(Date.now()),
) {
  return new Headers({
    "set-cookie": cookie.serialize(cookieName, value ? value : "", {
      path: "/",
      maxAge: value ? 60 : -1,
    }),
  });
}

export async function redirectWithConfetti(url: string, init?: ResponseInit) {
  return redirect(url, {
    ...init,
    headers: combineHeaders(init?.headers, await createConfettiHeaders()),
  });
}
