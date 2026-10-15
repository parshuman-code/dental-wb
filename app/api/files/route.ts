import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateFile } from '@/lib/validation';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: files, error } = await supabase
      .from('patient_files')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Generate short-lived signed URLs for each file for secure client viewing
    const filesWithUrls = await Promise.all(
      (files || []).map(async (file) => {
        try {
          const { data: signed } = await supabase.storage
            .from('patient-records')
            .createSignedUrl(file.file_path, 900); // 15 minutes

          return {
            ...file,
            signed_url: signed?.signedUrl || null,
          };
        } catch {
          return { ...file, signed_url: null };
        }
      })
    );

    return NextResponse.json({ files: filesWithUrls });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const description = (formData.get('description') as string) || '';
    const treatmentPlanId = (formData.get('treatment_plan_id') as string) || null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate size and MIME type
    const validation = validateFile({
      name: file.name,
      size: file.size,
      type: file.type,
    });

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Validate treatment_plan_id ownership if provided
    if (treatmentPlanId) {
      const { data: plan } = await supabase
        .from('treatment_plans')
        .select('id')
        .eq('id', treatmentPlanId)
        .eq('user_id', user.id)
        .single();

      if (!plan) {
        return NextResponse.json(
          { error: 'Cannot attach file to a treatment plan you do not own' },
          { status: 403 }
        );
      }
    }

    // Sanitize file name and create user-scoped storage path
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${user.id}/${Date.now()}_${sanitizedName}`;

    // Upload to private Supabase Storage bucket
    const fileBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from('patient-records')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Insert metadata record in database
    const { data: fileRecord, error: dbError } = await supabase
      .from('patient_files')
      .insert({
        user_id: user.id,
        treatment_plan_id: treatmentPlanId,
        file_name: file.name,
        file_path: storagePath,
        file_size: file.size,
        file_type: file.type,
        bucket_id: 'patient-records',
        description: description?.trim() || null,
      })
      .select()
      .single();

    // If database insertion fails, roll back uploaded storage object to prevent orphan files
    if (dbError) {
      await supabase.storage.from('patient-records').remove([storagePath]);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // Create initial signed URL for immediate frontend display
    const { data: signed } = await supabase.storage
      .from('patient-records')
      .createSignedUrl(storagePath, 900);

    // Audit log
    await supabase.from('user_activity').insert({
      user_id: user.id,
      action: 'file.uploaded',
      entity_type: 'patient_file',
      entity_id: fileRecord.id,
      details: {
        file_name: fileRecord.file_name,
        file_size: fileRecord.file_size,
        file_type: fileRecord.file_type,
      },
    });

    return NextResponse.json(
      {
        file: {
          ...fileRecord,
          signed_url: signed?.signedUrl || null,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
