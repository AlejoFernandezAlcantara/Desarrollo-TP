import { Request, Response } from 'express';
import * as usuarioService from '../services/usuario.service';

export const getAllUsuarios = async (req: Request, res: Response) => {
  try {
    const usuarios = await usuarioService.getAll();
    res.json(usuarios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

export const getUsuarioById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const usuario = await usuarioService.getById(id);
    
    if (!usuario) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    
    res.json(usuario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el usuario' });
  }
};

export const createUsuario = async (req: Request, res: Response) => {
  try {
    const nuevoUsuario = await usuarioService.create(req.body);
    res.status(201).json(nuevoUsuario);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Error al crear el usuario. Verifica los datos enviados.' });
  }
};

export const updateUsuario = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const usuarioActualizado = await usuarioService.update(id, req.body);
    res.json(usuarioActualizado);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Error al actualizar el usuario.' });
  }
};

export const deleteUsuario = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    await usuarioService.remove(id);
    res.status(204).send(); // 204 No Content
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Error al eliminar el usuario.' });
  }
};
