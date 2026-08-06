/**
 * Chess tactics. Provenance: every position was generated/composed for Axiom
 * Lab and VERIFIED by exhaustive search (see scripts/find-tactics.mjs and the
 * content audit): mate goals are re-searched at test time, and line tactics
 * are replayed move-by-move for legality and material gain.
 *
 * Mate goals accept ANY move that keeps the forced mate; line tactics accept
 * exactly the listed continuation.
 */
import type { ChessSpec, ItemTemplate, RenderedItem } from '../../domain/types'

export interface TacticDef {
  id: string
  fen: string
  goal: ChessSpec['goal']
  line: string[]
  theme: string
  difficulty: 1 | 2 | 3 | 4 | 5
  explanation: string
}

export const TACTICS: TacticDef[] = [
  // ---------------- mate in 1 ----------------
  {
    id: 'chess-m1-backrank-r',
    fen: '6k1/5ppp/8/8/8/8/3R4/2K5 w - - 0 1',
    goal: 'mate1',
    line: ['Rd8#'],
    theme: 'Back-rank mate',
    difficulty: 1,
    explanation:
      'The pawns that shelter a castled king also wall him in. A rook landing on the eighth rank checks a king whose own shield removes every escape square — the classic back-rank mate. Habit to build: before anything else, scan checks on the last rank.',
  },
  {
    id: 'chess-m1-backrank-q',
    fen: '6k1/5ppp/8/8/8/8/2Q4K/8 w - - 0 1',
    goal: 'mate1',
    line: ['Qc8#'],
    theme: 'Back-rank mate',
    difficulty: 1,
    explanation:
      'Same pattern, queen edition: the c-file is open, the eighth rank is one move away, and the pawn shield does the rest. Count the defenders of the landing square before you commit — here there are none.',
  },
  {
    id: 'chess-m1-backrank-c',
    fen: '7k/5ppp/8/2R5/8/8/8/2K5 w - - 0 1',
    goal: 'mate1',
    line: ['Rc8#'],
    theme: 'Back-rank mate',
    difficulty: 1,
    explanation:
      'With the king in the corner, one rank-eight check ends it: g8 is covered by the rook, and the pawns block everything else. Back-rank vulnerability is about OPEN FILES — the rook only needed one.',
  },
  {
    id: 'chess-m1-smothered',
    fen: '6rk/6pp/8/4N3/8/8/3K4/8 w - - 0 1',
    goal: 'mate1',
    line: ['Nf7#'],
    theme: 'Smothered mate',
    difficulty: 2,
    explanation:
      'The knight is the only piece that checks without a line — so it is the only piece that can mate a fully boxed-in king. Black\'s own rook and pawns fill every flight square; Nf7 does the rest. When an enemy king has zero air, hunt for the knight check.',
  },
  {
    id: 'chess-m1-smothered2',
    fen: '6rk/6pp/8/6N1/Q7/8/8/5K2 w - - 0 1',
    goal: 'mate1',
    line: ['Nf7#'],
    theme: 'Smothered mate',
    difficulty: 2,
    explanation:
      'The queen watches from a4, but the knight alone delivers: f7 hits h8, and the smothered king cannot move. Note that the flashy piece is not always the mating piece — the geometry decides.',
  },
  {
    id: 'chess-m1-two-mates',
    fen: '5Nrk/6pp/8/7Q/8/8/8/4K3 w - - 0 1',
    goal: 'mate1',
    line: ['Ng6#'],
    theme: 'Two mating ideas',
    difficulty: 2,
    explanation:
      'Two distinct mates hide here. Ng6# works because hxg6 is ILLEGAL — the h7-pawn is pinned to the king by the h5-queen, and a pinned pawn defends nothing. Qxh7# works because the f8-knight protects h7, so the "sacrifice" is no sacrifice. One position, two lessons: recount defenders as if pinned pieces were absent, and check every check — positions often hold more than one win.',
  },
  {
    id: 'chess-m1-ladder',
    fen: '8/3R4/8/4R3/8/1K6/8/1k6 w - - 0 1',
    goal: 'mate1',
    line: ['Re1#'],
    theme: 'Rook ladder',
    difficulty: 1,
    explanation:
      'The rook on d7 is the barrier: it seals the second rank. The other rook drops to the first rank for mate. Two rooks mate by ladder — one cuts, one checks — no king help required.',
  },
  {
    id: 'chess-m1-ladder2',
    fen: 'k7/2R5/8/4R3/1K6/8/8/8 w - - 0 1',
    goal: 'mate1',
    line: ['Re8#'],
    theme: 'Rook ladder',
    difficulty: 1,
    explanation:
      'The c7-rook fences the seventh rank; Re8 checks on the eighth. The cornered king has nowhere left. Ladder mates reward one habit: park the cutting rook FIRST, then deliver with the other.',
  },
  {
    id: 'chess-m1-discovered',
    fen: 'r5k1/6pp/8/8/8/1R6/Q6K/8 w - - 0 1',
    goal: 'mate1',
    line: ['Rb8#'],
    theme: 'Discovered double check',
    difficulty: 3,
    explanation:
      'Rb8 LOOKS impossible — the a8-rook covers b8. But the rook move opens the a2–g8 diagonal: DOUBLE check from rook and queen at once. Against double check, capturing and blocking are both useless (they answer only one check); the king must move, and it has nowhere to go. Double check is the most forcing move in chess — always check what your move UNCOVERS.',
  },
  {
    id: 'chess-m1-qb-battery',
    fen: '8/8/8/8/8/2KB4/6Q1/4k3 w - - 0 1',
    goal: 'mate1',
    line: ['Qe2#'],
    theme: 'Queen + bishop coordination',
    difficulty: 2,
    explanation:
      'Several queen moves mate here — the bishop and king seal the escape diagonals while the queen delivers. When multiple mates exist, any of them counts: what matters is verifying the king truly has zero replies, not finding "the" move.',
  },
  {
    id: 'chess-m1-corner-n',
    fen: '8/5Q2/8/8/2N5/8/2K5/k7 w - - 0 1',
    goal: 'mate1',
    line: ['Qa7#'],
    theme: 'Cornered king',
    difficulty: 2,
    explanation:
      'Qa7 mates because the knight quietly covers b2 — the only would-be escape. Mates are team events: the delivering piece gets the glory, the covering piece makes it legal. Before calling a check "mate", list every escape square and its guard.',
  },
  {
    id: 'chess-m1-opposition',
    fen: '8/8/8/4Q3/8/5K2/8/5k2 w - - 0 1',
    goal: 'mate1',
    line: ['Qa1#'],
    theme: 'King opposition',
    difficulty: 2,
    explanation:
      'The kings face off — f3 covers e2, f2, g2 — so a first-rank check is mate. In king-and-queen endings the KING does the boxing; the queen only finishes. Qa1 checks along the rank the enemy king cannot leave.',
  },
  {
    id: 'chess-m1-qslide',
    fen: '6k1/Q4ppp/8/8/8/2K5/8/5R2 w - - 0 1',
    goal: 'mate1',
    line: ['Qa8#'],
    theme: 'Back-rank mate',
    difficulty: 1,
    explanation:
      'The queen slides along the seventh... to the eighth: Qa8 (or Qb8) mates on the open back rank. The f1-rook is a spectator — material advantage does not mate; a piece REACHING the right square does.',
  },
  {
    id: 'chess-m1-qe8',
    fen: '7k/5ppp/8/8/8/8/1K6/4Q2R w - - 0 1',
    goal: 'mate1',
    line: ['Qe8#'],
    theme: 'Back-rank mate',
    difficulty: 1,
    explanation:
      'Qe8 walks straight up the open e-file\'s extension to the back rank. One open lane to the eighth is all a queen needs against an uncastled shield. Scan: which files reach their last rank unopposed?',
  },
  // ---------------- mate in 2 ----------------
  {
    id: 'chess-m2-ladder1',
    fen: '8/R7/4R3/3K4/8/8/8/5k2 w - - 0 1',
    goal: 'mate2',
    line: ['Ra2'],
    theme: 'Rook ladder',
    difficulty: 3,
    explanation:
      'The ladder in slow motion: Ra2 seals the second rank (the king\'s only breathing room), and next move the e6-rook drops to e1 for mate. Whatever Black plays changes nothing — that is what "forced" means. Plan the CUT first, the check second.',
  },
  {
    id: 'chess-m2-ladder2',
    fen: '6R1/8/K7/8/8/8/6R1/4k3 w - - 0 1',
    goal: 'mate2',
    line: ['Rf8'],
    theme: 'Rook ladder',
    difficulty: 3,
    explanation:
      'Vertical ladder: Rf8 fences the f-file, boxing the king onto e1/d1/e2... and the g2-rook mates on the first rank next move. Ladders work on files exactly as on ranks — the pattern is the fence, not the direction.',
  },
  {
    id: 'chess-m2-ladder3',
    fen: '5k2/7R/8/7R/K7/8/8/8 w - - 0 1',
    goal: 'mate2',
    line: ['Rg5'],
    theme: 'Rook ladder',
    difficulty: 3,
    explanation:
      'The h7-rook already seals the seventh rank. Rg5 readies the finisher: wherever the king shuffles on the eighth, Rg8 next move is mate. When one rook already cuts, the whole plan is repositioning the second rook OUT of the king\'s reach and dropping it in.',
  },
  {
    id: 'chess-m2-double7',
    fen: '4k3/3R4/1K6/2R5/8/8/8/8 w - - 0 1',
    goal: 'mate2',
    line: ['Rcc7'],
    theme: 'Doubled rooks',
    difficulty: 3,
    explanation:
      'Rcc7 doubles both rooks on the seventh rank. The king is trapped on the eighth with the seventh fenced; next move one rook slides to the eighth for mate — and because they defend each other, nothing can be captured. Doubling converts two strong pieces into one unstoppable one.',
  },
  {
    id: 'chess-m2-deflect',
    fen: '7k/5pp1/R7/R7/8/8/8/7K w - - 0 1',
    goal: 'mate2',
    line: ['Rh5+'],
    theme: 'Boxing the king',
    difficulty: 4,
    explanation:
      'Rh5+! seizes the h-file: the check cannot be blocked (pawns capture diagonally, so gxh5 does not exist) and the king\'s only square is g8. Now the h5-rook is not just checking — it OWNS h7. That makes Ra8# next move a true back-rank mate: f8 and h8 are covered by the rook on a8, g7 by Black\'s own pawn, and h7 by the rook you repositioned. The first move looked like a check; it was really a construction move for the second.',
  },
  {
    id: 'chess-m2-qb',
    fen: '7k/8/1Q6/8/7K/8/2B5/8 w - - 0 1',
    goal: 'mate2',
    line: ['Qh6+'],
    theme: 'Queen + bishop mate',
    difficulty: 3,
    explanation:
      'Qh6+ forces Kg8 — and then the QUIET piece delivers: Bb3# along the a2–g8 diagonal. The queen on h6 is the cage (f8, g7, h7 all covered); the bishop is the executioner. Q+B mates often work exactly this way around: the loud piece confines, the modest piece checks. If you only calculated queen moves after Qh6+, this mate was invisible.',
  },
  {
    id: 'chess-m2-quiet-b',
    fen: '5k2/2BQ4/8/8/8/2K5/8/8 w - - 0 1',
    goal: 'mate2',
    line: ['Be5'],
    theme: 'Quiet key move',
    difficulty: 4,
    explanation:
      'No check! Be5 simply takes away the king\'s escape squares — and now every black move allows Qf7# or Qd8#. Quiet key moves are the hardest tactic to spot because they refuse the "checks first" reflex; the tell is a king with exactly one or two flight squares that a single piece can cancel.',
  },
  {
    id: 'chess-m2-king-walk',
    fen: '8/8/1Q6/8/k7/8/3K4/8 w - - 0 1',
    goal: 'mate2',
    line: ['Kc3'],
    theme: 'King as attacker',
    difficulty: 4,
    explanation:
      'The winning move is a KING move: Kc3 (or Kc2) tightens the box, and the queen mates next move wherever the black king steps. In endings the king is a fighting piece; the queen alone cannot mate a bare king — she needs her partner to take the last squares.',
  },
  {
    id: 'chess-m2-two-paths',
    fen: '6k1/5p1p/8/8/7Q/8/8/RK6 w - - 0 1',
    goal: 'mate2',
    line: ['Ra8+'],
    theme: 'Converging attacks',
    difficulty: 3,
    explanation:
      'Two different forcing wins: Ra8+ drives the king up the board into the queen\'s net, and Qg5+ herds it back into the rook\'s. When two forcing lines exist, calculate ONE to the end rather than half-calculating both — the engine will accept any move that keeps the forced mate.',
  },
  {
    id: 'chess-m2-qh1',
    fen: '3r3k/5pp1/8/8/8/1K1R4/8/Q7 w - - 0 1',
    goal: 'mate2',
    line: ['Qh1+'],
    theme: 'Open-file invasion',
    difficulty: 4,
    explanation:
      'Qh1+! The corner-to-corner check forces Kg8 (the king\'s only square). Then Rxd8# — the capture is mate because the queen, from all the way back on h1, controls the h-file and takes h7 away. Black\'s rook guarded the back rank until the queen\'s check pulled the king onto it. Long-range pieces defend and attack from ANY distance: the mate was delivered by a queen eight squares away.',
  },
  // ---------------- exact-line tactics (material) ----------------
  {
    id: 'chess-line-fork-rook',
    fen: 'r3k3/8/8/3N4/8/8/8/4K3 w - - 0 1',
    goal: 'line',
    line: ['Nc7+', 'Kd7', 'Nxa8'],
    theme: 'Knight fork',
    difficulty: 2,
    explanation:
      'Nc7+ attacks king and rook at once — the fork. The check makes it forcing: Black must attend to the king, and the rook falls next move. Knight forks live on the squares a knight-move away from TWO targets; train yourself to see c7/f7-type squares whenever king and rook share the back rank.',
  },
  {
    id: 'chess-line-fork-queen',
    fen: '2q3k1/5ppp/8/3N4/1B6/8/8/6K1 w - - 0 1',
    goal: 'line',
    line: ['Ne7+', 'Kh8', 'Nxc8'],
    theme: 'Knight fork',
    difficulty: 3,
    explanation:
      'Ne7+ forks king and queen — and the b4-bishop guards e7, so the king cannot simply take. Forks are geometry plus PROTECTION: an unguarded forking square is just a piece hanging. The bishop\'s quiet support is what turns the pattern into a win.',
  },
  // ---------------- pawn endgames (escort technique) ----------------
  {
    id: 'chess-end-escort1',
    fen: '5k2/8/4KP2/8/8/8/8/8 w - - 0 1',
    goal: 'line',
    line: ['f7', 'Kg7', 'Ke7', 'Kg6', 'f8=Q'],
    theme: 'Pawn escort',
    difficulty: 3,
    explanation:
      'The king escorts, the pawn walks. f7 (the king already guards f7\'s path) forces the defender aside; Ke7 then OWNS f8, and the promotion cannot be stopped. The whole technique in one line: put your king in front of or beside the pawn where it controls the promotion square, and only then push. Kings are fighting pieces in endgames — the pawn is just the passenger.',
  },
  {
    id: 'chess-end-escort2',
    fen: '1k6/8/1K6/2P5/8/8/8/8 w - - 0 1',
    goal: 'line',
    line: ['c6', 'Kc8', 'c7', 'Kd7', 'Kb7', 'Kd6', 'c8=Q'],
    theme: 'Pawn escort',
    difficulty: 4,
    explanation:
      'c6, c7 — and then the move that wins isn\'t a push: **Kb7** seizes c8 (and b8) so the promotion next move cannot be prevented. Pushing c8=Q immediately would never happen — the black king sat on the square\'s doorstep. The endgame law on display: the KING must control the promotion square before the pawn claims it. (Beware the cousin trap: with a rook-pawn, this whole plan is often only a draw — corners create stalemates.)',
  },
  {
    id: 'chess-end-clear-path',
    fen: '4k3/8/4K3/3P4/8/8/8/8 w - - 0 1',
    goal: 'line',
    line: ['d6', 'Kd8', 'd7', 'Kc7', 'Ke7', 'Kb7', 'd8=Q'],
    theme: 'King clears the path',
    difficulty: 4,
    explanation:
      'With the kings facing off, the pawn advances under escort: d6, d7 (never with check — a check would let the king slide in front!), then **Ke7** takes d8 under white\'s control and the queen appears. The quiet detail that decides these endings: d7 was played WITHOUT check, so the black king had to step aside rather than blockade. Opposition and tempo, not speed, win king-and-pawn endings.',
  },
  {
    id: 'chess-line-pin-combo',
    fen: 'r3k3/1p6/2n5/1B6/3N4/8/8/6K1 w - - 0 1',
    goal: 'line',
    line: ['Nxc6', 'bxc6', 'Bxc6+', 'Kd8', 'Bxa8'],
    theme: 'Pin exploitation',
    difficulty: 3,
    explanation:
      'The c6-knight is pinned by the bishop — it cannot recapture without exposing the king. So Nxc6! wins a piece; after bxc6 Bxc6+ the bishop forks king and rook along the newly opened diagonal, collecting a8 next. Pinned pieces are not defenders: recount every "defended" square pretending the pinned piece is absent.',
  },
]

