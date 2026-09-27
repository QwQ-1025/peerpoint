/* ============================================================
   PeerPoint — local demo data
   All mentor profiles are fictional sample data for demonstration.
   ============================================================ */

const TOPICS = [
  { id: "opp-cost",  label: "Opportunity Cost & Comparative Advantage", mentor: "alex"  },
  { id: "supply",    label: "Supply & Demand",                          mentor: "jamie" },
  { id: "elasticity",label: "Elasticity",                               mentor: "jamie" },
  { id: "costs",     label: "Production Costs",                         mentor: "taylor"},
  { id: "structures",label: "Market Structures",                        mentor: "taylor"},
];

const STUCK_TAGS = [
  "Understanding the concept",
  "Choosing a method",
  "Explaining my reasoning",
  "Reading a graph",
  "I'm not sure yet",
];

const LANGUAGES = ["English", "Mandarin", "Either"];

const MENTORS = [
  {
    id: "alex",
    name: "Alex Chen",
    role: "Senior student",
    focus: "Opportunity cost and comparative advantage",
    style: "Step-by-step tables and guided questions",
    languages: "English and Mandarin",
    topics: ["opp-cost"],
    sessionPlan: [
      ["5 min",  "Understand your approach", "Alex reads how you actually worked the question before explaining anything."],
      ["15 min", "Work through the misconception", "The point where your reasoning slipped, rebuilt with you on the spot."],
      ["5 min",  "Summarise and prepare for practice", "You say the idea back in your own words; Alex listens for gaps."],
    ],
    reason: {
      "opp-cost": "Alex's sample profile focuses on the opportunity-cost comparisons in your question.",
      _default:  "Alex's sample profile focuses on opportunity cost and comparative advantage.",
    },
  },
  {
    id: "jamie",
    name: "Jamie Lin",
    role: "Senior student",
    focus: "Graphs, supply and demand, and elasticity",
    style: "Visual explanation and short practice",
    languages: "English and Mandarin",
    topics: ["supply", "elasticity"],
    sessionPlan: [
      ["5 min",  "Understand your approach", "Jamie asks what you drew or calculated first, and why."],
      ["15 min", "Work through the misconception", "The graph or calculation is rebuilt slowly, then you try one yourself."],
      ["5 min",  "Summarise and prepare for practice", "Jamie checks whether you can describe the shift without the diagram."],
    ],
    reason: {
      "supply":     "Jamie's sample profile focuses on reading shifts on a supply-and-demand diagram.",
      "elasticity": "Jamie's sample profile focuses on elasticity calculations and what the number means.",
      _default:     "Jamie's sample profile focuses on graphs, supply and demand, and elasticity.",
    },
  },
  {
    id: "taylor",
    name: "Taylor Wang",
    role: "Senior student",
    focus: "Production costs and market structures",
    style: "Worked examples followed by independent attempts",
    languages: "English",
    topics: ["costs", "structures"],
    sessionPlan: [
      ["5 min",  "Understand your approach", "Taylor looks at which cost figures you used and in what order."],
      ["15 min", "Work through the misconception", "A worked example first, then you complete the next step alone."],
      ["5 min",  "Summarise and prepare for practice", "Taylor asks you to name the rule you would use next time."],
    ],
    reason: {
      "costs":      "Taylor's sample profile focuses on cost curves and how average cost is built up.",
      "structures": "Taylor's sample profile focuses on what separates market structures in the long run.",
      _default:     "Taylor's sample profile focuses on production costs and market structures.",
    },
  },
];

