export type AttributeType = 'Skill' | 'Will';

export interface ColorScheme {
  bg: string;
  text: string;
  border: string;
}

export interface ColorSchemes {
  [key: string]: ColorScheme;
}

export interface Scores {
  skill: ScoreDetails;
  will: ScoreDetails;
  total: ScoreDetails;
}

export interface ScoreDetails {
  score: number;
  total: number;
  percentage: number;
}

export interface Ratings {
  [key: string]: number;
}