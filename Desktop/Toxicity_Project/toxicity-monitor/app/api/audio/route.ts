import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Ping the fast Python Flask background server
    const flaskResponse = await fetch("http://127.0.0.1:5000/analyze", {
        method: "POST",
        body: formData,
    });
    
    const result = await flaskResponse.json();
    if (!flaskResponse.ok) {
       return NextResponse.json({ error: result.error || 'Flask Background Server returned an error' }, { status: 500 });
    }

    return NextResponse.json(result);

  } catch (err: any) {
    if (err.message.includes("fetch")) {
       return NextResponse.json({ 
          error: "Python AI Server offline. Please run `python audio_server.py` in your terminal to start the background scanner!" 
       }, { status: 500 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