/* ---------- original practice questions, one per topic ---------- */
const PRACTICE = {
  "opp-cost": {
    stem: "Country C can produce 12 apples or 4 bananas per hour. Country D can produce 8 apples or 8 bananas per hour. Which country has a comparative advantage in apples, and why?",
    options: [
      { id: "A", text: "Country C, because producing one apple costs 1/3 of a banana, compared with 1 banana in Country D.", correct: true },
      { id: "B", text: "Country C, because it produces more apples per hour.", correct: false },
      { id: "C", text: "Country D, because it produces more bananas per hour.", correct: false },
      { id: "D", text: "Neither country has a comparative advantage.", correct: false },
    ],
    correct: "Correct. Country C gives up fewer bananas for each apple.",
    incorrect: "Compare what each country gives up to produce one apple.",
    working: [
      "Country C: 4 ÷ 12 = 1/3 banana per apple.",
      "Country D: 8 ÷ 8 = 1 banana per apple.",
    ],
    takeaway: "Comparative advantage goes to whoever gives up less — not to whoever produces more.",
    nextIfRight: "Try a variant with different units, then look at terms of trade.",
    nextIfWrong: "Recompare the opportunity cost of the same good in both countries, then try one more.",
  },
  "supply": {
    stem: "A widely reported study says coffee improves concentration. In the same month, a frost destroys part of the coffee harvest. What happens in the market for coffee?",
    options: [
      { id: "A", text: "Demand increases and supply decreases, so the equilibrium price rises but the change in quantity is indeterminate.", correct: true },
      { id: "B", text: "Demand and supply both increase, so the equilibrium price falls.", correct: false },
      { id: "C", text: "Demand decreases and supply increases, so the equilibrium price falls.", correct: false },
      { id: "D", text: "The two changes cancel out, so price and quantity are both unchanged.", correct: false },
    ],
    correct: "Correct. Two curves moving in opposite directions leave price certain and quantity ambiguous.",
    incorrect: "Decide which curve moves, and in which direction, before comparing the two effects.",
    working: [
      "Demand shifts right (tastes change in favour of coffee).",
      "Supply shifts left (a frost reduces what growers can bring to market).",
      "Price: both shifts push it up, so the direction is certain.",
      "Quantity: one shift raises it, the other lowers it — so the net effect cannot be determined.",
    ],
    takeaway: "When price is determined but quantity is not, the two curves must be moving in opposite directions.",
    nextIfRight: "Try a case where both curves move the same way, and say what becomes determinate.",
    nextIfWrong: "Draw the two shifts separately first, then combine them on one diagram.",
  },
  "elasticity": {
    stem: "The price of a good rises from ¥20 to ¥22 and quantity demanded falls from 100 to 90 units. Using the midpoint method, what is the absolute value of the price elasticity of demand?",
    options: [
      { id: "A", text: "0.10", correct: false },
      { id: "B", text: "1.11", correct: true },
      { id: "C", text: "2.10", correct: false },
      { id: "D", text: "0.90", correct: false },
    ],
    correct: "Correct. Quantity changes proportionally more than price, so demand is elastic at this point.",
    incorrect: "Use the midpoint for both the price change and the quantity change, then divide.",
    working: [
      "Percentage change in quantity: 10 ÷ 95 = 10.5%.",
      "Percentage change in price: 2 ÷ 21 = 9.5%.",
      "Elasticity = 10.5 ÷ 9.5 ≈ 1.11.",
    ],
    takeaway: "The midpoint method uses the average of the start and end values, so the answer is the same whichever direction you move.",
    nextIfRight: "Try a case just above and just below 1, and describe what happens to total revenue.",
    nextIfWrong: "Write the two percentage changes on separate lines before dividing them.",
  },
  "costs": {
    stem: "A firm's total fixed cost is ¥200. At an output of 10 units, its total variable cost is ¥300. What is average total cost at 10 units?",
    options: [
      { id: "A", text: "¥30", correct: false },
      { id: "B", text: "¥50", correct: true },
      { id: "C", text: "¥500", correct: false },
      { id: "D", text: "¥20", correct: false },
    ],
    correct: "Correct. Add the two costs first, then divide by output.",
    incorrect: "Average total cost needs total cost in the numerator — not just variable cost.",
    working: [
      "Total cost = fixed + variable = 200 + 300 = ¥500.",
      "Average total cost = 500 ÷ 10 = ¥50.",
      "Choice C is total cost, not average total cost.",
    ],
    takeaway: "Average cost is always a total divided by output; the common error is dividing only the variable part.",
    nextIfRight: "Work out average fixed cost and average variable cost separately, and check they add to ¥50.",
    nextIfWrong: "Write total cost on its own line before dividing, so the denominator applies to the right figure.",
  },
  "structures": {
    stem: "Which feature best distinguishes a perfectly competitive firm from a monopoly in the long run?",
    options: [
      { id: "A", text: "In perfect competition long-run economic profit is driven to zero, while a monopoly can sustain positive economic profit.", correct: true },
      { id: "B", text: "Perfectly competitive firms set price above marginal cost, while a monopoly sets price equal to marginal cost.", correct: false },
      { id: "C", text: "Only monopolies face a downward-sloping demand curve.", correct: false },
      { id: "D", text: "Perfectly competitive firms earn positive economic profit in the long run.", correct: false },
    ],
    correct: "Correct. Barriers to entry are what allow profit to persist.",
    incorrect: "Ask what entry does to profit in each market structure.",
    working: [
      "Perfect competition: free entry erodes economic profit until price equals minimum average total cost.",
      "Monopoly: barriers to entry keep rivals out, so positive economic profit can persist.",
      "Option B reverses the pricing rules; option C is also true of most firms but is not the distinguishing long-run feature.",
    ],
    takeaway: "The long-run difference comes from entry conditions, not from the shape of the demand curve alone.",
    nextIfRight: "Compare monopolistic competition with monopoly, where the difference is efficiency rather than profit.",
    nextIfWrong: "Write down what happens to profit when a new firm can freely enter the market.",
  },
};

const SAMPLE_REQUEST = {
  subject: "AP Microeconomics",
  topic: "opp-cost",
  question: "Country A can produce 10 apples or 5 bananas per hour. Country B can produce 6 apples or 6 bananas. Which country has a comparative advantage in each good?",
  attempt: "I chose Country A for both because I focused on how much it could produce. I'm unsure how to compare opportunity costs.",
  stuck: "Choosing a method",
  language: "Either",
};

const KEY_TAKEAWAYS = {
  "opp-cost":  "Comparative advantage depends on lower opportunity cost.",
  "supply":    "Opposite shifts make price determinate and quantity ambiguous.",
  "elasticity":"Elasticity compares proportional changes, using the midpoint as the base.",
  "costs":     "Average total cost is total cost — fixed plus variable — divided by output.",
  "structures":"Barriers to entry decide whether profit survives in the long run.",
};

const BOOKING_GOAL_DEFAULT = "I want to identify comparative advantage using opportunity cost.";
