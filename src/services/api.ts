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
  async getSections(subpositionId: string, uid?: string) {
    const url = uid 
      ? `/sections/${subpositionId}?uid=${uid}`
      : `/sections/${subpositionId}`;
    return this.request<{ sections: any[] }>(url, {
      method: "GET",
    });
  }

  // Submit test result
  async submitTestResult(
    uid: string,
    data: {
      sectionId: string;
      correctAnswers: number;
      totalQuestions: number;
      position: string;
      subposition: string;
      level: string;
      testNumber: number;
    }
  ) {
    return this.request(`/users/${uid}/submit-test`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Test endpoints
  async createTest(data: {
    position: string;
    subposition: string;
    level: string;
    section: string;
    testNumber: number;
  }) {
    return this.request<any>("/create-test", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Streaming test creation - відправляє питання по одному
  // Використовуємо XMLHttpRequest для React Native сумісності
  async createTestStream(
    data: {
      position: string;
      subposition: string;
      level: string;
      section: string;
      testNumber: number;
      language?: string;
    },
    onQuestion: (question: any) => void,
    onComplete: () => void,
    onError: (error: string) => void
  ) {
    const url = `${this.baseURL}/create-test-stream`;
    
    console.log("🚀 Starting test stream request to:", url);
    console.log("Request data:", data);

    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let lastPosition = 0;
      let isComplete = false;

      xhr.open("POST", url, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.responseType = "text";
      
      // Обробка прогресивного отримання даних
      const processData = () => {
        if (isComplete) return;
        
        const currentText = xhr.responseText;
        if (currentText.length > lastPosition) {
          const newData = currentText.substring(lastPosition);
          lastPosition = currentText.length;

          const lines = newData.split("\n");
          
          for (const line of lines) {
            if (line.trim() && line.startsWith("data: ")) {
              try {
                const parsed = JSON.parse(line.slice(6));
                console.log("📨 Received SSE data:", parsed.type);
                
                  if (parsed.type === "question") {
                    console.log("✅ Question received:", parsed.data.id);
                    onQuestion(parsed.data);
                  } else if (parsed.type === "initial_ready") {
                    console.log("✅ Initial questions ready - user can start!");
                    // Викликаємо onComplete для припинення loading, але stream продовжується
                    onComplete();
                  } else if (parsed.type === "complete") {
                    console.log("✅ Stream complete - all questions generated");
                    isComplete = true;
                    resolve();
                    return;
                  } else if (parsed.type === "error") {
                    console.error("❌ Stream error:", parsed.message);
                    isComplete = true;
                    onError(parsed.message || "Unknown error");
                    reject(new Error(parsed.message || "Unknown error"));
                    return;
                  }
              } catch (err) {
                console.error("❌ Error parsing SSE data:", err, "Line:", line);
              }
            }
          }
        }
      };
      
      xhr.onprogress = () => {
        processData();
      };
      
      xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.LOADING) {
          processData();
        } else if (xhr.readyState === XMLHttpRequest.DONE) {
          processData(); // Обробити останні дані
          
          if (xhr.status >= 200 && xhr.status < 300) {
            if (!isComplete) {
              console.log("✅ Stream reading completed");
              onComplete();
              resolve();
            }
          } else {
            const error = `HTTP error! status: ${xhr.status}`;
            console.error("❌ Response error:", error);
            if (!isComplete) {
              onError(error);
              reject(new Error(error));
            }
          }
        }
      };

      xhr.onerror = () => {
        const error = "Network error";
        console.error("❌ createTestStream network error");
        if (!isComplete) {
          isComplete = true;
          onError(error);
          reject(new Error(error));
        }
      };

      xhr.send(JSON.stringify(data));
    });
  }
}

export const apiService = new ApiService(API_BASE_URL);

