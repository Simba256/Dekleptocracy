import { NextRequest, NextResponse } from 'next/server';

// Types for our chat messages
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  stream?: boolean;
}

// MCP Server configuration
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:8000';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Helper function to detect if query needs MCP tools
// Now that we have intelligent V2 with GPT-5 deciding which tools to use,
// we can route ALL queries to MCP and let GPT-5 decide if tools are needed
function shouldUseMCPTools(query: string): boolean {
  // Route all queries to intelligent MCP server V2
  // GPT-5 will automatically decide which tools to use (if any)
  return true;

  // Alternative: Keep restrictive routing if you want fallback behavior
  // const keywords = [
  //   'tariff', 'trade', 'import', 'export', 'duty', 'customs',
  //   'hts', 'harmonized', 'census', 'bea', 'usitc', 'gdp',
  //   'economic', 'federal register', 'regulation', 'commodity',
  //   'stock', 'market', 'company', 'tesla', 'steel', 'automotive',
  //   'price', 'news', 'industry', 'finance'
  // ];
  // const lowerQuery = query.toLowerCase();
  // return keywords.some(keyword => lowerQuery.includes(keyword));
}

// Helper function to call MCP server with intelligent V2 system
async function callMCPServer(messages: ChatMessage[]): Promise<Response> {
  try {
    // Use the new LLM-driven endpoint (V2) with GPT-5 function calling
    const response = await fetch(`${MCP_SERVER_URL}/chat/intelligent/v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        use_mcp_tools: true,
        stream: false  // V2 returns complete responses, not streaming yet
      }),
    });

    if (!response.ok) {
      throw new Error(`MCP server error: ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error('MCP Server error:', error);
    throw error;
  }
}

// Helper function to call OpenAI GPT-5
async function callOpenAI(messages: ChatMessage[], stream: boolean = true): Promise<Response> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-5',  // Use GPT-5 when available, fallback to gpt-4-turbo
      messages,
      stream,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    // If GPT-5 is not available, try GPT-4
    if (response.status === 404 || response.status === 400) {
      const fallbackResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',  // Fallback model
          messages,
          stream,
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!fallbackResponse.ok) {
        throw new Error(`OpenAI API error: ${fallbackResponse.status}`);
      }
      return fallbackResponse;
    }
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  return response;
}

// Stream transformer for OpenAI responses
function transformOpenAIStream(reader: ReadableStreamDefaultReader): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                controller.close();
                return;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'content', content })}\n\n`));
                }
              } catch (e) {
                console.error('Error parsing OpenAI stream:', e);
              }
            }
          }
        }
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

// Stream transformer for MCP responses (already in SSE format)
function transformMCPStream(reader: ReadableStreamDefaultReader): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            break;
          }
          controller.enqueue(value);
        }
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const { messages, stream = true } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    // Get the last user message
    const lastUserMessage = messages
      .filter(m => m.role === 'user')
      .pop();

    if (!lastUserMessage) {
      return NextResponse.json(
        { error: 'No user message found' },
        { status: 400 }
      );
    }

    // Determine routing based on message content
    const useMCP = shouldUseMCPTools(lastUserMessage.content);

    if (useMCP) {
      // Route to MCP server V2 for intelligent trade/tariff analysis
      console.log('Routing to MCP server V2 (LLM-driven) for trade analysis...');

      try {
        const mcpResponse = await callMCPServer(messages);

        if (!mcpResponse.ok) {
          throw new Error(`MCP server error: ${mcpResponse.status}`);
        }

        // V2 returns JSON with complete response
        const data = await mcpResponse.json();

        console.log(`MCP V2 used ${data.metadata?.tool_count || 0} tools in ${data.metadata?.iterations || 0} iterations`);

        return NextResponse.json({
          role: 'assistant',
          content: data.content,
          metadata: data.metadata,
          tools_used: data.tool_calls?.map((t: any) => t.name) || []
        });
      } catch (mcpError) {
        console.error('MCP V2 routing failed, falling back to OpenAI:', mcpError);
        // Fallback to OpenAI if MCP fails
      }
    }

    // Route to OpenAI for general queries or if MCP fails
    console.log('Routing to OpenAI GPT...');

    if (!stream) {
      // Non-streaming response
      const openAIResponse = await callOpenAI(messages, false);
      const data = await openAIResponse.json();

      return NextResponse.json({
        role: 'assistant',
        content: data.choices?.[0]?.message?.content || 'No response generated',
      });
    }

    // Streaming response
    const openAIResponse = await callOpenAI(messages, true);

    if (!openAIResponse.body) {
      throw new Error('No response body from OpenAI');
    }

    const transformedStream = transformOpenAIStream(openAIResponse.body.getReader());

    return new Response(transformedStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// OPTIONS request for CORS
export async function OPTIONS(req: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}