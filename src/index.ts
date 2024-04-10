import needle from "needle";

interface IOrg {
  name: string;
  id: string;
  country: string;
  city: string;
  zip: string;
  address: string;
  company: string;
  companySize: number;
  createdAt: number;
  deletedAt?: number;
  users: IUser[];
}

interface IUser {
  email: string;
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  phone: string;
  country: string;
  browserLanguage: string;
  lastActiveAt: number;
  emailValidatedAt: number;
  createdAt: number;
  deletedAt?: number;
  orgsIds: string[];
}

const _planhatApiKey = process.env.PLANHAT_API_KEY;

const _options = {
  json: true,
  headers: {
    Authorization: `Bearer ${_planhatApiKey}`,
    Connection: "keep-alive",
  },
};

function makeCompanyUpsertPayload(org: IOrg) {
  return {
    name: org.name,
    externalId: org.id,
    country: org.country,
    city: org.city,
    zip: org.zip,
    address: org.address,
    custom: {
      "Workspace Creation Date": new Date(org.createdAt).toISOString(),
      "Workspace Deletion Date": org.deletedAt
        ? new Date(org.deletedAt).toISOString()
        : null,
      "Company Name": org.company,
      "Company Size": org.companySize,
    },
  };
}

function makeEndUserUpsertPayload(user: IUser, orgId: string) {
  return {
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    companyId: `extid-${orgId}`,
    externalId: user.id,
    position: user.position,
    phone: user.phone,
    lastActive: new Date(user.lastActiveAt).toISOString(),
    custom: {
      Country: user.country,
      "Browser Language": user.browserLanguage,
      "User Sign Up Date": new Date(user.createdAt).toISOString(),
      "User deletion date": user.deletedAt
        ? new Date(user.deletedAt).toISOString()
        : null,
      "User Email Validated Date": new Date(
        user.emailValidatedAt
      ).toISOString(),
    },
  };
}

async function bulkUpsertCompany(payload: Array<object>) {
  const upsertCompanyUrl = "https://api.planhat.com/companies";

  const res = await needle("put", upsertCompanyUrl, payload, _options);
  console.log("Result:", res.body);
}

async function bulkUpsertEndUser(payload: Array<object>) {
  const upsertEndUserUrl = "https://api.planhat.com/endusers";

  const res = await needle("put", upsertEndUserUrl, payload, _options);
  console.log("Result:", res.body);
}

async function upsertOrg(org: IOrg) {
  try {
    const payload = makeCompanyUpsertPayload(org);
    await bulkUpsertCompany([payload]);
  } catch (err) {
    console.log("Error on upsert of org", err);
  }
}

async function upsertUserToOrgs(user: IUser, orgsIds: string[]) {
  const bulkPayload: Array<object> = [];

  try {
    for (const orgId of orgsIds) {
      const payload = makeEndUserUpsertPayload(user, orgId);
      bulkPayload.push(payload);
    }
    await bulkUpsertEndUser(bulkPayload);
  } catch (err) {
    console.log("Error on upsert of user in orgs", err);
  }
}

function makeUser(email: string, id: string, orgsIds: string[]): IUser {
  return {
    email,
    id,
    firstName: "firstName",
    lastName: "lastName",
    position: "developer",
    phone: "+0123456789",
    country: "FR",
    browserLanguage: "fr-FR",
    lastActiveAt: 1712676376086,
    emailValidatedAt: 1712676376086,
    createdAt: 1712676376086,
    orgsIds,
  };
}

function makeOrg(name: string, id: string, users: IUser[]): IOrg {
  return {
    name,
    id,
    country: "FR",
    city: "Marseille",
    zip: "13000",
    address: "20 rue de Paris",
    company: "My Company",
    companySize: 100,
    createdAt: 1712676376086,
    users,
  };
}

async function doUpsertOrg(org: IOrg) {
  await upsertOrg(org);

  /**
   * At each org upsert, we update every user of the org
   */
  for (const user of org.users) {
    await doUpsertUser(user);
  }
}

async function doUpsertUser(user: IUser) {
  /**
   * Because the user can be part of several orgs,
   * we update the user in all the orgs to which he belongs
   */
  await upsertUserToOrgs(user, user.orgsIds);
}

function main() {
  let index = 0;
  const users: IUser[] = [];

  const orgId1 = "1-9876543210";
  const orgId2 = "2-9876543210";
  const orgId3 = "3-9876543210";
  const orgId4 = "4-9876543210";

  // Create only 3 users
  while (index < 3) {
    const user: IUser = makeUser(
      `test-email-${index}@gmail.com`,
      `0123456789-${index}`,
      [orgId1, orgId2, orgId3, orgId4]
    );
    users.push(user);
    index++;
  }
  // Create only 4 orgs
  const org1: IOrg = makeOrg(`1 Super Org`, orgId1, users);
  const org2: IOrg = makeOrg(`2 Super Org`, orgId2, users);
  const org3: IOrg = makeOrg(`3 Super Org`, orgId3, users);
  const org4: IOrg = makeOrg(`4 Super Org`, orgId4, users);

  index = 0;
  // Update orgs and users
  while (index < 6) {
    // Asynchronous call
    void doUpsertOrg(org1);
    void doUpsertOrg(org2);
    void doUpsertOrg(org3);
    void doUpsertOrg(org4);

    for (const user of org1.users) {
      // Data variation update
      user.firstName = `firstName-${Math.random()}`;
      // Asynchronous call
      void doUpsertUser(user);
    }
    index++;
  }
}

main();
