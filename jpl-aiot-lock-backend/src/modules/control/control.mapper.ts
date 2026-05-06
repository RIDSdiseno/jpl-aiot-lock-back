export function ok<T>(data: T) {
  return { ok: true, data };
}

export function fail(code: string, message: string) {
  return { ok: false, error: { code, message } };
}
