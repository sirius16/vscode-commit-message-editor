export async function findAsync<T>(arr: T[], predicate: (item: T) => boolean | Thenable<boolean>): Promise<T | undefined> {
  for (const item of arr) {
    if (await predicate(item)) {
      return item;
    }
  }
  return undefined;
}
