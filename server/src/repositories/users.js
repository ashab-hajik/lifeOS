// Small JSON-file adapter for the no-database MVP. Replace this repository with Mongoose later.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const directory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../data",
);
const file = path.join(directory, "users.json");
fs.mkdirSync(directory, { recursive: true });
let users = [];
try {
  users = JSON.parse(fs.readFileSync(file, "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const persist = () =>
  fs.writeFileSync(file, JSON.stringify(users, null, 2), { mode: 0o600 });
export default {
  all: () => users,
  findByIdentity: (value) =>
    users.find(
      (u) =>
        u.email === value.toLowerCase() || u.username === value.toLowerCase(),
    ),
  findById: (id) => users.find((u) => u.id === id),
  findByProvider: (provider, providerId) =>
    users.find((user) => user.oauthProviders?.[provider] === providerId),
  create: (user) => (users.push(user), persist(), user),
  update: (id, patch) => {
    const user = users.find((u) => u.id === id);
    if (user) {
      Object.assign(user, patch);
      persist();
    }
    return user;
  },
};
