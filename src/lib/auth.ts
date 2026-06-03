import { SignJWT, jwtVerify } from 'jose';

const getSecret = () => {
  return new TextEncoder().encode(
    process.env.JWT_SECRET || 'secreto-por-defecto-de-desarrollo-super-seguro-123456'
  );
};

export interface TokenPayload {
  usuarioId: number;
  rol: 'admin' | 'docente' | 'padre';
  cedula: string;
}

export async function firmarToken(payload: TokenPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(getSecret());
}

export async function verificarToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}
