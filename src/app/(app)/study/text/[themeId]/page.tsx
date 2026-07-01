import { notFound } from "next/navigation";
import { StudyTextLoader } from "@/components/study/study-text-loader";
import { getThemeById, isThemeId } from "@/lib/catalog";

export default async function StudyTextPage({
  params,
}: {
  params: Promise<{ themeId: string }>;
}) {
  const { themeId } = await params;

  if (!isThemeId(themeId)) {
    notFound();
  }

  const theme = getThemeById(themeId);

  return <StudyTextLoader theme={theme} />;
}
