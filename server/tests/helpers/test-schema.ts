// Test helpers TRUNCATE and DROP. This guard makes it impossible for them to
// run against the dev schema, even if the environment is misconfigured.
export function assertTestSchema(): string {
  const schema = process.env.DB_SCHEMA ?? "";
  if (!schema.endsWith("_test")) {
    throw new Error(`Refusing to run destructive test setup against schema "${schema}"`);
  }
  return schema;
}
