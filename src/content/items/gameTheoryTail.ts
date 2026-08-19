/**
 * Game theory, part four: a fourth question family for each of the twelve
 * game-theory skills.
 *
 * Why this file exists: the Path independence bar needs THREE distinct
 * template families per skill, and every skill covered by `gameTheoryDepth.ts`
 * and `gameTheoryLab.ts` sat at exactly three — the bare minimum, where one
 * blocked template makes a skill unprovable. This file adds one genuinely new
 * question FORM per skill (not a reskin: each asks for something the existing
 * three do not), so the ladder has slack.
 *
 * The forms added, next to what each skill already had:
 *
 *   i-iterated   run the elimination chain ALL the way to a single cell
 *   i-backward   fold both move orders and price the right to move first
 *   i-selection  recognise where "the win itself is bad news" applies at all
 *   i-common     repair the missing link in an asymmetric knowledge chain
 *   i-unpredict  exploit a readable opponent (and hear the honest caveats)
 *   i-commons    find the group size where sensible tips into ruinous
 *   i-levelk     predict how the crowd moves when the game is REPLAYED
 *   i-mixed      evaluate a leaked mix from the opponent's side
 *   i-median     compute what a third entrant takes from a crowded middle
 *   i-credible   fold an empty threat through to the actual outcome
 *   i-fairness   solve for the acceptance rate a greedy offer would need
 *   i-trust      solve for the return that shares the created value equally
 *
 * ANSWERS ARE COMPUTED, as in parts one to three. The elimination item runs a
 * generic dominance search over its own grid rather than trusting its
 * construction; the order-of-moves item folds both trees; every numeric key is
 * derived from the same drawn values the prompt prints. No key is hand-typed.
 *
 * BEHAVIOURAL HONESTY, matching `gameTheoryLab.ts` and never exceeding it:
 * the credible-threat item names the ultimatum finding (people do pay to
 * punish) as the reason the fold is only as good as its payoffs; the trust
 * item repeats the lab file's claim — first movers sent about half, returners
 * sent back a substantial part — and nothing stronger; the level-k replay item
 * states its anchoring assumption IN the prompt rather than asserting a speed
 * of convergence the record does not give us.
 *
 * BOUNDARY, AS CONTENT LAW. Everything here models lab games, sports covers
 * and open agreements. The exploit item stays inside a game frame and says so;
 * the trust and fairness items reward the move you could say out loud to the
 * other player. Nothing teaches reading or steering real people off the board.
 */
import type { ItemTemplate } from '../../domain/types'
import { pick, rint, shuffle, type Rng } from '../../engine/rng'
import { cycle, mcq, mcqNoted, multi, numeric, round, tpl } from '../lib'

const PROV_TAIL = 'original construction, 2026-08-18 tail pass'

/** Capitalise an interpolated fragment that opens a sentence. */
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)

// ============================================================ i-iterated
// Run the crossing-out to the very end.

/** A 3x3 payoff grid: grid[r][c] = [yourPayoff, theirPayoff]. */
type Grid3 = [number, number][][]

function gridTable(names: readonly string[], g: Grid3): string {
  const head = `| | **${names[0]}** | **${names[1]}** | **${names[2]}** |\n| --- | --- | --- | --- |\n`
  const body = g
    .map((row, r) => `| **${names[r]}** | ${row.map((cell) => `${cell[0]} , ${cell[1]}`).join(' | ')} |`)
    .join('\n')
  return `${head}${body}\n\n**Each cell reads: your points, their points.**`
}

/** Rows strictly dominated by some other live row, for the ROW player. */
function dominatedRowsIn(g: Grid3, liveR: number[], liveC: number[]): number[] {
  return liveR.filter((r) => liveR.some((o) => o !== r && liveC.every((c) => g[o][c][0] > g[r][c][0])))
}

/** Columns strictly dominated by some other live column, for the COLUMN player. */
function dominatedColsIn(g: Grid3, liveR: number[], liveC: number[]): number[] {
  return liveC.filter((c) => liveC.some((o) => o !== c && liveR.every((r) => g[r][o][1] > g[r][c][1])))
}

/**
 * Iterated elimination by actual search. The key is read off THIS result, not
 * off the construction that built the grid — the same discipline that caught a
 * one-seed-in-four ambiguity in the two-step version of this game.
 */
function runElimination(g: Grid3): { liveR: number[]; liveC: number[]; deadRows: number[]; deadCols: number[] } {
  let liveR = [0, 1, 2]
  let liveC = [0, 1, 2]
  const deadRows: number[] = []
  const deadCols: number[] = []
  for (let guard = 0; guard < 6; guard++) {
    const dr = dominatedRowsIn(g, liveR, liveC)
    if (dr.length) {
      deadRows.push(...dr)
      liveR = liveR.filter((r) => !dr.includes(r))
      continue
    }
    const dc = dominatedColsIn(g, liveR, liveC)
    if (dc.length) {
      deadCols.push(...dc)
      liveC = liveC.filter((c) => !dc.includes(c))
      continue
    }
    break
  }
  return { liveR, liveC, deadRows, deadCols }
}

/**
 * Build a game that provably unravels to one cell in four alternating cuts:
 * your rC dies to rA, then their cC (whose best cell lived in rC), then your
 * rB (kept alive only by cC), then their cB — leaving (rA, cA). Every step is
 * unique when it happens, so the chain has one order.
 */
function chainGame(rng: Rng): Grid3 {
  const [rA, rB, rC] = shuffle(rng, [0, 1, 2])
  const [cA, cB, cC] = shuffle(rng, [0, 1, 2])
  const g: Grid3 = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => [0, 0] as [number, number]))
  // Your payoffs: rA beats rC everywhere; rB loses to rA except in cC.
  for (const c of [cA, cB, cC]) {
    g[rA][c][0] = rint(rng, 4, 7)
    g[rC][c][0] = g[rA][c][0] - rint(rng, 1, 3)
  }
  g[rB][cA][0] = g[rA][cA][0] - rint(rng, 1, 3)
  g[rB][cB][0] = g[rA][cB][0] - rint(rng, 1, 3)
  g[rB][cC][0] = g[rA][cC][0] + rint(rng, 1, 2)
  // Their payoffs: cC is their best against rC and worst elsewhere, so it dies
  // only after rC does; cB beats cA in rB only, so it dies only after rB does.
  g[rC][cC][1] = 9
  g[rC][cA][1] = rint(rng, 1, 3)
  g[rC][cB][1] = rint(rng, 1, 3)
  g[rA][cA][1] = rint(rng, 5, 8)
  g[rA][cB][1] = g[rA][cA][1] - rint(rng, 1, 3)
  g[rA][cC][1] = 1
  g[rB][cB][1] = rint(rng, 5, 8)
  g[rB][cA][1] = g[rB][cB][1] - rint(rng, 1, 3)
  g[rB][cC][1] = 1
  return g
}

