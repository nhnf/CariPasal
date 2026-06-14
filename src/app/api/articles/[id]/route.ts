import { getArticleDetail } from "@/lib/supabase/queries";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const article = await getArticleDetail(id);

    if (!article) {
      return Response.json({ message: "Pasal tidak ditemukan." }, { status: 404 });
    }

    return Response.json(article);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal mengambil detail pasal.";

    return Response.json({ message }, { status: 500 });
  }
}
