// =====================================================================
// CONVITE EXCLUSIVO — Formulário de confirmação de presença (RSVP)
// =====================================================================
import { supabase } from './supabaseClient.js';
import { telefoneValido } from './utils.js';

const MENSAGENS_ERRO_SERVIDOR = {
  token_invalido: 'O teu convite não é válido. Recarrega a página.',
  convite_nao_encontrado: 'Não foi possível encontrar o teu convite.',
  convite_revogado: 'Este convite já não está disponível.',
  confirmacoes_encerradas: 'O prazo para confirmar presença já terminou.',
  nome_invalido: 'Escreve o teu nome completo.',
  telefone_invalido: 'Escreve um número de telefone válido.',
  horario_invalido: 'Seleciona um horário válido.',
  erro_interno: 'Não foi possível enviar agora. Tenta novamente em instantes.',
};

/**
 * Liga toda a interatividade do modal/formulário de RSVP.
 *
 * @param {Object} contexto
 * @param {string} contexto.token
 * @param {string} contexto.nomeConvidado   - nome já registado pelo admin (pré-preenchimento)
 * @param {number|null} contexto.limiteAcompanhantes
 * @param {Object|null} contexto.respostaExistente - { confirmou, quantidade_acompanhantes, horario_chegada, observacao }
 * @param {Function} contexto.aoSubmeterComSucesso - callback(confirmou: boolean)
 */
