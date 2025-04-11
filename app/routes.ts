import type { RouteConfig } from "@react-router/dev/routes";
import { index, route } from "@react-router/dev/routes";

// Explicitly define the application routes
export default [
  // Matches the root path '/' and uses the component exported from 'app/routes/home.tsx'
  index("routes/home.tsx"),

  // Matches paths like '/answer/some-id'
  // It uses the component exported from 'app/routes/answer.$id.tsx'
  // The ':id' part corresponds to the [id] or $id in the filename and becomes a param
  route("answer/:id", "routes/answer.$id.tsx"),
] satisfies RouteConfig;
