import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
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
export class ChatbotComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  
  messages: Message[] = [];
  userInput: string = '';
  isLoading: boolean = false;
  isBusy: boolean = false;
  embeddingsReady: boolean = false;
  isChatOpen: boolean = false; // التحكم في ظهور الدردشة
  private embeddingsCheckInterval: any;
  private statusCheckCount = 0;
  private maxStatusChecks = 5;
  private shouldScroll = false;

  constructor(
    private http: HttpClient,
    private chatbotService: ChatbotService,
    private sanitizer: DomSanitizer
  ) {
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  /**
   * تنسيق الرسائل وإضافة HTML formatting
   */
  formatMessage(text: string, isUser: boolean): SafeHtml {
    if (isUser) {
      return this.sanitizer.sanitize(1, text) || text;
    }

    // تنسيق رسائل البوت
    let formatted = text;
    
    // إضافة روابط للعقارات أولاً
    formatted = this.addPropertyLinks(formatted);
    
    // إزالة الـ emojis والرموز من البداية
    formatted = formatted.replace(/^[🤖💬📤📥✅❌⚠️💡🔄🔍]*\s*/g, '');
    
    // تحويل الأسطر المتعددة إلى فقرات منفصلة
    formatted = formatted.split('\n').map(line => {
      line = line.trim();
      
      // تجاهل الروابط - لا تضيف <p> حولها
      if (line.includes('<a ') && line.includes('</a>')) {
        return line;
      }
      
      // النقاط والقوائم
      if (line.match(/^[•\-\*]\s+/)) {
        return `<li>${line.replace(/^[•\-\*]\s+/, '')}</li>`;
      }
      
      // الأسئلة (تنتهي بعلامة استفهام)
      if (line.match(/[؟?]$/)) {
        return `<div class="question-box">${line}</div>`;
      }
      
      // العناوين (الأسطر القصيرة بحروف كبيرة)
      if (line.match(/^[أ-ي\w\s]{3,30}:$/) || line.match(/^###\s+/)) {
        return `<h4 class="section-title">${line.replace(/^#+\s*/, '').replace(/:$/, '')}</h4>`;
      }
      
      // أسطر عادية
      if (line.length > 0) {
        return `<p>${line}</p>`;
      }
      
      return '';
    }).join('');
    
    // تجميع عناصر القائمة
    formatted = formatted.replace(/(<li>.*?<\/li>)/gs, (match) => {
      const items = match.match(/<li>.*?<\/li>/g) || [];
      return items.length > 0 ? `<ul>${match}</ul>` : match;
    });
    
    // تنظيف الفراغات الزائدة
    formatted = formatted.replace(/<p><\/p>/g, '');
    
    return this.sanitizer.bypassSecurityTrustHtml(formatted);
  }

  /**
   * إضافة روابط للعقارات في الرسالة
   * يتعامل مع أنماط مختلفة لتمثيل معرفات العقارات
   */
  private addPropertyLinks(text: string): string {
    let result = text;
    const detectedIds = new Set<string>();

    // البحث عن جميع معرفات العقارات المحتملة
    const patterns = [
      /(?:Property ID|رقم العقار|معرف العقار)[\s:]*#?(\d+)/gi,
      /ID\s*#?(\d{1,4})\b/gi,
      /(?:الرقم|رقم|№|#)[\s:]*(\d{1,4})(?:\s|$|[،\.])/gi,
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (match[1]) {
          const id = match[1].toString().trim();
          if (id && /^\d+$/.test(id) && parseInt(id) > 0 && parseInt(id) < 100000) {
            detectedIds.add(id);
          }
        }
      }
    });

    // النمط 1: Property ID: [number] أو رقم العقار: [number]
    result = result.replace(/(?:Property ID|رقم العقار|معرف العقار)[\s:]*#?(\d+)/gi, (match, propertyId) => {
      const id = propertyId.toString().trim();
      if (id && /^\d+$/.test(id)) {
        return `<a href="/property/${id}" target="_blank" class="property-link-blue">اضغط هنا</a>`;
      }
      return match;
    });

    // النمط 2: ID #[number]
    result = result.replace(/ID\s*#?(\d{1,4})\b/gi, (match, propertyId) => {
      const id = propertyId.trim();
      if (parseInt(id) > 0 && parseInt(id) < 100000) {
        return `<a href="/property/${id}" target="_blank" class="property-link-blue">اضغط هنا</a>`;
      }
      return match;
    });

    // النمط 3: الرقم: [number] أو رقم: [number]
    result = result.replace(/(?:الرقم|رقم|№|#)[\s:]*(\d{1,4})(?=\s|$|[،\.])/gi, (match, propertyId) => {
      const id = propertyId.toString().trim();
      if (id && /^\d+$/.test(id) && parseInt(id) > 0 && parseInt(id) < 100000) {
        if (!match.includes('href')) {
          return `<a href="/property/${id}" target="_blank" class="property-link-blue">اضغط هنا</a>`;
        }
      }
      return match;
    });

    return result;
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
          this.shouldScroll = true;
        },
        error: (error) => {
          this.isBusy = false;
          console.error('❌ Embeddings generation error:', error);
          
          let errorMsg = '';
          if (error.status === 500) {
            errorMsg = 'خطأ في الخادم (500). يرجى التأكد من أن خادم الذكاء الاصطناعي يعمل بشكل صحيح.';
          } else if (error.status === 0 || !error.status) {
            errorMsg = 'انتهت المهلة الزمنية للطلب. قد يستغرق خادم الذكاء الاصطناعي وقتاً طويلاً. حاول مرة أخرى بعد قليل.';
          } else {
            errorMsg = `خطأ: ${error.message || 'حدث خطأ غير متوقع'}`;
          }
          
          this.addBotMessage(`⚠️ ${errorMsg}`);
          this.shouldScroll = true;
          
          // محاولة التحقق من الحالة بعد قليل
          setTimeout(() => this.checkStatus(), 3000);
        }
      });
  }

  /**
   * التحقق من حالة embeddings
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
            this.statusCheckCount = 0;
            this.addBotMessage(`✅ النظام جاهز الآن! (${response.totalProperties || 0} عقار متوفر)`);
          } else {
            this.statusCheckCount++;
            const progress = `${response?.embeddingsCount || 0}/${response?.totalProperties || '?'}`;
            const message = `⏳ جاري تحضير النموذج: ${progress} عقار`;
            
            if (this.statusCheckCount < this.maxStatusChecks) {
              this.addBotMessage(message + ` (المحاولة ${this.statusCheckCount}/${this.maxStatusChecks})`);
              setTimeout(() => this.checkStatus(), 10000);
            } else {
              this.addBotMessage(`⚠️ ${message}\nتوقفت محاولات الفحص. حاول لاحقاً من فضلك.`);
              this.statusCheckCount = 0;
            }
          }
          this.shouldScroll = true;
        },
        error: (error) => {
          this.isBusy = false;
          console.error('❌ Status check error:', error);
          this.addBotMessage(`❌ لا يمكن التحقق من حالة النظام. حاول مرة أخرى لاحقاً.`);
          this.shouldScroll = true;
        }
      });
  }

  /**
   * إرسال رسالة
   */
  sendMessage() {
    if (!this.userInput.trim()) return;
    if (this.isLoading) return;

    const message = this.userInput.trim();
    this.addUserMessage(message);
    this.userInput = '';
    this.isLoading = true;
    this.shouldScroll = true;

    console.log('📤 Sending message:', message.substring(0, 50) + '...');

    this.chatbotService.sendMessage(message)
      .subscribe({
        next: (response) => {
          console.log('📥 Response received:', response);
          const botMessage = typeof response === 'string' ? response : (response.response || JSON.stringify(response));
          const cleanedMessage = this.cleanBotMessage(botMessage);
          this.addBotMessage(cleanedMessage);
          this.isLoading = false;
          this.shouldScroll = true;
        },
        error: (error) => {
          console.error('❌ Chat error:', error);
          this.isLoading = false;
          
          let errorMsg = '';
          if (error.status === 400) {
            errorMsg = 'لم يتم تحضير نموذج البحث بعد. حاول مرة أخرى أو انقر على "إعادة محاولة" أعلاه.';
          } else if (error.status === 500) {
            errorMsg = 'خطأ في الخادم. تأكد من أن خادم Backend يعمل بشكل صحيح.';
          } else if (error.status === 0) {
            errorMsg = 'فشل الاتصال بالخادم. تأكد من: https://localhost:7030';
          } else {
            errorMsg = `خطأ: ${error.message || 'حدث خطأ غير متوقع'}`;
          }
          
          this.addBotMessage(`❌ ${errorMsg}`);
          this.shouldScroll = true;
        }
      });
  }

  /**
   * تنقية رسالة البوت من الملاحظات والرسائل غير المرغوبة
   */
  private cleanBotMessage(message: string): string {
    let cleaned = message;
    
    // حذف الملاحظة عن استخدام رقم العقار
    cleaned = cleaned.replace(/💡\s*ملاحظة:?\s*يمكنك استخدام رقم العقار للبحث عن المزيد من التفاصيل والصور\s*/gi, '');
    
    // حذف رسالة الاستفسارات والحجز
    cleaned = cleaned.replace(/📞\s*للاستفسارات أو الحجز،?\s*يرجى التواصل مع مالك العقار مباشر\s*/gi, '');
    
    // حذف الفواصل الزائدة والفراغات الإضافية
    cleaned = cleaned.replace(/[\n\r]+\s*[\n\r]+/g, '\n\n');
    cleaned = cleaned.trim();
    
    return cleaned;
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
    this.shouldScroll = true;
  }

  /**
   * إضافة رسالة البوت
   */
  addBotMessage(text: string) {
    const formattedText = this.formatBotResponse(text);
    this.messages.push({
      text: formattedText,
      isUser: false,
      timestamp: new Date()
    });
    this.shouldScroll = true;
  }

  /**
   * معالجة رسالة البوت وتنسيقها
   */
  private formatBotResponse(response: string): string {
    // إذا كانت الرسالة تحتوي على نقاط، تأكد من أنها مفصولة بشكل جيد
    let formatted = response;
    
    // تحويل أنماط مختلفة من النقاط
    formatted = formatted.replace(/([•\-\*])/g, '\n• ');
    
    // إضافة فواصل بين الأقسام الرئيسية
    formatted = formatted.replace(/([?؟])\s+([أ-ي])/g, '$1\n\n$2');
    
    return formatted;
  }

  /**
   * التمرير للأسفل تلقائياً
   */
  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = 
          this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Scroll error:', err);
    }
  }

  ngOnDestroy() {
    if (this.embeddingsCheckInterval) {
      clearInterval(this.embeddingsCheckInterval);
    }
  }

  /**
   * فتح/إغلاق الدردشة
   */
  toggleChat() {
    this.isChatOpen = !this.isChatOpen;
    if (this.isChatOpen) {
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  /**
   * إغلاق الدردشة
   */
  closeChat() {
    this.isChatOpen = false;
  }
}