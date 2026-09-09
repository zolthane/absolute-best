// Rules R10/R11 (docs/01-product-spec.md): an item is votable (shown blue)
// only for a logged-in user who hasn't already voted on it; everyone and
// everything else is locked (grey/black). `hasVoted` always false for now -
// batch 7 is what actually casts votes - but the colour logic itself is
// built now so batch 7 only has to supply real data, not new rules.
export function isItemVotable(isLoggedIn: boolean, hasVoted: boolean): boolean {
  return isLoggedIn && !hasVoted;
}