export const CHESS_TEMPLATES: ItemTemplate[] = TACTICS.map((t) => ({
  id: t.id,
  version: 1,
  kind: 'chess',
  name: `${t.theme} (${t.goal === 'mate1' ? 'mate in 1' : t.goal === 'mate2' ? 'mate in 2' : 'win material'})`,
  skillIds: ['z-chess'],
  bucket: 'puzzle',
  difficulty: t.difficulty,
  variants: 1,
  minutes: t.goal === 'mate1' ? 2 : 3.5,
  provenance: 'Original position, generated/composed for Axiom Lab; verified by exhaustive search in the content audit.',
  generate: (seed: number): RenderedItem => ({
    templateId: t.id,
    version: 1,
    seed,
    kind: 'chess',
    title: t.theme,
    prompt:
      t.goal === 'mate1'
        ? 'White to move. **Find mate in one.** Any mating move counts.'
        : t.goal === 'mate2'
          ? 'White to move. **Force mate in two** — your move, any reply, then mate. Any move that keeps the forced mate counts.'
          : 'White to move. **Win material** with the key tactical sequence.',
    chess: { fen: t.fen, goal: t.goal, line: t.line, explanation: t.explanation, theme: t.theme },
    hints:
      t.goal === 'line'
        ? [
            'List every check and capture first — forcing moves narrow the tree.',
            `Theme: ${t.theme}. Which of your pieces can attack two things at once?`,
            `Key move: **${t.line[0]}**.`,
          ]
        : [
            'Candidate moves: list EVERY check before evaluating any of them.',
            t.goal === 'mate2'
              ? 'For each check (and each strong quiet move), name the opponent\'s best reply — the defense you would play.'
              : 'For each check, verify: can the king move, can the check be blocked, can the checker be taken?',
            `Theme: ${t.theme}.`,
          ],
    explanation: t.explanation,
    transferBridge:
      'Name the pattern you used (fork? back rank? deflection?). What would this pattern look like outside chess — where else does "overloaded defender" or "forcing move first" apply?',
  }),
}))
