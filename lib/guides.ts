export const guides: Record<
  string,
  {
    title: string;
    description: string;
    sections: { title: string; body: string }[];
  }
> = {
  "student-rental-fees-nigeria": {
    title: "Student rental fees explained",
    description:
      "Separate annual rent, initial housing charges and inspection costs before committing to a room.",
    sections: [
      {
        title: "Annual rent is not always the first payment",
        body: "Ask for a written breakdown showing annual rent, agency and legal fees, caution deposits, service charges and every other mandatory charge. A low rent figure can still come with a higher initial payment. Where any mandatory cost is unknown, treat the total as unconfirmed rather than zero.",
      },
      {
        title: "Confirm who receives each payment",
        body: "Ask whether the advertiser is the owner or an agent and verify their authority to accept money. Confirm the recipient, purpose and refund conditions of every charge. A caution deposit may be refundable, but the conditions need to be recorded. Do not rely on an oral promise or an unlabeled bank transfer.",
      },
      {
        title: "Inspection and renewal charges",
        body: "Inspection costs should be disclosed separately with the recipient and whether they are refundable. Arrange visits directly with the advertiser. HousePlug does not book inspections or collect rent. Ask what will be payable at renewal: a first-year agency fee does not establish the next year’s rent or terms.",
      },
      {
        title: "Use your total budget",
        body: "Include every mandatory upfront housing charge in the amount you can afford. Budget separately for optional inspection travel and personal move-in expenses. Ask for evidence of any charge stated as zero. If a listing description and its cost summary disagree, request clarification before travelling or paying.",
      },
    ],
  },
  "uniport-accommodation": {
    title: "Finding accommodation near UNIPORT",
    description:
      "A practical checklist for comparing rooms around Choba, Alakahia and Aluu.",
    sections: [
      {
        title: "Start with the campus and your needs",
        body: "Choose the campus location relevant to your studies and set a total move-in budget. Compare the neighbourhood, room type, permitted occupants, amenities and move-in date. Choba, Alakahia and Aluu are useful starting areas to investigate, but a neighbourhood name alone does not establish how convenient a specific property will be.",
      },
      {
        title: "Check the route yourself",
        body: "Ask which campus gate the advertiser’s distance estimate refers to and how it was measured. Check the actual route, transport options, cost and conditions at the times you expect to travel. Do not interpret an advertiser’s walking-time estimate as a measured or guaranteed journey time.",
      },
      {
        title: "Compare water, electricity and house rules",
        body: "Ask about water access, electricity arrangements, service charges, noise rules and security procedures. Inspect the actual room and shared facilities. Permission to share must come from the owner and fit the allowed occupancy; a rent-split calculation does not grant that permission.",
      },
      {
        title: "Arrange any inspection directly",
        body: "HousePlug helps you discover rooms and send housing requests. The student and advertiser agree the inspection details directly. Confirm the location, person you are meeting and any inspection cost before travelling. Consider a daylight visit with a trusted person, and independently verify identity and the terms before payment.",
      },
    ],
  },
  "uniport-hostel-prices": {
    title: "How to compare UNIPORT accommodation prices",
    description:
      "Compare confirmed total costs rather than assuming annual rent is your move-in payment.",
    sections: [
      {
        title: "There is no single campus price",
        body: "Prices vary by property, area, room type, amenities and terms. HousePlug does not publish a campus price range without a verified current sample. Use the available listings as individual offers that still need confirmation, not an authoritative market average.",
      },
      {
        title: "Compare like for like",
        body: "Separate annual rent, first payment, renewal rent and refundable deposits. A shared room and a self-contained unit may have different occupancy rules. Ask whether a quoted price is for the room or each person. Do not divide a whole-unit rent unless the owner explicitly permits sharing.",
      },
      {
        title: "Unknown totals are a reason to ask",
        body: "A blank or unconfirmed mandatory charge is not a zero charge. Request an itemized explanation and confirmation date. When your budget is firm, use the total move-in filter, which excludes offers with unconfirmed totals. If nothing fits, send a housing request rather than assuming unavailable rooms exist.",
      },
    ],
  },
};
