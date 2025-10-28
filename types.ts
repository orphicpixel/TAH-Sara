
export enum Sender {
  User = 'user',
  Sara = 'sara',
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
}
