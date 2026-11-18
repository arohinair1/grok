export const EXAMPLE_PROMPTS = [
  {
    id: "summer-storage",
    category: "storage" as const,
    label: "Summer storage",
    text: "I'm going home for the summer and need to store a mini-fridge, two suitcases, and four boxes near Old Campus from May 15, 2027 to August 15, 2027 for around $100 a month.",
  },
  {
    id: "graduation-parking",
    category: "parking" as const,
    label: "Graduation parking",
    text: "My family is visiting for Yale graduation and needs a driveway spot within walking distance of Old Campus from May 22, 2027 in the morning through May 24, 2027 in the afternoon. We have an SUV and would prefer to spend under $100 total.",
  },
  {
    id: "semester-parking",
    category: "parking" as const,
    label: "Semester parking",
    text: "Find parking near Science Hill from September 1, 2027 through December 15, 2027. A sedan is fine, and overnight parking matters.",
  },
  {
    id: "bike-storage",
    category: "storage" as const,
    label: "Bicycle storage",
    text: "I need somewhere to keep one bicycle and two boxes while I'm studying abroad from January 10, 2027 to May 20, 2027 near East Rock, under $80 a month.",
  },
  {
    id: "day-parking",
    category: "parking" as const,
    label: "Daytime Broadway",
    text: "Show me parking under $30 per day near Broadway for May 23, 2027. No overnight.",
  },
  {
    id: "suv-overnight",
    category: "parking" as const,
    label: "Overnight SUV",
    text: "Find an overnight driveway spot for an SUV near campus from May 22, 2027 to May 24, 2027 under $100 total.",
  },
];

export const STORAGE_DEMO = EXAMPLE_PROMPTS[0].text;
export const PARKING_DEMO = EXAMPLE_PROMPTS[1].text;
