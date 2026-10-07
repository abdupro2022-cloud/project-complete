"use client";

import { useParams } from "next/navigation";

import { ProjectWorkspace, ViewHeader } from "@/components/projects/ProjectWorkspace";
import { ThumbnailsPanel } from "@/components/create/DerivedContent";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return (
    <ProjectWorkspace>
      <ViewHeader title="الثامبنيلات" description="مخرَج مشتق من المشروع — قابل للتعديل قبل الاعتماد." />
      <ThumbnailsPanel projectId={id} />
    </ProjectWorkspace>
  );
}