const CHAIN_STORIES = [
  { story: 'Two stalls at the same fete are choosing what to sell', options: ['Drinks', 'Snacks', 'Crafts'] },
  { story: 'Two delivery riders are choosing which zone to cover', options: ['North', 'Centre', 'South'] },
  { story: 'Two quiz teams are choosing a specialist subject', options: ['History', 'Science', 'Sport'] },
  { story: 'Two societies are choosing a night for their weekly slot', options: ['Tuesday', 'Wednesday', 'Thursday'] },
] as const

const iteratedSolve = tpl(
  {
    id: 'gtt-iterated-solve',
    name: 'Cross out to the end',
    skillIds: ['i-iterated'],
    bucket: 'investigator',
    difficulty: 4,
    variants: 24,
    minutes: 3.5,
    provenance: PROV_TAIL,
  },
  (rng, seed) => {
    const s = cycle(seed, CHAIN_STORIES)
    const o = s.options
    const g = chainGame(rng)
    const { liveR, liveC, deadRows, deadCols } = runElimination(g)
    const finalR = liveR[0]
    const finalC = liveC[0]
    const cellTxt = (r: number, c: number) => `You: **${o[r]}** — them: **${o[c]}**`
    return {
      title: 'Four cuts, one cell',
      prompt:
        `${s.story}. You pick a row, they pick a column, both at the same time — and both of you can do the same crossing out.\n\n` +
        `${gridTable(o, g)}\n\n` +
        `Neither of you will ever play an option that loses to another of your own in every case, and each of you knows the other will not either. Keep crossing out until nothing more goes. Where does the game settle?`,
      answer: mcq(rng, cellTxt(finalR, finalC), [
        cellTxt(finalR, deadCols[1]),
        cellTxt(deadRows[1], deadCols[0]),
        cellTxt(deadRows[0], deadCols[0]),
        'Nowhere — the crossing out never settles, because each cut brings an earlier option back',
      ]),
      hints: [
        'Begin like the two-step version: find the row of yours that loses to another row in all three columns, and cross it out.',
        'Alternate sides after every cut — each option you remove can make one of theirs removable, and each of theirs can free up another cut for you.',
        `The chain runs: your **${o[deadRows[0]]}** goes first, then their **${o[deadCols[0]]}**, then your **${o[deadRows[1]]}**, then their **${o[deadCols[1]]}**.`,
      ],
      explanation:
        `Four cuts, alternating sides.\n\n` +
        `1. Your **${o[deadRows[0]]}** loses to **${o[finalR]}** in every column, so it goes.\n` +
        `2. With it gone, their **${o[deadCols[0]]}** pays them less than **${o[finalC]}** in every remaining row — its one strong cell lived in your dead row.\n` +
        `3. That leaves a two-by-two, where your **${o[deadRows[1]]}** now loses to **${o[finalR]}** everywhere: the column that made it worth keeping has gone.\n` +
        `4. Their **${o[deadCols[1]]}** falls last, and one cell remains: you play **${o[finalR]}** for ${g[finalR][finalC][0]}, they play **${o[finalC]}** for ${g[finalR][finalC][1]}.\n\n` +
        `A game that unravels to a single cell is rare and worth recognising: neither player needs to guess anything beyond "they will not play a dead option". Most games stop unravelling earlier — and the method has still earned its keep, because the game it leaves behind is smaller than the one you started with.`,
      commonErrors: {
        misread:
          'Crossing out a row because most of its numbers look low is not elimination — it has to lose to one other row in every single column.',
      },
    }
  },
)

// ============================================================ i-backward
// Price the right to move first.

const ORDER_STORIES = [
  {
    you: ['Price high', 'Price low'],
    them: ['Price high', 'Price low'],
    setting: 'Your stall and the stall opposite each put up one price board, and either of you could put yours up first',
  },
  {
    you: ['Enter the doubles', 'Enter the singles'],
    them: ['Enter the doubles', 'Enter the singles'],
    setting: 'You and a rival each enter one draw of a tournament, and entries are public the moment they go in',
  },
  {
    you: ['Take the hall', 'Take the yard'],
    them: ['Take the hall', 'Take the yard'],
    setting: 'Your society and another each book one venue for the same evening, and bookings show up instantly',
  },
  {
    you: ['Rehearse Tuesday', 'Rehearse Friday'],
    them: ['Rehearse Tuesday', 'Rehearse Friday'],
    setting: 'Your band and another band each fix one weekly slot in the shared room, and the sheet is on the wall',
  },
] as const

