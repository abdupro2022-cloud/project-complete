"use client";

import { useParams } from "next/navigation";

import { ProjectWorkspace, ViewHeader } from "@/components/projects/ProjectWorkspace";
import { TranscriptView } from "@/components/research/TranscriptView";

export default function ProjectTranscriptPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <ProjectWorkspace>
      <ViewHeader title="التفريغ النصي" description="فهرسة بالفصل والمؤشر الزمني، جاهزة للاقتباس." />
      <TranscriptView projectId={id} />
    </ProjectWorkspace>
  );
}
