import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateName, validatePhone } from '@/lib/validation';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      profile: data || {
        id: user.id,
        full_name: user.user_metadata?.full_name || '',
        phone: user.user_metadata?.phone || '',
        avatar_url: user.user_metadata?.avatar_url || '',
        role: 'patient',
        preferences: { email_notifications: true, sms_reminders: true, language: 'en' },
      },
      email: user.email,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, phone, emergency_contact, preferences } = body;

    const updates: Record<string, any> = {};

    if (full_name !== undefined) {
      const v = validateName(full_name);
      if (!v.valid) return NextResponse.json({ error: v.error }, { status: 400 });
      updates.full_name = full_name.trim();
    }

    if (phone !== undefined && phone !== '') {
      const v = validatePhone(phone);
      if (!v.valid) return NextResponse.json({ error: v.error }, { status: 400 });
      updates.phone = phone.trim();
    } else if (phone === '') {
      updates.phone = '';
    }

    if (emergency_contact !== undefined) {
      updates.emergency_contact = emergency_contact?.trim() || null;
    }

    if (preferences !== undefined && typeof preferences === 'object') {
      updates.preferences = preferences;
    }

    // Upsert profile
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        ...updates,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also update Supabase auth user metadata so session reflects new full_name
    if (updates.full_name || updates.phone) {
      await supabase.auth.updateUser({
        data: {
          full_name: updates.full_name,
          phone: updates.phone,
        },
      });
    }

    await supabase.from('user_activity').insert({
      user_id: user.id,
      action: 'profile.updated',
      entity_type: 'profile',
      entity_id: user.id,
      details: { updated_fields: Object.keys(updates) },
    });

    return NextResponse.json({ profile: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
