export interface TmdbMovieSummary {
  id: number
  title: string
  original_title: string
  release_date: string
  poster_path: string | null
  vote_count: number
  vote_average: number
  genre_ids: number[]
  original_language: string
  popularity: number
  adult: boolean
  video: boolean
  overview: string
}

export interface TmdbSearchMoviesResponse {
  page: number
  total_pages: number
  total_results: number
  results: TmdbMovieSummary[]
}

export interface TmdbCastMember {
  id: number
  name: string
  original_name: string
  character: string
  credit_id: string
  order: number
  profile_path: string | null
  known_for_department: string
  gender: number | null
  adult: boolean
  popularity: number
}

export interface TmdbCrewMember {
  id: number
  name: string
  original_name: string
  department: string
  job: string
  credit_id: string
  profile_path: string | null
  known_for_department: string
  gender: number | null
  adult: boolean
  popularity: number
}

export interface TmdbMovieCreditsResponse {
  id: number
  cast: TmdbCastMember[]
  crew: TmdbCrewMember[]
}

export interface TmdbPersonCastCredit extends TmdbMovieSummary {
  character: string
  credit_id: string
  order: number
}

export interface TmdbPersonCrewCredit extends TmdbMovieSummary {
  department: string
  job: string
  credit_id: string
}

export interface TmdbPersonMovieCreditsResponse {
  id: number
  cast: TmdbPersonCastCredit[]
  crew: TmdbPersonCrewCredit[]
}

export interface TmdbErrorResponse {
  status_code: number
  status_message: string
  success: false
}
