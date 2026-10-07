"use client";

import { useParams } from "next/navigation";

import { ProjectWorkspace, ViewHeader } from "@/components/projects/ProjectWorkspace";
import { ShortsPanel } from "@/components/create/DerivedContent";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return (
    <ProjectWorkspace>
      <ViewHeader title="استخراج الشورتس" description="مخرَج مشتق من المشروع — قابل للتعديل قبل الاعتماد." />
      <ShortsPanel projectId={id} />
    </ProjectWorkspace>
  );
}
