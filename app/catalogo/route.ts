import { NextResponse } from "next/server";
import { CATALOGO_INSTITUCIONAL } from "../../utils/catalogo";

export async function GET() {
  return NextResponse.json(CATALOGO_INSTITUCIONAL, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
