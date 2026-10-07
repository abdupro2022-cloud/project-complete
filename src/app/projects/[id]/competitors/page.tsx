"use client";

import { useParams } from "next/navigation";

import { ProjectWorkspace, ViewHeader } from "@/components/projects/ProjectWorkspace";
import { CompetitorPanel } from "@/app/competitors/page";

export default function ProjectCompetitorsPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <ProjectWorkspace>
      <ViewHeader
        title="المنافسون"
        description="أنماط متكررة وفجوات محتوى — بيانات وتحليل، لا حكم على من هو أفضل."
      />
      <CompetitorPanel projectId={id} />
    </ProjectWorkspace>
  );
}
