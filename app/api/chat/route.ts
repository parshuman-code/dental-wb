import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const SYSTEM_INSTRUCTION = `You are DenTo, the official 24/7 AI Receptionist for Aura Dental Clinic, located in Sector 17, Vashi, Navi Mumbai, led by Dr. Ananya Roy (Chief Dental Specialist & MDS).

Your Persona & Tone:
- Your name is DenTo. When greeting or introducing yourself, use DenTo.
- Extremely polite, warm, empathetic, caring, and patient-centric.
- You understand and reply seamlessly in English, Hindi, and Hinglish (natural mix of Hindi and English) based on what the patient prefers and uses.
- Always reassure nervous or anxious patients about painless, modern care.

Clinic Details:
- Clinic Name: Aura Dental Clinic
- Chief Specialist: Dr. Ananya Roy (MDS, Advanced Aesthetic & Restorative Dentistry)
- Location: Sector 17, Vashi, Navi Mumbai (Near Vashi Plaza / Railway Station)
- Hours: Open 24/7 for patient inquiries, emergency assistance, and scheduling.
- Key Treatments offered:
  * RCT (Root Canal Treatment): Single-visit, virtually painless nerve cleaning with advanced rotary systems.
  * Teeth Cleaning & Polishing (Scaling): Gentle removal of plaque, calculus, and stains for fresh breath and healthy gums.
  * Braces & Clear Aligners: Straightening crooked teeth with conventional braces or invisible aligners.
  * Dental Implants: Permanent, natural-looking replacement roots and crowns for missing teeth.
  * Emergency Dental Relief: Instant care for severe toothaches, chipped teeth, abscesses, broken crowns, or bleeding gums.

Guidelines & Rules:
1. Provide concise, clear, reassuring answers about treatments, post-procedure tips, and clinic timings.
2. If a patient asks you to book an appointment, expresses that they don't know how to book, asks you to book on their behalf, or says phrases like:
   - "I don't know how to book"
   - "Book an appointment for me" / "Book for me"
   - "Save my time"
   - "Can you schedule a visit?"
   - "Schedule my RCT / cleaning / consultation"
   - "Please book a slot"
   Then switch into 'Interactive Guided Booking Mode'. ALWAYS include the special signal tag [[START_INCHAT_BOOKING]] in your response. Reassure the user warmly (e.g. "Namaste! I'd love to help you book directly right here to save your time. Let's start by choosing your treatment below:") and provide [[START_INCHAT_BOOKING]].
3. If a patient expresses severe pain, bleeding, swelling, dental trauma, reassure them and either offer direct booking with [[START_INCHAT_BOOKING]] or encourage immediate urgent consultation.
4. Keep responses nicely formatted with short paragraphs or bullet points when helpful, without being overly wordy. Never provide dangerous self-medication prescriptions (e.g. antibiotic dosages) — always recommend a professional consultation.`;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured.' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required.' },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    // Limit history to the last 6 messages to prevent latency degradation from large context
    const recentMessages = messages.slice(-6);
    const contents = recentMessages.map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content || '' }],
    }));

    // High-speed, responsive model sequence:
    // 1. gemini-3-flash-preview: ~1.5s ultra-fast execution
    // 2. gemini-3.5-flash: high accuracy & low latency
    // 3. gemini-3.5-flash-lite: reliable fallback
    const modelsToTry = [
      'gemini-3-flash-preview',
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite'
    ];
    let reply = '';
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.6,
            maxOutputTokens: 250, // Keep responses crisp and snappy
          },
        });

        if (response && response.text) {
          reply = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} attempt failed, trying next fallback:`, err?.message || err);
      }
    }

    if (!reply) {
      if (lastError) throw lastError;
      reply = 'Namaste! I am DenTo. How may I assist you with your dental care today?';
    }

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Error in AI Chat API route:', error);
    return NextResponse.json(
      {
        error: error?.message || 'Failed to process AI chat response.',
        reply: "I apologize, but I am having trouble connecting right now. Please feel free to click 'Book Appointment' above or call our front desk for immediate assistance!",
      },
      { status: 500 }
    );
  }
}
