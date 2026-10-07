"use client";

import { useParams } from "next/navigation";

import { ProjectWorkspace, ViewHeader } from "@/components/projects/ProjectWorkspace";
import { TitlesPanel } from "@/components/create/DerivedContent";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return (
    <ProjectWorkspace>
      <ViewHeader title="العناوين" description="مخرَج مشتق من المشروع — قابل للتعديل قبل الاعتماد." />
      <TitlesPanel projectId={id} />
    </ProjectWorkspace>
  );
}
