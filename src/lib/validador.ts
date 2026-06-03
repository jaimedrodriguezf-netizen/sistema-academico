export function validarCedula(cedula: string): boolean {
  if (typeof cedula !== 'string') return false;

  // Debe tener exactamente 10 dígitos numéricos
  if (!/^\d{10}$/.test(cedula)) return false;

  // Provincia (primeros dos dígitos)
  const provincia = parseInt(cedula.substring(0, 2), 10);
  if (!((provincia >= 1 && provincia <= 24) || provincia === 30)) {
    return false;
  }

  // Tercer dígito (menor a 6 para personas naturales)
  const tercerDigito = parseInt(cedula.charAt(2), 10);
  if (tercerDigito >= 6) {
    return false;
  }

  // Décimo dígito (verificador)
  const digitoVerificador = parseInt(cedula.charAt(9), 10);

  // Coeficientes: 2.1.2.1.2.1.2.1.2
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let valor = parseInt(cedula.charAt(i), 10);
    if (i % 2 === 0) {
      valor = valor * 2;
      if (valor > 9) valor -= 9;
    }
    suma += valor;
  }

  const decenal = Math.ceil(suma / 10) * 10;
  let digitoCalculado = decenal - suma;
  if (digitoCalculado === 10) {
    digitoCalculado = 0;
  }

  return digitoCalculado === digitoVerificador;
}
