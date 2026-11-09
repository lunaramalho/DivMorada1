export type Resident = {
  id: string;
  usuarioId: string;
  name: string;
  role: 'Administrador' | 'Membro';
  avatarLetter: string;
  avatarColor: string;
  photoUri?: string | null;
  confirmed: boolean;
};
