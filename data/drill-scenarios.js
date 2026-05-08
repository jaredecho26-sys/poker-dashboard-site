// drill-scenarios.js — deterministic scenario bank
// Formulas verified: pot odds = call/(pot+call) | equity_flop = 1-(47-n)/47*(46-n)/46 | equity_turn = n/46
// Hand review cards sourced from actual imported hand history — no synthetic examples
/* eslint-disable */

const DRILL_SCENARIOS = {
  "potOdds": [
    {
      "id": "po_1",
      "category": "potOdds",
      "prompt": "Pot is $20. Villain bets $10. (heads-up, flop, half-pot bet) What equity do you need to call profitably?",
      "answer": 33.3,
      "answerLabel": "33.3%",
      "formula": "call/(pot+call) = 10/(20+10) = 10/30",
      "detail": "You need 33.3% equity. Getting 2:1 pot odds.",
      "call": 10,
      "pot": 20
    },
    {
      "id": "po_2",
      "category": "potOdds",
      "prompt": "Pot is $30. Villain bets $10. (heads-up, flop, 1/3-pot bet) What equity do you need to call profitably?",
      "answer": 25,
      "answerLabel": "25%",
      "formula": "call/(pot+call) = 10/(30+10) = 10/40",
      "detail": "You need 25% equity. Getting 3:1 pot odds.",
      "call": 10,
      "pot": 30
    },
    {
      "id": "po_3",
      "category": "potOdds",
      "prompt": "Pot is $40. Villain bets $20. (heads-up, turn, half-pot bet) What equity do you need to call profitably?",
      "answer": 33.3,
      "answerLabel": "33.3%",
      "formula": "call/(pot+call) = 20/(40+20) = 20/60",
      "detail": "You need 33.3% equity. Getting 2:1 pot odds.",
      "call": 20,
      "pot": 40
    },
    {
      "id": "po_4",
      "category": "potOdds",
      "prompt": "Pot is $45. Villain bets $15. (heads-up, turn, 1/3-pot bet) What equity do you need to call profitably?",
      "answer": 25,
      "answerLabel": "25%",
      "formula": "call/(pot+call) = 15/(45+15) = 15/60",
      "detail": "You need 25% equity. Getting 3:1 pot odds.",
      "call": 15,
      "pot": 45
    },
    {
      "id": "po_5",
      "category": "potOdds",
      "prompt": "Pot is $30. Villain bets $30. (heads-up, flop, pot-sized bet) What equity do you need to call profitably?",
      "answer": 50,
      "answerLabel": "50%",
      "formula": "call/(pot+call) = 30/(30+30) = 30/60",
      "detail": "You need 50% equity. Getting 1:1 pot odds.",
      "call": 30,
      "pot": 30
    },
    {
      "id": "po_6",
      "category": "potOdds",
      "prompt": "Pot is $20. Villain bets $20. (heads-up, turn, pot-sized bet) What equity do you need to call profitably?",
      "answer": 50,
      "answerLabel": "50%",
      "formula": "call/(pot+call) = 20/(20+20) = 20/40",
      "detail": "You need 50% equity. Getting 1:1 pot odds.",
      "call": 20,
      "pot": 20
    },
    {
      "id": "po_7",
      "category": "potOdds",
      "prompt": "Pot is $20. Villain bets $5. (heads-up, flop, quarter-pot bet) What equity do you need to call profitably?",
      "answer": 20,
      "answerLabel": "20%",
      "formula": "call/(pot+call) = 5/(20+5) = 5/25",
      "detail": "You need 20% equity. Getting 4:1 pot odds.",
      "call": 5,
      "pot": 20
    },
    {
      "id": "po_8",
      "category": "potOdds",
      "prompt": "Pot is $80. Villain bets $40. (heads-up, flop, half-pot, larger pot) What equity do you need to call profitably?",
      "answer": 33.3,
      "answerLabel": "33.3%",
      "formula": "call/(pot+call) = 40/(80+40) = 40/120",
      "detail": "You need 33.3% equity. Getting 2:1 pot odds.",
      "call": 40,
      "pot": 80
    },
    {
      "id": "po_9",
      "category": "potOdds",
      "prompt": "Pot is $50. Villain bets $25. (heads-up, river, half-pot bet) What equity do you need to call profitably?",
      "answer": 33.3,
      "answerLabel": "33.3%",
      "formula": "call/(pot+call) = 25/(50+25) = 25/75",
      "detail": "You need 33.3% equity. Getting 2:1 pot odds.",
      "call": 25,
      "pot": 50
    },
    {
      "id": "po_10",
      "category": "potOdds",
      "prompt": "Pot is $15. Villain bets $15. (heads-up, river, pot-sized bet) What equity do you need to call profitably?",
      "answer": 50,
      "answerLabel": "50%",
      "formula": "call/(pot+call) = 15/(15+15) = 15/30",
      "detail": "You need 50% equity. Getting 1:1 pot odds.",
      "call": 15,
      "pot": 15
    },
    {
      "id": "po_11",
      "category": "potOdds",
      "prompt": "Pot is $40. Villain bets $8. (heads-up, river, 20% bet) What equity do you need to call profitably?",
      "answer": 16.7,
      "answerLabel": "16.7%",
      "formula": "call/(pot+call) = 8/(40+8) = 8/48",
      "detail": "You need 16.7% equity. Getting 5:1 pot odds.",
      "call": 8,
      "pot": 40
    },
    {
      "id": "po_12",
      "category": "potOdds",
      "prompt": "Pot is $24. Villain bets $12. (heads-up, flop, half-pot bet) What equity do you need to call profitably?",
      "answer": 33.3,
      "answerLabel": "33.3%",
      "formula": "call/(pot+call) = 12/(24+12) = 12/36",
      "detail": "You need 33.3% equity. Getting 2:1 pot odds.",
      "call": 12,
      "pot": 24
    },
    {
      "id": "po_13",
      "category": "potOdds",
      "prompt": "Pot is $12. Villain bets $6. (heads-up, flop, small bet) What equity do you need to call profitably?",
      "answer": 33.3,
      "answerLabel": "33.3%",
      "formula": "call/(pot+call) = 6/(12+6) = 6/18",
      "detail": "You need 33.3% equity. Getting 2:1 pot odds.",
      "call": 6,
      "pot": 12
    },
    {
      "id": "po_14",
      "category": "potOdds",
      "prompt": "Pot is $100. Villain bets $50. (heads-up, river, half-pot (large)) What equity do you need to call profitably?",
      "answer": 33.3,
      "answerLabel": "33.3%",
      "formula": "call/(pot+call) = 50/(100+50) = 50/150",
      "detail": "You need 33.3% equity. Getting 2:1 pot odds.",
      "call": 50,
      "pot": 100
    },
    {
      "id": "po_15",
      "category": "potOdds",
      "prompt": "Pot is $60. Villain bets $60. (heads-up, river, pot-sized bet) What equity do you need to call profitably?",
      "answer": 50,
      "answerLabel": "50%",
      "formula": "call/(pot+call) = 60/(60+60) = 60/120",
      "detail": "You need 50% equity. Getting 1:1 pot odds.",
      "call": 60,
      "pot": 60
    },
    {
      "id": "po_16",
      "category": "potOdds",
      "prompt": "Pot is $12. Villain bets $3. (multiway, flop, small bet) What equity do you need to call profitably?",
      "answer": 20,
      "answerLabel": "20%",
      "formula": "call/(pot+call) = 3/(12+3) = 3/15",
      "detail": "You need 20% equity. Getting 4:1 pot odds.",
      "call": 3,
      "pot": 12
    },
    {
      "id": "po_17",
      "category": "potOdds",
      "prompt": "Pot is $32. Villain bets $8. (multiway, flop, quarter-pot bet) What equity do you need to call profitably?",
      "answer": 20,
      "answerLabel": "20%",
      "formula": "call/(pot+call) = 8/(32+8) = 8/40",
      "detail": "You need 20% equity. Getting 4:1 pot odds.",
      "call": 8,
      "pot": 32
    },
    {
      "id": "po_18",
      "category": "potOdds",
      "prompt": "Pot is $36. Villain bets $12. (multiway, flop, 1/3-pot bet) What equity do you need to call profitably?",
      "answer": 25,
      "answerLabel": "25%",
      "formula": "call/(pot+call) = 12/(36+12) = 12/48",
      "detail": "You need 25% equity. Getting 3:1 pot odds.",
      "call": 12,
      "pot": 36
    },
    {
      "id": "po_19",
      "category": "potOdds",
      "prompt": "Pot is $60. Villain bets $20. (multiway, turn, 1/3-pot bet) What equity do you need to call profitably?",
      "answer": 25,
      "answerLabel": "25%",
      "formula": "call/(pot+call) = 20/(60+20) = 20/80",
      "detail": "You need 25% equity. Getting 3:1 pot odds.",
      "call": 20,
      "pot": 60
    },
    {
      "id": "po_20",
      "category": "potOdds",
      "prompt": "Pot is $75. Villain bets $25. (multiway, turn, 1/3-pot bet) What equity do you need to call profitably?",
      "answer": 25,
      "answerLabel": "25%",
      "formula": "call/(pot+call) = 25/(75+25) = 25/100",
      "detail": "You need 25% equity. Getting 3:1 pot odds.",
      "call": 25,
      "pot": 75
    },
    {
      "id": "po_21",
      "category": "potOdds",
      "prompt": "Pot is $90. Villain bets $30. (multiway, river, 1/3-pot bet) What equity do you need to call profitably?",
      "answer": 25,
      "answerLabel": "25%",
      "formula": "call/(pot+call) = 30/(90+30) = 30/120",
      "detail": "You need 25% equity. Getting 3:1 pot odds.",
      "call": 30,
      "pot": 90
    },
    {
      "id": "po_22",
      "category": "potOdds",
      "prompt": "Pot is $30. Villain bets $15. (multiway, flop, half-pot bet) What equity do you need to call profitably?",
      "answer": 33.3,
      "answerLabel": "33.3%",
      "formula": "call/(pot+call) = 15/(30+15) = 15/45",
      "detail": "You need 33.3% equity. Getting 2:1 pot odds.",
      "call": 15,
      "pot": 30
    },
    {
      "id": "po_23",
      "category": "potOdds",
      "prompt": "Pot is $50. Villain bets $25. (multiway, flop, half-pot bet) What equity do you need to call profitably?",
      "answer": 33.3,
      "answerLabel": "33.3%",
      "formula": "call/(pot+call) = 25/(50+25) = 25/75",
      "detail": "You need 33.3% equity. Getting 2:1 pot odds.",
      "call": 25,
      "pot": 50
    },
    {
      "id": "po_24",
      "category": "potOdds",
      "prompt": "Pot is $120. Villain bets $40. (multiway, turn, 1/3-pot bet) What equity do you need to call profitably?",
      "answer": 25,
      "answerLabel": "25%",
      "formula": "call/(pot+call) = 40/(120+40) = 40/160",
      "detail": "You need 25% equity. Getting 3:1 pot odds.",
      "call": 40,
      "pot": 120
    },
    {
      "id": "po_25",
      "category": "potOdds",
      "prompt": "Pot is $40. Villain bets $10. (heads-up, flop, quarter-pot bet) What equity do you need to call profitably?",
      "answer": 20,
      "answerLabel": "20%",
      "formula": "call/(pot+call) = 10/(40+10) = 10/50",
      "detail": "You need 20% equity. Getting 4:1 pot odds.",
      "call": 10,
      "pot": 40
    },
    {
      "id": "po_26",
      "category": "potOdds",
      "prompt": "Pot is $14. Villain bets $7. (heads-up, flop, half-pot (small)) What equity do you need to call profitably?",
      "answer": 33.3,
      "answerLabel": "33.3%",
      "formula": "call/(pot+call) = 7/(14+7) = 7/21",
      "detail": "You need 33.3% equity. Getting 2:1 pot odds.",
      "call": 7,
      "pot": 14
    },
    {
      "id": "po_27",
      "category": "potOdds",
      "prompt": "Pot is $200. Villain bets $100. (heads-up, river, half-pot (very large)) What equity do you need to call profitably?",
      "answer": 33.3,
      "answerLabel": "33.3%",
      "formula": "call/(pot+call) = 100/(200+100) = 100/300",
      "detail": "You need 33.3% equity. Getting 2:1 pot odds.",
      "call": 100,
      "pot": 200
    },
    {
      "id": "po_28",
      "category": "potOdds",
      "prompt": "Pot is $44. Villain bets $22. (heads-up, flop, half-pot bet) What equity do you need to call profitably?",
      "answer": 33.3,
      "answerLabel": "33.3%",
      "formula": "call/(pot+call) = 22/(44+22) = 22/66",
      "detail": "You need 33.3% equity. Getting 2:1 pot odds.",
      "call": 22,
      "pot": 44
    },
    {
      "id": "po_29",
      "category": "potOdds",
      "prompt": "Pot is $36. Villain bets $18. (heads-up, turn, half-pot bet) What equity do you need to call profitably?",
      "answer": 33.3,
      "answerLabel": "33.3%",
      "formula": "call/(pot+call) = 18/(36+18) = 18/54",
      "detail": "You need 33.3% equity. Getting 2:1 pot odds.",
      "call": 18,
      "pot": 36
    },
    {
      "id": "po_30",
      "category": "potOdds",
      "prompt": "Pot is $90. Villain bets $45. (heads-up, turn, half-pot bet) What equity do you need to call profitably?",
      "answer": 33.3,
      "answerLabel": "33.3%",
      "formula": "call/(pot+call) = 45/(90+45) = 45/135",
      "detail": "You need 33.3% equity. Getting 2:1 pot odds.",
      "call": 45,
      "pot": 90
    },
    {
      "id": "po_31",
      "category": "potOdds",
      "prompt": "Pot is $33. Villain bets $33. (heads-up, flop, pot-sized overbet) What equity do you need to call profitably?",
      "answer": 50,
      "answerLabel": "50%",
      "formula": "call/(pot+call) = 33/(33+33) = 33/66",
      "detail": "You need 50% equity. Getting 1:1 pot odds.",
      "call": 33,
      "pot": 33
    },
    {
      "id": "po_32",
      "category": "potOdds",
      "prompt": "Pot is $40. Villain bets $60. (heads-up, turn, 1.5x overbet) What equity do you need to call profitably?",
      "answer": 60,
      "answerLabel": "60%",
      "formula": "call/(pot+call) = 60/(40+60) = 60/100",
      "detail": "You need 60% equity. Getting 0.7:1 pot odds.",
      "call": 60,
      "pot": 40
    },
    {
      "id": "po_33",
      "category": "potOdds",
      "prompt": "Pot is $60. Villain bets $80. (heads-up, river, 1.3x overbet) What equity do you need to call profitably?",
      "answer": 57.1,
      "answerLabel": "57.1%",
      "formula": "call/(pot+call) = 80/(60+80) = 80/140",
      "detail": "You need 57.1% equity. Getting 0.8:1 pot odds.",
      "call": 80,
      "pot": 60
    },
    {
      "id": "po_34",
      "category": "potOdds",
      "prompt": "Pot is $150. Villain bets $50. (multiway, turn, 1/3-pot bet) What equity do you need to call profitably?",
      "answer": 25,
      "answerLabel": "25%",
      "formula": "call/(pot+call) = 50/(150+50) = 50/200",
      "detail": "You need 25% equity. Getting 3:1 pot odds.",
      "call": 50,
      "pot": 150
    },
    {
      "id": "po_35",
      "category": "potOdds",
      "prompt": "Pot is $150. Villain bets $75. (heads-up, river, half-pot bet) What equity do you need to call profitably?",
      "answer": 33.3,
      "answerLabel": "33.3%",
      "formula": "call/(pot+call) = 75/(150+75) = 75/225",
      "detail": "You need 33.3% equity. Getting 2:1 pot odds.",
      "call": 75,
      "pot": 150
    }
  ],
  "outs": [
    {
      "id": "outs_1",
      "category": "outs",
      "prompt": "9 cards complete flush draw (flopped fd). How many outs? (flop)",
      "answer": 9,
      "answerLabel": "9 outs",
      "detail": "Two suited cards, two on board. Draw: Flush draw.",
      "drawType": "Flush draw",
      "street": "flop",
      "outs": 9
    },
    {
      "id": "outs_2",
      "category": "outs",
      "prompt": "Open-ended straight draw, 8 outs. How many outs? (flop)",
      "answer": 8,
      "answerLabel": "8 outs",
      "detail": "8-9 on J-7-2: any T or 6 completes. Draw: OESD.",
      "drawType": "OESD",
      "street": "flop",
      "outs": 8
    },
    {
      "id": "outs_3",
      "category": "outs",
      "prompt": "Inside straight draw, 4 outs. How many outs? (flop)",
      "answer": 4,
      "answerLabel": "4 outs",
      "detail": "8-T on J-9-2: only a Q completes. Draw: Gutshot.",
      "drawType": "Gutshot",
      "street": "flop",
      "outs": 4
    },
    {
      "id": "outs_4",
      "category": "outs",
      "prompt": "Flush (9) + OESD (8) - 2 overlap = 15 outs. How many outs? (flop)",
      "answer": 15,
      "answerLabel": "15 outs",
      "detail": "Suited connector with flush and straight draws. Draw: Flush draw + OESD combo.",
      "drawType": "Flush draw + OESD combo",
      "street": "flop",
      "outs": 15
    },
    {
      "id": "outs_5",
      "category": "outs",
      "prompt": "Flush (9) + gutshot (4) - 1 overlap = 12 outs. How many outs? (flop)",
      "answer": 12,
      "answerLabel": "12 outs",
      "detail": "Suited card with inside straight draw. Draw: Flush draw + gutshot.",
      "drawType": "Flush draw + gutshot",
      "street": "flop",
      "outs": 12
    },
    {
      "id": "outs_6",
      "category": "outs",
      "prompt": "Two overcards, 3 outs each = 6 outs. How many outs? (flop)",
      "answer": 6,
      "answerLabel": "6 outs",
      "detail": "A-K on 9-7-2: any ace or king wins. Draw: Two overcards.",
      "drawType": "Two overcards",
      "street": "flop",
      "outs": 6
    },
    {
      "id": "outs_7",
      "category": "outs",
      "prompt": "Pocket pair, 2 outs to hit set. How many outs? (flop)",
      "answer": 2,
      "answerLabel": "2 outs",
      "detail": "Pocket 8s need 8 to hit set. Draw: Set draw.",
      "drawType": "Set draw",
      "street": "flop",
      "outs": 2
    },
    {
      "id": "outs_8",
      "category": "outs",
      "prompt": "Bottom pair + inside straight draw. How many outs? (flop)",
      "answer": 5,
      "answerLabel": "5 outs",
      "detail": "Pair with an inside straight draw. Draw: Pair + gutshot.",
      "drawType": "Pair + gutshot",
      "street": "flop",
      "outs": 5
    },
    {
      "id": "outs_9",
      "category": "outs",
      "prompt": "Middle pair (≈5) + OESD (8) ≈ 14 outs (with overlap). How many outs? (flop)",
      "answer": 14,
      "answerLabel": "14 outs",
      "detail": "Middle pair and open-ended straight draw. Draw: Pair + OESD.",
      "drawType": "Pair + OESD",
      "street": "flop",
      "outs": 14
    },
    {
      "id": "outs_10",
      "category": "outs",
      "prompt": "Flush (9) + overcards (6) - 4 overlap ≈ 11 outs. How many outs? (flop)",
      "answer": 11,
      "answerLabel": "11 outs",
      "detail": "Ace-high flush draw on a low board. Draw: Flush draw + 2 overcards.",
      "drawType": "Flush draw + 2 overcards",
      "street": "flop",
      "outs": 11
    },
    {
      "id": "outs_11",
      "category": "outs",
      "prompt": "Flush draw, 9 outs, turn (1 card to come). How many outs? (turn)",
      "answer": 9,
      "answerLabel": "9 outs",
      "detail": "Missed flush draw on turn. Draw: Flush draw (turn).",
      "drawType": "Flush draw (turn)",
      "street": "turn",
      "outs": 9
    },
    {
      "id": "outs_12",
      "category": "outs",
      "prompt": "OESD, 8 outs, turn (1 card to come). How many outs? (turn)",
      "answer": 8,
      "answerLabel": "8 outs",
      "detail": "Missed straight draw on turn. Draw: OESD (turn).",
      "drawType": "OESD (turn)",
      "street": "turn",
      "outs": 8
    },
    {
      "id": "outs_13",
      "category": "outs",
      "prompt": "Inside straight draw, 4 outs, turn. How many outs? (turn)",
      "answer": 4,
      "answerLabel": "4 outs",
      "detail": "Missed inside straight on turn. Draw: Gutshot (turn).",
      "drawType": "Gutshot (turn)",
      "street": "turn",
      "outs": 4
    },
    {
      "id": "outs_14",
      "category": "outs",
      "prompt": "Pocket pair, 2 outs, turn. How many outs? (turn)",
      "answer": 2,
      "answerLabel": "2 outs",
      "detail": "Missed set on turn, last card. Draw: Set draw (turn).",
      "drawType": "Set draw (turn)",
      "street": "turn",
      "outs": 2
    },
    {
      "id": "outs_15",
      "category": "outs",
      "prompt": "Flush (9) + gutshot (4) - 1 overlap = 12 outs, turn. How many outs? (turn)",
      "answer": 12,
      "answerLabel": "12 outs",
      "detail": "Flush draw + inside straight on turn. Draw: Flush + gutshot (turn).",
      "drawType": "Flush + gutshot (turn)",
      "street": "turn",
      "outs": 12
    },
    {
      "id": "outs_16",
      "category": "outs",
      "prompt": "Two overcards, 6 outs, turn. How many outs? (turn)",
      "answer": 6,
      "answerLabel": "6 outs",
      "detail": "Overcards on turn. Draw: Two overcards (turn).",
      "drawType": "Two overcards (turn)",
      "street": "turn",
      "outs": 6
    },
    {
      "id": "outs_17",
      "category": "outs",
      "prompt": "Three to straight flush (unlikely to materialize). How many outs? (flop)",
      "answer": 3,
      "answerLabel": "3 outs",
      "detail": "Only 3 outs to straight-flush, discuss limitations. Draw: Three to straight flush.",
      "drawType": "Three to straight flush",
      "street": "flop",
      "outs": 3
    },
    {
      "id": "outs_18",
      "category": "outs",
      "prompt": "OESD (8) + 2 overcards (6) - overlap ≈ 10-11 outs. How many outs? (flop)",
      "answer": 10,
      "answerLabel": "10 outs",
      "detail": "Straight draw with overcards. Draw: OESD + overcards.",
      "drawType": "OESD + overcards",
      "street": "flop",
      "outs": 10
    },
    {
      "id": "outs_19",
      "category": "outs",
      "prompt": "Gutshot (4) + pair outs ≈ 7 total. How many outs? (flop)",
      "answer": 7,
      "answerLabel": "7 outs",
      "detail": "Bottom pair with an inside straight draw. Draw: Gutshot + pair.",
      "drawType": "Gutshot + pair",
      "street": "flop",
      "outs": 7
    },
    {
      "id": "outs_20",
      "category": "outs",
      "prompt": "Flush (9) + pair (4) overlapping = ~13 outs. How many outs? (flop)",
      "answer": 13,
      "answerLabel": "13 outs",
      "detail": "Flopped flush draw while pairing the board. Draw: Flush + pair.",
      "drawType": "Flush + pair",
      "street": "flop",
      "outs": 13
    },
    {
      "id": "outs_21",
      "category": "outs",
      "prompt": "Flush (9) + OESD (8) - 2 overlap = 15 outs, turn. How many outs? (turn)",
      "answer": 15,
      "answerLabel": "15 outs",
      "detail": "Big combo draw on turn. Draw: Flush + OESD (turn).",
      "drawType": "Flush + OESD (turn)",
      "street": "turn",
      "outs": 15
    },
    {
      "id": "outs_22",
      "category": "outs",
      "prompt": "One specific out remains (turn, river). How many outs? (turn)",
      "answer": 1,
      "answerLabel": "1 outs",
      "detail": "Only one card in the deck saves you. Draw: One out (turn).",
      "drawType": "One out (turn)",
      "street": "turn",
      "outs": 1
    },
    {
      "id": "outs_23",
      "category": "outs",
      "prompt": "Gutshot (4) + 1 overcard (3) - possible overlap. How many outs? (flop)",
      "answer": 5,
      "answerLabel": "5 outs",
      "detail": "Inside straight + 1 live overcard. Draw: Gutshot + overcard.",
      "drawType": "Gutshot + overcard",
      "street": "flop",
      "outs": 5
    },
    {
      "id": "outs_24",
      "category": "outs",
      "prompt": "Flush (9) + 2 overcards (6) - overlap ≈ 11 outs, turn. How many outs? (turn)",
      "answer": 11,
      "answerLabel": "11 outs",
      "detail": "Flush draw with overcards on turn. Draw: Flush + overcards (turn).",
      "drawType": "Flush + overcards (turn)",
      "street": "turn",
      "outs": 11
    },
    {
      "id": "outs_25",
      "category": "outs",
      "prompt": "Flush + OESD + overcard ≈ 16-17 outs. How many outs? (flop)",
      "answer": 16,
      "answerLabel": "16 outs",
      "detail": "Maximum draw: flush, straight, and overcard outs. Draw: Monster combo draw.",
      "drawType": "Monster combo draw",
      "street": "flop",
      "outs": 16
    }
  ],
  "equity": [
    {
      "id": "eq_1",
      "category": "equity",
      "prompt": "You have 9 outs on the flop (Flush draw). What is your equity (flop-to-river, 2 cards to come)?",
      "answer": 35,
      "answerLabel": "35% exact / Rule of 4: ~36%",
      "formula": "1-(47-9)/47×(46-9)/46 = 35%",
      "detail": "Flush draw, flop. Exact: 35%. Rule of 4: ~36%.",
      "drawName": "Flush draw",
      "street": "flop",
      "outs": 9,
      "ruleApprox": 36
    },
    {
      "id": "eq_2",
      "category": "equity",
      "prompt": "You have 8 outs on the flop (OESD). What is your equity (flop-to-river, 2 cards to come)?",
      "answer": 31.5,
      "answerLabel": "31.5% exact / Rule of 4: ~32%",
      "formula": "1-(47-8)/47×(46-8)/46 = 31.5%",
      "detail": "OESD, flop. Exact: 31.5%. Rule of 4: ~32%.",
      "drawName": "OESD",
      "street": "flop",
      "outs": 8,
      "ruleApprox": 32
    },
    {
      "id": "eq_3",
      "category": "equity",
      "prompt": "You have 4 outs on the flop (Gutshot). What is your equity (flop-to-river, 2 cards to come)?",
      "answer": 16.5,
      "answerLabel": "16.5% exact / Rule of 4: ~16%",
      "formula": "1-(47-4)/47×(46-4)/46 = 16.5%",
      "detail": "Gutshot, flop. Exact: 16.5%. Rule of 4: ~16%.",
      "drawName": "Gutshot",
      "street": "flop",
      "outs": 4,
      "ruleApprox": 16
    },
    {
      "id": "eq_4",
      "category": "equity",
      "prompt": "You have 15 outs on the flop (Flush+OESD combo). What is your equity (flop-to-river, 2 cards to come)?",
      "answer": 54.1,
      "answerLabel": "54.1% exact / Rule of 4: ~60%",
      "formula": "1-(47-15)/47×(46-15)/46 = 54.1%",
      "detail": "Flush+OESD combo, flop. Exact: 54.1%. Rule of 4: ~60%.",
      "drawName": "Flush+OESD combo",
      "street": "flop",
      "outs": 15,
      "ruleApprox": 60
    },
    {
      "id": "eq_5",
      "category": "equity",
      "prompt": "You have 12 outs on the flop (Flush+gutshot combo). What is your equity (flop-to-river, 2 cards to come)?",
      "answer": 45,
      "answerLabel": "45% exact / Rule of 4: ~48%",
      "formula": "1-(47-12)/47×(46-12)/46 = 45%",
      "detail": "Flush+gutshot combo, flop. Exact: 45%. Rule of 4: ~48%.",
      "drawName": "Flush+gutshot combo",
      "street": "flop",
      "outs": 12,
      "ruleApprox": 48
    },
    {
      "id": "eq_6",
      "category": "equity",
      "prompt": "You have 6 outs on the flop (Two overcards). What is your equity (flop-to-river, 2 cards to come)?",
      "answer": 24.1,
      "answerLabel": "24.1% exact / Rule of 4: ~24%",
      "formula": "1-(47-6)/47×(46-6)/46 = 24.1%",
      "detail": "Two overcards, flop. Exact: 24.1%. Rule of 4: ~24%.",
      "drawName": "Two overcards",
      "street": "flop",
      "outs": 6,
      "ruleApprox": 24
    },
    {
      "id": "eq_7",
      "category": "equity",
      "prompt": "You have 2 outs on the flop (Set draw). What is your equity (flop-to-river, 2 cards to come)?",
      "answer": 8.4,
      "answerLabel": "8.4% exact / Rule of 4: ~8%",
      "formula": "1-(47-2)/47×(46-2)/46 = 8.4%",
      "detail": "Set draw, flop. Exact: 8.4%. Rule of 4: ~8%.",
      "drawName": "Set draw",
      "street": "flop",
      "outs": 2,
      "ruleApprox": 8
    },
    {
      "id": "eq_8",
      "category": "equity",
      "prompt": "You have 11 outs on the flop (Flush draw + overcards). What is your equity (flop-to-river, 2 cards to come)?",
      "answer": 41.7,
      "answerLabel": "41.7% exact / Rule of 4: ~44%",
      "formula": "1-(47-11)/47×(46-11)/46 = 41.7%",
      "detail": "Flush draw + overcards, flop. Exact: 41.7%. Rule of 4: ~44%.",
      "drawName": "Flush draw + overcards",
      "street": "flop",
      "outs": 11,
      "ruleApprox": 44
    },
    {
      "id": "eq_9",
      "category": "equity",
      "prompt": "You have 14 outs on the flop (Pair + OESD). What is your equity (flop-to-river, 2 cards to come)?",
      "answer": 51.2,
      "answerLabel": "51.2% exact / Rule of 4: ~56%",
      "formula": "1-(47-14)/47×(46-14)/46 = 51.2%",
      "detail": "Pair + OESD, flop. Exact: 51.2%. Rule of 4: ~56%.",
      "drawName": "Pair + OESD",
      "street": "flop",
      "outs": 14,
      "ruleApprox": 56
    },
    {
      "id": "eq_10",
      "category": "equity",
      "prompt": "You have 10 outs on the flop (OESD + overcards). What is your equity (flop-to-river, 2 cards to come)?",
      "answer": 38.4,
      "answerLabel": "38.4% exact / Rule of 4: ~40%",
      "formula": "1-(47-10)/47×(46-10)/46 = 38.4%",
      "detail": "OESD + overcards, flop. Exact: 38.4%. Rule of 4: ~40%.",
      "drawName": "OESD + overcards",
      "street": "flop",
      "outs": 10,
      "ruleApprox": 40
    },
    {
      "id": "eq_11",
      "category": "equity",
      "prompt": "You have 13 outs on the flop (Flush draw + pair). What is your equity (flop-to-river, 2 cards to come)?",
      "answer": 48.1,
      "answerLabel": "48.1% exact / Rule of 4: ~52%",
      "formula": "1-(47-13)/47×(46-13)/46 = 48.1%",
      "detail": "Flush draw + pair, flop. Exact: 48.1%. Rule of 4: ~52%.",
      "drawName": "Flush draw + pair",
      "street": "flop",
      "outs": 13,
      "ruleApprox": 52
    },
    {
      "id": "eq_12",
      "category": "equity",
      "prompt": "You have 5 outs on the flop (Gutshot + overcards). What is your equity (flop-to-river, 2 cards to come)?",
      "answer": 20.4,
      "answerLabel": "20.4% exact / Rule of 4: ~20%",
      "formula": "1-(47-5)/47×(46-5)/46 = 20.4%",
      "detail": "Gutshot + overcards, flop. Exact: 20.4%. Rule of 4: ~20%.",
      "drawName": "Gutshot + overcards",
      "street": "flop",
      "outs": 5,
      "ruleApprox": 20
    },
    {
      "id": "eq_13",
      "category": "equity",
      "prompt": "You have 7 outs on the flop (Gutshot + pair). What is your equity (flop-to-river, 2 cards to come)?",
      "answer": 27.8,
      "answerLabel": "27.8% exact / Rule of 4: ~28%",
      "formula": "1-(47-7)/47×(46-7)/46 = 27.8%",
      "detail": "Gutshot + pair, flop. Exact: 27.8%. Rule of 4: ~28%.",
      "drawName": "Gutshot + pair",
      "street": "flop",
      "outs": 7,
      "ruleApprox": 28
    },
    {
      "id": "eq_14",
      "category": "equity",
      "prompt": "You have 3 outs on the flop (Three marginal outs). What is your equity (flop-to-river, 2 cards to come)?",
      "answer": 12.5,
      "answerLabel": "12.5% exact / Rule of 4: ~12%",
      "formula": "1-(47-3)/47×(46-3)/46 = 12.5%",
      "detail": "Three marginal outs, flop. Exact: 12.5%. Rule of 4: ~12%.",
      "drawName": "Three marginal outs",
      "street": "flop",
      "outs": 3,
      "ruleApprox": 12
    },
    {
      "id": "eq_15",
      "category": "equity",
      "prompt": "You have 16 outs on the flop (Monster combo draw). What is your equity (flop-to-river, 2 cards to come)?",
      "answer": 57,
      "answerLabel": "57% exact / Rule of 4: ~64%",
      "formula": "1-(47-16)/47×(46-16)/46 = 57%",
      "detail": "Monster combo draw, flop. Exact: 57%. Rule of 4: ~64%.",
      "drawName": "Monster combo draw",
      "street": "flop",
      "outs": 16,
      "ruleApprox": 64
    },
    {
      "id": "eq_16",
      "category": "equity",
      "prompt": "You have 9 outs on the turn (Flush draw). What is your equity (turn-to-river, 1 card to come)?",
      "answer": 19.6,
      "answerLabel": "19.6% exact / Rule of 2: ~18%",
      "formula": "9/46 = 19.6%",
      "detail": "Flush draw, turn. Exact: 19.6%. Rule of 2: ~18%.",
      "drawName": "Flush draw",
      "street": "turn",
      "outs": 9,
      "ruleApprox": 18
    },
    {
      "id": "eq_17",
      "category": "equity",
      "prompt": "You have 8 outs on the turn (OESD). What is your equity (turn-to-river, 1 card to come)?",
      "answer": 17.4,
      "answerLabel": "17.4% exact / Rule of 2: ~16%",
      "formula": "8/46 = 17.4%",
      "detail": "OESD, turn. Exact: 17.4%. Rule of 2: ~16%.",
      "drawName": "OESD",
      "street": "turn",
      "outs": 8,
      "ruleApprox": 16
    },
    {
      "id": "eq_18",
      "category": "equity",
      "prompt": "You have 4 outs on the turn (Gutshot). What is your equity (turn-to-river, 1 card to come)?",
      "answer": 8.7,
      "answerLabel": "8.7% exact / Rule of 2: ~8%",
      "formula": "4/46 = 8.7%",
      "detail": "Gutshot, turn. Exact: 8.7%. Rule of 2: ~8%.",
      "drawName": "Gutshot",
      "street": "turn",
      "outs": 4,
      "ruleApprox": 8
    },
    {
      "id": "eq_19",
      "category": "equity",
      "prompt": "You have 2 outs on the turn (Set draw). What is your equity (turn-to-river, 1 card to come)?",
      "answer": 4.3,
      "answerLabel": "4.3% exact / Rule of 2: ~4%",
      "formula": "2/46 = 4.3%",
      "detail": "Set draw, turn. Exact: 4.3%. Rule of 2: ~4%.",
      "drawName": "Set draw",
      "street": "turn",
      "outs": 2,
      "ruleApprox": 4
    },
    {
      "id": "eq_20",
      "category": "equity",
      "prompt": "You have 12 outs on the turn (Flush+gutshot combo). What is your equity (turn-to-river, 1 card to come)?",
      "answer": 26.1,
      "answerLabel": "26.1% exact / Rule of 2: ~24%",
      "formula": "12/46 = 26.1%",
      "detail": "Flush+gutshot combo, turn. Exact: 26.1%. Rule of 2: ~24%.",
      "drawName": "Flush+gutshot combo",
      "street": "turn",
      "outs": 12,
      "ruleApprox": 24
    },
    {
      "id": "eq_21",
      "category": "equity",
      "prompt": "You have 6 outs on the turn (Two overcards). What is your equity (turn-to-river, 1 card to come)?",
      "answer": 13,
      "answerLabel": "13% exact / Rule of 2: ~12%",
      "formula": "6/46 = 13%",
      "detail": "Two overcards, turn. Exact: 13%. Rule of 2: ~12%.",
      "drawName": "Two overcards",
      "street": "turn",
      "outs": 6,
      "ruleApprox": 12
    },
    {
      "id": "eq_22",
      "category": "equity",
      "prompt": "You have 15 outs on the turn (Flush+OESD combo). What is your equity (turn-to-river, 1 card to come)?",
      "answer": 32.6,
      "answerLabel": "32.6% exact / Rule of 2: ~30%",
      "formula": "15/46 = 32.6%",
      "detail": "Flush+OESD combo, turn. Exact: 32.6%. Rule of 2: ~30%.",
      "drawName": "Flush+OESD combo",
      "street": "turn",
      "outs": 15,
      "ruleApprox": 30
    },
    {
      "id": "eq_23",
      "category": "equity",
      "prompt": "You have 11 outs on the turn (Flush draw + overcards). What is your equity (turn-to-river, 1 card to come)?",
      "answer": 23.9,
      "answerLabel": "23.9% exact / Rule of 2: ~22%",
      "formula": "11/46 = 23.9%",
      "detail": "Flush draw + overcards, turn. Exact: 23.9%. Rule of 2: ~22%.",
      "drawName": "Flush draw + overcards",
      "street": "turn",
      "outs": 11,
      "ruleApprox": 22
    },
    {
      "id": "eq_24",
      "category": "equity",
      "prompt": "You have 5 outs on the turn (Gutshot + 1 overcard). What is your equity (turn-to-river, 1 card to come)?",
      "answer": 10.9,
      "answerLabel": "10.9% exact / Rule of 2: ~10%",
      "formula": "5/46 = 10.9%",
      "detail": "Gutshot + 1 overcard, turn. Exact: 10.9%. Rule of 2: ~10%.",
      "drawName": "Gutshot + 1 overcard",
      "street": "turn",
      "outs": 5,
      "ruleApprox": 10
    },
    {
      "id": "eq_25",
      "category": "equity",
      "prompt": "You have 3 outs on the turn (Three outs). What is your equity (turn-to-river, 1 card to come)?",
      "answer": 6.5,
      "answerLabel": "6.5% exact / Rule of 2: ~6%",
      "formula": "3/46 = 6.5%",
      "detail": "Three outs, turn. Exact: 6.5%. Rule of 2: ~6%.",
      "drawName": "Three outs",
      "street": "turn",
      "outs": 3,
      "ruleApprox": 6
    },
    {
      "id": "eq_26",
      "category": "equity",
      "prompt": "You have 1 outs on the turn (One out). What is your equity (turn-to-river, 1 card to come)?",
      "answer": 2.2,
      "answerLabel": "2.2% exact / Rule of 2: ~2%",
      "formula": "1/46 = 2.2%",
      "detail": "One out, turn. Exact: 2.2%. Rule of 2: ~2%.",
      "drawName": "One out",
      "street": "turn",
      "outs": 1,
      "ruleApprox": 2
    },
    {
      "id": "eq_27",
      "category": "equity",
      "prompt": "You have 10 outs on the turn (OESD + overcards). What is your equity (turn-to-river, 1 card to come)?",
      "answer": 21.7,
      "answerLabel": "21.7% exact / Rule of 2: ~20%",
      "formula": "10/46 = 21.7%",
      "detail": "OESD + overcards, turn. Exact: 21.7%. Rule of 2: ~20%.",
      "drawName": "OESD + overcards",
      "street": "turn",
      "outs": 10,
      "ruleApprox": 20
    },
    {
      "id": "eq_28",
      "category": "equity",
      "prompt": "You have 7 outs on the turn (Gutshot + pair). What is your equity (turn-to-river, 1 card to come)?",
      "answer": 15.2,
      "answerLabel": "15.2% exact / Rule of 2: ~14%",
      "formula": "7/46 = 15.2%",
      "detail": "Gutshot + pair, turn. Exact: 15.2%. Rule of 2: ~14%.",
      "drawName": "Gutshot + pair",
      "street": "turn",
      "outs": 7,
      "ruleApprox": 14
    },
    {
      "id": "eq_29",
      "category": "equity",
      "prompt": "You have 14 outs on the turn (Pair + OESD). What is your equity (turn-to-river, 1 card to come)?",
      "answer": 30.4,
      "answerLabel": "30.4% exact / Rule of 2: ~28%",
      "formula": "14/46 = 30.4%",
      "detail": "Pair + OESD, turn. Exact: 30.4%. Rule of 2: ~28%.",
      "drawName": "Pair + OESD",
      "street": "turn",
      "outs": 14,
      "ruleApprox": 28
    },
    {
      "id": "eq_30",
      "category": "equity",
      "prompt": "You have 13 outs on the turn (Flush draw + pair). What is your equity (turn-to-river, 1 card to come)?",
      "answer": 28.3,
      "answerLabel": "28.3% exact / Rule of 2: ~26%",
      "formula": "13/46 = 28.3%",
      "detail": "Flush draw + pair, turn. Exact: 28.3%. Rule of 2: ~26%.",
      "drawName": "Flush draw + pair",
      "street": "turn",
      "outs": 13,
      "ruleApprox": 26
    }
  ],
  "handReview": [
    {
      "id": "hr_1",
      "category": "handReview",
      "handId": "2731956194",
      "prompt": "Real hand review — $1.00/$2.00, UTG\nHero: Ac Ts | Board: 7d 2c Td 6s 2s | Result: -$1.17 (No showdown)\n\nAction:\n    PREFLOP: PopeMyCherry raises $5.00 to $5.00\n    PREFLOP: PopeMyCherry calls $10.00\n    FLOP: PopeMyCherry checks\n    FLOP: PopeMyCherry calls $10.23\n    TURN: PopeMyCherry checks\n    RIVER: PopeMyCherry bets $26.73\n\nQuestion: Identify hero's hand strength on the flop. Any draws? Was the action reasonable?",
      "answer": "review",
      "answerLabel": "Review — see detail",
      "detail": "Hero held Ac Ts on board 7d 2c Td 6s 2s. Result: -$1.17. This is a real hand from your session history — analyze the line, not a hypothetical.",
      "heroCards": "Ac Ts",
      "board": [
        "7d",
        "2c",
        "Td",
        "6s",
        "2s"
      ],
      "net": -1.17,
      "position": "UTG",
      "actions": [
        "PREFLOP: PopeMyCherry raises $5.00 to $5.00",
        "PREFLOP: PopeMyCherry calls $10.00",
        "FLOP: PopeMyCherry checks",
        "FLOP: PopeMyCherry calls $10.23",
        "TURN: PopeMyCherry checks",
        "RIVER: PopeMyCherry bets $26.73"
      ],
      "stakes": "$1.00/$2.00"
    },
    {
      "id": "hr_2",
      "category": "handReview",
      "handId": "2731956941",
      "prompt": "Real hand review — $1.00/$2.00, BB\nHero: As 5s | Board: Ad 4c Tc Qs | Result: +$2.40 (No showdown)\n\nAction:\n    PREFLOP: PopeMyCherry posts the big blind $2.00\n    PREFLOP: PopeMyCherry calls $3.00\n    FLOP: PopeMyCherry calls $5.00\n    TURN: PopeMyCherry bets $6.60\n\nQuestion: Identify hero's hand strength on the flop. Any draws? Was the action reasonable?",
      "answer": "review",
      "answerLabel": "Review — see detail",
      "detail": "Hero held As 5s on board Ad 4c Tc Qs. Result: +$2.40. This is a real hand from your session history — analyze the line, not a hypothetical.",
      "heroCards": "As 5s",
      "board": [
        "Ad",
        "4c",
        "Tc",
        "Qs"
      ],
      "net": 2.4,
      "position": "BB",
      "actions": [
        "PREFLOP: PopeMyCherry posts the big blind $2.00",
        "PREFLOP: PopeMyCherry calls $3.00",
        "FLOP: PopeMyCherry calls $5.00",
        "TURN: PopeMyCherry bets $6.60"
      ],
      "stakes": "$1.00/$2.00"
    },
    {
      "id": "hr_3",
      "category": "handReview",
      "handId": "2731959849",
      "prompt": "Real hand review — $1.00/$2.00, BTN\nHero: Qd Td | Board: 5h Ks 3s Kh 2h | Result: -$4.00 (No showdown)\n\nAction:\n    PREFLOP: PopeMyCherry calls $4.00\n    FLOP: PopeMyCherry folds\n\nQuestion: Identify hero's hand strength on the flop. Any draws? Was the action reasonable?",
      "answer": "review",
      "answerLabel": "Review — see detail",
      "detail": "Hero held Qd Td on board 5h Ks 3s Kh 2h. Result: -$4.00. This is a real hand from your session history — analyze the line, not a hypothetical.",
      "heroCards": "Qd Td",
      "board": [
        "5h",
        "Ks",
        "3s",
        "Kh",
        "2h"
      ],
      "net": -4,
      "position": "BTN",
      "actions": [
        "PREFLOP: PopeMyCherry calls $4.00",
        "FLOP: PopeMyCherry folds"
      ],
      "stakes": "$1.00/$2.00"
    },
    {
      "id": "hr_4",
      "category": "handReview",
      "handId": "2731960706",
      "prompt": "Real hand review — $1.00/$2.00, HJ\nHero: Jh Ad | Board: 7c Qh Jd | Result: +$0.78 (No showdown)\n\nAction:\n    PREFLOP: PopeMyCherry calls $5.75\n    FLOP: PopeMyCherry bets $7.25\n\nQuestion: Identify hero's hand strength on the flop. Any draws? Was the action reasonable?",
      "answer": "review",
      "answerLabel": "Review — see detail",
      "detail": "Hero held Jh Ad on board 7c Qh Jd. Result: +$0.78. This is a real hand from your session history — analyze the line, not a hypothetical.",
      "heroCards": "Jh Ad",
      "board": [
        "7c",
        "Qh",
        "Jd"
      ],
      "net": 0.78,
      "position": "HJ",
      "actions": [
        "PREFLOP: PopeMyCherry calls $5.75",
        "FLOP: PopeMyCherry bets $7.25"
      ],
      "stakes": "$1.00/$2.00"
    },
    {
      "id": "hr_5",
      "category": "handReview",
      "handId": "2731961334",
      "prompt": "Real hand review — $1.00/$2.00, BB\nHero: Ts Qd | Board: 4s Kc Ah Kd 2s | Result: -$9.00 (Lost at showdown)\n\nAction:\n    PREFLOP: PopeMyCherry posts the big blind $2.00\n    PREFLOP: PopeMyCherry calls $3.00\n    FLOP: PopeMyCherry checks\n    TURN: PopeMyCherry bets $4.00\n    RIVER: PopeMyCherry checks\n\nQuestion: Identify hero's hand strength on the flop. Any draws? Was the action reasonable?",
      "answer": "review",
      "answerLabel": "Review — see detail",
      "detail": "Hero held Ts Qd on board 4s Kc Ah Kd 2s. Result: -$9.00. This is a real hand from your session history — analyze the line, not a hypothetical.",
      "heroCards": "Ts Qd",
      "board": [
        "4s",
        "Kc",
        "Ah",
        "Kd",
        "2s"
      ],
      "net": -9,
      "position": "BB",
      "actions": [
        "PREFLOP: PopeMyCherry posts the big blind $2.00",
        "PREFLOP: PopeMyCherry calls $3.00",
        "FLOP: PopeMyCherry checks",
        "TURN: PopeMyCherry bets $4.00",
        "RIVER: PopeMyCherry checks"
      ],
      "stakes": "$1.00/$2.00"
    },
    {
      "id": "hr_6",
      "category": "handReview",
      "handId": "2731962642",
      "prompt": "Real hand review — $1.00/$2.00, BB\nHero: 8c 8h | Board: 9c Th 6h 2s 5d | Result: -$15.27 (No showdown)\n\nAction:\n    PREFLOP: PopeMyCherry posts the big blind $2.00\n    PREFLOP: PopeMyCherry calls $3.00\n    FLOP: PopeMyCherry checks\n    TURN: PopeMyCherry bets $4.00\n    RIVER: PopeMyCherry bets $6.27\n    RIVER: PopeMyCherry folds\n\nQuestion: Identify hero's hand strength on the flop. Any draws? Was the action reasonable?",
      "answer": "review",
      "answerLabel": "Review — see detail",
      "detail": "Hero held 8c 8h on board 9c Th 6h 2s 5d. Result: -$15.27. This is a real hand from your session history — analyze the line, not a hypothetical.",
      "heroCards": "8c 8h",
      "board": [
        "9c",
        "Th",
        "6h",
        "2s",
        "5d"
      ],
      "net": -15.27,
      "position": "BB",
      "actions": [
        "PREFLOP: PopeMyCherry posts the big blind $2.00",
        "PREFLOP: PopeMyCherry calls $3.00",
        "FLOP: PopeMyCherry checks",
        "TURN: PopeMyCherry bets $4.00",
        "RIVER: PopeMyCherry bets $6.27",
        "RIVER: PopeMyCherry folds"
      ],
      "stakes": "$1.00/$2.00"
    },
    {
      "id": "hr_7",
      "category": "handReview",
      "handId": "2731964234",
      "prompt": "Real hand review — $1.00/$2.00, BB\nHero: Ad 9d | Board: 5d 3c 5s Tc | Result: -$10.00 (No showdown)\n\nAction:\n    PREFLOP: PopeMyCherry posts the big blind $2.00\n    PREFLOP: PopeMyCherry calls $3.00\n    FLOP: PopeMyCherry calls $5.00\n    TURN: PopeMyCherry folds\n\nQuestion: Identify hero's hand strength on the flop. Any draws? Was the action reasonable?",
      "answer": "review",
      "answerLabel": "Review — see detail",
      "detail": "Hero held Ad 9d on board 5d 3c 5s Tc. Result: -$10.00. This is a real hand from your session history — analyze the line, not a hypothetical.",
      "heroCards": "Ad 9d",
      "board": [
        "5d",
        "3c",
        "5s",
        "Tc"
      ],
      "net": -10,
      "position": "BB",
      "actions": [
        "PREFLOP: PopeMyCherry posts the big blind $2.00",
        "PREFLOP: PopeMyCherry calls $3.00",
        "FLOP: PopeMyCherry calls $5.00",
        "TURN: PopeMyCherry folds"
      ],
      "stakes": "$1.00/$2.00"
    },
    {
      "id": "hr_8",
      "category": "handReview",
      "handId": "2731964537",
      "prompt": "Real hand review — $1.00/$2.00, SB\nHero: 9h As | Board: 9s 3s 3h 9d 2s | Result: +$12.60 (Won at showdown)\n\nAction:\n    PREFLOP: PopeMyCherry posts the small blind $1.00\n    PREFLOP: PopeMyCherry raises $3.00 to $4.00\n    FLOP: PopeMyCherry bets $3.00\n    TURN: PopeMyCherry checks\n    RIVER: PopeMyCherry bets $7.00\n\nQuestion: Identify hero's hand strength on the flop. Any draws? Was the action reasonable?",
      "answer": "review",
      "answerLabel": "Review — see detail",
      "detail": "Hero held 9h As on board 9s 3s 3h 9d 2s. Result: +$12.60. This is a real hand from your session history — analyze the line, not a hypothetical.",
      "heroCards": "9h As",
      "board": [
        "9s",
        "3s",
        "3h",
        "9d",
        "2s"
      ],
      "net": 12.6,
      "position": "SB",
      "actions": [
        "PREFLOP: PopeMyCherry posts the small blind $1.00",
        "PREFLOP: PopeMyCherry raises $3.00 to $4.00",
        "FLOP: PopeMyCherry bets $3.00",
        "TURN: PopeMyCherry checks",
        "RIVER: PopeMyCherry bets $7.00"
      ],
      "stakes": "$1.00/$2.00"
    },
    {
      "id": "hr_9",
      "category": "handReview",
      "handId": "2731966636",
      "prompt": "Real hand review — $1.00/$2.00, BTN\nHero: Js Ks | Board: 7c 2s 4c 8d 7d | Result: -$13.00 (Lost at showdown)\n\nAction:\n    PREFLOP: PopeMyCherry calls $5.75\n    FLOP: PopeMyCherry calls $7.25\n    TURN: PopeMyCherry checks\n    RIVER: PopeMyCherry checks\n\nQuestion: Identify hero's hand strength on the flop. Any draws? Was the action reasonable?",
      "answer": "review",
      "answerLabel": "Review — see detail",
      "detail": "Hero held Js Ks on board 7c 2s 4c 8d 7d. Result: -$13.00. This is a real hand from your session history — analyze the line, not a hypothetical.",
      "heroCards": "Js Ks",
      "board": [
        "7c",
        "2s",
        "4c",
        "8d",
        "7d"
      ],
      "net": -13,
      "position": "BTN",
      "actions": [
        "PREFLOP: PopeMyCherry calls $5.75",
        "FLOP: PopeMyCherry calls $7.25",
        "TURN: PopeMyCherry checks",
        "RIVER: PopeMyCherry checks"
      ],
      "stakes": "$1.00/$2.00"
    },
    {
      "id": "hr_10",
      "category": "handReview",
      "handId": "2731967992",
      "prompt": "Real hand review — $1.00/$2.00, BTN\nHero: Jh Kh | Board: 9h 3c Jd | Result: +$1.82 (No showdown)\n\nAction:\n    PREFLOP: PopeMyCherry raises $5.00 to $5.00\n    FLOP: PopeMyCherry bets $3.63\n\nQuestion: Identify hero's hand strength on the flop. Any draws? Was the action reasonable?",
      "answer": "review",
      "answerLabel": "Review — see detail",
      "detail": "Hero held Jh Kh on board 9h 3c Jd. Result: +$1.82. This is a real hand from your session history — analyze the line, not a hypothetical.",
      "heroCards": "Jh Kh",
      "board": [
        "9h",
        "3c",
        "Jd"
      ],
      "net": 1.82,
      "position": "BTN",
      "actions": [
        "PREFLOP: PopeMyCherry raises $5.00 to $5.00",
        "FLOP: PopeMyCherry bets $3.63"
      ],
      "stakes": "$1.00/$2.00"
    },
    {
      "id": "hr_11",
      "category": "handReview",
      "handId": "2731970387",
      "prompt": "Real hand review — $1.00/$2.00, BB\nHero: 4h 9c | Board: Jc 4d 7c 3s | Result: -$9.50 (No showdown)\n\nAction:\n    PREFLOP: PopeMyCherry posts the big blind $2.00\n    PREFLOP: PopeMyCherry calls $2.50\n    FLOP: PopeMyCherry checks\n    TURN: PopeMyCherry bets $5.00\n    TURN: PopeMyCherry folds\n\nQuestion: Identify hero's hand strength on the flop. Any draws? Was the action reasonable?",
      "answer": "review",
      "answerLabel": "Review — see detail",
      "detail": "Hero held 4h 9c on board Jc 4d 7c 3s. Result: -$9.50. This is a real hand from your session history — analyze the line, not a hypothetical.",
      "heroCards": "4h 9c",
      "board": [
        "Jc",
        "4d",
        "7c",
        "3s"
      ],
      "net": -9.5,
      "position": "BB",
      "actions": [
        "PREFLOP: PopeMyCherry posts the big blind $2.00",
        "PREFLOP: PopeMyCherry calls $2.50",
        "FLOP: PopeMyCherry checks",
        "TURN: PopeMyCherry bets $5.00",
        "TURN: PopeMyCherry folds"
      ],
      "stakes": "$1.00/$2.00"
    },
    {
      "id": "hr_12",
      "category": "handReview",
      "handId": "2731972193",
      "prompt": "Real hand review — $1.00/$2.00, BB\nHero: Ac 8s | Board: 5h 4d Jc | Result: -$5.00 (No showdown)\n\nAction:\n    PREFLOP: PopeMyCherry posts the big blind $2.00\n    PREFLOP: PopeMyCherry calls $3.00\n    FLOP: PopeMyCherry checks\n    FLOP: PopeMyCherry folds\n\nQuestion: Identify hero's hand strength on the flop. Any draws? Was the action reasonable?",
      "answer": "review",
      "answerLabel": "Review — see detail",
      "detail": "Hero held Ac 8s on board 5h 4d Jc. Result: -$5.00. This is a real hand from your session history — analyze the line, not a hypothetical.",
      "heroCards": "Ac 8s",
      "board": [
        "5h",
        "4d",
        "Jc"
      ],
      "net": -5,
      "position": "BB",
      "actions": [
        "PREFLOP: PopeMyCherry posts the big blind $2.00",
        "PREFLOP: PopeMyCherry calls $3.00",
        "FLOP: PopeMyCherry checks",
        "FLOP: PopeMyCherry folds"
      ],
      "stakes": "$1.00/$2.00"
    },
    {
      "id": "hr_13",
      "category": "handReview",
      "handId": "2731972844",
      "prompt": "Real hand review — $1.00/$2.00, BTN\nHero: 8c Qd | Board: 9s 3c Qc 7s | Result: -$0.41 (No showdown)\n\nAction:\n    PREFLOP: PopeMyCherry raises $5.00 to $5.00\n    FLOP: PopeMyCherry bets $3.63\n    TURN: PopeMyCherry bets $9.13\n\nQuestion: Identify hero's hand strength on the flop. Any draws? Was the action reasonable?",
      "answer": "review",
      "answerLabel": "Review — see detail",
      "detail": "Hero held 8c Qd on board 9s 3c Qc 7s. Result: -$0.41. This is a real hand from your session history — analyze the line, not a hypothetical.",
      "heroCards": "8c Qd",
      "board": [
        "9s",
        "3c",
        "Qc",
        "7s"
      ],
      "net": -0.41,
      "position": "BTN",
      "actions": [
        "PREFLOP: PopeMyCherry raises $5.00 to $5.00",
        "FLOP: PopeMyCherry bets $3.63",
        "TURN: PopeMyCherry bets $9.13"
      ],
      "stakes": "$1.00/$2.00"
    },
    {
      "id": "hr_14",
      "category": "handReview",
      "handId": "2731973203",
      "prompt": "Real hand review — $1.00/$2.00, HJ\nHero: Jh Kh | Board: 3h Ks 6h | Result: +$5.57 (No showdown)\n\nAction:\n    PREFLOP: PopeMyCherry calls $5.75\n    FLOP: PopeMyCherry bets $6.02\n\nQuestion: Identify hero's hand strength on the flop. Any draws? Was the action reasonable?",
      "answer": "review",
      "answerLabel": "Review — see detail",
      "detail": "Hero held Jh Kh on board 3h Ks 6h. Result: +$5.57. This is a real hand from your session history — analyze the line, not a hypothetical.",
      "heroCards": "Jh Kh",
      "board": [
        "3h",
        "Ks",
        "6h"
      ],
      "net": 5.57,
      "position": "HJ",
      "actions": [
        "PREFLOP: PopeMyCherry calls $5.75",
        "FLOP: PopeMyCherry bets $6.02"
      ],
      "stakes": "$1.00/$2.00"
    },
    {
      "id": "hr_15",
      "category": "handReview",
      "handId": "2731973564",
      "prompt": "Real hand review — $1.00/$2.00, SB\nHero: 6d 8d | Board: Kd Ks 6s Ah Kh | Result: +$10.13 (Won at showdown)\n\nAction:\n    PREFLOP: PopeMyCherry posts the small blind $1.00\n    PREFLOP: PopeMyCherry calls $3.00\n    FLOP: PopeMyCherry checks\n    FLOP: PopeMyCherry calls $3.14\n    TURN: PopeMyCherry checks\n    RIVER: PopeMyCherry bets $2.00\n\nQuestion: Identify hero's hand strength on the flop. Any draws? Was the action reasonable?",
      "answer": "review",
      "answerLabel": "Review — see detail",
      "detail": "Hero held 6d 8d on board Kd Ks 6s Ah Kh. Result: +$10.13. This is a real hand from your session history — analyze the line, not a hypothetical.",
      "heroCards": "6d 8d",
      "board": [
        "Kd",
        "Ks",
        "6s",
        "Ah",
        "Kh"
      ],
      "net": 10.13,
      "position": "SB",
      "actions": [
        "PREFLOP: PopeMyCherry posts the small blind $1.00",
        "PREFLOP: PopeMyCherry calls $3.00",
        "FLOP: PopeMyCherry checks",
        "FLOP: PopeMyCherry calls $3.14",
        "TURN: PopeMyCherry checks",
        "RIVER: PopeMyCherry bets $2.00"
      ],
      "stakes": "$1.00/$2.00"
    },
    {
      "id": "hr_16",
      "category": "handReview",
      "handId": "2731977438",
      "prompt": "Real hand review — $1.00/$2.00, UTG\nHero: Ah Qs | Board: 2d 8c Jh Ac 8s | Result: +$65.86 (Won at showdown)\n\nAction:\n    PREFLOP: PopeMyCherry raises $5.00 to $5.00\n    PREFLOP: PopeMyCherry calls $10.00\n    FLOP: PopeMyCherry checks\n    FLOP: PopeMyCherry calls $15.68\n    TURN: PopeMyCherry checks\n    RIVER: PopeMyCherry bets $35.18\n\nQuestion: Identify hero's hand strength on the flop. Any draws? Was the action reasonable?",
      "answer": "review",
      "answerLabel": "Review — see detail",
      "detail": "Hero held Ah Qs on board 2d 8c Jh Ac 8s. Result: +$65.86. This is a real hand from your session history — analyze the line, not a hypothetical.",
      "heroCards": "Ah Qs",
      "board": [
        "2d",
        "8c",
        "Jh",
        "Ac",
        "8s"
      ],
      "net": 65.86,
      "position": "UTG",
      "actions": [
        "PREFLOP: PopeMyCherry raises $5.00 to $5.00",
        "PREFLOP: PopeMyCherry calls $10.00",
        "FLOP: PopeMyCherry checks",
        "FLOP: PopeMyCherry calls $15.68",
        "TURN: PopeMyCherry checks",
        "RIVER: PopeMyCherry bets $35.18"
      ],
      "stakes": "$1.00/$2.00"
    },
    {
      "id": "hr_17",
      "category": "handReview",
      "handId": "2731979259",
      "prompt": "Real hand review — $1.00/$2.00, BB\nHero: 9d 4s | Board: 7c Kd Ts | Result: -$4.00 (No showdown)\n\nAction:\n    PREFLOP: PopeMyCherry posts the big blind $2.00\n    PREFLOP: PopeMyCherry calls $2.00\n    FLOP: PopeMyCherry checks\n    FLOP: PopeMyCherry folds\n\nQuestion: Identify hero's hand strength on the flop. Any draws? Was the action reasonable?",
      "answer": "review",
      "answerLabel": "Review — see detail",
      "detail": "Hero held 9d 4s on board 7c Kd Ts. Result: -$4.00. This is a real hand from your session history — analyze the line, not a hypothetical.",
      "heroCards": "9d 4s",
      "board": [
        "7c",
        "Kd",
        "Ts"
      ],
      "net": -4,
      "position": "BB",
      "actions": [
        "PREFLOP: PopeMyCherry posts the big blind $2.00",
        "PREFLOP: PopeMyCherry calls $2.00",
        "FLOP: PopeMyCherry checks",
        "FLOP: PopeMyCherry folds"
      ],
      "stakes": "$1.00/$2.00"
    },
    {
      "id": "hr_18",
      "category": "handReview",
      "handId": "2731980293",
      "prompt": "Real hand review — $1.00/$2.00, CO\nHero: Jh As | Board: Ac Qd 8d 2d | Result: -$17.00 (No showdown)\n\nAction:\n    PREFLOP: PopeMyCherry raises $5.00 to $5.00\n    FLOP: PopeMyCherry bets $3.63\n    FLOP: PopeMyCherry calls $8.37\n    TURN: PopeMyCherry folds\n\nQuestion: Identify hero's hand strength on the flop. Any draws? Was the action reasonable?",
      "answer": "review",
      "answerLabel": "Review — see detail",
      "detail": "Hero held Jh As on board Ac Qd 8d 2d. Result: -$17.00. This is a real hand from your session history — analyze the line, not a hypothetical.",
      "heroCards": "Jh As",
      "board": [
        "Ac",
        "Qd",
        "8d",
        "2d"
      ],
      "net": -17,
      "position": "CO",
      "actions": [
        "PREFLOP: PopeMyCherry raises $5.00 to $5.00",
        "FLOP: PopeMyCherry bets $3.63",
        "FLOP: PopeMyCherry calls $8.37",
        "TURN: PopeMyCherry folds"
      ],
      "stakes": "$1.00/$2.00"
    },
    {
      "id": "hr_19",
      "category": "handReview",
      "handId": "2731981030",
      "prompt": "Real hand review — $1.00/$2.00, UTG\nHero: Ac Jc | Board: 2d Qh 2c 8h | Result: -$5.00 (No showdown)\n\nAction:\n    PREFLOP: PopeMyCherry raises $5.00 to $5.00\n    FLOP: PopeMyCherry checks\n    TURN: PopeMyCherry folds\n\nQuestion: Identify hero's hand strength on the flop. Any draws? Was the action reasonable?",
      "answer": "review",
      "answerLabel": "Review — see detail",
      "detail": "Hero held Ac Jc on board 2d Qh 2c 8h. Result: -$5.00. This is a real hand from your session history — analyze the line, not a hypothetical.",
      "heroCards": "Ac Jc",
      "board": [
        "2d",
        "Qh",
        "2c",
        "8h"
      ],
      "net": -5,
      "position": "UTG",
      "actions": [
        "PREFLOP: PopeMyCherry raises $5.00 to $5.00",
        "FLOP: PopeMyCherry checks",
        "TURN: PopeMyCherry folds"
      ],
      "stakes": "$1.00/$2.00"
    },
    {
      "id": "hr_20",
      "category": "handReview",
      "handId": "2731982710",
      "prompt": "Real hand review — $1.00/$2.00, UTG\nHero: Kh Ac | Board: 9c 3c 2d 5h Jh | Result: -$33.87 (No showdown)\n\nAction:\n    PREFLOP: PopeMyCherry raises $5.00 to $5.00\n    FLOP: PopeMyCherry calls $8.25\n    TURN: PopeMyCherry calls $20.62\n    RIVER: PopeMyCherry folds\n\nQuestion: Identify hero's hand strength on the flop. Any draws? Was the action reasonable?",
      "answer": "review",
      "answerLabel": "Review — see detail",
      "detail": "Hero held Kh Ac on board 9c 3c 2d 5h Jh. Result: -$33.87. This is a real hand from your session history — analyze the line, not a hypothetical.",
      "heroCards": "Kh Ac",
      "board": [
        "9c",
        "3c",
        "2d",
        "5h",
        "Jh"
      ],
      "net": -33.87,
      "position": "UTG",
      "actions": [
        "PREFLOP: PopeMyCherry raises $5.00 to $5.00",
        "FLOP: PopeMyCherry calls $8.25",
        "TURN: PopeMyCherry calls $20.62",
        "RIVER: PopeMyCherry folds"
      ],
      "stakes": "$1.00/$2.00"
    }
  ]
};

if (typeof module !== 'undefined') module.exports = DRILL_SCENARIOS;