const backwardOrder = tpl(
  {
    id: 'gtt-backward-order',
    name: 'Is moving first worth anything?',
    skillIds: ['i-backward'],
    bucket: 'investigator',
    difficulty: 4,
    variants: 24,
    minutes: 3.5,
    provenance: PROV_TAIL,
  },
  (rng, seed) => {
    const s = cycle(seed, ORDER_STORIES)
    // Four distinct payoffs per player, so every fold comparison is strict.
    const ys = shuffle(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4)
    const ts = shuffle(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4)
    const at = (y: number, t: number) => y * 2 + t
    // FOLD "you first": their reply to each of your moves, then your best root.
    const reply = [0, 1].map((y) => (ts[at(y, 0)] > ts[at(y, 1)] ? 0 : 1))
    const firstVals = [0, 1].map((y) => ys[at(y, reply[y])])
    const yStar = firstVals[0] > firstVals[1] ? 0 : 1
    const vFirst = firstVals[yStar]
    // FOLD "they first": your reply to each of their moves, then their best root.
    const yourReply = [0, 1].map((t) => (ys[at(0, t)] > ys[at(1, t)] ? 0 : 1))
    const theirVals = [0, 1].map((t) => ts[at(yourReply[t], t)])
    const tStar = theirVals[0] > theirVals[1] ? 0 : 1
    const vSecond = ys[at(yourReply[tStar], tStar)]

    const table =
      `| | **They: ${s.them[0]}** | **They: ${s.them[1]}** |\n| --- | --- | --- |\n` +
      `| **You: ${s.you[0]}** | ${ys[0]} , ${ts[0]} | ${ys[1]} , ${ts[1]} |\n` +
      `| **You: ${s.you[1]}** | ${ys[2]} , ${ts[2]} | ${ys[3]} , ${ts[3]} |\n\n**Each cell reads: your points, their points.**`

    const firstAhead = `Take the first move — folding both orders, the committing seat comes out ahead here`
    const replyAhead = `Take the reply — folding both orders, the replying seat comes out ahead here`
    const initiative = `Take the first move — the side that commits first keeps the initiative, whatever the numbers say`
    const information = `Take the reply — seeing their move before choosing has to be worth more than committing blind`
    const evenClaim = `Flip for it — the two seats are worth the same here, because the same four cells are in play either way`
    const evenTrue = `Flip for it — folding both orders, the two seats come out worth exactly the same here`

    const key = vFirst > vSecond ? firstAhead : vFirst < vSecond ? replyAhead : evenTrue
    const decoys =
      vFirst === vSecond
        ? [firstAhead, replyAhead, initiative, information]
        : [vFirst > vSecond ? replyAhead : firstAhead, initiative, information, evenClaim]

    const foldFirst =
      `after **${s.you[0]}** they take **${s.them[reply[0]]}**, leaving you ${firstVals[0]}; after **${s.you[1]}** they take **${s.them[reply[1]]}**, leaving you ${firstVals[1]}. Committing is a choice between those, so **${vFirst}** at best.`
    const foldSecond =
      `if they open **${s.them[0]}** you reply **${s.you[yourReply[0]]}**, and if they open **${s.them[1]}** you reply **${s.you[yourReply[1]]}**. Reading your replies, they open **${s.them[tStar]}** — and you end on **${vSecond}**.`

    return {
      title: 'Pick your seat',
      prompt:
        `${s.setting}. The four ways it can land:\n\n${table}\n\n` +
        `Whoever moves second sees the first move before choosing, and each side takes what is best for itself at its own turn. You can commit first, or hold back and reply. Which seat do you want?`,
      answer: mcq(rng, key, decoys),
      hints: [
        'There are two different games here — the one where you commit first and the one where they do. Fold each separately.',
        'Solve each from the bottom: fix the first move, read the second mover\'s best reply off the second mover\'s OWN numbers, then see what the first mover is left with.',
        vFirst === vSecond
          ? `Both orders land on the same cell, worth ${vFirst} to you — so the seats are equal.`
          : `Moving first leaves you ${vFirst}; replying leaves you ${vSecond}.`,
      ],
      explanation:
        `**Fold "you first":** ${foldFirst}\n\n**Fold "they first":** ${foldSecond}\n\n` +
        (vFirst === vSecond
          ? `The two folds land on the same pair of moves, so the right to move first is worth exactly nothing here — and that is worth knowing on its own. Order only matters when somebody's best reply depends on what they have seen; when it does not, you can hand the first move away as a courtesy, or take it for free, and nothing changes but the theatre.`
          : `The seat worth having is ${vFirst > vSecond ? `the first one, by ${vFirst - vSecond}: committing early forces them to plan around your move` : `the REPLY seat, by ${vSecond - vFirst}: seeing their move lets you fit around it, and committing early would have handed that away`}.\n\nNeither "always seize the initiative" nor "always keep your options open" survives this exercise. Which seat wins is a fact about the payoffs, and the fold turns it into a number.`),
      commonErrors: {
        strategy: 'Treating "move first" as automatically strong is a slogan, not a fold — in some games the reply seat is the one worth having.',
      },
    }
  },
)

// ============================================================ i-selection
// Where does "winning is bad news" apply at all?

const SELECTION_POOL = [
  {
    scene: 'Your low quote wins a repair job against six other quotes, all of them higher',
    bad: true,
    why: 'Seven people estimated the same unknown amount of work and the lowest estimate won, which suggests you read the job as smaller than everyone else did. Ask what the higher quotes saw before you start.',
  },
  {
    scene: 'You win a box of unsorted trading cards at an auction, outbidding four collectors',
    bad: true,
    why: 'Five people guessed at the same unknown value and the highest guess paid. Winning is evidence that yours was the most optimistic of the five.',
  },
  {
    scene: 'You are the only applicant for a weekend job that has been advertised for a month',
    bad: true,
    why: 'A month of people reading the advert and passing is information. It does not prove the job is bad — it means "what did they see?" is worth asking before you commit.',
  },
  {
    scene: 'A stranger selling a games console accepts your very first offer on the spot',
    bad: true,
    why: 'They know the machine\'s history and you do not. Instant acceptance suggests your number cleared their floor easily — which is exactly when to wonder why the floor sat so low.',
  },
  {
    scene: 'The stall pitch nobody else wanted is yours the moment you ask for it',
    bad: true,
    why: 'Every other stallholder looked at that pitch and chose differently. Their choices are data about footfall that you have not measured yourself.',
  },
  {
    scene: 'You win the school chess tournament after beating the top seed in the final',
    bad: false,
    why: 'Nothing hidden was being estimated — the games were played and the result measured directly. There is no selection working against you, just a win.',
  },
  {
    scene: 'Your raffle ticket is pulled out of the drum for the main prize',
    bad: false,
    why: 'Pure chance selected you. Nobody\'s private information was in play, so the win carries no message at all — only luck.',
  },
  {
    scene: 'You get the last library copy of a textbook by arriving when the doors open',
    bad: false,
    why: 'First come, first served selects on timing, not on anyone\'s estimate of hidden value. The book is the same book whoever gets it.',
  },
  {
    scene: 'Your team wins the quiz because your answers were checked and right',
    bad: false,
    why: 'The scoring measured the thing itself against a key. Where the win is graded directly rather than won off other people\'s guesses about an unknown, there is nothing to be suspicious of.',
  },
  {
    scene: 'You win a coin toss to decide which team kicks off',
    bad: false,
    why: 'Chance again. A fair coin cannot know anything that you do not.',
  },
] as const

