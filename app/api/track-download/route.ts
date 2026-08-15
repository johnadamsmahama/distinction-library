import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { type, id } = await req.json();

    if (!id || (type !== 'papers' && type !== 'materials')) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const supabase = createClient();

    const { error } =
      type === 'papers'
        ? await supabase.rpc('increment_paper_downloads', { paper_id: id })
        : await supabase.rpc('increment_material_downloads', { material_id: id });

    if (error) {
      console.error('Download tracking error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Download tracking error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
