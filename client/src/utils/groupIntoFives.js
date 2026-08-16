export function groupIntoFives(count) {
  return { fullGroups: Math.floor(count / 5), remainder: count % 5 };
}
