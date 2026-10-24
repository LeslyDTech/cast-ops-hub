import type { Category, Priority, Status } from "../issues/domain.js";

export interface SeedLocation {
  name: string;
  area: string;
}

export interface SeedIssue {
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  location: string;
  reportedBy: string;
  hoursAgo: number;
  // Status changes after creation; `at` is minutes after the issue was reported.
  history?: { to: Status; at: number; by: string; note?: string }[];
}

export const locations: SeedLocation[] = [
  { name: "Harborview Grill", area: "Waterfront" },
  { name: "Main Street Café", area: "Town Square" },
  { name: "Poolside Bar", area: "Resort Pool Deck" },
  { name: "Central Kitchen", area: "Back of House" },
  { name: "Lakeside Bakery", area: "Lakeshore Promenade" },
];

export const issues: SeedIssue[] = [
  // Harborview Grill
  {
    title: "Walk-in cooler reading 45°F",
    description: "Thermometer on the walk-in showed 45°F at the 2pm temp check. Door gasket looks fine. Compressor is running constantly.",
    category: "equipment", priority: "urgent", location: "Harborview Grill", reportedBy: "Devon T.", hoursAgo: 3,
    history: [{ to: "in_progress", at: 12, by: "Ana R.", note: "Moved proteins to reach-ins. Refrigeration tech called, ETA 90 min." }],
  },
  {
    title: "Fryer #2 pilot light keeps going out",
    description: "Pilot goes out every 20–30 minutes during lunch. Running on fryer #1 only.",
    category: "equipment", priority: "high", location: "Harborview Grill", reportedBy: "Kenji M.", hoursAgo: 26,
    history: [{ to: "in_progress", at: 40, by: "Ana R.", note: "Service tech booked for tomorrow 7am." }],
  },
  {
    title: "Low on lemons for bar service",
    description: "About 15 lemons left, Friday dinner expected to be busy. Next produce delivery isn't until Saturday.",
    category: "stock", priority: "medium", location: "Harborview Grill", reportedBy: "Priya S.", hoursAgo: 5,
  },
  {
    title: "Guest reported undercooked salmon",
    description: "Table 14 sent back salmon that was translucent in the center. Guest was understanding but unhappy.",
    category: "guest", priority: "high", location: "Harborview Grill", reportedBy: "Marcus B.", hoursAgo: 50,
    history: [
      { to: "in_progress", at: 15, by: "Ana R.", note: "Comped the entrée and spoke with the guest." },
      { to: "resolved", at: 140, by: "Ana R.", note: "Line re-briefed on salmon target temp (125°F). Called guest to follow up." },
    ],
  },
  {
    title: "Loose tile at host stand",
    description: "Tile in front of the host stand rocks when stepped on. Trip hazard, especially for guests with canes.",
    category: "safety", priority: "medium", location: "Harborview Grill", reportedBy: "Jordan L.", hoursAgo: 72,
    history: [
      { to: "in_progress", at: 1440, by: "Facilities – Chris P.", note: "Coned off. Replacement tile ordered." },
      { to: "resolved", at: 2880, by: "Facilities – Chris P.", note: "Tile replaced and grouted." },
    ],
  },
  {
    title: "Dish machine not reaching sanitizing temp",
    description: "Final rinse is reading 160°F, needs 180°F. Switched to three-compartment sink for now.",
    category: "equipment", priority: "urgent", location: "Harborview Grill", reportedBy: "Devon T.", hoursAgo: 1.5,
  },

  // Main Street Café
  {
    title: "Espresso grinder jamming",
    description: "Grinder on the left station jams every few shots. Cleared it twice, still happening.",
    category: "equipment", priority: "high", location: "Main Street Café", reportedBy: "Sam O.", hoursAgo: 8,
  },
  {
    title: "Oat milk down to one case",
    description: "One case of oat milk left. At current pace that's gone by tomorrow noon. Delivery is Friday.",
    category: "stock", priority: "high", location: "Main Street Café", reportedBy: "Lena W.", hoursAgo: 2,
  },
  {
    title: "High chair strap broken",
    description: "Buckle on one of the wooden high chairs snapped off.",
    category: "safety", priority: "high", location: "Main Street Café", reportedBy: "Lena W.", hoursAgo: 30,
    history: [{ to: "in_progress", at: 60, by: "Sam O.", note: "Pulled from floor and tagged out. Replacement chair ordered." }],
  },
  {
    title: "Guest complaint: 20+ minute wait for drinks",
    description: "Guest said they waited over 20 minutes for two lattes during the 8am rush.",
    category: "guest", priority: "medium", location: "Main Street Café", reportedBy: "Sam O.", hoursAgo: 20,
    history: [
      { to: "in_progress", at: 30, by: "Maria G." },
      { to: "resolved", at: 190, by: "Maria G.", note: "Adding a second barista 7–9am on weekdays starting tomorrow." },
    ],
  },
  {
    title: "Pastry case light flickering",
    description: "Left side LED strip in the pastry case flickers. Cosmetic, but noticeable to guests.",
    category: "equipment", priority: "low", location: "Main Street Café", reportedBy: "Lena W.", hoursAgo: 96,
  },
  {
    title: "Receipt printer paper running low",
    description: "Last roll in the register drawer.",
    category: "stock", priority: "low", location: "Main Street Café", reportedBy: "Sam O.", hoursAgo: 10,
    history: [{ to: "resolved", at: 25, by: "Maria G.", note: "Restocked from back office, 12 rolls." }],
  },

  // Poolside Bar
  {
    title: "Ice machine producing slushy ice",
    description: "Ice is coming out wet and clumping. Not usable for blended drinks.",
    category: "equipment", priority: "high", location: "Poolside Bar", reportedBy: "Jordan L.", hoursAgo: 6,
    history: [{ to: "in_progress", at: 30, by: "Jordan L.", note: "Bagged ice requested from Central Kitchen as a stopgap." }],
  },
  {
    title: "Broken glass near pool steps",
    description: "Guest dropped a glass by the shallow-end steps. Barefoot guests in the area.",
    category: "safety", priority: "urgent", location: "Poolside Bar", reportedBy: "Tasha K.", hoursAgo: 4,
    history: [
      { to: "in_progress", at: 2, by: "Jordan L.", note: "Area closed off." },
      { to: "resolved", at: 15, by: "Jordan L.", note: "Swept and wet-vacuumed. Switched to acrylic drinkware for the rest of the day." },
    ],
  },
  {
    title: "Running low on frozen mango purée",
    description: "Two bags left, enough for roughly 30 smoothies. Weekend forecast is hot.",
    category: "stock", priority: "medium", location: "Poolside Bar", reportedBy: "Tasha K.", hoursAgo: 18,
  },
  {
    title: "Guest reported mild allergic reaction",
    description: "Guest reported itchy throat after a smoothie. Says they told the server about a tree-nut allergy.",
    category: "guest", priority: "urgent", location: "Poolside Bar", reportedBy: "Tasha K.", hoursAgo: 28,
    history: [
      { to: "in_progress", at: 5, by: "Jordan L.", note: "First aid responded. Guest declined further care." },
      { to: "resolved", at: 65, by: "Maria G.", note: "Incident report filed. Allergen procedure reviewed with all bar staff; blender rinse step added." },
    ],
  },
  {
    title: "Umbrella crank stripped at table 12",
    description: "Can't raise or lower the umbrella. Currently stuck open.",
    category: "equipment", priority: "low", location: "Poolside Bar", reportedBy: "Tasha K.", hoursAgo: 120,
  },
  {
    title: "Blender lid cracked",
    description: "Hairline crack in one of the two blender lids. Leaks during long blends.",
    category: "equipment", priority: "medium", location: "Poolside Bar", reportedBy: "Jordan L.", hoursAgo: 40,
    history: [
      { to: "in_progress", at: 120, by: "Jordan L." },
      { to: "open", at: 1500, by: "Jordan L.", note: "Replacement lid backordered 2 weeks. Back to the queue." },
    ],
  },

  // Central Kitchen
  {
    title: "Hood vent filters heavy with grease",
    description: "Filters over the flat-top are dripping. Last deep clean was over a month ago.",
    category: "safety", priority: "high", location: "Central Kitchen", reportedBy: "Kenji M.", hoursAgo: 60,
    history: [
      { to: "in_progress", at: 180, by: "Facilities – Chris P.", note: "Cleaning crew booked for tomorrow night." },
      { to: "resolved", at: 1980, by: "Facilities – Chris P.", note: "Filters swapped and hood degreased." },
    ],
  },
  {
    title: "Short on 6-qt deli containers",
    description: "Under 20 left. Prep needs about 40 a day.",
    category: "stock", priority: "medium", location: "Central Kitchen", reportedBy: "Rosa V.", hoursAgo: 7,
  },
  {
    title: "Combi oven showing error E34",
    description: "Oven 2 throws E34 and stops mid-cycle. Manual says steam generator fault.",
    category: "equipment", priority: "high", location: "Central Kitchen", reportedBy: "Kenji M.", hoursAgo: 12,
    history: [{ to: "in_progress", at: 45, by: "Kenji M.", note: "Ran descale cycle, no change. Vendor service ticket opened." }],
  },
  {
    title: "First aid kit missing burn gel",
    description: "Kit by the line has no burn gel or burn dressings left.",
    category: "safety", priority: "medium", location: "Central Kitchen", reportedBy: "Rosa V.", hoursAgo: 3,
  },
  {
    title: "Produce delivery missing romaine",
    description: "Morning delivery came without the 4 cases of romaine on the invoice.",
    category: "stock", priority: "high", location: "Central Kitchen", reportedBy: "Rosa V.", hoursAgo: 30,
    history: [
      { to: "in_progress", at: 20, by: "Kenji M.", note: "Called vendor; short-ship coming this afternoon." },
      { to: "resolved", at: 250, by: "Kenji M.", note: "Received 2pm. Credit issued for the delay." },
    ],
  },
  {
    title: "Floor drain backing up near prep sink",
    description: "Standing water around the drain by prep sink 3 after the lunch rush.",
    category: "safety", priority: "high", location: "Central Kitchen", reportedBy: "Rosa V.", hoursAgo: 100,
    history: [
      { to: "in_progress", at: 60, by: "Facilities – Chris P." },
      { to: "resolved", at: 300, by: "Facilities – Chris P.", note: "Drain snaked; grease clog removed." },
      { to: "open", at: 3180, by: "Rosa V.", note: "Backing up again during dinner rush. Reopening." },
    ],
  },

  // Lakeside Bakery
  {
    title: "Proofer humidity sensor reading erratic",
    description: "Humidity jumps between 40% and 95%. Dough is skinning over.",
    category: "equipment", priority: "medium", location: "Lakeside Bakery", reportedBy: "Elif A.", hoursAgo: 22,
  },
  {
    title: "Flour delivery short two bags",
    description: "Invoice says 12 bags of bread flour, received 10.",
    category: "stock", priority: "medium", location: "Lakeside Bakery", reportedBy: "Elif A.", hoursAgo: 48,
    history: [
      { to: "in_progress", at: 60, by: "Maria G." },
      { to: "resolved", at: 360, by: "Maria G.", note: "Borrowed two bags from Central Kitchen; vendor crediting the invoice." },
    ],
  },
  {
    title: "Guest found plastic in muffin",
    description: "Small piece of clear plastic in a blueberry muffin. Guest kept the piece and gave it to us.",
    category: "guest", priority: "high", location: "Lakeside Bakery", reportedBy: "Noah F.", hoursAgo: 9,
    history: [{ to: "in_progress", at: 10, by: "Elif A.", note: "Pulled the rest of the batch. Checking the line and packaging." }],
  },
  {
    title: "Mixer guard interlock taped over",
    description: "Found tape over the guard interlock on the 60-qt mixer, so it runs with the guard open.",
    category: "safety", priority: "urgent", location: "Lakeside Bakery", reportedBy: "Noah F.", hoursAgo: 1,
  },
  {
    title: "Display case temperature log missed",
    description: "No entries on the display case temp log for Tuesday afternoon.",
    category: "safety", priority: "low", location: "Lakeside Bakery", reportedBy: "Maria G.", hoursAgo: 30,
    history: [
      { to: "in_progress", at: 30, by: "Elif A." },
      { to: "resolved", at: 90, by: "Elif A.", note: "Added the check to the closing checklist." },
    ],
  },
  {
    title: "Out of 10-inch cake boxes",
    description: "None left for custom orders. Three pickups scheduled Saturday.",
    category: "stock", priority: "low", location: "Lakeside Bakery", reportedBy: "Noah F.", hoursAgo: 14,
  },
];