const selectionWhere = tpl(
  {
    id: 'gtt-selection-where',
    name: 'Which wins carry a message?',
    skillIds: ['i-selection'],
    bucket: 'investigator',
    difficulty: 4,
    variants: 20,
    minutes: 3,
    provenance: PROV_TAIL,
  },
  (rng, seed) => {
    const bad = SELECTION_POOL.filter((c) => c.bad)
    const fine = SELECTION_POOL.filter((c) => !c.bad)
    const rot = <T,>(xs: readonly T[], by: number, take: number): T[] =>
      Array.from({ length: take }, (_, i) => xs[(by + i) % xs.length])
    const shown = [...rot(bad, seed % bad.length, 3), ...rot(fine, (seed >> 2) % fine.length, 3)]
    return {
      title: 'Sort the wins',
      prompt:
        `Winning selects. When you got something because you were the keenest — the highest guess, the lowest quote, the only taker — the getting itself says something about what you got. When the win came from measured skill or plain chance, it says nothing.\n\n` +
        `In which of these should the win send you off to ask what the people who passed could see?`,
      answer: multi(
        rng,
        shown.filter((c) => c.bad).map((c) => c.scene),
        shown.filter((c) => !c.bad).map((c) => c.scene),
      ),
      hints: [
        'Sort each win by HOW it was won: against other people\'s estimates of something unknown, by directly measured merit, or by pure chance.',
        'Flag the ones where being keenest is what won it — highest guess, lowest quote, only taker. Those wins double as evidence about the prize.',
        'Measured merit and plain luck carry no hidden message. Estimates of an unknown do.',
      ],
      explanation:
        shown
          .map((c) => `**${c.bad ? 'Worth asking' : 'No message in it'}** — ${c.scene.toLowerCase()}. ${c.why}`)
          .join('\n\n') +
        `\n\nThe test is always the same: did the win select on somebody's estimate of a value nobody could see? If yes, the win is data about the prize. If it selected on chance or on measured skill, it is just a win — and treating every success as suspicious is the mistake in the other direction.`,
    }
  },
)

// ============================================================ i-common
// Repair the missing link.

const RELAY_PLANS = [
  { pair: ['Iris', 'Jon'], org: 'the organiser', plan: 'swap their two stalls for the afternoon' },
  { pair: ['Kim', 'Leo'], org: 'the coach', plan: 'switch their doubles practice to Thursday' },
  { pair: ['Mara', 'Nils'], org: 'the editor', plan: 'trade pages for the next issue' },
  { pair: ['Omar', 'Pia'], org: 'the teacher', plan: 'swap their two presentation slots' },
] as const

