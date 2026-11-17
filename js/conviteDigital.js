// =====================================================================
// CONVITE EXCLUSIVO — Meu Convite Digital (PNG / PDF / E-mail)
// =====================================================================
// O cartão (#cartao-convite-digital) é a ÚNICA fonte visual usada
// tanto no PNG como no PDF — nunca se desenha duas composições
// diferentes, exatamente como pedido no briefing.
// =====================================================================
import { CONFIGURACAO } from './config.js';

let html2canvasPromessa = null;
let jsPDFPromessa = null;

// Importadas só quando realmente preciso (poupa carregamento inicial
// em quem nunca chega a confirmar presença).
function carregarHtml2Canvas() {
  if (!html2canvasPromessa) {
    html2canvasPromessa = import('https://esm.sh/html2canvas@1.4.1').then((m) => m.default);
  }
  return html2canvasPromessa;
}

function carregarJsPDF() {
  if (!jsPDFPromessa) {
    jsPDFPromessa = import('https://esm.sh/jspdf@2.5.1').then((m) => m.jsPDF);
  }
  return jsPDFPromessa;
}

const MESES_PT_ABREV = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez',
];

function formatarDataCurta(dataISO) {
  const [ano, mes, dia] = dataISO.split('-').map(Number);
  return `${String(dia).padStart(2, '0')} ${MESES_PT_ABREV[mes - 1]} ${ano}`;
}

function formatarHoraCurta(horaStr) {
  const [h, m] = horaStr.split(':');
  return `${h}H${m}`;
}

function textoHorarioChegada(codigo) {
  const mapa = {
    '19h00-19h30': '19h00 – 19h30',
    '19h30-20h00': '19h30 – 20h00',
    '20h00-20h30': '20h00 – 20h30',
    '20h30-21h00': '20h30 – 21h00',
    'depois-21h00': 'Depois das 21h00',
  };
  return mapa[codigo] ?? 'A combinar';
}

let contextoAtual = null;

/**
 * Preenche o cartão com os dados reais (evento + resposta do
 * convidado) e revela a secção "O teu convite está pronto!".
 * NUNCA é chamada para quem respondeu que não vai — ver pagina.js.
 */
export function revelarConviteDigital({ evento, codigoPublico, nome, acompanhantes, horario, token }) {
  contextoAtual = { token };

  document.getElementById('cd-nome').textContent = evento.nome_aniversariante;
  document.getElementById('cd-frase').textContent = evento.mensagem_principal;
  document.getElementById('cd-idade').textContent = String(evento.idade_comemorada);
  document.getElementById('cd-data').textContent = formatarDataCurta(evento.data_evento);
  document.getElementById('cd-hora').textContent = formatarHoraCurta(evento.hora_evento);
  document.getElementById('cd-local').textContent = evento.local_evento;
  document.getElementById('cd-traje').textContent = evento.traje;

  document.getElementById('cd-convidado').textContent = nome || '—';
  document.getElementById('cd-acompanhantes').textContent = String(acompanhantes ?? 0);
  document.getElementById('cd-chegada').textContent = horario ? textoHorarioChegada(horario) : 'Não indicada';
  document.getElementById('cd-codigo').textContent = codigoPublico ?? '—';

  const secao = document.getElementById('secao-convite-digital');
  secao.classList.remove('oculto');

  ligarBotoesDeAcao();

  // O scroll até esta secção, quando faz sentido (logo após uma
  // submissão), é tratado em formulario.js ao fechar o modal de
  // sucesso — aqui só preenchemos e revelamos o conteúdo.
}

function mostrarEstado(mensagem, tipoErro = false) {
  const el = document.getElementById('estado-acao-convite');
  el.textContent = mensagem;
  el.classList.remove('oculto');
  el.classList.toggle('erro', tipoErro);
}

async function gerarCanvasDoCartao() {
  const html2canvas = await carregarHtml2Canvas();
  const cartao = document.getElementById('cartao-convite-digital');
  const larguraAtual = cartao.getBoundingClientRect().width;
  const escala = Math.max(1, 1080 / larguraAtual); // garante ~1080px de largura final

  return html2canvas(cartao, {
    scale: escala,
    backgroundColor: '#080808',
    useCORS: true,
  });
}

let botoesJaLigados = false;

