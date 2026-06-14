import { z } from "zod";

import { searchArticles } from "@/lib/supabase/queries";

const searchRequestSchema = z.object({
  query: z.string().min(3, "Query minimal 3 karakter."),
  category: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = searchRequestSchema.parse(json);
    const result = await searchArticles(payload.query, payload.category);

    return Response.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        {
          message: "Input pencarian tidak valid.",
          errors: error.flatten(),
        },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Terjadi kegagalan pencarian.";

    return Response.json({ message }, { status: 500 });
  }
}
