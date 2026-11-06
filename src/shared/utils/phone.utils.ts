/**
 * Utilitários para tratamento e máscara de telefones brasileiros
 */

/**
 * Aplica máscara dinâmica de telefone conforme o usuário digita:
 * - Até 10 dígitos: (99) 9999-9999
 * - 11 dígitos: (99) 99999-9999
 */
export function maskPhone(value: string): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 2) {
    return digits.length > 0 ? `(${digits}` : '';
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Normaliza o telefone garantindo o nono dígito (9) para celulares brasileiros.
 * Se o usuário digitar 10 dígitos (DDD + 8 dígitos ex: 9981718936),
 * insere automaticamente o 9 após o DDD tornando-o 11 dígitos: 99981718936.
 * Retorna no formato limpo para a API (ex: 5599981718936).
 */
export function normalizePhoneForApi(value: string): string {
  if (!value) return '';
  let digits = value.replace(/\D/g, '');

  // 12 dígitos com 55 (55 + DDD + 8 dígitos)
  if (digits.length === 12 && digits.startsWith('55')) {
    digits = digits.slice(0, 4) + '9' + digits.slice(4);
  }
  // 10 dígitos (DDD + 8 dígitos) -> insere o 9
  else if (digits.length === 10) {
    digits = digits.slice(0, 2) + '9' + digits.slice(2);
  }
  // 8 dígitos (sem DDD nem 9) -> assume DDD 99 e insere o 9
  else if (digits.length === 8) {
    digits = '999' + digits;
  }
  // 9 dígitos (sem DDD mas com 9) -> assume DDD 99
  else if (digits.length === 9) {
    digits = '99' + digits;
  }

  // Garante o prefixo internacional 55 se tiver 11 dígitos
  if (digits.length === 11 && !digits.startsWith('55')) {
    digits = '55' + digits;
  }

  return digits;
}

/**
 * Formata um número salvo (ex: 5599981718936 ou 559981718936) para visualização amigável:
 * (99) 98171-8936
 */
export function formatPhoneDisplay(value: string | null | undefined): string {
  if (!value) return '';
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) {
    digits = digits.slice(2);
  }
  // Se ainda estiver com 10 dígitos, adiciona o 9 para exibição
  if (digits.length === 10) {
    digits = digits.slice(0, 2) + '9' + digits.slice(2);
  }
  return maskPhone(digits);
}

