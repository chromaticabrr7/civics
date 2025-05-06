import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    console.log('API route hit');
    const { question, answers, userAnswer } = await req.json();
    console.log('Received:', { question, answers, userAnswer });

    const prompt = `
You are a civics test grader. Here is the question:
${question}
Here are the correct answers: ${answers.join(', ')}
The user answered: ${userAnswer}
Is the user's answer correct? Reply with only "yes" or "no" on the first line, then explain briefly on the next line.
`;

    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      console.error('No OpenRouter API key found');
      return NextResponse.json({ error: 'No API key' }, { status: 500 });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-maverick:free',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 100,
      }),
    });

    console.log('OpenRouter response status:', response.status);

    const data = await response.json();
    console.log('OpenRouter response data:', data);

    const aiReply = data.choices?.[0]?.message?.content || '';
    console.log('AI Reply:', aiReply);

    const firstLine = aiReply.trim().split('\n')[0].toLowerCase();
    const isCorrect = firstLine.startsWith('yes');

    return NextResponse.json({ isCorrect, aiReply });
  } catch (error) {
    let message = 'Unknown error';
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      message = (error as any).message;
    }
    console.error('Error in API route:', message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}