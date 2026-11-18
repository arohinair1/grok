import { describe, expect, it } from "vitest";
import { PARKING_DEMO, STORAGE_DEMO } from "@/data/prompts";
import { listings } from "@/data/listings";
import { browseListings } from "@/lib/listings/browse";
import { estimateCubicFeet } from "@/lib/matching/capacity";
import { inclusiveDays } from "@/lib/matching/dates";
import { fallbackExtract } from "@/lib/matching/fallback";
import { matchListings } from "@/lib/matching/match";
import { bookingBlockers, quoteListing } from "@/lib/matching/quote";
import { parseSpaceRequest } from "@/lib/matching/schema";
import { runHostAssist } from "@/lib/grok/host";
import { runSpaceMatch } from "@/lib/grok/spacematch";
import { emptyRequest, type SpaceRequest } from "@/types/match";

function ids(request: SpaceRequest) {
  return matchListings(request).eligible.map((item) => item.listing.id);
}

describe("storage matching", () => {
  it("parses the summer demo and keeps appliance closets out", () => {
    const request = fallbackExtract(STORAGE_DEMO, null);
    expect(request.category).toBe("storage");
    expect(request.preferredNeighborhood).toBe("Old Campus");
    expect(request.budgetAmount).toBe(100);
    expect(request.budgetUnit).toBe("month");
    expect(request.budgetIsMaximum).toBe(false);
    expect(request.startDate).toBe("2027-05-15");
    expect(request.endDate).toBe("2027-08-15");
    expect(estimateCubicFeet(request.items)).toBe(24);
    const matched = matchListings(request);
    expect(matched.eligible.map((item) => item.listing.id)).toEqual([
      "stg-dwight",
      "stg-broadway",
      "stg-east-rock-bike",
      "stg-east-rock-basement",
    ]);
    expect(matched.excluded.map((item) => item.id)).toContain("stg-old-campus-closet");
    expect(matched.excluded.map((item) => item.id)).toContain("stg-luggage");
  });

  it("treats under $80 as a hard monthly maximum", () => {
    const request = fallbackExtract(
      "I need somewhere to keep one bicycle and two boxes from January 10, 2027 to May 20, 2027 near East Rock, under $80 a month.",
      null,
    );
    const matched = matchListings(request);
    expect(matched.eligible.every((item) => item.listing.price <= 80)).toBe(true);
    expect(matched.eligible.map((item) => item.listing.id)).toContain("stg-east-rock-bike");
    expect(matched.excluded.map((item) => item.id)).toContain("stg-broadway");
  });

  it("drops a summer-only closet when the dates are in January", () => {
    const request = fallbackExtract(
      "Store two suitcases near Old Campus from January 10, 2027 to January 20, 2027.",
      null,
    );
    expect(ids(request)).not.toContain("stg-old-campus-closet");
  });

  it("makes a cheaper follow-up a maximum budget", () => {
    const first = fallbackExtract(STORAGE_DEMO, null);
    const refined = fallbackExtract("Actually, I need something cheaper.", first);
    expect(refined.budgetIsMaximum).toBe(true);
    expect(refined.budgetAmount).toBeLessThan(first.budgetAmount ?? 0);
    expect(refined.items.map((item) => item.name)).toEqual(expect.arrayContaining(["mini-fridge", "suitcase", "box"]));
    expect(ids(refined)).not.toContain("stg-broadway");
  });

  it("adds a bicycle on a follow-up and removes spaces that forbid one", () => {
    const first = fallbackExtract(STORAGE_DEMO, null);
    const refined = fallbackExtract("I also need to store a bicycle.", first);
    expect(refined.items.some((item) => item.name === "bicycle")).toBe(true);
    expect(ids(refined)).not.toContain("stg-broadway");
    expect(ids(refined)).toContain("stg-east-rock-basement");
  });
});