export function configurarFormularioRSVP(contexto) {
  const { token, nomeConvidado, limiteAcompanhantes, respostaExistente, aoSubmeterComSucesso } = contexto;

  const elModalFundo = document.getElementById('modal-fundo');
  const elBotaoConfirmar = document.getElementById('botao-confirmar');
  const elModalFechar = document.getElementById('modal-fechar');
  const elForm = document.getElementById('form-rsvp');
  const elModalSucesso = document.getElementById('modal-sucesso');
  const elMensagemSucesso = document.getElementById('mensagem-sucesso');
  const elBotaoFecharSucesso = document.getElementById('botao-fechar-sucesso');

  const elCampoNome = document.getElementById('campo-nome');
  const elCampoTelefone = document.getElementById('campo-telefone');
  const elRadiosPresenca = elForm.querySelectorAll('input[name="presenca"]');
  const elBlocoPresencaSim = document.getElementById('bloco-presenca-sim');
  const elCampoAcompanhantes = document.getElementById('campo-acompanhantes');
  const elAjudaLimite = document.getElementById('ajuda-limite-acompanhantes');
  const elCampoHorario = document.getElementById('campo-horario');
  const elCampoObservacao = document.getElementById('campo-observacao');
  const elCampoEmail = document.getElementById('campo-email');

  const elBotaoEnviar = document.getElementById('botao-enviar');
  const elSpinner = document.getElementById('spinner-envio');
  const elTextoBotaoEnviar = elBotaoEnviar.querySelector('.botao-enviar-texto');

  const elErros = {
    nome: document.getElementById('erro-nome'),
    telefone: document.getElementById('erro-telefone'),
    presenca: document.getElementById('erro-presenca'),
    acompanhantes: document.getElementById('erro-acompanhantes'),
    email: document.getElementById('erro-email'),
    geral: document.getElementById('erro-geral'),
  };

  // --- Pré-preenchimento ------------------------------------------------
  if (nomeConvidado) elCampoNome.value = nomeConvidado;

  if (limiteAcompanhantes !== null && limiteAcompanhantes !== undefined) {
    elAjudaLimite.textContent = `Máximo de ${limiteAcompanhantes} acompanhante(s).`;
    elCampoAcompanhantes.max = String(limiteAcompanhantes);
  }

  if (respostaExistente) {
    const valorPresenca = respostaExistente.confirmou ? 'sim' : 'nao';
    const radioCorrespondente = elForm.querySelector(`input[name="presenca"][value="${valorPresenca}"]`);
    if (radioCorrespondente) radioCorrespondente.checked = true;

    if (respostaExistente.confirmou) {
      elBlocoPresencaSim.classList.remove('oculto');
      elCampoAcompanhantes.value = respostaExistente.quantidade_acompanhantes ?? 0;
      if (respostaExistente.horario_chegada) elCampoHorario.value = respostaExistente.horario_chegada;
    }
    if (respostaExistente.observacao) elCampoObservacao.value = respostaExistente.observacao;
    if (respostaExistente.email) elCampoEmail.value = respostaExistente.email;

    elTextoBotaoEnviar.textContent = 'Atualizar Confirmação';
  }

  // --- Alternar bloco condicional (acompanhantes/horário) --------------
  elRadiosPresenca.forEach((radio) => {
    radio.addEventListener('change', () => {
      const mostrar = radio.value === 'sim' && radio.checked;
      if (mostrar) elBlocoPresencaSim.classList.remove('oculto');
      else if (radio.checked) elBlocoPresencaSim.classList.add('oculto');
    });
  });

  // --- Abrir / fechar modal ----------------------------------------------
  function abrirModal() {
    elModalFundo.classList.remove('oculto');
    document.body.style.overflow = 'hidden';
    elCampoNome.focus();
  }

  function fecharModal() {
    elModalFundo.classList.add('oculto');
    document.body.style.overflow = '';
  }

  elBotaoConfirmar.addEventListener('click', abrirModal);
  elModalFechar.addEventListener('click', fecharModal);
  elModalFundo.addEventListener('click', (evento) => {
    if (evento.target === elModalFundo) fecharModal();
  });
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && !elModalFundo.classList.contains('oculto')) fecharModal();
  });

  elBotaoFecharSucesso.addEventListener('click', () => {
    fecharModal();
    elModalSucesso.classList.add('oculto');
    elForm.classList.remove('oculto');

    // Se a secção do convite digital (ou de agradecimento) já estiver
    // visível nesse momento, leva o convidado até ela.
    const secaoConvite = document.getElementById('secao-convite-digital');
    const secaoAgradecimento = document.getElementById('secao-agradecimento');
    const alvo = !secaoConvite.classList.contains('oculto')
      ? secaoConvite
      : (!secaoAgradecimento.classList.contains('oculto') ? secaoAgradecimento : null);
    if (alvo) {
      const prefereReduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      alvo.scrollIntoView({ behavior: prefereReduzirMovimento ? 'auto' : 'smooth', block: 'start' });
    }
  });

  // --- Validação -----------------------------------------------------
  function limparErros() {
    Object.values(elErros).forEach((el) => { el.textContent = ''; });
    [elCampoNome, elCampoTelefone, elCampoAcompanhantes, elCampoEmail].forEach((el) => el.classList.remove('campo-invalido'));
  }

  function marcarInvalido(elCampo, elErro, mensagem) {
    elErro.textContent = mensagem;
    elCampo.classList.add('campo-invalido');
  }

  function validarFormulario(dados) {
    limparErros();
    let valido = true;

    if (!dados.nome || dados.nome.trim().length < 2) {
      marcarInvalido(elCampoNome, elErros.nome, 'Escreve o teu nome completo.');
      valido = false;
    }

    if (!telefoneValido(dados.telefone)) {
      marcarInvalido(elCampoTelefone, elErros.telefone, 'Número de telefone inválido.');
      valido = false;
    }

    if (!dados.presenca) {
      elErros.presenca.textContent = 'Seleciona uma opção.';
      valido = false;
    }

    // E-mail é opcional aqui — só valida formato se o convidado escreveu algo.
    if (dados.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(dados.email)) {
      marcarInvalido(elCampoEmail, elErros.email, 'Esse e-mail não parece válido.');
      valido = false;
    }

    if (dados.presenca === 'sim') {
      const qtd = Number(dados.acompanhantes);
      if (Number.isNaN(qtd) || qtd < 0) {
        marcarInvalido(elCampoAcompanhantes, elErros.acompanhantes, 'Quantidade inválida.');
        valido = false;
      } else if (limiteAcompanhantes !== null && qtd > limiteAcompanhantes) {
        marcarInvalido(elCampoAcompanhantes, elErros.acompanhantes, `O limite é de ${limiteAcompanhantes} acompanhante(s).`);
        valido = false;
      }
    }

    return valido;
  }

  // --- Submissão -------------------------------------------------------
  let emEnvio = false;

  elForm.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (emEnvio) return;

    const formData = new FormData(elForm);
    const dados = {
      nome: formData.get('nome')?.toString() ?? '',
      telefone: formData.get('telefone')?.toString() ?? '',
      presenca: formData.get('presenca')?.toString() ?? '',
      acompanhantes: formData.get('acompanhantes')?.toString() ?? '0',
      horario: formData.get('horario')?.toString() ?? '',
      observacao: formData.get('observacao')?.toString() ?? '',
      email: formData.get('email')?.toString().trim() ?? '',
    };

    if (!validarFormulario(dados)) return;

    const confirmou = dados.presenca === 'sim';

    emEnvio = true;
    elBotaoEnviar.disabled = true;
    elSpinner.classList.remove('oculto');
    elErros.geral.textContent = '';

    try {
      const { data, error } = await supabase.rpc('rpc_submeter_rsvp', {
        p_token: token,
        p_nome: dados.nome.trim(),
        p_telefone: dados.telefone.trim(),
        p_confirmou: confirmou,
        p_quantidade_acompanhantes: confirmou ? Number(dados.acompanhantes) || 0 : 0,
        p_horario_chegada: confirmou && dados.horario ? dados.horario : null,
        p_observacao: dados.observacao.trim() || null,
        p_email: dados.email || null,
      });

      if (error) {
        elErros.geral.textContent = 'Não foi possível enviar agora. Verifica a tua ligação e tenta novamente.';
        return;
      }

      if (!data || data.sucesso !== true) {
        const codigo = data?.erro ?? 'erro_interno';
        elErros.geral.textContent = MENSAGENS_ERRO_SERVIDOR[codigo] ?? MENSAGENS_ERRO_SERVIDOR.erro_interno;
        return;
      }

      // Sucesso — mostra a mensagem correta consoante a resposta
      elMensagemSucesso.textContent = confirmou
        ? 'A tua presença foi registada com sucesso! Estamos a preparar uma noite especial e será um prazer receber-te.'
        : 'Obrigado por nos dares uma resposta. Lamentamos que não possas estar presente e esperamos encontrar-nos noutra ocasião.';

      elForm.classList.add('oculto');
      elModalSucesso.classList.remove('oculto');

      if (typeof aoSubmeterComSucesso === 'function') {
        aoSubmeterComSucesso({
          confirmou,
          nome: dados.nome.trim(),
          acompanhantes: confirmou ? Number(dados.acompanhantes) || 0 : 0,
          horario: confirmou ? dados.horario || null : null,
          email: dados.email || null,
        });
      }
    } catch (excecao) {
      elErros.geral.textContent = 'Não foi possível enviar agora. Tenta novamente em instantes.';
    } finally {
      emEnvio = false;
      elBotaoEnviar.disabled = false;
      elSpinner.classList.add('oculto');
    }
  });
}
