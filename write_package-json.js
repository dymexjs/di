import { writeFileSync } from "node:fs";
import { join } from "node:path";

writeFileSync(
  join("dist", "cjs", "package.json"),
  JSON.stringify({ type: "commonjs" }, null, 2),
);

writeFileSync(
  join("dist", "esm", "package.json"),
  JSON.stringify({ type: "module" }, null, 2),
);
