/**
 * API Service
 * Centralized API calls for the application
 */

const API_BASE_URL = __DEV__
  ? "http://localhost:4000/api"
  : "https://your-production-api.com/api";

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

class ApiService {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `HTTP error! status: ${response.status}`,
        }));

        throw {
          message: errorData.message || "An error occurred",
          code: errorData.code,
          status: response.status,
        } as ApiError;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error && typeof error === "object" && "message" in error) {
        throw error;
      }
      throw {
        message: error instanceof Error ? error.message : "Network error",
      } as ApiError;
    }
  }

  // User endpoints
  async syncUser(uid: string, email: string | null) {
    return this.request<{ success: boolean; user: any }>("/users/sync", {
      method: "POST",
      body: JSON.stringify({ uid, email }),
    });
  }

  async getUser(uid: string) {
    return this.request<{ user: any }>(`/users/${uid}`, {
      method: "GET",
    });
  }

  async updateUser(uid: string, data: Partial<{ email: string; name: string; position: string; subposition: string; level: string }>) {
    return this.request<{ success: boolean; user: any }>(`/users/${uid}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Add more API methods as needed
  async getCourses() {
    return this.request<{ courses: any[] }>("/courses", {
      method: "GET",
    });
  }

  async getCourse(courseId: string) {
    return this.request<{ course: any }>(`/courses/${courseId}`, {
      method: "GET",
    });
  }

  // Positions endpoints
  async getPositions() {
    return this.request<{ positions: any[] }>("/positions", {
      method: "GET",
    });
  }

  // Sections endpoints
  async getSections(subpositionId: string) {
    return this.request<{ sections: any[] }>(`/sections/${subpositionId}`, {
      method: "GET",
    });
  }
}

export const apiService = new ApiService(API_BASE_URL);

