import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
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

    // Fetch the file record to get storage path and verify ownership
    const { data: file, error: fetchError } = await supabase
      .from('patient_files')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !file) {
      return NextResponse.json({ error: 'File not found or unauthorized' }, { status: 404 });
    }

    // Remove from storage bucket
    await supabase.storage.from('patient-records').remove([file.file_path]);

    // Remove from database
    const { error: deleteError } = await supabase
      .from('patient_files')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    await supabase.from('user_activity').insert({
      user_id: user.id,
      action: 'file.deleted',
      entity_type: 'patient_file',
      entity_id: id,
      details: { file_name: file.file_name },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
