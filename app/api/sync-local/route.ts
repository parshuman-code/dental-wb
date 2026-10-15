import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { appointments } = body;

    if (!Array.isArray(appointments) || appointments.length === 0) {
      return NextResponse.json({ synced: 0 });
    }

    let syncedCount = 0;
    for (const appt of appointments) {
      if (!appt.treatment || !appt.date || !appt.time) continue;

      const refCode = appt.id && appt.id.startsWith('LD-') 
        ? appt.id 
        : `LD-${Math.floor(100000 + Math.random() * 900000)}`;

      const { error } = await supabase.from('appointments').insert({
        user_id: user.id,
        treatment: appt.treatment,
        date: appt.date,
        time: appt.time,
        doctor: appt.doctor || 'MDS Specialist',
        patient_name: appt.name || user.user_metadata?.full_name || 'Patient',
        patient_phone: appt.phone || user.user_metadata?.phone || '',
        notes: appt.notes || null,
        status: appt.status || 'Pending',
        reference_code: refCode,
      });

      if (!error) {
        syncedCount++;
      }
    }

    if (syncedCount > 0) {
      await supabase.from('user_activity').insert({
        user_id: user.id,
        action: 'appointments.synced_from_local_storage',
        entity_type: 'appointment',
        details: { count: syncedCount },
      });
    }

    return NextResponse.json({ synced: syncedCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Sync failed' }, { status: 500 });
  }
}
