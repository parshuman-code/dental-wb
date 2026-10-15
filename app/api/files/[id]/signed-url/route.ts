import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: file, error: fetchError } = await supabase
      .from('patient_files')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !file) {
      return NextResponse.json({ error: 'File not found or unauthorized' }, { status: 404 });
    }

    const { data: signed, error: signError } = await supabase.storage
      .from('patient-records')
      .createSignedUrl(file.file_path, 900); // 15 mins

    if (signError || !signed) {
      return NextResponse.json({ error: 'Could not generate signed URL' }, { status: 500 });
    }

    return NextResponse.json({ signed_url: signed.signedUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
