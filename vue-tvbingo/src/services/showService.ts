import { ApiClient } from './apiClient'
import type { Show, CreateShowInput } from '../types/Show'

// Use relative URLs by default (works when frontend/backend are same origin)
// For local dev with separate servers, set VITE_API_BASE_URL=http://localhost:8080
const apiClient = new ApiClient(import.meta.env.VITE_API_BASE_URL || '')

export const showService = {
  async getShows(): Promise<Show[]> {
    return apiClient.request<Show[]>('/api/shows')
  },

  async getShowById(id: number): Promise<Show> {
    return apiClient.request<Show>(`/api/shows/${id}`)
  },

  async addShow(show: CreateShowInput): Promise<Show> {
    return apiClient.request<Show>('/api/shows', {
      method: 'POST',
      body: JSON.stringify(show)
    })
  },

  async updateShow(show: Show): Promise<Show> {
    return apiClient.request<Show>(`/api/shows/${show.id}`, {
      method: 'PUT',
      body: JSON.stringify(show)
    })
  },

  async deleteShow(id: number): Promise<void> {
    await apiClient.request(`/api/shows/${id}`, {
      method: 'DELETE'
    })
  },

  async searchShowsByTitle(query: string): Promise<Show[]> {
    const shows = await apiClient.request<Show[]>('/api/shows')
    return shows.filter(show => show.showTitle.toLowerCase().includes(query.toLowerCase()))
  }
}