const commonFixlink = tpl(
  {
    id: 'gtt-common-fixlink',
    name: 'One message fixes it',
    skillIds: ['i-common'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 8,
    minutes: 3,
    calibration: true,
    provenance: PROV_TAIL,
  },
  (rng, seed) => {
    const s = cycle(seed, RELAY_PLANS)
    const flip = (seed >> 2) & 1
    const first = s.pair[flip]
    const second = s.pair[1 - flip]
    return {
      title: 'Who is still in the dark?',
      prompt:
        `${cap(s.org)} needs ${s.pair[0]} and ${s.pair[1]} to ${s.plan} — it only works if both do it, at the same time, unprompted.\n\n` +
        `${cap(s.org)} phones ${first} and explains the plan. Later, ${s.org} phones ${second}, explains the plan, and adds that ${first} has already been told. Nobody says anything else to anyone.\n\n` +
        `One more message would make this safe to act on. Which one?`,
      answer: mcq(rng, `${cap(s.org)} sends ${first} one line saying that ${second} has been told as well`, [
        `${cap(s.org)} tells ${second} a second time that ${first} already knows about the plan`,
        `${cap(s.org)} asks ${second} to confirm that they have understood the plan properly`,
        `${cap(first)} rings ${s.org} back to say that they are happy to go ahead with it`,
        `No single message can make it safe — the two of them would have to meet and agree it in person`,
      ]),
      hints: [
        'Write down two facts for each person: do they know the plan, and do they know whether the OTHER one knows it?',
        'Find who cannot rule out being the only one told, and close exactly that gap — a joint move needs each side to know the other knows.',
        `${second} already holds both halves. ${first} knows the plan but has no idea ${second} does — so that is the message to send.`,
      ],
      explanation:
        `${cap(s.org)} tells ${first} that ${second} has been told as well.\n\n` +
        `Count the levels on each side. ${second} knows the plan AND knows ${first} knows it, because ${s.org} said so. ${first} knows the plan and nothing more: from where ${first} stands, ${second} may never have been called at all, and moving alone means turning up to a swap the other half never heard of. So the plan is stuck — not because information is missing, both of them have it, but because one side cannot see that the other does.\n\n` +
        `Check the decoys against that gap. Telling ${second} again adds a level ${second} already has. A confirmation from ${second} back to ${s.org} reassures ${s.org}, who was never the problem. The missing link decides the message: find who is blind, and aim at exactly that.\n\n` +
        `This is also why plans get announced with everyone in the room rather than passed along one at a time — delivery was never the hard part; visibility of the delivery is.`,
    }
  },
)

// ============================================================ i-unpredict
// This time you are the one doing the reading.

const READER_STORIES = [
  { you: 'keeper', them: 'taker', a: 'left', b: 'right', setting: 'penalties, where you must commit to a dive as the ball is struck' },
  { you: 'returner', them: 'server', a: 'wide', b: 'down the middle', setting: 'a racket game, where you must lean one way before the serve lands' },
  { you: 'seeker', them: 'hider', a: 'upstairs', b: 'downstairs', setting: 'a hiding game, where you pick one floor to search first' },
  { you: 'guesser', them: 'setter', a: 'odd', b: 'even', setting: 'a guessing game played for points over many rounds' },
] as const

const unpredictExploit = tpl(
  {
    id: 'gtt-unpredict-exploit',
    name: 'They have a pattern. Now what?',
    skillIds: ['i-unpredict'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 24,
    minutes: 2.5,
    calibration: true,
    provenance: PROV_TAIL,
  },
  (rng, seed) => {
    const s = cycle(seed, READER_STORIES)
    const rounds = rint(rng, 18, 26)
    const share = pick(rng, [0.7, 0.75, 0.8])
    const fav = Math.round(rounds * share)
    const other = rounds - fav
    const leanA = rng() < 0.5
    const aCount = leanA ? fav : other
    const bCount = leanA ? other : fav
    const leanSide = leanA ? s.a : s.b
    return {
      title: 'Reading them back',
      prompt:
        `You are the ${s.you} in ${s.setting}. You win a round when you pick the same side as the ${s.them}; otherwise they do.\n\n` +
        `Over the last ${rounds} rounds they went **${s.a}** ${aCount} times and **${s.b}** ${bCount} times.\n\n` +
        `Suppose their lean holds for the next ${rounds} rounds, and you commit to covering one single side throughout. At best, about how many of those rounds do you win?`,
      answer: numeric(fav, { tolerance: 1, unit: 'rounds' }),
      hints: [
        'Covering a side wins you exactly the rounds they choose that side — nothing else enters the count.',
        `Park on the side they lean to: cover **${leanSide}** every round and let their habit do your work.`,
        `They went ${leanSide} ${fav} times out of ${rounds} — if the lean holds, covering it wins about ${fav}.`,
      ],
      explanation:
        `About **${fav}**. Commit to ${leanSide} and you win every round their lean sends there — ${fav} of ${rounds} if the habit holds — where guessing evenly against them would win only about ${Math.round(rounds / 2)}.\n\n` +
        `Two honest caveats before treating that as money in the bank. First, ${rounds} rounds is a small sample: a ${fav} to ${other} split can be a real habit or a run of luck, so acting on it is a good bet, not a certainty. Second, the moment you park on one side, YOU are the readable one — a ${s.them} who notices will start feeding you the other side, and the counting war begins again. Run that arms race to its end and you get the whole reason genuinely mixed play exists: it is the only strategy that hands the other side nothing to count.\n\n` +
        `The skill cuts both ways and stays inside the game: patterns are free points for whoever spots them first, on either side of the ball. Reading people's habits to get the better of them outside a game frame is a different activity, and not one this app teaches.`,
    }
  },
)

// ============================================================ i-commons
// The size where sensible tips into ruinous.

const TIPPING_STORIES = [
  { member: 'club', who: 'clubs', unit: 'an extra booking', pool: 'a minibus fund' },
  { member: 'stall', who: 'stalls', unit: 'an extra crate of stock', pool: 'a storeroom' },
  { member: 'class', who: 'classes', unit: 'an extra print run', pool: 'an ink budget' },
  { member: 'crew', who: 'crews', unit: 'an extra hour', pool: 'an editing suite' },
] as const

const commonsTipping = tpl(
  {
    id: 'gtt-commons-tipping',
    name: 'When does taking tip over?',
    skillIds: ['i-commons'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 20,
    minutes: 3,
    provenance: PROV_TAIL,
  },
  (_rng, seed) => {
    const s = cycle(seed, TIPPING_STORIES)
    const gain = 5 + (seed % 5)
    const cost = 2 + ((seed >> 2) % 2)
    const nStar = Math.floor(gain / cost) + 1
    const below = cost * (nStar - 1)
    return {
      title: 'Find the tipping size',
      prompt:
        `Groups of ${s.who} run ${s.pool} together, and any one ${s.member} can take **${s.unit}** from it.\n\n` +
        `- Taking it is worth **+${gain}** to the ${s.member} that takes it.\n` +
        `- It costs **${cost}** to every ${s.member} in the group, the taker included.\n\n` +
        `In a small enough group that trade still creates value overall. What is the smallest group size at which one ${s.member} taking it destroys more value than it creates?`,
      answer: numeric(nStar, { tolerance: 0, unit: 'members' }),
      hints: [
        'The gain is private and fixed; the cost multiplies. Work out the group\'s total loss once it has n members.',
        `Find the tipping size: the smallest n where ${cost} × n grows past the ${gain} the taker gains.`,
        `${cost} × ${nStar - 1} = ${below} still ${below === gain ? 'only matches' : 'sits inside'} the ${gain} created; ${cost} × ${nStar} = ${cost * nStar} passes it. So ${nStar}.`,
      ],
      explanation:
        `**${nStar} members.** One take creates ${gain} of private value and destroys ${cost} per member, so a group of n loses ${cost} × n in total. At ${nStar - 1} members the loss is ${below}, which ${below === gain ? 'exactly matches' : 'stays under'} the ${gain} created; at ${nStar} it is ${cost * nStar}, and the take destroys value on balance.\n\n` +
        `Now the trap worth carrying away: the taker's own sum never changes. At ANY group size they gain ${gain} and pay ${cost}, clearing ${gain - cost} — so taking stays individually sensible long after it has turned collectively ruinous, and the bigger the group, the wider the gap grows. Nobody has to get greedier for a larger commons to fail harder; the arithmetic does it alone.\n\n` +
        `Which is why the fixes that survive scale are the ones that change the taker's own line — a cap, a charge, a named share — rather than appeals to weigh the group's total. The group's total was never in anyone's sum to begin with.`,
    }
  },
)

// ============================================================ i-levelk
// The game is played again, and everyone heard what won.

const REPLAY_STORIES = [
  { who: 'your year group' },
  { who: 'the chess club' },
  { who: 'the online league' },
  { who: 'the maths circle' },
] as const

const REPLAY_AVGS = [45, 48, 51, 54, 60] as const

const levelkRounds = tpl(
  {
    id: 'gtt-levelk-rounds',
    name: 'Round two of the guessing game',
    skillIds: ['i-levelk'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 20,
    minutes: 3,
    provenance: PROV_TAIL,
  },
  (_rng, seed) => {
    const s = cycle(seed, REPLAY_STORIES)
    const avg = REPLAY_AVGS[seed % REPLAY_AVGS.length]
    const t1 = Math.round((avg * 2) / 3)
    const t2 = Math.round((t1 * 2) / 3)
    return {
      title: 'The target moves',
      prompt:
        `${cap(s.who)} played the two-thirds game: everyone writes a number from 0 to 100, and the entry closest to two thirds of the average wins.\n\n` +
        `Round one is done. The average came out at **${avg}**, so the winning entries sat around **${t1}** — and that result is read out to everyone.\n\n` +
        `The same people now play a second round, and most of this crowd will anchor on the number that just won, writing something close to it. What should you write for round two?`,
      answer: numeric(t2, { tolerance: 2 }),
      hints: [
        `If most people write close to ${t1}, then ${t1} is roughly the new AVERAGE — it is not the new target.`,
        'Step one past the crowd again: take two thirds of the number they are anchoring on now.',
        `Two thirds of ${t1} is about ${t2}.`,
      ],
      explanation:
        `About **${t2}** — two thirds of ${t1}. The crowd's new anchor is round one's winner, and the target always sits one step below wherever the crowd sits.\n\n` +
        `See what repetition does here: each round, the anchor becomes last round's answer and the target drops by a third again — ${avg} to ${t1} to ${t2} and onward. Played long enough with results read out, the game slides toward the equilibrium at zero, the number that was "correct" from the start and losing from the start. The equilibrium is not wrong; it is where the crowd is heading. The skill is judging how far along the road they are right now.\n\n` +
        `One honest limit: "most people anchor on what just won" is the assumption doing the work, which is why the problem states it. Real crowds move at different speeds — some people jump three steps at once, some never move — so between rounds the useful data is the room, not just the arithmetic.`,
    }
  },
)

// ============================================================ i-mixed
// Your mix leaked. Think like the opponent.

const LEAK_STORIES = [
  { you: 'attacker', them: 'keeper', a: 'left', b: 'right', setting: 'penalty kicks' },
  { you: 'server', them: 'returner', a: 'wide', b: 'into the body', setting: 'a tennis match' },
  { you: 'runner', them: 'tackler', a: 'inside', b: 'outside', setting: 'a training drill' },
  { you: 'striker', them: 'defender', a: 'the near post', b: 'the far post', setting: 'set-piece practice' },
] as const

const mixedEvaluate = tpl(
  {
    id: 'gtt-mixed-evaluate',
    name: 'Your mix leaked',
    skillIds: ['i-mixed'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 24,
    minutes: 3,
    provenance: PROV_TAIL,
  },
  (rng, seed) => {
    const s = cycle(seed, LEAK_STORIES)
    const p10 = pick(rng, [6, 7, 8])
    const q10 = 10 - p10
    const x = rint(rng, 4, 9) // they cover a, you went a
    let y = rint(rng, 1, 3) // they cover a, you went b
    const u = rint(rng, 1, 3) // they cover b, you went a
    const wChoices = [4, 5, 6, 7, 8, 9].filter((v) => v !== x)
    const w = wChoices[rint(rng, 0, wChoices.length - 1)] // they cover b, you went b
    // Integer tenths, so the comparison is exact and the display has no dust.
    let coverA10 = p10 * x + q10 * y
    let coverB10 = p10 * u + q10 * w
    if (coverA10 === coverB10) {
      y = y === 3 ? 2 : y + 1
      coverA10 = p10 * x + q10 * y
    }
    const winA = coverA10 > coverB10
    const winSide = winA ? s.a : s.b
    const loseSide = winA ? s.b : s.a
    const show = (tenths: number) => (tenths % 10 === 0 ? String(tenths / 10) : (tenths / 10).toFixed(1))
    const winE = show(Math.max(coverA10, coverB10))
    const loseE = show(Math.min(coverA10, coverB10))
    const maxSide = x > w ? s.a : s.b
    const pf = (p10 / 10).toFixed(1)
    const qf = (q10 / 10).toFixed(1)
    const { answer, distractorNotes } = mcqNoted(
      rng,
      `Cover **${winSide}** — weighted by how often each side actually comes up, it pays them more`,
      [
        [
          `Cover **${loseSide}** — weighted by how often each side actually comes up, it pays them more`,
          `Run the weighting again: against the leaked mix this line averages ${loseE}, which is the smaller of the two.`,
        ],
        [
          `Split the cover evenly — a mixed plan from me leaves them with nothing to choose between`,
          'Only one exact proportion removes their preference: the solved mix. A leaked lean is not it, and a reader profits from knowing so.',
        ],
        [
          `Cover **${maxSide}** whatever else — the ${Math.max(x, w)} is the biggest single payoff on the table`,
          'The biggest cell only matters as often as it comes up. Weight every cell by its frequency before comparing.',
        ],
      ],
    )
    return {
      title: 'Think like the reader',
      prompt:
        `You are the ${s.you} in ${s.setting}, choosing **${s.a}** or **${s.b}** each time — and word has got out that you go **${s.a}** ${p10 * 10}% of the time. The ${s.them} commits to covering one side each round, and their payoffs are:\n\n` +
        `| | you go **${s.a}** | you go **${s.b}** |\n| --- | --- | --- |\n` +
        `| they cover **${s.a}** | ${x} | ${y} |\n| they cover **${s.b}** | ${u} | ${w} |\n\n` +
        `Against your leaked mix, which way should a sharp ${s.them} lean?`,
      answer,
      distractorNotes,
      hints: [
        'Their choice is now plain arithmetic: the leak fixed your frequencies, so each cover line has a computable average.',
        `Weight each line by the mix: covering ${s.a} pays them ${pf}×${x} + ${qf}×${y}, and covering ${s.b} pays them ${pf}×${u} + ${qf}×${w}.`,
        `Those come out at ${show(coverA10)} against ${show(coverB10)}, so they cover **${winSide}**.`,
      ],
      explanation:
        `Cover **${winSide}**. Against a ${p10 * 10}/${q10 * 10} lean, covering ${s.a} averages ${pf}×${x} + ${qf}×${y} = **${show(coverA10)}** a round, and covering ${s.b} averages ${pf}×${u} + ${qf}×${w} = **${show(coverB10)}**. The bigger single number does not decide it; the weighting does.\n\n` +
        `Two things to carry out of this. A mix only protects you while it stays unreadable — once your true frequencies leak, an adapting opponent turns them into exactly this arithmetic and stands where the average is best. And this is the situation the SOLVED mix is built to prevent: at one particular proportion those two averages come out equal, and the ${s.them} is left with nothing to lean on. Your ${p10 * 10}% is not that proportion, and the gap between ${winE} and ${loseE} is the edge the leak handed over.`,
    }
  },
)

// ============================================================ i-median
// A third player walks into the crowded middle.

const FLANK_STORIES = [
  { things: 'ice-cream vans', one: 'van', line: 'a beach promenade', newcomer: 'a third van' },
  { things: 'coffee carts', one: 'cart', line: 'a station concourse', newcomer: 'a third cart' },
  { things: 'burger stands', one: 'stand', line: 'a festival strip', newcomer: 'a third stand' },
  { things: 'book stalls', one: 'stall', line: 'a market street', newcomer: 'a third stall' },
] as const

const FLANK_POSITIONS = [56, 58, 60, 62, 36, 38, 40, 42] as const
const FLANK_OFFSETS = [6, 8, 10] as const

const medianThird = tpl(
  {
    id: 'gtt-median-third',
    name: 'The open flank',
    skillIds: ['i-median'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 24,
    minutes: 3,
    calibration: true,
    provenance: PROV_TAIL,
  },
  (_rng, seed) => {
    const s = cycle(seed, FLANK_STORIES)
    const m = FLANK_POSITIONS[seed % FLANK_POSITIONS.length]
    const off = FLANK_OFFSETS[(seed >> 3) % FLANK_OFFSETS.length]
    const high = m >= 50
    const q = high ? m - off : m + off
    const mid = (m + q) / 2
    const share = high ? mid : 100 - mid
    return {
      title: 'Three on a line',
      prompt:
        `Two ${s.things} have ended up side by side at position **${m}** on ${s.line} — rivals drift together like that. Customers are spread evenly along the whole line from 0 to 100, and each walks to whichever ${s.one} is nearest; the pair at ${m} split whatever reaches them.\n\n` +
        `${cap(s.newcomer)} now arrives and sets up at **${q}**. Roughly what percentage of the line does the newcomer capture?`,
      answer: numeric(share, { tolerance: 1, unit: '%' }),
      hints: [
        `Only one boundary matters: between the newcomer at ${q} and the pair at ${m}. Everyone beyond the pair on the far side stays with the pair.`,
        `Split at the midpoint: customers between ${q} and ${m} break at (${q} + ${m}) ÷ 2, and the newcomer takes everything on their own side of it.`,
        `That midpoint is ${mid}, so the newcomer takes about ${share}% of the line.`,
      ],
      explanation:
        `About **${share}%**. The line breaks at the midpoint between ${q} and ${m}, which is ${mid}: the newcomer takes the whole stretch ${high ? 'below' : 'above'} it, while the pair at ${m} are left splitting the other ${100 - share}% between them — roughly ${round((100 - share) / 2, 1)} each.\n\n` +
        `One newcomer out-draws the two incumbents COMBINED, and that is the point. Standing in the middle of the crowd wins a two-player race — that pull is exactly what dragged the pair together — but the huddle it produces stands wide open on the flanks, and a third player simply walks onto one. With three on the line there is no resting spot at all: whoever ends up squeezed in the middle does better by hopping to an outside edge, so the shuffling never settles.\n\n` +
        `So the middle rewards exactly two rivals, no more. When you meet a crowded middle, the useful question is not "how do I squeeze in?" but "which flank did the huddle leave open?"`,
    }
  },
)

// ============================================================ i-credible
// Fold the empty threat through to the outcome.

const CALLED_STORIES = [
  {
    who: 'the established shop',
    other: 'the newcomer',
    threat: 'slash its prices below cost if anyone opens on the same street',
    act: 'opens on the street',
    hold: 'opens two streets away',
  },
  {
    who: 'the team captain',
    other: 'the committee',
    threat: 'pull the team out of the league if the fixture is moved',
    act: 'moves the fixture',
    hold: 'leaves the fixture where it is',
  },
  {
    who: 'the seller',
    other: 'the buyer',
    threat: 'refuse any offer under the asking price, full stop',
    act: 'offers below the asking price',
    hold: 'pays the asking price',
  },
  {
    who: 'the headline band',
    other: 'your band',
    threat: 'walk off the festival bill unless they close the night',
    act: 'takes the closing slot',
    hold: 'hands over the closing slot',
  },
] as const

const credibleCalled = tpl(
  {
    id: 'gtt-credible-called',
    name: 'Call it and count it',
    skillIds: ['i-credible'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 24,
    minutes: 3,
    calibration: true,
    provenance: PROV_TAIL,
  },
  (rng, seed) => {
    const s = cycle(seed, CALLED_STORIES)
    const carryOut = rint(rng, 1, 3)
    const backDown = carryOut + rint(rng, 2, 5)
    const hurt = rint(rng, 0, 2)
    const win = rint(rng, 6, 9)
    const safe = rint(rng, 3, 5)
    const whoSafe = rint(rng, 5, 8)
    return {
      title: 'The moment of truth, priced',
      prompt:
        `${cap(s.who)} has loudly and publicly threatened to ${s.threat}. ${cap(s.other)} now chooses, knowing all the numbers — and so does everyone else. The three ways it can end:\n\n` +
        `- ${cap(s.other)} ${s.hold}: ${s.other} ends on **${safe}**, ${s.who} on **${whoSafe}**.\n` +
        `- ${cap(s.other)} ${s.act}, and the threat is carried out: ${s.other} ends on **${hurt}**, ${s.who} on **${carryOut}**.\n` +
        `- ${cap(s.other)} ${s.act}, and the threat is quietly dropped: ${s.other} ends on **${win}**, ${s.who} on **${backDown}**.\n\n` +
        `How does this end?`,
      answer: mcq(
        rng,
        `${cap(s.other)} ${s.act} — once that happens, ${s.who} prefers ${backDown} to ${carryOut} and drops the threat`,
        [
          `${cap(s.other)} ${s.hold} — risking ${hurt} against a safe ${safe} is a bad trade whatever ${s.who} intends`,
          `${cap(s.other)} ${s.act} — and the threat is carried out, because backing down after saying it publicly costs too much`,
          `${cap(s.other)} ${s.hold} — a threat made loudly and in public is binding enough, whoever it happens to come from`,
          `It cannot be called either way — the numbers say nothing about which move ${s.other} will actually pick`,
        ],
      ),
      hints: [
        `Start at the end. Suppose the threat has just been called — compare what carrying it out and dropping it are worth to ${s.who} at that moment.`,
        `Fold the threat away: replace it with what ${s.who} would really do once called, then let ${s.other} choose against THAT.`,
        `${cap(s.who)} prefers ${backDown} to ${carryOut}, so the threat gets dropped — and ${s.other}, seeing that coming, compares ${win} with ${safe}.`,
      ],
      explanation:
        `${cap(s.other)} ${s.act}, the threat quietly dies, and the ledger reads ${win} to ${s.other} and ${backDown} to ${s.who}.\n\n` +
        `Fold it. At the moment of truth, ${s.who} holds ${carryOut} for carrying the threat out against ${backDown} for letting it go — so it will not be carried out, and a threat that will not be carried out changes nothing for the person deciding. ${cap(s.other)} compares ${win} with ${safe} and goes ahead. Saying it loudly did no work at all: volume is not commitment, and both sides could run this arithmetic from the start.\n\n` +
        `One honest wrinkle before relying on this in the wild: the fold is only as good as the payoffs, and people demonstrably do pay real costs to punish — the ultimatum experiments document offers refused out of pure principle. Anger, pride and reputation can sit inside someone's true payoffs and flip the comparison. Here the numbers are given as complete, so the fold stands; out there, "would carrying it out REALLY cost them more?" is the question to settle before calling anyone's bluff.`,
      commonErrors: {
        misread: 'Judging the threat by how firmly it was announced instead of by the threatener\'s own numbers at the moment it would bind.',
      },
    }
  },
)

// ============================================================ i-fairness
// The acceptance rate a greedy offer would need.

const BREAKEVEN_STORIES = [
  { pot: 'a hundred tokens from a games-night win' },
  { pot: 'a hundred credits of shared darkroom time' },
  { pot: 'a hundred tickets from a funfair haul' },
  { pot: 'a hundred points of tournament prize budget' },
] as const

/** The same rough acceptance rates the head-on version of this item prints. */
const ACCEPT_RATE: Record<number, number> = { 10: 15, 20: 50, 30: 80 }

const fairnessBreakeven = tpl(
  {
    id: 'gtt-fairness-breakeven',
    name: 'What the greedy offer needs',
    skillIds: ['i-fairness'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 12,
    minutes: 3,
    provenance: PROV_TAIL,
  },
  (_rng, seed) => {
    const s = cycle(seed, BREAKEVEN_STORIES)
    const low = [10, 20, 30][seed % 3]
    const keepLow = 100 - low
    const needed = Math.round(5700 / keepLow)
    const actual = ACCEPT_RATE[low]
    return {
      title: 'Solve for the missing rate',
      prompt:
        `You and another player must split ${s.pot} — 100 units, one shot. One of you proposes a split; the other accepts it, or both get nothing.\n\n` +
        `From the experimental record, an offer of **40** is accepted roughly **95%** of the time, so proposing it keeps you 60 when it lands — about 57 per game on average.\n\n` +
        `Someone at your table insists on offering **${low}** and keeping **${keepLow}** instead. How often would that offer have to be accepted to average as well as offering 40?`,
      answer: numeric(needed, { tolerance: 3, unit: '%' }),
      hints: [
        'Write both averages the same way: the amount kept, times how often it is actually kept.',
        `Set the greedy line equal to the fair one and solve for the missing rate: ${keepLow} × rate = 60 × 0.95 = 57.`,
        `Rate = 57 ÷ ${keepLow}, which is about ${needed}%.`,
      ],
      explanation:
        `About **${needed}%** — keeping ${keepLow} only helps in the games where it lands, so the offer needs 57 ÷ ${keepLow} of games to land just to TIE with the fair proposal.\n\n` +
        `Now put that next to what people actually do: in the experimental record, offers around ${low} are accepted roughly **${actual}%** of the time — short of the ${needed}% required, so the greedy proposal ${low === 30 ? 'only barely holds its own, with the margin inside the noise' : 'loses on average, and not by a little'}.\n\n` +
        (low === 30
          ? `That thin margin is itself the lesson: by 30 the offer is close enough to fair that rejections stop punishing it much. It is the genuinely greedy offers that collapse — the required rate climbs just as the real rate falls away.`
          : `The pattern is steep in both directions at once: the lower the offer, the higher the acceptance rate it NEEDS and the lower the rate it GETS. Those two move against each other, which is why proposers in these experiments cluster near an even split — arithmetic before kindness ever enters into it.`),
    }
  },
)

// ============================================================ i-trust
// Solve for the return that shares the surplus.

const RETURN_STORIES = [
  { frame: 'an online game with a stranger you will never meet again' },
  { frame: 'a one-round classroom experiment run on paper slips' },
  { frame: 'an anonymous pairing at a summer camp, names withheld' },
  { frame: 'a demonstration game a club runs between two hidden players' },
] as const

const trustReturn = tpl(
  {
    id: 'gtt-trust-return',
    name: 'The even-handed return',
    skillIds: ['i-trust'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 12,
    minutes: 3,
    provenance: PROV_TAIL,
  },
  (_rng, seed) => {
    const s = cycle(seed, RETURN_STORIES)
    const start = [20, 40][seed % 2]
    const mult = [2, 3, 4][Math.floor(seed / 2) % 3]
    const multWord = ({ 2: 'doubled', 3: 'tripled', 4: 'quadrupled' } as const)[mult as 2 | 3 | 4]
    const send = start / 2
    const arrives = send * mult
    const surplus = arrives - send
    const back = send + surplus / 2
    return {
      title: 'Split what the trust created',
      prompt:
        `Two strangers in ${s.frame}. Each starts with ${start} units. The first mover may send any amount across, and **whatever is sent is ${multWord} on the way**. The second mover may then return as much or as little as they like.\n\n` +
        `You send **${send}**, and ${arrives} lands on their side. They message back: "Let us end this with both of us up by the same amount." How much do they return?`,
      answer: numeric(back, { tolerance: 0, unit: 'units' }),
      hints: [
        `Count the value the transfer created: ${send} left you and ${arrives} arrived, so between you the pair is up ${surplus}.`,
        `Share the created value evenly: each of you should finish exactly ${surplus / 2} ahead of your starting ${start}.`,
        `Your gain is the return minus the ${send} you sent, so they return ${send} + ${surplus / 2} = ${back}.`,
      ],
      explanation:
        `**${back}.** The move created ${surplus} of new value — ${arrives} arrived where ${send} left. Ending level means each side finishes ${surplus / 2} up, so you need your ${send} back plus ${surplus / 2} on top: ${back} comes across, leaving you on ${start - send + back} and them on ${start + arrives - back} — both exactly ${surplus / 2} above where they started.\n\n` +
        `Worth seeing the whole range around that answer: ANY return between ${send} and ${arrives} leaves both of you ahead of never playing, while below ${send} your trust made you poorer. Trust does not create one fair answer — it creates a zone of deals better than nothing, and the even split is the focal point people reach for when nothing else picks a spot. That is also what makes it easy to say out loud, which is what a deal that survives daylight sounds like.\n\n` +
        `And the honest footnote: nothing in the rules forces any return at all. In the original experiment of this shape, first movers sent about half their stake and second movers returned a substantial part of it — real, and not guaranteed. What turns even-handed returns from lucky into routine is the scaffolding around a relationship: repetition, reputation, enforcement. One-shot anonymity strips out all three, which is exactly why this little game says so much.`,
    }
  },
)

export const GAME_THEORY_TAIL_TEMPLATES: ItemTemplate[] = [
  iteratedSolve,
  backwardOrder,
  selectionWhere,
  commonFixlink,
  unpredictExploit,
  commonsTipping,
  levelkRounds,
  mixedEvaluate,
  medianThird,
  credibleCalled,
  fairnessBreakeven,
  trustReturn,
]
