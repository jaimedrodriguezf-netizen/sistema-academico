import { describe, it, expect } from 'vitest';
import { validarCedula } from '../validador';

describe('validarCedula', () => {
  it('debe retornar true para una cédula ecuatoriana válida', () => {
    // Cédulas que cumplen con el algoritmo ecuatoriano
    expect(validarCedula('1722210380')).toBe(true);
    expect(validarCedula('1710034065')).toBe(true);
  });

  it('debe retornar false para cédulas con longitud incorrecta', () => {
    expect(validarCedula('172221038')).toBe(false);
    expect(validarCedula('17222103866')).toBe(false);
  });

  it('debe retornar false si contiene caracteres no numéricos', () => {
    expect(validarCedula('172221038a')).toBe(false);
  });

  it('debe retornar false para provincias inválidas (fuera del rango 01-24 y diferente de 30)', () => {
    expect(validarCedula('2500000002')).toBe(false);
  });

  it('debe retornar false si el tercer dígito es mayor o igual a 6', () => {
    expect(validarCedula('1760000008')).toBe(false);
  });

  it('debe retornar false si el dígito verificador no coincide', () => {
    // Cédula similar pero con último dígito incorrecto
    expect(validarCedula('1722210387')).toBe(false);
  });
});
