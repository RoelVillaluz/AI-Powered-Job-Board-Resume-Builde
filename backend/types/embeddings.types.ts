export type EmbeddingVector = number[]

export type MeanEmbeddings = {
  skills?: EmbeddingVector;
  workExperience?: EmbeddingVector;
  certifications?: EmbeddingVector;
}

export type ResumeEmbeddings = {
  meanEmbeddings: MeanEmbeddings;
}

export type EmbeddingValidationReturn = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  validSections?: string[];
};