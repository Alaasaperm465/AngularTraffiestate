import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ChatbotService } from './chatbot.service';

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.html',
  styleUrls: ['./chatbot.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe]
})
export class ChatbotComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  userInput: string = '';
  isLoading: boolean = false;
  isBusy: boolean = false; // للأزرار - يعني طلب جاري
  embeddingsReady: boolean = false;
  private embeddingsCheckInterval: any;
  private statusCheckCount = 0;
  private maxStatusChecks = 5; // توقف بعد 5 محاولات

  constructor(
    private http: HttpClient,
    private chatbotService: ChatbotService
  ) {
    this.addBotMessage('مرحباً! أنا هنا لمساعدتك في البحث عن عقار مناسب. يتم الآن تجهيز نموذج البحث...');
  }

  ngOnInit() {
    this.initEmbeddings();
  }

  /**
   * تهيئة embeddings
   */
  initEmbeddings() {
    console.log('🤖 Initializing embeddings... (this may take a minute)');
    this.isBusy = true;
    this.statusCheckCount = 0;
    
    this.chatbotService.generateEmbeddings()
      .subscribe({
        next: (response) => {
          this.embeddingsReady = true;
          this.isBusy = false;
          console.log('✅ Embeddings generated successfully:', response);
          this.addBotMessage('✅ تم تجهيز نموذج البحث بنجاح! يمكنك الآن البدء بالبحث عن عقارات.');
        },
        error: (error) => {
          this.isBusy = false;
          console.error('❌ Embeddings generation error:', error);
          
          let errorMsg = '';
          if (error.status === 500) {
            errorMsg = '⚠️ خطأ في الخادم (500). تأكد من أن خادم AI يعمل بشكل صحيح.';
          } else if (error.status === 0 || !error.status) {
            errorMsg = '⚠️ انتهت المهلة الزمنية للطلب. خادم AI قد يستغرق وقتاً طويلاً. يمكنك محاولة "تحقق من الحالة" بعد قليل.';
          } else if (error.message?.includes('embeddings')) {
            errorMsg = '⚠️ لم يتم إنشاء embeddings للعقارات بعد. انقر على "إعادة محاولة".';
          } else {
            errorMsg = `⚠️ خطأ: ${error.message || error.details?.message || 'حدث خطأ غير متوقع'}`;
          }
          
          this.addBotMessage(errorMsg);
          
          // محاولة التحقق من الحالة بعد قليل
          setTimeout(() => this.checkStatus(), 3000);
        }
      });
  }

  /**
   * التحقق من حالة embeddings (مع تحديد عدد المحاولات)
   */
  checkStatus() {
    console.log(`🔍 Checking embeddings status... (${this.statusCheckCount + 1}/${this.maxStatusChecks})`);
    this.isBusy = true;
    
    this.chatbotService.checkEmbeddingsStatus()
      .subscribe({
        next: (response) => {
          this.isBusy = false;
          console.log('📊 Status response:', response);
          
          if (response?.isReady) {
            this.embeddingsReady = true;
            this.statusCheckCount = 0; // إعادة تعيين العداد
            this.addBotMessage(`✅ نموذج البحث جاهز! (${response.totalProperties || ''} عقار)`);
          } else {
            this.statusCheckCount++;
            const message = `⏳ نموذج البحث قيد التحضير... ${response?.embeddingsCount || 0}/${response?.totalProperties || '?'} عقار`;
            
            if (this.statusCheckCount < this.maxStatusChecks) {
              this.addBotMessage(message + ` (المحاولة ${this.statusCheckCount}/${this.maxStatusChecks})`);
              // محاولة جديدة بعد 10 ثواني
              setTimeout(() => this.checkStatus(), 10000);
            } else {
              this.addBotMessage(message + '\n⚠️ توقفت محاولات البحث. يرجى محاولة "إعادة محاولة" لاحقاً.');
              this.statusCheckCount = 0;
            }
          }
        },
        error: (error) => {
          this.isBusy = false;
          console.error('❌ Status check error:', error);
          this.addBotMessage(`❌ لا يمكن التحقق من الحالة. ${error.message}`);
        }
      });
  }

  /**
   * إرسال رسالة
   */
  sendMessage() {
    if (!this.userInput.trim()) return;

    // إضافة رسالة المستخدم
    this.addUserMessage(this.userInput);
    const message = this.userInput;
    this.userInput = '';
    this.isLoading = true;

    console.log('📤 Sending message:', message.substring(0, 50) + '...');

    // إرسال للـ API
    this.chatbotService.sendMessage(message)
      .subscribe({
        next: (response) => {
          console.log('📥 Response received:', response);
          const botMessage = typeof response === 'string' ? response : (response.response || JSON.stringify(response));
          this.addBotMessage(botMessage);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Chat error:', error);
          this.isLoading = false;
          
          if (error.status === 400) {
            this.addBotMessage('⚠️ لم يتم إنشاء embeddings بعد. يرجى الضغط على "إعادة محاولة" في الأعلى.');
          } else if (error.status === 500) {
            this.addBotMessage('❌ خطأ في الخادم. تأكد من أن خادم Backend يعمل بشكل صحيح.');
          } else if (error.status === 0) {
            this.addBotMessage('❌ فشل الاتصال بالخادم. تأكد من: https://localhost:7030');
          } else {
            this.addBotMessage(`❌ خطأ: ${error.message}`);
          }
        }
      });
  }

  /**
   * إضافة رسالة المستخدم
   */
  addUserMessage(text: string) {
    this.messages.push({
      text,
      isUser: true,
      timestamp: new Date()
    });
  }

  /**
   * إضافة رسالة البوت
   */
  addBotMessage(text: string) {
    this.messages.push({
      text,
      isUser: false,
      timestamp: new Date()
    });
  }

  ngOnDestroy() {
    if (this.embeddingsCheckInterval) {
      clearInterval(this.embeddingsCheckInterval);
    }
  }
}