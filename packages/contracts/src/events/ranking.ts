export interface RankingUpdatedEvent {
  barberId: string
  score: number
  scope: 'LOCATION' | 'CITY' | 'COUNTRY' | 'GLOBAL'
}