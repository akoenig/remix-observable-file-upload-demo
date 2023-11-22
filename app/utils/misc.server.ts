// Borrowed from Kent C. Dodds
// https://github.com/kentcdodds/epic-stack-example-confetti/blob/768051d3fe07a9e981b5eb04abf928175adb93eb/app/utils/misc.tsx

export function combineHeaders(
  ...headers: Array<ResponseInit["headers"] | null | undefined>
) {
  const combined = new Headers();
  for (const header of headers) {
    if (!header) continue;
    for (const [key, value] of new Headers(header).entries()) {
      combined.append(key, value);
    }
  }
  return combined;
}
