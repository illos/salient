/** Component-local receipts for ambiguous responses. A new intent has a different payload key. */
export class CommandIdentities {
  private pending: { key: string; id: string } | undefined;
  constructor(private makeId: () => string = () => crypto.randomUUID()) {}
  forPayload(key: string) {
    // Once another intent is submitted, returning to old values is a new command.
    // Otherwise a show→hide→show cycle could replay a receipt for the first show.
    if (this.pending?.key !== key) this.pending = { key, id: this.makeId() };
    return this.pending.id;
  }
  acknowledged(key: string) {
    if (this.pending?.key === key) this.pending = undefined;
  }
}
