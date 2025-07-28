export async function GET() {
  return new Response(JSON.stringify({ error: 'Not implemented. Use localStorage on client.' }), { status: 401 });
} 