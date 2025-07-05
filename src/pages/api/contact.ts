import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    
    // Aqui você pode adicionar a lógica para enviar o email
    // Por exemplo, usando serviços como SendGrid, Amazon SES, etc.
    
    // Por enquanto, vamos apenas simular um sucesso
    console.log('Dados do formulário recebidos:', data);
    
    return new Response(JSON.stringify({
      message: 'Mensagem recebida com sucesso'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Erro ao processar formulário:', error);
    
    return new Response(JSON.stringify({
      message: 'Erro ao processar a mensagem'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}; 