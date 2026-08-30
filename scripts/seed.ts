import { config } from "dotenv";
config({ path: ".env.local" });
import { db } from "../lib/db/client";
import { companies } from "../lib/db/schema";
import { normalizeCompanyName } from "../lib/legitimacy/companyCache";

// Seeds a starter whitelist so common big/mid-tier employers skip the LLM
// legitimacy check entirely on first sight. Add more with an insert or via
// the (future) admin UI — this is not meant to be exhaustive.
const WHITELIST_SEED = [
  // Big tech / global
  "Google", "Microsoft", "Amazon", "Meta", "Apple", "Netflix", "Adobe", "Salesforce",
  "Oracle", "SAP", "IBM", "Intel", "Nvidia", "Uber", "Airbnb", "Atlassian", "ServiceNow",
  "LinkedIn", "Unisys", "HPE", "Hewlett Packard Enterprise",
  // Indian IT services / mid-tier
  "TCS", "Tata Consultancy Services", "Infosys", "Wipro", "HCLTech", "HCL Technologies",
  "Capgemini", "Cognizant", "Accenture", "Tech Mahindra", "LTIMindtree", "Mphasis",
  "Persistent Systems", "L&T Infotech",
  // Notable Indian startups / unicorns
  "Flipkart", "Zomato", "Swiggy", "PhonePe", "Razorpay", "Freshworks", "Zoho",
  "CRED", "Meesho", "Groww", "Postman", "BrowserStack", "Chargebee", "CoinDCX", "Enterpret",
];

async function main() {
  for (const name of WHITELIST_SEED) {
    // onConflictDoUpdate (not DoNothing): a company can already exist as
    // 'unknown' if it was seen in a real posting (via touchCompany) before
    // ever appearing in this list — that shouldn't block promoting it to
    // whitelisted once a human has curated it in here.
    await db
      .insert(companies)
      .values({ name, normalizedName: normalizeCompanyName(name), legitimacyStatus: "whitelisted", source: "seed" })
      .onConflictDoUpdate({
        target: companies.normalizedName,
        set: { legitimacyStatus: "whitelisted", source: "seed" },
      });
  }
  console.log(`Seeded ${WHITELIST_SEED.length} whitelisted companies.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
