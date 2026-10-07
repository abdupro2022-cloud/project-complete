"use client";

import { useParams } from "next/navigation";
import { ProjectWorkspace, ViewHeader } from "@/components/projects/ProjectWorkspace";
import { EntityMap } from "@/components/research/EntityMap";
import { useProjectBundle } from "@/lib/store/provider";

export default function ProjectEntitiesPage() {
  const { id } = useParams<{ id: string }>();
  const bundle = useProjectBundle(id);

  return (
    <ProjectWorkspace>
      <ViewHeader
        title="خريطة الكيانات"
        description="من متصل بمن، وبأي دليل. هذه هي الشبكة التي تجعل المصادر قابلة للربط بدل أن تكون قائمة مسطّحة."
      />
      <EntityMap entities={bundle.entities} edges={bundle.edges} />
    </ProjectWorkspace>
  );
}
