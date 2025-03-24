export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return new Response(JSON.stringify({ error: "URL parameter is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch subtitle");
    }

    const subtitleText = await response.text();
    return new Response(subtitleText, {
      status: 200,
      headers: {
        "Content-Type": "text/vtt",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(JSON.stringify({ error: "Failed to proxy subtitle" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
