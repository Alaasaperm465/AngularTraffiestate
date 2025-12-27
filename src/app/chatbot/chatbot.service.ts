import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

export interface ChatMessage {
  message: string;
}

export interface ChatResponse {
  response: string;
  success?: boolean;
  error?: string;
}

export interface EmbeddingsStatus {
  isReady: boolean;
  message?: string;
  totalProperties?: number;
  embeddingsCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private readonly apiUrl = 'https://localhost:7030/api';
  private readonly chatbotEndpoint = `${this.apiUrl}/Chatbot`;
  private readonly timeout = 120000; // 2 minutes timeout (embeddings can take a while)

  constructor(private http: HttpClient) {
    console.log('🤖 ChatbotService initialized with API URL:', this.chatbotEndpoint);
  }

  /**
   * إنشاء embeddings للعقارات الموجودة
   */
  generateEmbeddings(): Observable<any> {
    console.log('📊 Calling generate embeddings endpoint...');
    return this.http.post(
      `${this.chatbotEndpoint}/generate-embeddings`,
      {},
      { timeout: this.timeout }
    ).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  /**
   * التحقق من حالة embeddings
   */
  checkEmbeddingsStatus(): Observable<EmbeddingsStatus> {
    console.log('🔍 Checking embeddings status...');
    return this.http.get<EmbeddingsStatus>(
      `${this.chatbotEndpoint}/embeddings-status`,
      { timeout: this.timeout }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * إرسال رسالة للشات بوت
   */
  sendMessage(message: string): Observable<ChatResponse> {
    if (!message || !message.trim()) {
      return throwError(() => new Error('Message cannot be empty'));
    }

    console.log('💬 Sending message:', message.substring(0, 50) + '...');
    return this.http.post<ChatResponse>(
      `${this.chatbotEndpoint}/chat`,
      { message } as ChatMessage,
      { timeout: this.timeout }
    ).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  /**
   * معالجة الأخطاء
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'حدث خطأ غير متوقع';

    if (error.error instanceof ErrorEvent) {
      // خطأ من جهة العميل
      errorMessage = `خطأ: ${error.error.message}`;
      console.error('Client-side error:', error.error);
    } else {
      // خطأ من جهة الخادم
      errorMessage = `خطأ الخادم ${error.status}: ${error.message}`;
      console.error(
        'Server-side error:',
        error.status,
        error.statusText,
        error.error
      );
    }

    return throwError(() => ({
      status: error.status,
      message: errorMessage,
      details: error.error
    }));
  }

  /**
   * الحصول على URL الخادم (للاستخدام الخارجي)
   */
  getApiUrl(): string {
    return this.apiUrl;
  }

  /**
   * الحصول على URL الـ chatbot
   */
  getChatbotUrl(): string {
    return this.chatbotEndpoint;
  }
}
