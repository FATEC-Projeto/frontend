/**
 * Concatena nomes de classes de forma limpa, removendo falsy values.
 * Ex: cx("a", false, "b", null, "c") => "a b c"
 */
export function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}