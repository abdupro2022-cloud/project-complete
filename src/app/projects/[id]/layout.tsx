import { buildDemoState } from "@/lib/store/seed";

// Pre-render every seeded demo project at build time so the static export has
// real HTML for those URLs. Anything beyond the seeds is handled at runtime by
// the client router (Next keeps `dynamicParams = true` by default).
export function generateStaticParams() {
  return buildDemoState().projects.map((p) => ({ id: p.id }));
}

export default function ProjectIdLayout({ children }: { children: React.ReactNode }) {
  return children;
}