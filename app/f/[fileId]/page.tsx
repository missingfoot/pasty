import Workspace from "@/components/Workspace";

export default async function FilePage({
  params,
}: {
  params: Promise<{ fileId: string }>;
}) {
  const { fileId } = await params;
  return <Workspace activeFileId={fileId} />;
}
