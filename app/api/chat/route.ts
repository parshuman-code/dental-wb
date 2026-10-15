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
2. If a patient expresses severe pain, bleeding, swelling, dental trauma, or asks how to visit Dr. Ananya Roy, politely encourage them to click the 'Book Appointment' button on the website immediately for urgent booking and consultation.
3. Keep responses nicely formatted with short paragraphs or bullet points when helpful, without being overly wordy. Never provide dangerous self-medication prescriptions (e.g. antibiotic dosages) — always recommend a professional consultation.`;

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

    // Format conversation history for Gemini API
    // Maps roles to 'user' or 'model'
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content || '' }],
    }));

    // Supported active models in order of priority & speed
    const modelsToTry = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];
    let reply = '';
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.7,
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
