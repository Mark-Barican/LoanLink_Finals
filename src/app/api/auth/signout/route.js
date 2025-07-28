export async function POST() {
  return new Response(JSON.stringify({ message: 'Sign out handled on client.' }), { status: 200 });
} 