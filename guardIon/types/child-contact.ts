export type ChildContactType = 'guardian' | 'school' | 'device' | 'emergency';

export type ChildContact = {
  id: string;
  childId: string;
  name: string;
  role: string;
  phone: string;
  type: ChildContactType;
  isPrimary?: boolean;
};
