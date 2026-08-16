export function calculateResults(options) {
  const totalVotes = options.reduce((sum, opt) => sum + opt.votes, 0);
  return options.map((opt) => ({
    text: opt.text,
    votes: opt.votes,
    percentage: totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100),
  }));
}
