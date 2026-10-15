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

    const { data, error } = await supabase
      .from('treatment_plans')
      .select('*, patient_files(*), appointments(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Treatment plan not found' }, { status: 404 });
    }

    return NextResponse.json({ project: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(
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

    const body = await request.json();
    const { title, category, description, doctor_notes, status, estimated_cost } = body;

    const updates: Record<string, any> = {};
    if (title !== undefined) updates.title = title.trim();
    if (category !== undefined) updates.category = category;
    if (description !== undefined) updates.description = description?.trim() || null;
    if (doctor_notes !== undefined) updates.doctor_notes = doctor_notes?.trim() || null;
    if (status !== undefined) updates.status = status;
    if (estimated_cost !== undefined) updates.estimated_cost = estimated_cost;

    // Reject tampering with ownership
    delete updates.user_id;
    delete updates.id;

    const { data, error } = await supabase
      .from('treatment_plans')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Update failed' }, { status: 400 });
    }

    await supabase.from('user_activity').insert({
      user_id: user.id,
      action: 'treatment_plan.updated',
      entity_type: 'treatment_plan',
      entity_id: id,
      details: { title: data.title },
    });

    return NextResponse.json({ project: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

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

    const { error } = await supabase
      .from('treatment_plans')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await supabase.from('user_activity').insert({
      user_id: user.id,
      action: 'treatment_plan.deleted',
      entity_type: 'treatment_plan',
      entity_id: id,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
