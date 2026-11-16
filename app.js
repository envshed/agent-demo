const required = ["DATABASE_URL", "PAYMENTS_API_KEY", "EMAIL_API_KEY"];

console.log("Starting agent-demo with config:");
for (const key of required) {
  const value = process.env[key];
  console.log(value ? `  ${key}=${value}` : `  ${key} (missing)`);
}

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`\nCannot start: missing ${missing.join(", ")}.`);
  process.exit(1);
}
console.log("\nagent-demo is ready.");