describe("parking matching", () => {
  it("prices a three-day driveway and a flat graduation weekend separately", () => {
    const request = fallbackExtract(PARKING_DEMO, null);
    expect(request.category).toBe("parking");
    expect(request.vehicleSize).toBe("suv");
    expect(request.overnightRequired).toBe(true);
    expect(request.budgetIsMaximum).toBe(true);
    expect(request.budgetUnit).toBe("total");
    expect(request.eventType).toBe("graduation");
    const oldCampus = listings.find((item) => item.id === "prk-old-campus");
    const dwight = listings.find((item) => item.id === "prk-dwight-grad");
    expect(oldCampus && quoteListing(oldCampus, request)?.amount).toBe(84);
    expect(dwight && quoteListing(dwight, request)?.amount).toBe(90);
    expect(inclusiveDays("2027-05-22", "2027-05-24")).toBe(3);
    const matched = matchListings(request);
    expect(matched.eligible.map((item) => item.listing.id)).toEqual(["prk-old-campus", "prk-dwight-grad"]);
    expect(matched.excluded.map((item) => item.id)).toEqual(
      expect.arrayContaining(["prk-science-hill", "prk-broadway", "prk-yale-bowl", "prk-east-rock-month"]),
    );
  });

  it("rejects a sedan-only pad for an SUV and a daytime spot for an overnight stay", () => {
    const request = fallbackExtract(
      "Find an overnight driveway spot for an SUV near campus from May 22, 2027 to May 24, 2027 under $100 total.",
      null,
    );
    const reasons = matchListings(request).excluded;
    expect(reasons.find((item) => item.id === "prk-science-hill")?.reason).toMatch(/overnight|smaller/i);
    expect(ids(request)).not.toContain("prk-science-hill");
    expect(ids(request)).not.toContain("prk-yale-bowl");
  });

  it("keeps a same-day no-overnight request off the overnight-only exclusions", () => {
    const request = fallbackExtract(
      "Show me parking under $30 per day near Broadway for May 23, 2027. No overnight.",
      null,
    );
    expect(request.overnightRequired).toBe(false);
    expect(request.endDate).toBe("2027-05-23");
    const matched = ids(request);
    expect(matched).toContain("prk-science-hill");
    expect(matched).toContain("prk-old-campus");
    expect(matched).not.toContain("prk-east-rock-month");
  });

  it("prefers monthly parking for a semester near Science Hill", () => {
    const request = fallbackExtract(
      "Find parking near Science Hill from September 1, 2027 through December 15, 2027. A sedan is fine, and overnight parking matters.",
      null,
    );
    expect(ids(request)[0]).toBe("prk-east-rock-month");
    expect(ids(request)).not.toContain("prk-science-hill");
  });

  it("can narrow a weekend to the Sunday inside it", () => {
    const first = fallbackExtract(PARKING_DEMO, null);
    const refined = fallbackExtract("What if we only park on Sunday?", first);
    expect(refined.startDate).toBe("2027-05-23");
    expect(refined.endDate).toBe("2027-05-23");
    expect(refined.overnightRequired).toBe(false);
  });

  it("blocks a booking that extends past the demo window", () => {
    const listing = listings.find((item) => item.id === "prk-dwight-grad");
    expect(listing).toBeTruthy();
    const reasons = bookingBlockers(listing!, {
      startDate: "2027-05-22",
      endDate: "2027-05-28",
      arrivalTime: "09:00",
      departureTime: "15:00",
    });
    expect(reasons[0]).toMatch(/available/);
  });
});

describe("shared safeguards", () => {
  it("does not invent listings or mark an excluded spot as bookable", () => {
    const request = fallbackExtract(PARKING_DEMO, null);
    const matched = matchListings(request);
    const known = new Set(listings.map((item) => item.id));
    expect(matched.eligible.every((item) => known.has(item.listing.id))).toBe(true);
    expect(matched.eligible.map((item) => item.listing.id).some((id) => matched.excluded.some((item) => item.id === id))).toBe(false);
  });

  it("rejects invalid model output", () => {
    const parsed = parseSpaceRequest({ category: "nope" });
    expect(parsed.success).toBe(false);
  });

  it("asks for dates instead of assuming graduation", () => {
    const request = fallbackExtract("My parents need parking near Old Campus for graduation weekend.", null);
    expect(request.startDate).toBeNull();
    expect(request.missingInformation.join(" ")).toMatch(/date/i);
    expect(matchListings(request).eligible.length).toBeGreaterThan(0);
  });

  it("returns an empty set for an impossible vehicle", () => {
    const request = emptyRequest();
    request.category = "parking";
    request.vehicleSize = "oversized";
    request.startDate = "2027-05-22";
    request.endDate = "2027-05-24";
    request.overnightRequired = true;
    request.budgetAmount = 5;
    request.budgetUnit = "total";
    request.budgetIsMaximum = true;
    expect(matchListings(request).eligible).toEqual([]);
  });

  it("filters the catalog by neighborhood and category", () => {
    const storage = browseListings({
      q: "",
      category: "storage",
      neighborhood: "East Rock",
      maxPrice: null,
      availability: "any",
      sort: "featured",
      minCubic: null,
      access: "any",
      vehicle: "any",
      covered: false,
      overnight: false,
      inAndOut: false,
      event: "any",
      savedOnly: false,
    });
    expect(storage.every((item) => item.category === "storage" && item.neighborhood === "East Rock")).toBe(true);
    expect(storage.length).toBe(2);
  });
});