function ligarBotoesDeAcao() {
  if (botoesJaLigados) return; // evita ligar duas vezes se a secção for revelada mais de uma vez
  botoesJaLigados = true;

  const elBotaoPng = document.getElementById('botao-baixar-png');
  const elBotaoPdf = document.getElementById('botao-baixar-pdf');
  const elBotaoEmail = document.getElementById('botao-enviar-email');
  const elCampoEmailEnvio = document.getElementById('campo-email-envio');
  const elErroEmailEnvio = document.getElementById('erro-email-envio');

  elBotaoPng.addEventListener('click', async () => {
    elBotaoPng.disabled = true;
    mostrarEstado('A preparar a imagem…');
    try {
      const canvas = await gerarCanvasDoCartao();
      canvas.toBlob(async (blob) => {
        if (!blob) {
          mostrarEstado('Não foi possível gerar a imagem. Tenta novamente.', true);
          elBotaoPng.disabled = false;
          return;
        }

        const ficheiro = new File([blob], 'convite-exclusivo.png', { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [ficheiro] })) {
          try {
            await navigator.share({ files: [ficheiro], title: 'O meu Convite Exclusivo' });
            mostrarEstado('Escolhe "Guardar imagem" na janela que abriu para a teres na galeria.');
          } catch (excecaoPartilha) {
            // Utilizador cancelou a partilha — não é um erro a mostrar.
            mostrarEstado('');
            document.getElementById('estado-acao-convite').classList.add('oculto');
          }
        } else {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'convite-exclusivo.png';
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(url);
          mostrarEstado('A imagem foi transferida — procura-a na pasta de transferências ou na galeria.');
        }
        elBotaoPng.disabled = false;
      }, 'image/png', 1.0);
    } catch (excecao) {
      mostrarEstado('Não foi possível gerar a imagem agora. Tenta novamente.', true);
      elBotaoPng.disabled = false;
    }
  });

  elBotaoPdf.addEventListener('click', async () => {
    elBotaoPdf.disabled = true;
    mostrarEstado('A preparar o PDF…');
    try {
      const canvas = await gerarCanvasDoCartao();
      const JsPdfClasse = await carregarJsPDF();

      // Página vertical com a mesma proporção 9:16 do cartão, em mm.
      const larguraMm = 100;
      const alturaMm = larguraMm * (canvas.height / canvas.width);
      const doc = new JsPdfClasse({
        orientation: 'portrait',
        unit: 'mm',
        format: [larguraMm, alturaMm],
      });

      doc.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', 0, 0, larguraMm, alturaMm);
      doc.save('convite-exclusivo.pdf');
      mostrarEstado('O PDF foi transferido.');
    } catch (excecao) {
      mostrarEstado('Não foi possível gerar o PDF agora. Tenta novamente.', true);
    } finally {
      elBotaoPdf.disabled = false;
    }
  });

  elBotaoEmail.addEventListener('click', async () => {
    elErroEmailEnvio.textContent = '';
    const email = elCampoEmailEnvio.value.trim();

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      elErroEmailEnvio.textContent = 'Escreve um e-mail válido.';
      elCampoEmailEnvio.focus();
      return;
    }

    elBotaoEmail.disabled = true;
    mostrarEstado('A preparar e a enviar o convite por e-mail…');

    try {
      const canvas = await gerarCanvasDoCartao();
      const JsPdfClasse = await carregarJsPDF();
      const larguraMm = 100;
      const alturaMm = larguraMm * (canvas.height / canvas.width);
      const doc = new JsPdfClasse({ orientation: 'portrait', unit: 'mm', format: [larguraMm, alturaMm] });
      doc.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', 0, 0, larguraMm, alturaMm);

      const pngBase64 = canvas.toDataURL('image/png', 1.0).split(',')[1];
      const pdfBase64 = doc.output('datauristring').split(',')[1];

      const urlFuncao = `${CONFIGURACAO.SUPABASE_URL}/functions/v1/enviar-convite-email`;
      const respostaFetch = await fetch(urlFuncao, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: contextoAtual.token,
          email,
          png_base64: pngBase64,
          pdf_base64: pdfBase64,
        }),
      });

      const dados = await respostaFetch.json().catch(() => null);

      if (!respostaFetch.ok || !dados?.sucesso) {
        const mapaErros = {
          servico_email_nao_configurado: 'O envio por e-mail ainda não foi configurado pelo administrador.',
          email_invalido: 'Esse e-mail não é válido.',
          convite_nao_disponivel: 'O convite ainda não está disponível para envio.',
        };
        mostrarEstado(mapaErros[dados?.erro] ?? 'Não foi possível enviar o e-mail agora. Tenta novamente.', true);
        return;
      }

      mostrarEstado(`Convite enviado com sucesso para ${email}.`);
    } catch (excecao) {
      mostrarEstado('Não foi possível enviar o e-mail agora. Verifica a tua ligação e tenta novamente.', true);
    } finally {
      elBotaoEmail.disabled = false;
    }
  });
}
