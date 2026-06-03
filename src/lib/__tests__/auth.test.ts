// @vitest-environment node
import { describe, it, expect, afterAll } from 'vitest';
import { firmarToken, verificarToken } from '../auth';
import type { TokenPayload } from '../auth';

describe('Servicio de Autenticación JWT', () => {
  const secretoOriginal = process.env.JWT_SECRET;

  // Mock de la variable de entorno
  process.env.JWT_SECRET = 'secreto-de-prueba-super-seguro-123456';

  afterAll(() => {
    process.env.JWT_SECRET = secretoOriginal;
  });

  it('debe firmar un token y verificarlo con éxito retornando el payload', async () => {
    const payload: TokenPayload = { usuarioId: 1, rol: 'docente', cedula: '1710034065' };
    const token = await firmarToken(payload);
    
    expect(token).toBeTypeOf('string');
    
    const verificado = await verificarToken(token);
    expect(verificado).toBeDefined();
    expect(verificado?.usuarioId).toBe(1);
    expect(verificado?.rol).toBe('docente');
    expect(verificado?.cedula).toBe('1710034065');
  });

  it('debe retornar null o lanzar error para un token inválido', async () => {
    const verificado = await verificarToken('token.invalido.corrupto');
    expect(verificado).toBeNull();
  });
});
