export const normalizeRequiredString = (value: string): string =>
  value.trim().replace(/\s+/g, " ");

export const normalizeOptionalString = (
  value: string | null | undefined,
): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = value.trim();
  return normalized === "" ? null : normalized;
};

export const normalizeTreeName = (name: string) => {
  const displayName = normalizeRequiredString(name);
  return {
    name: displayName,
    normalizedName: displayName.toLowerCase(),
  };
};
