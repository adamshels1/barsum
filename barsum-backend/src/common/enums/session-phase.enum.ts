export enum SessionPhase {
  READ = 'read',
  RECORDING = 'recording',
  TRANSCRIBING = 'transcribing',
  ANALYZING = 'analyzing',
  // Пересказ: ребёнок своими словами рассказывает, что прочитал.
  RETELL = 'retell',
  RETELL_TRANSCRIBING = 'retell_transcribing',
  RETELL_ANALYZING = 'retell_analyzing',
  DONE = 'done',
}
