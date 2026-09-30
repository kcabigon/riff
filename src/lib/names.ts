// How people are named in what Riff sends. First names by default — it's a
// product for friends — and full names only where someone may be new to the
// reader (a join announcement) or as a byline. Each falls back through the
// other fields, since onboarding can leave any of them empty.

type Named =
  | {
      name?: string | null;
      firstName?: string | null;
      username?: string | null;
    }
  | null
  | undefined;

export function firstNameOf(user: Named): string {
  return (
    user?.firstName?.trim() ||
    user?.name?.trim().split(/\s+/)[0] ||
    user?.username?.trim() ||
    "Someone"
  );
}

export function fullNameOf(user: Named): string {
  return (
    user?.name?.trim() ||
    user?.firstName?.trim() ||
    user?.username?.trim() ||
    "Someone"
  );
}
