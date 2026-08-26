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
  // Indian IT services / mid-tier
  "TCS", "Tata Consultancy Services", "Infosys", "Wipro", "HCLTech", "HCL Technologies",
  "Capgemini", "Cognizant", "Accenture", "Tech Mahindra", "LTIMindtree", "Mphasis",
  "Persistent Systems", "L&T Infotech",
  // Notable Indian startups / unicorns
  "Flipkart", "Zomato", "Swiggy", "PhonePe", "Razorpay", "Freshworks", "Zoho",
  "CRED", "Meesho", "Groww", "Postman", "BrowserStack", "Chargebee",
];

async function main() {
  for (const name of WHITELIST_SEED) {
    await db
      .insert(companies)
      .values({ name, normalizedName: normalizeCompanyName(name), legitimacyStatus: "whitelisted", source: "seed" })
      .onConflictDoNothing();
  }
  console.log(`Seeded ${WHITELIST_SEED.length} whitelisted companies.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
