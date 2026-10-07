"use client";

import { useParams } from "next/navigation";
import { ProjectWorkspace, ViewHeader } from "@/components/projects/ProjectWorkspace";
import { TimelineRail } from "@/components/research/TimelineRail";
import { useProjectBundle } from "@/lib/store/provider";

export default function ProjectTimelinePage() {
  const { id } = useParams<{ id: string }>();
  const bundle = useProjectBundle(id);

  return (
    <ProjectWorkspace>
      <ViewHeader
        title="الخط الزمني"
        description="مرتّبة زمنيًا ومربوطة بمصادرها. ما يعتمد على تاريخ النشر فقط يُوسم كاستنتاجي."
      />
      <TimelineRail events={bundle.events} />
    </ProjectWorkspace>
  );
}
