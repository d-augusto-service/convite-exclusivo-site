// =====================================================================
// CONVITE EXCLUSIVO — Funções auxiliares
// =====================================================================

const MESES_PT = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

/**
 * Lê o token de convite a partir do URL.
 * Suporta dois formatos, para funcionar em qualquer alojamento estático:
 *   - caminho bonito:  /convite/ABC123...   (via redireção do 404.html)
 *   - parâmetro:       /?c=ABC123...
 */
export function obterTokenDaURL() {
  const parametros = new URLSearchParams(window.location.search);

  const porQuery = parametros.get('c');
  if (porQuery) return porQuery.trim();

  // Caminho redirecionado pelo 404.html (alojamento estático sem rotas
  // do lado do servidor, ex.: GitHub Pages) — ver 404.html.
  const porCaminhoRedirecionado = parametros.get('p');
  if (porCaminhoRedirecionado) {
    const token = extrairTokenDeCaminho(porCaminhoRedirecionado);
    if (token) return token;
  }

  const token = extrairTokenDeCaminho(window.location.pathname);
  if (token) return token;

  return null;
}

function extrairTokenDeCaminho(caminho) {
  const partes = caminho.split('/').filter(Boolean);
  const indiceConvite = partes.indexOf('convite');
  if (indiceConvite !== -1 && partes[indiceConvite + 1]) {
    return decodeURIComponent(partes[indiceConvite + 1]).trim();
  }
  return null;
}

/** Formata uma data (YYYY-MM-DD) como { dia, mesAno } em português. */
export function formatarData(dataISO) {
  const [ano, mes, dia] = dataISO.split('-').map(Number);
  const nomeMes = MESES_PT[mes - 1] ?? '';
  return {
    dia: String(dia).padStart(2, '0'),
    mesAno: `${nomeMes.toUpperCase()} ${ano}`,
    linhaUnica: `${String(dia).padStart(2, '0')} DE ${nomeMes.toUpperCase()} DE ${ano}`,
  };
}

/** Formata uma hora (HH:MM:SS ou HH:MM) como "20H00". */
export function formatarHora(horaStr) {
  const [h, m] = horaStr.split(':');
  return `${h}H${m}`;
}

/**
 * Constrói o instante exato do início do evento, como objeto Date,
 * assumindo o fuso horário informado (Africa/Luanda = UTC+1 fixo,
 * sem horário de verão — por isso o deslocamento pode ser fixado
 * com segurança em "+01:00").
 */
export function construirDataEvento(dataISO, horaStr, fusoHorario) {
  const deslocamento = fusoHorario === 'Africa/Luanda' ? '+01:00' : 'Z';
  const horaCompleta = horaStr.length === 5 ? `${horaStr}:00` : horaStr;
  return new Date(`${dataISO}T${horaCompleta}${deslocamento}`);
}

/** Validação simples e tolerante de número de telefone internacional. */
export function telefoneValido(valor) {
  const limpo = valor.replace(/[\s()-]/g, '');
  return /^\+?[0-9]{7,15}$/.test(limpo);
}

/** Pequeno "debounce" para evitar múltiplos submits rápidos. */
export function comBloqueioDuplo(funcao) {
  let emExecucao = false;
  return async (...args) => {
    if (emExecucao) return;
    emExecucao = true;
    try {
      return await funcao(...args);
    } finally {
      emExecucao = false;
    }
  };
}
