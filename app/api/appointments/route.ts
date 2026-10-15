import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter');

    let query = supabase
      .from('appointments')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (filter === 'Upcoming') {
      query = query.eq('status', 'Pending');
    } else if (filter === 'Past') {
      query = query.in('status', ['Completed', 'Cancelled']);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ appointments: data || [] });
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
    const {
      treatment,
      date,
      time,
      doctor,
      patient_name,
      patient_phone,
      notes,
      treatment_plan_id,
    } = body;

    if (!treatment || !date || !time) {
      return NextResponse.json(
        { error: 'Treatment, date, and preferred time are required' },
        { status: 400 }
      );
    }

    // Verify treatment plan belongs to this user if provided
    if (treatment_plan_id) {
      const { data: plan } = await supabase
        .from('treatment_plans')
        .select('id')
        .eq('id', treatment_plan_id)
        .eq('user_id', user.id)
        .single();

      if (!plan) {
        return NextResponse.json(
          { error: 'Invalid treatment plan association' },
          { status: 400 }
        );
      }
    }

    const reference_code = `LD-${Math.floor(100000 + Math.random() * 900000)}`;

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        user_id: user.id,
        treatment_plan_id: treatment_plan_id || null,
        treatment: treatment.trim(),
        date,
        time,
        doctor: doctor || 'MDS Specialist',
        patient_name: patient_name?.trim() || user.user_metadata?.full_name || 'Patient',
        patient_phone: patient_phone?.trim() || user.user_metadata?.phone || '',
        notes: notes?.trim() || null,
        status: 'Pending',
        reference_code,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from('user_activity').insert({
      user_id: user.id,
      action: 'appointment.booked',
      entity_type: 'appointment',
      entity_id: data.id,
      details: {
        treatment: data.treatment,
        date: data.date,
        time: data.time,
        reference_code: data.reference_code,
      },
    });

    return NextResponse.json({ appointment: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
