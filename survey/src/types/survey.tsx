export interface Question {
  id?: number;
  periodId: number;
  category: string;
  content: string;
  answers: {
    answer1: string;
    answer2: string;
    answer3: string;
    answer4: string;
    answer5: string;
  };
}

export interface Category {
  value: string;
  label: string;
}

export interface AnswerOptions {
  [key: number]: string;
}
