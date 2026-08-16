import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { connectTestDB, closeTestDB, clearTestDB } from './helpers/db.js';
import { registerUser } from '../src/services/authService.js';
import { createPoll, listPolls, getPoll, castVote, deletePoll } from '../src/services/pollService.js';
import { Poll } from '../src/models/Poll.js';

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_secret';
  await connectTestDB();
});
afterAll(async () => {
  await closeTestDB();
});
beforeEach(async () => {
  await clearTestDB();
});

async function makeUser(username) {
  return registerUser({ username, email: `${username}@test.com`, password: 'secret123' });
}

describe('createPoll', () => {
  it('creates a poll with 2-6 options', async () => {
    const owner = await makeUser('alice');
    const poll = await createPoll({ question: 'Best color?', options: ['Red', 'Blue'] }, owner.id);
    expect(poll.question).toBe('Best color?');
    expect(poll.options).toHaveLength(2);
  });

  it('rejects fewer than 2 options', async () => {
    const owner = await makeUser('alice');
    await expect(createPoll({ question: 'Best color?', options: ['Red'] }, owner.id)).rejects.toThrow(
      'a poll must have between 2 and 6 options'
    );
  });

  it('rejects more than 6 options', async () => {
    const owner = await makeUser('alice');
    const options = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    await expect(createPoll({ question: 'Too many?', options }, owner.id)).rejects.toThrow(
      'a poll must have between 2 and 6 options'
    );
  });

  it('accepts an optional future expiresAt', async () => {
    const owner = await makeUser('alice');
    const future = new Date(Date.now() + 60_000).toISOString();
    const poll = await createPoll({ question: 'Best color?', options: ['Red', 'Blue'], expiresAt: future }, owner.id);
    expect(new Date(poll.expiresAt).toISOString()).toBe(future);
  });

  it('rejects a past expiresAt', async () => {
    const owner = await makeUser('alice');
    const past = new Date(Date.now() - 60_000).toISOString();
    await expect(
      createPoll({ question: 'Best color?', options: ['Red', 'Blue'], expiresAt: past }, owner.id)
    ).rejects.toThrow('expiresAt must be in the future');
  });
});

describe('listPolls and getPoll', () => {
  it('lists polls with vote totals', async () => {
    const owner = await makeUser('alice');
    await createPoll({ question: 'Best color?', options: ['Red', 'Blue'] }, owner.id);
    const polls = await listPolls();
    expect(polls).toHaveLength(1);
    expect(polls[0].totalVotes).toBe(0);
  });

  it("returns per-option vote counts and the requesting user's vote", async () => {
    const owner = await makeUser('alice');
    const voter = await makeUser('bob');
    const created = await createPoll({ question: 'Best color?', options: ['Red', 'Blue'] }, owner.id);
    await castVote(created.id, voter.id, 0);
    const poll = await getPoll(created.id, voter.id);
    expect(poll.options[0].votes).toBe(1);
    expect(poll.options[1].votes).toBe(0);
    expect(poll.votedOptionIndex).toBe(0);
  });
});

describe('castVote', () => {
  it('rejects a second vote from the same user', async () => {
    const owner = await makeUser('alice');
    const voter = await makeUser('bob');
    const poll = await createPoll({ question: 'Best color?', options: ['Red', 'Blue'] }, owner.id);
    await castVote(poll.id, voter.id, 0);
    await expect(castVote(poll.id, voter.id, 1)).rejects.toThrow('you have already voted on this poll');
  });

  it('rejects an out-of-range option index', async () => {
    const owner = await makeUser('alice');
    const voter = await makeUser('bob');
    const poll = await createPoll({ question: 'Best color?', options: ['Red', 'Blue'] }, owner.id);
    await expect(castVote(poll.id, voter.id, 5)).rejects.toThrow('invalid option index');
  });

  it('rejects a vote on an ended poll', async () => {
    const owner = await makeUser('alice');
    const voter = await makeUser('bob');
    const poll = await createPoll({ question: 'Best color?', options: ['Red', 'Blue'] }, owner.id);
    await Poll.findByIdAndUpdate(poll.id, { expiresAt: new Date(Date.now() - 1000) });
    await expect(castVote(poll.id, voter.id, 0)).rejects.toThrow('this poll has ended');
  });
});

describe('getPoll', () => {
  it('reports isEnded false for a poll with no expiry', async () => {
    const owner = await makeUser('alice');
    const poll = await createPoll({ question: 'Best color?', options: ['Red', 'Blue'] }, owner.id);
    const result = await getPoll(poll.id, owner.id);
    expect(result.isEnded).toBe(false);
  });

  it('reports isEnded true once expiresAt has passed', async () => {
    const owner = await makeUser('alice');
    const poll = await createPoll({ question: 'Best color?', options: ['Red', 'Blue'] }, owner.id);
    await Poll.findByIdAndUpdate(poll.id, { expiresAt: new Date(Date.now() - 1000) });
    const result = await getPoll(poll.id, owner.id);
    expect(result.isEnded).toBe(true);
  });
});

describe('deletePoll', () => {
  it('lets the owner delete their poll', async () => {
    const owner = await makeUser('alice');
    const poll = await createPoll({ question: 'Best color?', options: ['Red', 'Blue'] }, owner.id);
    await deletePoll(poll.id, owner.id);
    const polls = await listPolls();
    expect(polls).toHaveLength(0);
  });

  it('soft-deletes: the record still exists in the database', async () => {
    const owner = await makeUser('alice');
    const poll = await createPoll({ question: 'Best color?', options: ['Red', 'Blue'] }, owner.id);
    await deletePoll(poll.id, owner.id);
    const stillThere = await Poll.findById(poll.id);
    expect(stillThere).not.toBeNull();
    expect(stillThere.deletedAt).not.toBeNull();
  });

  it('rejects deletion by a non-owner', async () => {
    const owner = await makeUser('alice');
    const someoneElse = await makeUser('bob');
    const poll = await createPoll({ question: 'Best color?', options: ['Red', 'Blue'] }, owner.id);
    await expect(deletePoll(poll.id, someoneElse.id)).rejects.toThrow('only the poll owner can delete this poll');
  });
});
