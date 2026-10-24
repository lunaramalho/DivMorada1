export type Resident = {
  id: string;
  name: string;
  role: 'Administrador' | 'Membro';
  avatarLetter: string;
  avatarColor: string;
  photoUri?: string | null;
  confirmed: boolean;
};
