export interface Show {
    id: number;
    showTitle: string;
    gameTitle?: string;
    centerSquare?: string;
    phrases: string[];
}

export type CreateShowInput = Omit<Show, 'id'>;
