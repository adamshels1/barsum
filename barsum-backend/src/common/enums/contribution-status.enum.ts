export enum ContributionStatus {
  PENDING = 'pending', // на рассмотрении эксперта
  SELECTED = 'selected', // выбрано экспертом → стало главой
  NOT_SELECTED = 'not_selected', // в этот раз не выбрали
}
