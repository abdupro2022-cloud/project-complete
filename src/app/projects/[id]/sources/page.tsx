"use client";

import { useParams } from "next/navigation";

import { ProjectWorkspace, ViewHeader } from "@/components/projects/ProjectWorkspace";
import { SourceList } from "@/components/research/SourceList";
import { useApp } from "@/lib/store/provider";

export default function ProjectSourcesPage() {
  const { id } = useParams<{ id: string }>();
  const { state } = useApp();
  const sources = state.sources.filter((s) => s.projectId === id);
  const project = state.projects.find((p) => p.id === id);

  return (
    <ProjectWorkspace>
      <ViewHeader
        title="المصادر"
        description="كل مصدر مع ما استُخرج منه فعليًا. درجة الموثوقية مبنية على نوع النطاق لا على شعور."
      />
      <SourceList sources={sources} projectId={project?.id} />
    </ProjectWorkspace>
  );
}
