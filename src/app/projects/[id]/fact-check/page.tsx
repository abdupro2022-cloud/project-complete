"use client";

import { useParams } from "next/navigation";
import { ProjectWorkspace, ViewHeader } from "@/components/projects/ProjectWorkspace";
import { FactCheckView } from "@/components/research/FactCheckView";
import { useProjectBundle } from "@/lib/store/provider";

export default function ProjectFactCheckPage() {
  const { id } = useParams<{ id: string }>();
  const bundle = useProjectBundle(id);

  return (
    <ProjectWorkspace>
      <ViewHeader
        title="تحقق الحقائق"
        description="قبل أن تكتب أي رقم في الفيديو: ما مصدره، وكم مصدرًا يسنده، وأين يتعارض مع غيره."
      />
      <FactCheckView claims={bundle.claims} contradictions={bundle.contradictions} />
    </ProjectWorkspace>
  );
}
