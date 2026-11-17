// =====================================================================
// CONVITE EXCLUSIVO — Contagem decrescente
// =====================================================================

let idIntervalo = null;

/**
 * Inicia a contagem decrescente até `dataAlvo` (objeto Date), atualizando
 * os elementos do DOM a cada segundo. Quando a data é ultrapassada,
 * mostra a mensagem de evento já iniciado e para o intervalo.
 */
export function iniciarContador(dataAlvo) {
  const elDias = document.getElementById('c-dias');
  const elHoras = document.getElementById('c-horas');
  const elMinutos = document.getElementById('c-minutos');
  const elSegundos = document.getElementById('c-segundos');
  const elContador = document.getElementById('contador');
  const elMensagemEvento = document.getElementById('contador-mensagem-evento');

  function atualizar() {
    const agora = new Date();
    const diferenca = dataAlvo.getTime() - agora.getTime();

    if (diferenca <= 0) {
      elContador.classList.add('oculto');
      elMensagemEvento.classList.remove('oculto');
      if (idIntervalo) {
        clearInterval(idIntervalo);
        idIntervalo = null;
      }
      return;
    }

    const segundosTotais = Math.floor(diferenca / 1000);
    const dias = Math.floor(segundosTotais / 86400);
    const horas = Math.floor((segundosTotais % 86400) / 3600);
    const minutos = Math.floor((segundosTotais % 3600) / 60);
    const segundos = segundosTotais % 60;

    elDias.textContent = String(dias).padStart(2, '0');
    elHoras.textContent = String(horas).padStart(2, '0');
    elMinutos.textContent = String(minutos).padStart(2, '0');
    elSegundos.textContent = String(segundos).padStart(2, '0');
  }

  atualizar();
  if (idIntervalo) clearInterval(idIntervalo);
  idIntervalo = setInterval(atualizar, 1000);
}
