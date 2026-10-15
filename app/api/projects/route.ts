import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('treatment_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ projects: data || [] });
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

    const body = await request.json();
    const { title, category, description, doctor_notes, status, estimated_cost } = body;

    if (!title || typeof title !== 'string' || title.trim().length < 2) {
      return NextResponse.json({ error: 'Title is required (minimum 2 characters)' }, { status: 400 });
    }

    // Explicitly enforce user_id from verified auth token
    const { data, error } = await supabase
      .from('treatment_plans')
      .insert({
        user_id: user.id,
        title: title.trim(),
        category: category || 'General Dentistry',
        description: description?.trim() || null,
        doctor_notes: doctor_notes?.trim() || null,
        status: status || 'Active',
        estimated_cost: typeof estimated_cost === 'number' ? estimated_cost : null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from('user_activity').insert({
      user_id: user.id,
      action: 'treatment_plan.created',
      entity_type: 'treatment_plan',
      entity_id: data.id,
      details: { title: data.title },
    });

    return NextResponse.json({ project: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
