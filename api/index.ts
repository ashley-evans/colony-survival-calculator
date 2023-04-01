import path from "path";
import fs from "fs";

const schemaPath = path.join(__dirname, "src/graphql/schema.graphql");
const schema = fs.readFileSync(schemaPath, "utf-8");

export { schema };
