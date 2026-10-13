// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ApiError, odontologosApi, pacientesApi, authApi, detallesApi } from './api';

const respuesta = (body: unknown, status = 200) =>
  new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

const mockFetch = (...respuestas: Response[]) => {
  const fn = vi.fn();
  respuestas.forEach((r) => fn.mockResolvedValueOnce(r));
  vi.stubGlobal('fetch', fn);
  return fn;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('request: formato de respuesta', () => {
  it('desenvuelve { success, data } y devuelve solo data', async () => {
    mockFetch(respuesta({ success: true, data: [{ id: 1 }], total: 1 }));
    const { mutualesApi } = await import('./api');
    const mutuales = await mutualesApi.getAll();
    expect(mutuales).toEqual([{ id: 1 }]);
  });

  it('devuelve {} en 204 (sin cuerpo)', async () => {
    mockFetch(respuesta(null, 204));
    const r = await mutualesApiDelete();
    expect(r).toEqual({});
  });
});

const mutualesApiDelete = async () => {
  const { mutualesApi } = await import('./api');
  return mutualesApi.delete(1);
};

describe('errores', () => {
  it('lanza ApiError con el status y el mensaje del back', async () => {
    mockFetch(respuesta({ success: false, error: 'El turno seleccionado ya no está disponible' }, 409));
    const { reservasApi } = await import('./api');

    const err = await reservasApi.create({ paciente_id: 1, turno_codigo: 5 }).catch((e) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(409);
    expect(err.message).toBe('El turno seleccionado ya no está disponible');
  });
});

describe('sesión vencida (401)', () => {
  it('dispara auth:unauthorized en un endpoint protegido', async () => {
    mockFetch(respuesta({ success: false, error: 'Token inválido o expirado' }, 401));
    const listener = vi.fn();
    window.addEventListener('auth:unauthorized', listener);

    await expect(authApi.getMe()).rejects.toThrow();

    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener('auth:unauthorized', listener);
  });

  it('no dispara el evento si el 401 viene del login (credenciales incorrectas)', async () => {
    mockFetch(respuesta({ success: false, error: 'Credenciales inválidas' }, 401));
    const listener = vi.fn();
    window.addEventListener('auth:unauthorized', listener);

    await expect(authApi.login('x@x.com', 'mal')).rejects.toThrow('Credenciales inválidas');

    expect(listener).not.toHaveBeenCalled();
    window.removeEventListener('auth:unauthorized', listener);
  });
});

describe('contratos con el back', () => {
  it('vincular mutual a odontólogo usa el id de la mutual en la URL', async () => {
    const fetchMock = mockFetch(respuesta({ success: true, data: {} }, 201));

    await odontologosApi.addMutual(3, { mutual_id: 7, nroAfiliado: 'A-1' });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/odontologos\/3\/mutuales\/7$/);
    expect(JSON.parse(init.body)).toEqual({ nroAfiliado: 'A-1' });
  });

  it('vincular mutual a paciente usa el id de la mutual en la URL', async () => {
    const fetchMock = mockFetch(respuesta({ success: true, data: {} }));

    await pacientesApi.addMutual(4, { mutual_id: 9, nroAfiliado: 'B-2', cubre: 80 });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/pacientes\/4\/mutuales\/9$/);
    expect(JSON.parse(init.body)).toEqual({ nroAfiliado: 'B-2', cubre: 80 });
  });

  it('crear paciente envía password y no envía password_hash', async () => {
    const fetchMock = mockFetch(respuesta({ success: true, data: { id: 1 } }, 201));

    await pacientesApi.create({
      nombre: 'Ana', apellido: 'Gómez', email: 'ana@test.com', password: 'Secreta1',
      direccion: 'Calle 1234', nroDocumento: '30123456', tipoDoc: 'DNI'
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.password).toBe('Secreta1');
    expect(body).not.toHaveProperty('password_hash');
  });

  
});