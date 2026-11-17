// =====================================================================
// CONVITE EXCLUSIVO — Orquestração da página pública
// =====================================================================
import { supabase } from './supabaseClient.js';
import { obterTokenDaURL, formatarData, formatarHora, construirDataEvento } from './utils.js';
import { iniciarContador } from './contador.js';
import { configurarFormularioRSVP } from './formulario.js';
import { revelarConviteDigital } from './conviteDigital.js';

const MENSAGENS_ERRO_CONVITE = {
  token_invalido: 'O link que utilizaste não é válido.',
  convite_nao_encontrado: 'O link que utilizaste é inválido ou já não existe.',
  convite_revogado: 'Este convite foi revogado e já não está disponível.',
};

function mostrarErro(codigo) {
  document.getElementById('ecra-carregamento').classList.add('oculto');
  document.getElementById('ecra-erro').classList.remove('oculto');
  document.getElementById('mensagem-erro').textContent =
    MENSAGENS_ERRO_CONVITE[codigo] ?? 'O link que utilizaste é inválido, foi revogado, ou já não existe.';
}

function preencherTextoEstatico(id, texto) {
  const el = document.getElementById(id);
  if (el) el.textContent = texto ?? '—';
}

function configurarRevelacaoAoScroll() {
  const elementos = document.querySelectorAll('.secao-informacoes, .secao-contagem, .secao-confirmacao');
  if (!('IntersectionObserver' in window)) {
    elementos.forEach((el) => el.classList.add('em-vista'));
    return;
  }
  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add('em-vista');
          observador.unobserve(entrada.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  elementos.forEach((el) => observador.observe(el));
}

export async function iniciarPaginaConvite() {
  const token = obterTokenDaURL();

  if (!token) {
    mostrarErro('token_invalido');
    return;
  }

  let resposta;
  try {
    resposta = await supabase.rpc('rpc_obter_convite', { p_token: token });
  } catch (excecao) {
    mostrarErro('erro_ligacao');
    return;
  }

  const { data, error } = resposta;

  if (error) {
    mostrarErro('convite_nao_encontrado');
    return;
  }

  if (data?.erro) {
    mostrarErro(data.erro);
    return;
  }

  const {
    convidado,
    evento,
    convite,
    confirmacoes_abertas: confirmacoesAbertas,
    resposta_existente: respostaExistente,
  } = data;
  const codigoPublico = convite?.codigo_publico ?? null;

  // --- Preencher textos estáticos ------------------------------------
  preencherTextoEstatico('nome-aniversariante', evento.nome_aniversariante);
  preencherTextoEstatico('frase-principal', evento.mensagem_principal);
  preencherTextoEstatico('idade-numero', String(evento.idade_comemorada));
  preencherTextoEstatico('frase-final', evento.mensagem_final);

  const dataFormatada = formatarData(evento.data_evento);
  preencherTextoEstatico('info-data', `${dataFormatada.dia} DE ${dataFormatada.mesAno}`);
  preencherTextoEstatico('info-hora', formatarHora(evento.hora_evento));
  preencherTextoEstatico('info-local', evento.local_evento);
  preencherTextoEstatico('info-traje', evento.traje);

  document.title = `Convite — ${evento.nome_aniversariante}`;

  // --- Mostrar conteúdo e esconder o ecrã de carregamento -------------
  document.getElementById('ecra-carregamento').classList.add('oculto');
  document.getElementById('conteudo-convite').classList.remove('oculto');

  configurarRevelacaoAoScroll();

  // --- Contagem decrescente --------------------------------------------
  const dataAlvo = construirDataEvento(evento.data_evento, evento.hora_evento, evento.fuso_horario);
  iniciarContador(dataAlvo);

  // --- Estado de confirmação -------------------------------------------
  const elBotaoConfirmar = document.getElementById('botao-confirmar');
  const elAvisoEncerrado = document.getElementById('aviso-encerrado');
  const elRespostaJaRegistada = document.getElementById('resposta-ja-registada');

  if (respostaExistente) {
    elRespostaJaRegistada.classList.remove('oculto');
    elRespostaJaRegistada.textContent = respostaExistente.confirmou
      ? 'Já confirmaste a tua presença. Podes alterar a resposta se precisares.'
      : 'Já respondeste que não poderás estar presente. Podes alterar a resposta se precisares.';
  }

  if (!confirmacoesAbertas) {
    elBotaoConfirmar.disabled = true;
    elAvisoEncerrado.classList.remove('oculto');
  }

  // --- Convite digital / agradecimento ---------------------------------
  // Mostra logo ao reabrir a página se o convidado já tiver respondido
  // antes (não só imediatamente a seguir a submeter o formulário) —
  // assim consegue voltar a descarregar o convite quando quiser.
  function atualizarSeccaoPosResposta({ confirmou, nome, acompanhantes, horario }) {
    const secaoAgradecimento = document.getElementById('secao-agradecimento');
    if (confirmou) {
      secaoAgradecimento.classList.add('oculto');
      revelarConviteDigital({ evento, codigoPublico, nome, acompanhantes, horario, token });
    } else {
      document.getElementById('secao-convite-digital').classList.add('oculto');
      secaoAgradecimento.classList.remove('oculto');
    }
  }

  if (respostaExistente) {
    atualizarSeccaoPosResposta({
      confirmou: respostaExistente.confirmou,
      nome: respostaExistente.nome_confirmado || convidado?.nome || '',
      acompanhantes: respostaExistente.quantidade_acompanhantes,
      horario: respostaExistente.horario_chegada,
    });
  }

  // --- Formulário de RSVP ------------------------------------------------
  configurarFormularioRSVP({
    token,
    nomeConvidado: convidado?.nome ?? '',
    limiteAcompanhantes: evento.limite_acompanhantes ?? null,
    respostaExistente: respostaExistente ?? null,
    aoSubmeterComSucesso(payload) {
      elRespostaJaRegistada.classList.remove('oculto');
      elRespostaJaRegistada.textContent = payload.confirmou
        ? 'Já confirmaste a tua presença. Podes alterar a resposta se precisares.'
        : 'Já respondeste que não poderás estar presente. Podes alterar a resposta se precisares.';

      atualizarSeccaoPosResposta(payload);
    },
  });
}