describe("api behavior without a live key", () => {
  it("labels a missing key as fallback rather than Grok", async () => {
    const previous = process.env.XAI_API_KEY;
    delete process.env.XAI_API_KEY;
    const result = await runSpaceMatch(STORAGE_DEMO, null);
    expect(result.inference).toBe("fallback");
    expect(result.notice).toMatch(/not Grok inference/i);
    expect(result.recommendations.length).toBeGreaterThan(0);
    if (previous) process.env.XAI_API_KEY = previous;
  });

  it("falls back when model output is invalid and does not hide that fact", async () => {
    process.env.XAI_API_KEY = "test-key-not-used";
    const result = await runSpaceMatch("Need storage near Dwight", null, async () => ({
      json: { category: "storage-ish" },
      model: "grok-4.7",
    }));
    expect(result.inference).toBe("fallback");
    expect(result.notice).toMatch(/not Grok inference/i);
    delete process.env.XAI_API_KEY;
  });

  it("uses a valid mocked extraction as Grok and keeps explanations grounded", async () => {
    process.env.XAI_API_KEY = "test-key-not-used";
    const calls: string[] = [];
    const result = await runSpaceMatch(PARKING_DEMO, null, async (args) => {
      calls.push(args.schemaName);
      if (args.schemaName === "space_request") {
        return {
          model: "grok-4.7",
          json: {
            ...emptyRequest(),
            category: "parking",
            startDate: null,
            endDate: null,
            budgetAmount: null,
            budgetUnit: null,
            budgetIsMaximum: false,
            preferredNeighborhood: null,
            vehicleSize: "suv",
            vehicleType: "SUV",
            eventType: "graduation",
            items: [],
            accessRequirements: [],
            specialConstraints: [],
            missingInformation: [],
          },
        };
      }
      return {
        model: "grok-4.7",
        json: {
          summaries: [
            {
              listingId: "prk-old-campus",
              explanation: "This Old Campus driveway allows an SUV overnight and the stay is $84.",
              tradeoff: "",
            },
            {
              listingId: "not-a-real-listing",
              explanation: "Invented spot with a verified review.",
              tradeoff: "",
            },
          ],
        },
      };
    });
    expect(result.inference).toBe("grok");
    expect(result.model).toBe("grok-4.7");
    expect(calls).toEqual(["space_request", "space_explanations"]);
    expect(result.recommendations.map((item) => item.listingId)).not.toContain("not-a-real-listing");
    const first = result.recommendations.find((item) => item.listingId === "prk-old-campus");
    expect(first?.explanationSource).toBe("grok");
    expect(first?.explanation).toMatch(/\$84/);
    delete process.env.XAI_API_KEY;
  });

  it("does not invent host authority", async () => {
    delete process.env.XAI_API_KEY;
    const result = await runHostAssist(
      "I live in a house near Yale with an extra driveway spot. I want to rent it for $30 per day. It fits a regular sedan or SUV.",
    );
    expect(result.inference).toBe("fallback");
    expect(result.draft.category).toBe("parking");
    expect(result.draft.price).toBe(30);
    expect(result.draft.missingQuestions.join(" ")).toMatch(/authority/i);
    expect(result.draft.description).not.toMatch(/verified/i);
  });
});
